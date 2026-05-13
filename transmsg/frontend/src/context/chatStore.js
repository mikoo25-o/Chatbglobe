import { create } from 'zustand'
import api from '../lib/api'

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  loading: false,
  messagesLoading: false,
  connected: false,
  typingMap: {},

  //
  // SOCKET STATUS
  //
  setConnected: (val) =>
    set({ connected: val }),

  //
  // FETCH CONVERSATIONS
  //
  fetchConversations: async () => {
    set({ loading: true })

    try {
      const { data } = await api.get('/conversations')

      const sorted = [...data].sort((a, b) => {
        const aTime = a.last_message_at
          ? new Date(a.last_message_at).getTime()
          : 0

        const bTime = b.last_message_at
          ? new Date(b.last_message_at).getTime()
          : 0

        return bTime - aTime
      })

      set({
        conversations: sorted,
        loading: false
      })
    } catch {
      set({ loading: false })
    }
  },

  //
  // ACTIVE CONVERSATION
  //
  setActiveConversation: async (conv) => {
    set({
      activeConversation: conv,
      messagesLoading: true
    })

    //
    // LOAD MESSAGES
    //
    if (!get().messages[conv.id]) {
      try {
        const { data } = await api.get(
          `/conversations/${conv.id}/messages`
        )

        set(state => ({
          messages: {
            ...state.messages,
            [conv.id]: data
          },
          messagesLoading: false
        }))
      } catch {
        set({ messagesLoading: false })
      }
    } else {
      set({ messagesLoading: false })
    }

    //
    // MARK AS READ
    //
    api
      .post(`/conversations/${conv.id}/read`)
      .catch(() => {})

    //
    // RESET UNREAD COUNT
    //
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conv.id
          ? {
              ...c,
              unread_count: 0
            }
          : c
      )
    }))
  },

  //
  // ADD MESSAGE
  //
  addMessage: (convId, message) => {
    set(state => {
      const updatedMessages = {
        ...state.messages,
        [convId]: [
          ...(state.messages[convId] || []),
          message
        ]
      }

      let updatedConversations =
        state.conversations.map(c => {
          if (c.id === convId) {
            return {
              ...c,
              last_message: message.body,
              last_message_at: message.created_at,
              unread_count:
                state.activeConversation?.id === convId
                  ? 0
                  : (c.unread_count || 0) + 1
            }
          }

          return c
        })

      //
      // SORT BY RECENT
      //
      updatedConversations.sort((a, b) => {
        const aTime = a.last_message_at
          ? new Date(a.last_message_at).getTime()
          : 0

        const bTime = b.last_message_at
          ? new Date(b.last_message_at).getTime()
          : 0

        return bTime - aTime
      })

      return {
        messages: updatedMessages,
        conversations: updatedConversations
      }
    })
  },

  //
  // SEND MESSAGE
  //
  sendMessage: async (convId, body) => {
    try {
      const { data } = await api.post(
        `/conversations/${convId}/messages`,
        { body }
      )

      get().addMessage(convId, data)

      return data
    } catch (err) {
      throw err
    }
  },

  //
  // TRANSLATION UPDATE
  //
  updateMessageTranslation: (
    convId,
    msgId,
    translation,
    translatedLang
  ) => {
    set(state => ({
      messages: {
        ...state.messages,
        [convId]: (state.messages[convId] || []).map(m =>
          m.id === msgId
            ? {
                ...m,
                translation,
                translated_lang: translatedLang
              }
            : m
        )
      }
    }))
  },

  //
  // TYPING
  //
  setTyping: (convId, isTyping) => {
    set(state => ({
      typingMap: {
        ...state.typingMap,
        [convId]: isTyping
      }
    }))

    if (isTyping) {
      setTimeout(() => {
        set(state => ({
          typingMap: {
            ...state.typingMap,
            [convId]: false
          }
        }))
      }, 3000)
    }
  },

  //
  // NEW CONVERSATION
  //
  prependConversation: (conv) => {
    set(state => {
      const exists = state.conversations.find(
        c => c.id === conv.id
      )

      let updated = []

      if (exists) {
        updated = [
          conv,
          ...state.conversations.filter(
            c => c.id !== conv.id
          )
        ]
      } else {
        updated = [conv, ...state.conversations]
      }

      return {
        conversations: updated
      }
    })
  },

  //
  // UPDATE CONVERSATION
  //
  updateConversation: (conv) => {
    set(state => {
      const exists = state.conversations.find(
        c => c.id === conv.id
      )

      let updated = []

      if (exists) {
        updated = state.conversations.map(c =>
          c.id === conv.id
            ? {
                ...c,
                ...conv
              }
            : c
        )
      } else {
        updated = [conv, ...state.conversations]
      }

      //
      // SORT
      //
      updated.sort((a, b) => {
        const aTime = a.last_message_at
          ? new Date(a.last_message_at).getTime()
          : 0

        const bTime = b.last_message_at
          ? new Date(b.last_message_at).getTime()
          : 0

        return bTime - aTime
      })

      return {
        conversations: updated
      }
    })
  },

  //
  // UNREAD
  //
  updateConversationUnread: (convId, count) => {
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === convId
          ? {
              ...c,
              unread_count:
                (c.unread_count || 0) + count
            }
          : c
      )
    }))
  }
}))