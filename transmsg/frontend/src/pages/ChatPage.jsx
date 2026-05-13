import { useEffect } from 'react'

import Sidebar from '../components/Sidebar'
import ConversationList from '../components/ConversationList'
import ChatWindow from '../components/ChatWindow'

import { useAuthStore } from '../context/authStore'
import { useChatStore } from '../context/chatStore'

import {
  connectSocket,
  disconnectSocket
} from '../lib/socket'

export default function ChatPage() {
  const { token } = useAuthStore()

  const {
    fetchConversations,
    addMessage,
    prependConversation,
    updateConversation,
    setConnected
  } = useChatStore()

  //
  // LOAD CONVERSATIONS
  //
  useEffect(() => {
    fetchConversations()
  }, [])

  //
  // WEBSOCKET CONNECTION
  //
  useEffect(() => {
    if (!token) return

    const socket = connectSocket(token, {
      onOpen: () => {
        setConnected(true)
      },

      onClose: () => {
        setConnected(false)
      },

      onMessage: (data) => {
        console.log('Realtime event:', data)

        //
        // NEW MESSAGE
        //
        if (data.type === 'new_message') {
          addMessage(
            data.conversation_id,
            data.message
          )
        }

        //
        // NEW CONVERSATION
        //
        if (data.type === 'new_conversation') {
          prependConversation(
            data.conversation
          )
        }

        //
        // CONVERSATION UPDATED
        //
        if (data.type === 'conversation_updated') {
          updateConversation(
            data.conversation
          )
        }
      },

      onError: (err) => {
        console.error('Socket error:', err)
      }
    })

    return () => {
      disconnectSocket()
    }
  }, [token])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <ConversationList />
      <ChatWindow />
    </div>
  )
}