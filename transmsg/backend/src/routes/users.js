import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { authenticate } from '../middleware/auth.js'
import { getDb } from '../db/database.js'

const router = Router()
router.use(authenticate)

// GET /api/users/me
router.get('/me', (req, res) => {
  res.json(req.user)
})

// PUT /api/users/me
router.put('/me', (req, res) => {
  const { name, company, default_lang, auto_translate, notifications } = req.body
  const db = getDb()
  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      company = COALESCE(?, company),
      default_lang = COALESCE(?, default_lang),
      auto_translate = COALESCE(?, auto_translate),
      notifications = COALESCE(?, notifications),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name, company, default_lang, auto_translate != null ? (auto_translate ? 1 : 0) : null, notifications != null ? (notifications ? 1 : 0) : null, req.user.id)

  const user = db.prepare('SELECT id, name, email, company, default_lang, auto_translate, notifications, plan FROM users WHERE id = ?').get(req.user.id)
  res.json(user)
})

// POST /api/users/me/password
router.post('/me/password', async (req, res) => {
  const { current_password, new_password } = req.body
  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Both current and new password required' })
  }
  if (new_password.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' })
  }
  const db = getDb()
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id)
  const match = await bcrypt.compare(current_password, row.password_hash)
  if (!match) return res.status(401).json({ message: 'Current password is incorrect' })

  const hash = await bcrypt.hash(new_password, 12)
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, req.user.id)
  res.json({ message: 'Password updated' })
})

export default router
