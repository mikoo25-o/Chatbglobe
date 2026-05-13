import { useEffect, useRef } from 'react'
import { useChatStore } from '../context/chatStore'
import { useAuthStore } from '../context/authStore'

export function useSocket() {
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

  const { token } = useAuthStore()

  const {
    setConnected,
    addMessage,
    setTyping,
    prependConversation,
    updateConversationUnread,
    updateConversation,
    activeConversation
  } = useChatStore()

  useEffect(() => {
    if (!token) return

    const connect = () => {
      const ws = new WebSocket(
        `ws://localhost:4000/ws?token=${token}`
      )

      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')

        setConnected(true)

        if (reconnectRef.current) {
          clearTimeout(reconnectRef.current)
          reconnectRef.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)

          handleMessage(msg)
        } catch (err) {
          console.error(err)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')

        setConnected(false)

        reconnectRef.current = setTimeout(connect, 3000)
      }

      ws.onerror = (err) => {
        console.error('WebSocket error', err)
      }
    }

    const handleMessage = (msg) => {
      switch (msg.type) {
        //
        // NEW MESSAGE
        //
        case 'new_message':
          addMessage(
            msg.conversation_id,
            msg.message
          )

          if (
            !activeConversation ||
            activeConversation.id !== msg.conversation_id
          ) {
            updateConversationUnread(
              msg.conversation_id,
              1
            )
          }

          break

        //
        // NEW CONVERSATION
        //
        case 'new_conversation':
          prependConversation(
            msg.conversation
          )
          break

        //
        // UPDATED CONVERSATION
        //
        case 'conversation_updated':
          updateConversation(
            msg.conversation
          )
          break

        //
        // TYPING
        //
        case 'typing':
          setTyping(
            msg.conversation_id,
            msg.is_typing
          )
          break

        default:
          break
      }
    }

    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }

      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
      }
    }
  }, [token])

  const send = (data) => {
    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN
    ) {
      wsRef.current.send(
        JSON.stringify(data)
      )
    }
  }

  return { send }
}