import { useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'

import { Toaster } from 'react-hot-toast'

import { useAuthStore } from './context/authStore'
import { useChatStore } from './context/chatStore'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage from './pages/ChatPage'
import SettingsPage from './pages/SettingsPage'
import IntegrationsPage from './pages/IntegrationsPage'
import CampaignsPage from './pages/CampaignsPage'

import {
  connectSocket,
  disconnectSocket
} from './lib/socket'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()

  return token
    ? children
    : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { token } = useAuthStore()

  return !token
    ? children
    : <Navigate to="/chat" replace />
}

function SocketManager() {
  const { token } = useAuthStore()

  const {
    addMessage,
    prependConversation,
    updateConversation,
    setConnected
  } = useChatStore()

  useEffect(() => {
    if (!token) {
      disconnectSocket()
      setConnected(false)
      return
    }

    const socket = connectSocket(token)

    socket.onopen = () => {
      console.log('✅ WebSocket connected')
      setConnected(true)
    }

    socket.onclose = () => {
      console.log('❌ WebSocket disconnected')
      setConnected(false)
    }

    socket.onerror = (err) => {
      console.error('WebSocket error:', err)
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

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
        // UPDATE CONVERSATION
        //
        if (data.type === 'conversation_updated') {
          updateConversation(
            data.conversation
          )
        }
      } catch (err) {
        console.error(
          'Socket parse error:',
          err
        )
      }
    }

    return () => {
      disconnectSocket()
      setConnected(false)
    }
  }, [
    token,
    addMessage,
    prependConversation,
    updateConversation,
    setConnected
  ])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <SocketManager />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#21262d',
            color: '#e6edf3',
            border: '1px solid #30363d',
            borderRadius: '8px',
            fontSize: '13px'
          }
        }}
      />

      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected */}
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/campaigns"
          element={
            <PrivateRoute>
              <CampaignsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/integrations"
          element={
            <PrivateRoute>
              <IntegrationsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}