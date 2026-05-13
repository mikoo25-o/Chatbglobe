import jwt from 'jsonwebtoken'
import { getDb } from '../db/database.js'

const JWT_SECRET =
  process.env.JWT_SECRET || 'dev_secret'

export function authenticate(
  req,
  res,
  next
) {
  try {
    const authHeader =
      req.headers.authorization

    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        message: 'Authentication required'
      })
    }

    const token =
      authHeader.split(' ')[1]

    const payload = jwt.verify(
      token,
      JWT_SECRET
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

    req.user = user

    next()
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    })
  }
}