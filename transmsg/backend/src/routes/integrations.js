import { Router } from 'express'
import { v4 as uuid } from 'uuid'

import { authenticate } from '../middleware/auth.js'
import { getDb } from '../db/database.js'

const router = Router()

router.use(authenticate)

//
// GET ALL INTEGRATIONS
//
router.get('/', (req, res) => {
  const db = getDb()

  const integrations = db.prepare(`
    SELECT
      id,
      user_id,
      platform,
      phone_number,
      identifier,
      webhook_verify_token,
      status,
      created_at
    FROM integrations
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id)

  res.json(integrations)
})

//
// CREATE INTEGRATION
//
router.post('/', (req, res) => {
  const {
    platform,
    phone_number,
    api_key,
    api_secret,
    webhook_verify_token
  } = req.body

  if (!platform) {
    return res.status(400).json({
      message: 'Platform required'
    })
  }

  const allowedPlatforms = [
    'whatsapp',
    'sms',
    'telegram'
  ]

  if (!allowedPlatforms.includes(platform)) {
    return res.status(400).json({
      message: 'Invalid platform'
    })
  }

  const db = getDb()

  //
  // Prevent duplicate integration
  //
  const existing = db.prepare(`
    SELECT id
    FROM integrations
    WHERE user_id = ?
    AND platform = ?
    AND phone_number = ?
  `).get(
    req.user.id,
    platform,
    phone_number || null
  )

  if (existing) {
    return res.status(409).json({
      message: 'Integration already exists'
    })
  }

  const id = uuid()

  db.prepare(`
    INSERT INTO integrations (
      id,
      user_id,
      platform,
      phone_number,
      identifier,
      api_key_encrypted,
      api_secret_encrypted,
      webhook_verify_token,
      status,
      created_at
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, 'active',
      datetime('now')
    )
  `).run(
    id,
    req.user.id,
    platform,
    phone_number || null,
    `${platform}_${id.slice(0, 8)}`,
    api_key || null,
    api_secret || null,
    webhook_verify_token || null
  )

  const integration = db.prepare(`
    SELECT
      id,
      user_id,
      platform,
      phone_number,
      identifier,
      webhook_verify_token,
      status,
      created_at
    FROM integrations
    WHERE id = ?
  `).get(id)

  res.status(201).json(integration)
})

//
// UPDATE STATUS
//
router.patch('/:id/status', (req, res) => {
  const { status } = req.body

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({
      message: 'Invalid status'
    })
  }

  const db = getDb()

  const integration = db.prepare(`
    SELECT id
    FROM integrations
    WHERE id = ?
    AND user_id = ?
  `).get(
    req.params.id,
    req.user.id
  )

  if (!integration) {
    return res.status(404).json({
      message: 'Integration not found'
    })
  }

  db.prepare(`
    UPDATE integrations
    SET status = ?
    WHERE id = ?
  `).run(status, req.params.id)

  res.json({
    ok: true
  })
})

//
// DELETE INTEGRATION
//
router.delete('/:id', (req, res) => {
  const db = getDb()

  const integration = db.prepare(`
    SELECT id
    FROM integrations
    WHERE id = ?
    AND user_id = ?
  `).get(
    req.params.id,
    req.user.id
  )

  if (!integration) {
    return res.status(404).json({
      message: 'Integration not found'
    })
  }

  db.prepare(`
    DELETE FROM integrations
    WHERE id = ?
  `).run(req.params.id)

  res.json({
    ok: true
  })
})

export default router