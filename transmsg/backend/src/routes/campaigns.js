import { Router } from 'express'
import { v4 as uuid } from 'uuid'

import { authenticate } from '../middleware/auth.js'
import { getDb } from '../db/database.js'
import {
  detectLanguage,
  translateText
} from '../services/translationService.js'

const router = Router()

router.use(authenticate)

//
// GET ALL CAMPAIGNS
//
router.get('/', (req, res) => {
  const db = getDb()

  const campaigns = db.prepare(`
    SELECT
      c.*,
      (
        SELECT COUNT(*)
        FROM campaign_contacts cc
        WHERE cc.campaign_id = c.id
      ) as contacts_count,

      (
        SELECT COUNT(*)
        FROM campaign_contacts cc
        WHERE cc.campaign_id = c.id
        AND cc.status = 'sent'
      ) as sent_count,

      (
        SELECT COUNT(*)
        FROM campaign_contacts cc
        WHERE cc.campaign_id = c.id
        AND cc.status = 'failed'
      ) as failed_count

    FROM campaigns c
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user.id)

  res.json(campaigns)
})

//
// CREATE CAMPAIGN
//
router.post('/', (req, res) => {
  const {
    name,
    message_template,
    platform,
    scheduled_at
  } = req.body

  if (!name || !message_template) {
    return res.status(400).json({
      message: 'Campaign name and message required'
    })
  }

  const db = getDb()

  const id = uuid()

  db.prepare(`
    INSERT INTO campaigns (
      id,
      user_id,
      name,
      message_template,
      platform,
      status,
      scheduled_at
    )
    VALUES (?, ?, ?, ?, ?, 'draft', ?)
  `).run(
    id,
    req.user.id,
    name.trim(),
    message_template.trim(),
    platform || 'whatsapp',
    scheduled_at || null
  )

  const campaign = db.prepare(`
    SELECT *
    FROM campaigns
    WHERE id = ?
  `).get(id)

  res.status(201).json(campaign)
})

//
// GET SINGLE CAMPAIGN
//
router.get('/:id', (req, res) => {
  const db = getDb()

  const campaign = db.prepare(`
    SELECT *
    FROM campaigns
    WHERE id = ?
    AND user_id = ?
  `).get(req.params.id, req.user.id)

  if (!campaign) {
    return res.status(404).json({
      message: 'Campaign not found'
    })
  }

  res.json(campaign)
})

//
// ADD CONTACT TO CAMPAIGN
//
router.post('/:id/contacts', async (req, res) => {
  const {
    contact_name,
    contact_phone,
    language,
    opt_in
  } = req.body

  if (!contact_phone) {
    return res.status(400).json({
      message: 'Phone number required'
    })
  }

  const db = getDb()

  const campaign = db.prepare(`
    SELECT *
    FROM campaigns
    WHERE id = ?
    AND user_id = ?
  `).get(req.params.id, req.user.id)

  if (!campaign) {
    return res.status(404).json({
      message: 'Campaign not found'
    })
  }

  const existing = db.prepare(`
    SELECT id
    FROM campaign_contacts
    WHERE campaign_id = ?
    AND contact_phone = ?
  `).get(campaign.id, contact_phone)

  if (existing) {
    return res.status(409).json({
      message: 'Contact already added'
    })
  }

  let detectedLang = language || 'en'

  if (!language && contact_name) {
    try {
      detectedLang = await detectLanguage(contact_name)
    } catch {}
  }

  const id = uuid()

  db.prepare(`
    INSERT INTO campaign_contacts (
      id,
      campaign_id,
      contact_name,
      contact_phone,
      language,
      opt_in,
      status,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
  `).run(
    id,
    campaign.id,
    contact_name || '',
    contact_phone.trim(),
    detectedLang,
    opt_in === false ? 0 : 1
  )

  res.status(201).json({
    ok: true
  })
})

//
// GET CONTACTS
//
router.get('/:id/contacts', (req, res) => {
  const db = getDb()

  const campaign = db.prepare(`
    SELECT id
    FROM campaigns
    WHERE id = ?
    AND user_id = ?
  `).get(req.params.id, req.user.id)

  if (!campaign) {
    return res.status(404).json({
      message: 'Campaign not found'
    })
  }

  const contacts = db.prepare(`
    SELECT *
    FROM campaign_contacts
    WHERE campaign_id = ?
    ORDER BY created_at DESC
  `).all(req.params.id)

  res.json(contacts)
})

//
// START CAMPAIGN
//
router.post('/:id/start', async (req, res) => {
  const db = getDb()

  const campaign = db.prepare(`
    SELECT *
    FROM campaigns
    WHERE id = ?
    AND user_id = ?
  `).get(req.params.id, req.user.id)

  if (!campaign) {
    return res.status(404).json({
      message: 'Campaign not found'
    })
  }

  const contacts = db.prepare(`
    SELECT *
    FROM campaign_contacts
    WHERE campaign_id = ?
    AND opt_in = 1
  `).all(campaign.id)

  if (contacts.length === 0) {
    return res.status(400).json({
      message: 'No opted-in contacts'
    })
  }

  const integration = db.prepare(`
    SELECT *
    FROM integrations
    WHERE user_id = ?
    AND platform = ?
    AND status = 'active'
    LIMIT 1
  `).get(req.user.id, campaign.platform)

  if (!integration) {
    return res.status(400).json({
      message: `No active ${campaign.platform} integration found`
    })
  }

  const user = db.prepare(`
    SELECT *
    FROM users
    WHERE id = ?
  `).get(req.user.id)

  let queued = 0

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i]

    let finalMessage = campaign.message_template

    //
    // AUTO TRANSLATION
    //
    if (
      user?.auto_translate &&
      contact.language &&
      contact.language !== 'en'
    ) {
      try {
        const translated = await translateText(
          campaign.message_template,
          contact.language,
          'en'
        )

        if (translated) {
          finalMessage = translated
        }
      } catch {}
    }

    //
    // DELIVERY PACING
    // 2 second stagger
    //
    const delaySeconds = i * 2

    const queueId = uuid()

    let payload = {
      to: contact.contact_phone,
      body: finalMessage
    }

    //
    // WHATSAPP
    //
    if (campaign.platform === 'whatsapp') {
      payload = {
        ...payload,
        token: integration.api_key_encrypted,
        phone_number_id: integration.phone_number
      }
    }

    //
    // SMS / TWILIO
    //
    if (campaign.platform === 'sms') {
      payload = {
        ...payload,
        account_sid: integration.api_key_encrypted,
        auth_token: integration.api_secret_encrypted,
        from: integration.phone_number
      }
    }

    //
    // TELEGRAM
    //
    if (campaign.platform === 'telegram') {
      payload = {
        ...payload,
        bot_token: integration.api_key_encrypted,
        chat_id: contact.contact_phone
      }
    }

    db.prepare(`
      INSERT INTO message_queue (
        id,
        user_id,
        platform,
        payload,
        status,
        scheduled_for
      )
      VALUES (?, ?, ?, ?, 'pending', datetime('now', '+' || ? || ' seconds'))
    `).run(
      queueId,
      req.user.id,
      campaign.platform,
      JSON.stringify(payload),
      delaySeconds
    )

    queued++
  }

  db.prepare(`
    UPDATE campaigns
    SET status = 'running'
    WHERE id = ?
  `).run(campaign.id)

  res.json({
    ok: true,
    queued
  })
})

//
// STOP CAMPAIGN
//
router.post('/:id/stop', (req, res) => {
  const db = getDb()

  db.prepare(`
    UPDATE campaigns
    SET status = 'stopped'
    WHERE id = ?
    AND user_id = ?
  `).run(req.params.id, req.user.id)

  res.json({
    ok: true
  })
})

//
// DELETE CAMPAIGN
//
router.delete('/:id', (req, res) => {
  const db = getDb()

  db.prepare(`
    DELETE FROM campaigns
    WHERE id = ?
    AND user_id = ?
  `).run(req.params.id, req.user.id)

  res.json({
    ok: true
  })
})

export default router