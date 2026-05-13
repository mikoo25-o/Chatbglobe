import cron from 'node-cron'
import { getDb } from '../db/database.js'
import axios from 'axios'

const MESSAGE_DELAY_MS = 2000
const MAX_RETRIES = 3

let processing = false

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function processQueue() {
  //
  // PREVENT PARALLEL RUNS
  //
  if (processing) return

  processing = true

  try {
    const db = getDb()

    const jobs = db.prepare(`
      SELECT *
      FROM message_queue
      WHERE status = 'pending'
      AND (
        scheduled_for IS NULL
        OR scheduled_for <= datetime('now')
      )
      ORDER BY created_at ASC
      LIMIT 20
    `).all()

    if (!jobs.length) {
      processing = false
      return
    }

    console.log(`📦 Processing ${jobs.length} queued jobs`)

    for (const job of jobs) {
      try {
        db.prepare(`
          UPDATE message_queue
          SET status = 'processing'
          WHERE id = ?
        `).run(job.id)

        const payload = JSON.parse(job.payload)

        //
        // WHATSAPP
        //
        if (job.platform === 'whatsapp') {
          await axios.post(
            `https://graph.facebook.com/v18.0/${payload.phone_number_id}/messages`,
            {
              messaging_product: 'whatsapp',
              to: payload.to,
              type: 'text',
              text: {
                body: payload.body
              }
            },
            {
              headers: {
                Authorization: `Bearer ${payload.token}`,
                'Content-Type': 'application/json'
              }
            }
          )
        }

        //
        // SMS / TWILIO
        //
        if (job.platform === 'sms') {
          const creds = Buffer.from(
            `${payload.account_sid}:${payload.auth_token}`
          ).toString('base64')

          await axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${payload.account_sid}/Messages.json`,
            new URLSearchParams({
              From: payload.from,
              To: payload.to,
              Body: payload.body
            }),
            {
              headers: {
                Authorization: `Basic ${creds}`,
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          )
        }

        //
        // TELEGRAM
        //
        if (job.platform === 'telegram') {
          await axios.post(
            `https://api.telegram.org/bot${payload.bot_token}/sendMessage`,
            {
              chat_id: payload.chat_id,
              text: payload.body
            }
          )
        }

        //
        // SUCCESS
        //
        db.prepare(`
          UPDATE message_queue
          SET
            status = 'completed',
            processed_at = datetime('now')
          WHERE id = ?
        `).run(job.id)

        console.log(`✅ Queue job completed: ${job.id}`)

        //
        // DELIVERY PACING
        //
        await sleep(MESSAGE_DELAY_MS)

      } catch (err) {
        console.error(`❌ Queue job failed: ${job.id}`)
        console.error(err.response?.data || err.message)

        const currentJob = db.prepare(`
          SELECT retries
          FROM message_queue
          WHERE id = ?
        `).get(job.id)

        const nextRetries =
          (currentJob?.retries || 0) + 1

        db.prepare(`
          UPDATE message_queue
          SET
            retries = ?,
            status = ?
          WHERE id = ?
        `).run(
          nextRetries,
          nextRetries >= MAX_RETRIES
            ? 'failed'
            : 'pending',
          job.id
        )
      }
    }

  } catch (err) {
    console.error('Queue worker crashed:', err.message)

  } finally {
    processing = false
  }
}

export function startQueueWorker() {
  console.log('🚀 Queue worker started')

  //
  // RUN EVERY 5 SECONDS
  //
  cron.schedule('*/5 * * * * *', async () => {
    await processQueue()
  })
}