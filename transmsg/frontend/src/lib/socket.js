let socket = null

export function connectSocket(token, handlers = {}) {
  if (!token) return null

  const wsUrl =
    import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws'

  socket = new WebSocket(`${wsUrl}?token=${token}`)

  socket.onopen = () => {
    console.log('✅ WebSocket connected')

    handlers.onOpen?.()
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      handlers.onMessage?.(data)
    } catch (err) {
      console.error('Socket parse error:', err)
    }
  }

  socket.onerror = (err) => {
    console.error('WebSocket error:', err)

    handlers.onError?.(err)
  }

  socket.onclose = () => {
    console.log(' WebSocket disconnected')

    handlers.onClose?.()
  }

  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.close()
    socket = null
  }
}