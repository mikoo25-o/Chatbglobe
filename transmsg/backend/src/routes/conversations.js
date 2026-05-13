import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import axios from 'axios'

import { authenticate } from '../middleware/auth.js'
import { getDb } from '../db/database.js'
import {
  detectLanguage,
  translateText
} from '../services/translationService.js'

const router = Router()

router.use(authenticate)

//
// GET CONVERSATIONS
//
router.get('/', (req, res) => {
  const db = getDb()

  const conversations = db.prepare(`
    SELECT *
    FROM conversations
    WHERE user_id = ?
    ORDER BY
      CASE
        WHEN last_message_at IS NULL THEN 1
        ELSE 0
      END,
      last_message_at DESC,
      created_at DESC
    LIMIT 100
  `).all(req.user.id)

  res.json(conversations)
})

//
// CREATE CONVERSATION
//
router.post('/', (req, res) => {
  const {
    contact_name,
    contact_phone,
    contact_lang,
    platform,
    integration_id
  } = req.body

  if (!contact_name || !contact_phone) {
    return res.status(400).json({
      message: 'Contact name and phone required'
    })
  }

  const db = getDb()

  //
  // CHECK EXISTING
  //
  const existing = db.prepare(`
    SELECT *
    FROM conversations
    WHERE user_id = ?
    AND contact_phone = ?
    AND platform = ?
  `).get(
    req.user.id,
    contact_phone.trim(),
    platform || 'whatsapp'
  )

  if (existing) {
    return res.json(existing)
  }

  const id = uuid()

  db.prepare(`
    INSERT INTO conversations (
      id,
      user_id,
      contact_name,
      contact_phone,
      contact_lang,
      platform,
      integration_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.user.id,
    contact_name.trim(),
    contact_phone.trim(),
    contact_lang || 'en',
    platform || 'whatsapp',
    integration_id || null
  )

  const conversation = db.prepare(`
    SELECT *
    FROM conversations
    WHERE id = ?
  `).get(id)

  res.status(201).json(conversation)
})

//
// GET MESSAGES
//
router.get('/:id/messages', (req, res) => {
  const db = getDb()

  const conversation = db.prepare(`
    SELECT *
    FROM conversations
    WHERE id = ?
    AND user_id = ?
  `).get(req.params.id, req.user.id)

  if (!conversation) {
    return res.status(404).json({
      message: 'Conversation not found'
    })
  }

  const messages = db.prepare(`
    SELECT *
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
    LIMIT 200
  `).all(req.params.id)

  res.json(messages)
})

//
// SEND MESSAGE
//
router.post('/:id/messages', async (req, res) => {
  const { body } = req.body

  if (!body?.trim()) {
    return res.status(400).json({
      message: 'Message body required'
    })
  }

  const db = getDb()

  const conversation = db.prepare(`
    SELECT *
    FROM conversations
    WHERE id = ?
    AND user_id = ?
  `).get(req.params.id, req.user.id)

  if (!conversation) {
    return res.status(404).json({
      message: 'Conversation not found'
    })
  }

  const id = uuid()

  db.prepare(`
    INSERT INTO messages (
      id,
      conversation_id,
      user_id,
      direction,
      body,
      sender_name,
      status
    )
    VALUES (?, ?, ?, 'out', ?, ?, 'sent')
  `).run(
    id,
    conversation.id,
    req.user.id,
    body.trim(),
    req.user.name
  )

  //
  // UPDATE CONVERSATION
  //
  db.prepare(`
    UPDATE conversations
    SET
      last_message = ?,
      last_message_at = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    body.trim().slice(0, 120),
    conversation.id
  )

  const message = db.prepare(`
    SELECT *
    FROM messages
    WHERE id = ?
  `).get(id)

  //
  // SEND VIA PLATFORM
  //
  sendOutboundMessage(
    conversation,
    message
  ).catch(err => {
    console.error('Outbound send failed:', err.message)
  })

  res.status(201).json(message)
})

//
// TRANSLATE MESSAGE
//
router.post('/:id/messages/:msgId/translate', async (req, res) => {
  const db = getDb()

  const conversation = db.prepare(`
    SELECT *
    FROM conversations
    WHERE id = ?
    AND user_id = ?
  `).get(req.params.id, req.user.id)

  if (!conversation) {
    return res.status(404).json({
      message: 'Conversation not found'
    })
  }

  const message = db.prepare(`
    SELECT *
    FROM messages
    WHERE id = ?
    AND conversation_id = ?
  `).get(
    req.params.msgId,
    req.params.id
  )

  if (!message) {
    return res.status(404).json({
      message: 'Message not found'
    })
  }

  //
  // ALREADY TRANSLATED
  //
  if (message.translation) {
    return res.json({
      translation: message.translation,
      target_lang: message.translated_lang
    })
  }

  try {
    let sourceLang = message.detected_lang

    //
    // DETECT LANGUAGE
    //
    if (!sourceLang) {
      sourceLang = await detectLanguage(message.body)

      db.prepare(`
        UPDATE messages
        SET detected_lang = ?
        WHERE id = ?
      `).run(sourceLang, message.id)
    }

    const targetLang =
      req.user.default_lang || 'en'

    const translation = await translateText(
      message.body,
      targetLang,
      sourceLang
    )

    if (!translation) {
      return res.status(503).json({
        message: 'Translation unavailable'
      })
    }

    db.prepare(`
      UPDATE messages
      SET
        translation = ?,
        translated_lang = ?
      WHERE id = ?
    `).run(
      translation,
      targetLang,
      message.id
    )

    res.json({
      translation,
      target_lang: targetLang
    })

  } catch (err) {
    console.error(err)

    res.status(500).json({
      message: 'Translation failed'
    })
  }
})

//
// MARK READ
//
router.post('/:id/read', (req, res) => {
  const db = getDb()

  db.prepare(`
    UPDATE conversations
    SET unread_count = 0
    WHERE id = ?
    AND user_id = ?
  `).run(
    req.params.id,
    req.user.id
  )

  db.prepare(`
    UPDATE messages
    SET status = 'read'
    WHERE conversation_id = ?
    AND direction = 'in'
  `).run(req.params.id)

  res.json({
    ok: true
  })
})

//
// DELETE CONVERSATION
//
router.delete('/:id', (req, res) => {
  const db = getDb()

  db.prepare(`
    DELETE FROM conversations
    WHERE id = ?
    AND user_id = ?
  `).run(
    req.params.id,
    req.user.id
  )

  res.json({
    ok: true
  })
})

//
// SEND OUTBOUND MESSAGE
//
async function sendOutboundMessage(
  conversation,
  message
) {
  const db = getDb()

  if (!conversation.integration_id) {
    return
  }

  const integration = db.prepare(`
    SELECT *
    FROM integrations
    WHERE id = ?
  `).get(conversation.integration_id)

  if (!integration) {
    return
  }

  //
  // WHATSAPP
  //
  if (conversation.platform === 'whatsapp') {
    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${integration.phone_number}/messages`,
        {
          messaging_product: 'whatsapp',
          to: conversation.contact_phone,
          type: 'text',
          text: {
            body: message.body
          }
        },
        {
          headers: {
            Authorization: `Bearer ${integration.api_key_encrypted}`,
            'Content-Type': 'application/json'
          }
        }
      )

      db.prepare(`
        UPDATE messages
        SET status = 'delivered'
        WHERE id = ?
      `).run(message.id)

    } catch (err) {
      console.error(
        'WhatsApp send failed:',
        err.response?.data || err.message
      )

      db.prepare(`
        UPDATE messages
        SET status = 'failed'
        WHERE id = ?
      `).run(message.id)
    }
  }

  //
  // SMS / TWILIO
  //
  if (conversation.platform === 'sms') {
    try {
      const creds = Buffer.from(
        `${integration.api_key_encrypted}:${integration.api_secret_encrypted}`
      ).toString('base64')

      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${integration.api_key_encrypted}/Messages.json`,
        new URLSearchParams({
          From: integration.phone_number,
          To: conversation.contact_phone,
          Body: message.body
        }),
        {
          headers: {
            Authorization: `Basic ${creds}`,
            'Content-Type':
              'application/x-www-form-urlencoded'
          }
        }
      )

    } catch (err) {
      console.error(
        'SMS send failed:',
        err.response?.data || err.message
      )
    }
  }

  //
  // TELEGRAM
  //
  if (conversation.platform === 'telegram') {
    try {
      await axios.post(
        `https://api.telegram.org/bot${integration.api_key_encrypted}/sendMessage`,
        {
          chat_id: conversation.contact_phone,
          text: message.body
        }
      )

    } catch (err) {
      console.error(
        'Telegram send failed:',
        err.response?.data || err.message
      )
    }
  }
}

export default router