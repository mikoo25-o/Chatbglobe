import jwt from 'jsonwebtoken'
import { getDb } from '../db/database.js'

const clients = new Map() // userId -> Set<ws>

export function wsHandler(wss) {
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost')
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(1008, 'Missing token')
      return
    }

    let userId
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret')
      userId = payload.userId
    } catch {
      ws.close(1008, 'Invalid token')
      return
    }

    // Register client
    if (!clients.has(userId)) clients.set(userId, new Set())
    clients.get(userId).add(ws)

    ws.isAlive = true
    ws.on('pong', () => { ws.isAlive = true })

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data)
        if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }))
      } catch {}
    })

    ws.on('close', () => {
      if (clients.has(userId)) {
        clients.get(userId).delete(ws)
        if (clients.get(userId).size === 0) clients.delete(userId)
      }
    })

    ws.send(JSON.stringify({ type: 'connected', userId }))
  })

  // Heartbeat
  const interval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate()
      ws.isAlive = false
      ws.ping()
    })
  }, 30000)

  wss.on('close', () => clearInterval(interval))
}

export function sendToUser(userId, data) {
  const userClients = clients.get(userId)
  if (!userClients) return
  const payload = JSON.stringify(data)
  userClients.forEach(ws => {
    if (ws.readyState === 1) { // OPEN
      ws.send(payload)
    }
  })
}

export function broadcastToConversationUsers(userIds, data) {
  userIds.forEach(uid => sendToUser(uid, data))
}
