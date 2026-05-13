import { useEffect, useMemo, useState } from 'react'
import { Search, Edit3, SlidersHorizontal } from 'lucide-react'
import { useChatStore } from '../context/chatStore'
import { getLangColor } from '../lib/languages'
import NewConversationModal from './NewConversationModal'

function formatTime(ts) {
  if (!ts) return ''

  try {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now - d
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) {
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }

    if (diffDays === 1) return 'Yesterday'

    if (diffDays < 7) {
      return d.toLocaleDateString([], {
        weekday: 'short'
      })
    }

    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return ''
  }
}

export default function ConversationList() {
  const {
    conversations,
    loading,
    fetchConversations,
    activeConversation,
    setActiveConversation
  } = useChatStore()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aTime = a.last_message_at
        ? new Date(a.last_message_at).getTime()
        : 0

      const bTime = b.last_message_at
        ? new Date(b.last_message_at).getTime()
        : 0

      return bTime - aTime
    })
  }, [conversations])

  const filtered = sortedConversations.filter(c => {
    const q = search.toLowerCase()

    const matchSearch =
      !q ||
      c.contact_name?.toLowerCase().includes(q) ||
      c.last_message?.toLowerCase().includes(q)

    const matchFilter =
      filter === 'all' ||
      (filter === 'unread' && c.unread_count > 0) ||
      (filter === 'groups' && c.is_group)

    return matchSearch && matchFilter
  })

  return (
    <div className="w-[320px] bg-surface-800 border-r border-surface-700 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">
            Messages
          </h2>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNew(true)}
              className="btn-ghost p-1.5 rounded-lg"
            >
              <Edit3 size={15} />
            </button>

            <button className="btn-ghost p-1.5 rounded-lg">
              <SlidersHorizontal size={15} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500"
          />

          <input
            type="text"
            className="input-field pl-8 py-1.5 text-xs"
            placeholder="Search or start new chat"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1 mt-2.5">
          {['all', 'unread', 'groups'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-700 text-surface-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-surface-500 text-sm">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-surface-500 text-sm gap-2">
            <span>No conversations</span>

            <button
              onClick={() => setShowNew(true)}
              className="text-brand-400 text-xs hover:underline"
            >
              Start one
            </button>
          </div>
        ) : (
          filtered.map(conv => (
            <ConvItem
              key={conv.id}
              conv={conv}
              active={activeConversation?.id === conv.id}
              onClick={() => setActiveConversation(conv)}
            />
          ))
        )}
      </div>

      {showNew && (
        <NewConversationModal
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  )
}

function ConvItem({ conv, active, onClick }) {
  const langColor = getLangColor(conv.contact_lang)

  const initials = conv.contact_name
    ? conv.contact_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all hover:bg-surface-700/60 border-b border-surface-700/40 ${
        active
          ? 'bg-surface-700 border-l-2 border-l-brand-500'
          : ''
      }`}
    >
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-surface-600 flex items-center justify-center text-sm font-bold text-white">
          {initials}
        </div>

        {conv.is_online && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface-800" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-medium text-sm text-white truncate">
            {conv.contact_name}
          </span>

          <span className="text-[11px] text-surface-500 shrink-0 ml-2">
            {formatTime(conv.last_message_at)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-400 truncate flex-1">
            {conv.last_message || 'No messages yet'}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {conv.contact_lang && (
              <span className={`lang-badge ${langColor}`}>
                {conv.contact_lang.toUpperCase()}
              </span>
            )}

            {conv.unread_count > 0 && (
              <span className="bg-brand-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                {conv.unread_count > 99
                  ? '99+'
                  : conv.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}