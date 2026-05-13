import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

let db

export function getDb() {
  return db
}

export async function initDb() {
  const dbPath = process.env.DB_PATH || './data/transmsg.db'

  mkdirSync(dirname(dbPath), { recursive: true })

  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      company TEXT DEFAULT '',
      default_lang TEXT DEFAULT 'en',
      auto_translate INTEGER DEFAULT 1,
      notifications INTEGER DEFAULT 1,
      plan TEXT DEFAULT 'free',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      phone_number TEXT,
      identifier TEXT,
      api_key_encrypted TEXT,
      api_secret_encrypted TEXT,
      webhook_verify_token TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, platform, phone_number)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      contact_lang TEXT DEFAULT 'en',
      platform TEXT DEFAULT 'whatsapp',
      integration_id TEXT REFERENCES integrations(id),
      is_group INTEGER DEFAULT 0,
      is_online INTEGER DEFAULT 0,
      unread_count INTEGER DEFAULT 0,
      last_message TEXT,
      last_message_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_user
    ON conversations(user_id);

    CREATE INDEX IF NOT EXISTS idx_conversations_last_msg
    ON conversations(last_message_at DESC);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
      body TEXT NOT NULL,
      detected_lang TEXT,
      translation TEXT,
      translated_lang TEXT,
      sender_name TEXT,
      status TEXT DEFAULT 'sent',
      platform_msg_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conv
    ON messages(conversation_id);

    CREATE INDEX IF NOT EXISTS idx_messages_created
    ON messages(created_at);

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      message_template TEXT NOT NULL,
      platform TEXT DEFAULT 'whatsapp',
      status TEXT DEFAULT 'draft',
      scheduled_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaign_contacts (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      contact_name TEXT,
      contact_phone TEXT NOT NULL,
      language TEXT DEFAULT 'en',

      -- COMPLIANCE
      opt_in INTEGER DEFAULT 0,
      opt_in_at TEXT,

      -- DELIVERY
      status TEXT DEFAULT 'pending',
      sent_at TEXT,
      error TEXT,

      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign
    ON campaign_contacts(campaign_id);

    CREATE TABLE IF NOT EXISTS message_queue (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      conversation_id TEXT REFERENCES conversations(id),
      platform TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      retries INTEGER DEFAULT 0,
      scheduled_for TEXT,
      processed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_queue_status
    ON message_queue(status);

    CREATE INDEX IF NOT EXISTS idx_queue_scheduled
    ON message_queue(scheduled_for);
  `)

  console.log('✅ Database initialized')

  return db
}