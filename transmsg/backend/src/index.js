import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

import { initDb } from './db/database.js'
import { wsHandler } from './services/wsService.js'
import { startQueueWorker } from './services/queueWorker.js'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import conversationRoutes from './routes/conversations.js'
import integrationRoutes from './routes/integrations.js'
import webhookRoutes from './routes/webhooks.js'
import campaignRoutes from './routes/campaigns.js'

const app = express()
const httpServer = createServer(app)

//
// WebSocket
//
const wss = new WebSocketServer({
  server: httpServer,
  path: '/ws'
})

wsHandler(wss)

//
// Middleware
//
app.use(
  helmet({
    contentSecurityPolicy: false
  })
)

//
// CORS FIX
//
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
]

app.use(
  cors({
    origin: function (origin, callback) {
      //
      // allow requests like Postman/mobile/no-origin
      //
      if (!origin) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      console.log('Blocked by CORS:', origin)

      return callback(new Error('CORS not allowed'))
    },
    credentials: true
  })
)

app.use(morgan('dev'))

app.use(
  express.json({
    limit: '10mb'
  })
)

app.use(
  express.urlencoded({
    extended: true
  })
)

//
// Routes
//
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/integrations', integrationRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/campaigns', campaignRoutes)

//
// Health
//
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  })
})

//
// 404
//
app.use((req, res) => {
  res.status(404).json({
    message: 'Not found'
  })
})

//
// Error handler
//
app.use((err, req, res, next) => {
  console.error(err)

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  })
})

const PORT = process.env.PORT || 4000

async function start() {
  //
  // Initialize database
  //
  await initDb()

  //
  // Start queue worker
  //
  startQueueWorker()

  //
  // Start server
  //
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 TransMsg backend running on port ${PORT}`)
    console.log(`📡 WebSocket ready`)
    console.log(`📨 Queue worker active\n`)
  })
}

start().catch(err => {
  console.error('Failed to start:', err)
  process.exit(1)
})