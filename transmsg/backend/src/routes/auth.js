import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'

import { getDb } from '../db/database.js'

const router = Router()

const SECRET =
  process.env.JWT_SECRET || 'dev_secret'

const EXPIRES =
  process.env.JWT_EXPIRES_IN || '30d'

function makeToken(userId) {
  return jwt.sign(
    { userId },
    SECRET,
    { expiresIn: EXPIRES }
  )
}

//
// REGISTER
//
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      company,
      default_lang
    } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          'Name, email and password are required'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters'
      })
    }

    const db = getDb()

    const existing = db.prepare(`
      SELECT id
      FROM users
      WHERE email = ?
    `).get(email.toLowerCase())

    if (existing) {
      return res.status(409).json({
        message: 'Email already registered'
      })
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    )

    const userId = uuid()

    db.prepare(`
      INSERT INTO users (
        id,
        name,
        email,
        password_hash,
        company,
        default_lang,
        auto_translate,
        notifications,
        plan,
        created_at,
        updated_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?,
        1, 1, 'free',
        datetime('now'),
        datetime('now')
      )
    `).run(
      userId,
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      company || '',
      default_lang || 'en'
    )

    const user = db.prepare(`
      SELECT
        id,
        name,
        email,
        company,
        default_lang,
        auto_translate,
        notifications,
        plan,
        created_at
      FROM users
      WHERE id = ?
    `).get(userId)

    const token = makeToken(user.id)

    res.status(201).json({
      token,
      user
    })
  } catch (err) {
    console.error('Register error:', err)

    res.status(500).json({
      message: 'Registration failed'
    })
  }
})

//
// LOGIN
//
router.post('/login', async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message:
          'Email and password required'
      })
    }

    const db = getDb()

    const row = db.prepare(`
      SELECT *
      FROM users
      WHERE email = ?
    `).get(email.toLowerCase().trim())

    if (!row) {
      return res.status(401).json({
        message:
          'Invalid email or password'
      })
    }

    const valid = await bcrypt.compare(
      password,
      row.password_hash
    )

    if (!valid) {
      return res.status(401).json({
        message:
          'Invalid email or password'
      })
    }

    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      company: row.company,
      default_lang: row.default_lang,
      auto_translate: row.auto_translate,
      notifications: row.notifications,
      plan: row.plan,
      created_at: row.created_at
    }

    const token = makeToken(user.id)

    res.json({
      token,
      user
    })
  } catch (err) {
    console.error('Login error:', err)

    res.status(500).json({
      message: 'Login failed'
    })
  }
})

//
// CURRENT USER
//
router.get('/me', (req, res) => {
  const auth = req.headers.authorization

  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Unauthorized'
    })
  }

  try {
    const token = auth.split(' ')[1]

    const payload = jwt.verify(
      token,
      SECRET
    )

    const db = getDb()

    const user = db.prepare(`
      SELECT
        id,
        name,
        email,
        company,
        default_lang,
        auto_translate,
        notifications,
        plan,
        created_at
      FROM users
      WHERE id = ?
    `).get(payload.userId)

    if (!user) {
      return res.status(401).json({
        message: 'User not found'
      })
    }

    res.json(user)
  } catch {
    res.status(401).json({
      message: 'Invalid token'
    })
  }
})

export default router