import { Router } from 'express'
import { v4 as uuid } from 'uuid'

import { getDb } from '../db/database.js'
import {
  detectLanguage,
  translateText
} from '../services/translationService.js'

import { sendToUser } from '../services/wsService.js'

const router = Router()

// ========================================
// HELPERS
// ========================================

async function autoTranslateMessage(
  text,
  userLang,
  autoTranslate,
  detectedLang
) {
  if (
    !autoTranslate ||
    !text ||
    detectedLang === userLang
  ) {
    return null
  }

  try {
    return await translateText(
      text,
      userLang,
      detectedLang
    )
  } catch {
    return null
  }
}

function emitConversationEvents(
  userId,
  conv,
  message,
  isNewConversation = false
) {
  sendToUser(userId, {
    type: 'new_message',
    conversation_id: conv.id,
    message
  })

  sendToUser(userId, {
    type: 'conversation_updated',
    conversation: conv
  })

  if (isNewConversation) {
    sendToUser(userId, {
      type: 'new_conversation',
      conversation: conv
    })
  }
}

// ========================================
// WHATSAPP VERIFY
// ========================================

router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (
    mode === 'subscribe' &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge)
  }

  return res.status(403).json({
    message: 'Verification failed'
  })
})

// ========================================
// WHATSAPP WEBHOOK
// ========================================

router.post('/whatsapp', async (req, res) => {
  res.sendStatus(200)

  try {
    const entry = req.body?.entry?.[0]
    const changes = entry?.changes?.[0]?.value

    if (!changes?.messages?.length) return

    const db = getDb()

    const waMessage = changes.messages[0]

    const fromPhone = waMessage.from
    const toPhone =
      changes.metadata?.display_phone_number

    const body =
      waMessage.text?.body ||
      waMessage.caption ||
      '[media]'

    const platformMsgId = waMessage.id

    //
    // Prevent duplicates
    //
    const exists = db.prepare(`
      SELECT id
      FROM messages
      WHERE platform_msg_id = ?
    `).get(platformMsgId)

    if (exists) return

    //
    // Find integration
    //
    const integration = db.prepare(`
      SELECT *
      FROM integrations
      WHERE phone_number = ?
      AND platform = 'whatsapp'
      AND status = 'active'
    `).get(toPhone)

    if (!integration) return

    //
    // Find conversation
    //
    let conv = db.prepare(`
      SELECT *
      FROM conversations
      WHERE user_id = ?
      AND contact_phone = ?
      AND platform = 'whatsapp'
    `).get(integration.user_id, fromPhone)

    let isNewConversation = false

    const contactName =
      changes.contacts?.[0]?.profile?.name ||
      fromPhone

    if (!conv) {
      isNewConversation = true

      const convId = uuid()

      db.prepare(`
        INSERT INTO conversations (
          id,
          user_id,
          contact_name,
          contact_phone,
          contact_lang,
          platform,
          integration_id,
          unread_count,
          is_online
        )
        VALUES (?, ?, ?, ?, 'en', 'whatsapp', ?, 1, 1)
      `).run(
        convId,
        integration.user_id,
        contactName,
        fromPhone,
        integration.id
      )

      conv = db.prepare(`
        SELECT *
        FROM conversations
        WHERE id = ?
      `).get(convId)
    }

    //
    // Detect language
    //
    let detectedLang = 'en'

    try {
      detectedLang = await detectLanguage(body)
    } catch {}

    //
    // User
    //
    const user = db.prepare(`
      SELECT *
      FROM users
      WHERE id = ?
    `).get(integration.user_id)

    //
    // Translation
    //
    const translation =
      await autoTranslateMessage(
        body,
        user?.default_lang || 'en',
        user?.auto_translate,
        detectedLang
      )

    //
    // Save message
    //
    const msgId = uuid()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO messages (
        id,
        conversation_id,
        user_id,
        direction,
        body,
        detected_lang,
        translation,
        translated_lang,
        sender_name,
        status,
        platform_msg_id,
        created_at
      )
      VALUES (
        ?, ?, ?, 'in',
        ?, ?, ?, ?, ?, 'delivered',
        ?, ?
      )
    `).run(
      msgId,
      conv.id,
      integration.user_id,
      body,
      detectedLang,
      translation,
      user?.default_lang || null,
      contactName,
      platformMsgId,
      now
    )

    //
    // Update conversation
    //
    db.prepare(`
      UPDATE conversations
      SET
        last_message = ?,
        last_message_at = ?,
        unread_count = unread_count + 1,
        contact_lang = ?,
        is_online = 1,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      body.slice(0, 100),
      now,
      detectedLang,
      conv.id
    )

    const message = db.prepare(`
      SELECT *
      FROM messages
      WHERE id = ?
    `).get(msgId)

    const updatedConv = db.prepare(`
      SELECT *
      FROM conversations
      WHERE id = ?
    `).get(conv.id)

    emitConversationEvents(
      integration.user_id,
      updatedConv,
      message,
      isNewConversation
    )
  } catch (err) {
    console.error(
      'WhatsApp webhook error:',
      err.message
    )
  }
})

// ========================================
// SMS WEBHOOK
// ========================================

router.post('/sms', async (req, res) => {
  res.sendStatus(200)

  try {
    const {
      From,
      To,
      Body,
      MessageSid
    } = req.body

    if (!From || !Body) return

    const db = getDb()

    //
    // Prevent duplicates
    //
    const exists = db.prepare(`
      SELECT id
      FROM messages
      WHERE platform_msg_id = ?
    `).get(MessageSid)

    if (exists) return

    //
    // Integration
    //
    const integration = db.prepare(`
      SELECT *
      FROM integrations
      WHERE phone_number = ?
      AND platform = 'sms'
      AND status = 'active'
    `).get(To)

    if (!integration) return

    //
    // Conversation
    //
    let conv = db.prepare(`
      SELECT *
      FROM conversations
      WHERE user_id = ?
      AND contact_phone = ?
      AND platform = 'sms'
    `).get(integration.user_id, From)

    let isNewConversation = false

    if (!conv) {
      isNewConversation = true

      const convId = uuid()

      db.prepare(`
        INSERT INTO conversations (
          id,
          user_id,
          contact_name,
          contact_phone,
          contact_lang,
          platform,
          integration_id,
          unread_count
        )
        VALUES (?, ?, ?, ?, 'en', 'sms', ?, 1)
      `).run(
        convId,
        integration.user_id,
        From,
        From,
        integration.id
      )

      conv = db.prepare(`
        SELECT *
        FROM conversations
        WHERE id = ?
      `).get(convId)
    }

    //
    // Detect language
    //
    let detectedLang = 'en'

    try {
      detectedLang = await detectLanguage(Body)
    } catch {}

    //
    // User
    //
    const user = db.prepare(`
      SELECT *
      FROM users
      WHERE id = ?
    `).get(integration.user_id)

    //
    // Translation
    //
    const translation =
      await autoTranslateMessage(
        Body,
        user?.default_lang || 'en',
        user?.auto_translate,
        detectedLang
      )

    //
    // Save message
    //
    const msgId = uuid()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO messages (
        id,
        conversation_id,
        user_id,
        direction,
        body,
        detected_lang,
        translation,
        translated_lang,
        sender_name,
        status,
        platform_msg_id,
        created_at
      )
      VALUES (
        ?, ?, ?, 'in',
        ?, ?, ?, ?, ?, 'delivered',
        ?, ?
      )
    `).run(
      msgId,
      conv.id,
      integration.user_id,
      Body,
      detectedLang,
      translation,
      user?.default_lang || null,
      From,
      MessageSid,
      now
    )

    //
    // Update conversation
    //
    db.prepare(`
      UPDATE conversations
      SET
        last_message = ?,
        last_message_at = ?,
        unread_count = unread_count + 1,
        contact_lang = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      Body.slice(0, 100),
      now,
      detectedLang,
      conv.id
    )

    const message = db.prepare(`
      SELECT *
      FROM messages
      WHERE id = ?
    `).get(msgId)

    const updatedConv = db.prepare(`
      SELECT *
      FROM conversations
      WHERE id = ?
    `).get(conv.id)

    emitConversationEvents(
      integration.user_id,
      updatedConv,
      message,
      isNewConversation
    )
  } catch (err) {
    console.error(
      'SMS webhook error:',
      err.message
    )
  }
})

// ========================================
// TELEGRAM WEBHOOK
// ========================================

router.post('/telegram', async (req, res) => {
  res.sendStatus(200)

  try {
    const msg = req.body?.message

    if (!msg?.text) return

    const db = getDb()

    const fromId = String(msg.chat.id)
    const body = msg.text

    const botToken =
      req.query.token || ''

    const integration = db.prepare(`
      SELECT *
      FROM integrations
      WHERE api_key_encrypted = ?
      AND platform = 'telegram'
      AND status = 'active'
    `).get(botToken)

    if (!integration) return

    let conv = db.prepare(`
      SELECT *
      FROM conversations
      WHERE user_id = ?
      AND contact_phone = ?
      AND platform = 'telegram'
    `).get(integration.user_id, fromId)

    let isNewConversation = false

    if (!conv) {
      isNewConversation = true

      const convId = uuid()

      db.prepare(`
        INSERT INTO conversations (
          id,
          user_id,
          contact_name,
          contact_phone,
          platform,
          integration_id,
          unread_count
        )
        VALUES (?, ?, ?, ?, 'telegram', ?, 1)
      `).run(
        convId,
        integration.user_id,
        msg.chat.first_name || fromId,
        fromId,
        integration.id
      )

      conv = db.prepare(`
        SELECT *
        FROM conversations
        WHERE id = ?
      `).get(convId)
    }

    const msgId = uuid()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO messages (
        id,
        conversation_id,
        user_id,
        direction,
        body,
        sender_name,
        status,
        created_at
      )
      VALUES (?, ?, ?, 'in', ?, ?, 'delivered', ?)
    `).run(
      msgId,
      conv.id,
      integration.user_id,
      body,
      msg.chat.first_name || 'Telegram',
      now
    )

    db.prepare(`
      UPDATE conversations
      SET
        last_message = ?,
        last_message_at = ?,
        unread_count = unread_count + 1
      WHERE id = ?
    `).run(
      body.slice(0, 100),
      now,
      conv.id
    )

    const message = db.prepare(`
      SELECT *
      FROM messages
      WHERE id = ?
    `).get(msgId)

    const updatedConv = db.prepare(`
      SELECT *
      FROM conversations
      WHERE id = ?
    `).get(conv.id)

    emitConversationEvents(
      integration.user_id,
      updatedConv,
      message,
      isNewConversation
    )
  } catch (err) {
    console.error(
      'Telegram webhook error:',
      err.message
    )
  }
})

export default router