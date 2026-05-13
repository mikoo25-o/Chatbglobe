import { useEffect, useRef, useState } from 'react'
import { Search, Phone, Video, MoreVertical, Globe2, Smile, Paperclip, Send, ChevronDown } from 'lucide-react'
import { useChatStore } from '../context/chatStore'
import { useAuthStore } from '../context/authStore'
import { getLang, getLangColor, LANGUAGES } from '../lib/languages'
import MessageBubble from './MessageBubble'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function ChatWindow() {
  const { activeConversation, messages, messagesLoading, sendMessage, typingMap } = useChatStore()
  const { user } = useAuthStore()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyLang, setReplyLang] = useState(user?.default_lang || 'en')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const conv = activeConversation
  const msgs = conv ? (messages[conv.id] || []) : []
  const isTyping = conv ? typingMap[conv.id] : false

  useEffect(() => {
    if (conv) {
      setText('')
      inputRef.current?.focus()
    }
  }, [conv?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length, isTyping])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || !conv || sending) return
    const body = text.trim()
    setText('')
    setSending(true)
    try {
      await sendMessage(conv.id, body)
    } catch {
      toast.error('Failed to send message')
      setText(body)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  if (!conv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-900 text-surface-500">
        <Globe2 size={48} className="mb-4 opacity-30" />
        <p className="text-lg font-medium">Select a conversation</p>
        <p className="text-sm mt-1">or start a new one from the sidebar</p>
      </div>
    )
  }

  const contactLang = getLang(conv.contact_lang)
  const myLang = getLang(replyLang)

  return (
    <div className="flex-1 flex flex-col bg-surface-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-700 bg-surface-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-surface-600 flex items-center justify-center font-bold text-sm">
              {conv.contact_name?.[0]?.toUpperCase()}
            </div>
            {conv.is_online && (
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-surface-800" />
            )}
          </div>
          <div>
            <div className="font-semibold text-sm">{conv.contact_name}</div>
            <div className="flex items-center gap-1.5 text-xs text-surface-500">
              <span>{conv.is_online ? 'online' : 'offline'}</span>
              <span className={`lang-badge ${getLangColor(conv.contact_lang)}`}>
                {contactLang.flag} {(conv.contact_lang || '').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-ghost p-2"><Search size={16} /></button>
          <button className="btn-ghost p-2"><Phone size={16} /></button>
          <button className="btn-ghost p-2"><Video size={16} /></button>
          <button className="btn-ghost p-2"><MoreVertical size={16} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messagesLoading ? (
          <div className="flex justify-center py-8 text-surface-500 text-sm">Loading messages...</div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-surface-500 text-sm gap-2">
            <Globe2 size={32} className="opacity-30" />
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          <>
            {msgs.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                convId={conv.id}
                isOwn={msg.direction === 'out'}
              />
            ))}
            {isTyping && (
              <div className="flex gap-2 mb-2 msg-in">
                <div className="w-7 h-7 rounded-full bg-surface-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {conv.contact_name?.[0]?.toUpperCase()}
                </div>
                <div className="bg-surface-700 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Compose */}
      <div className="px-4 pb-4 shrink-0">
        <div className="bg-surface-800 border border-surface-600 rounded-2xl overflow-hidden">
          <form onSubmit={handleSend} className="flex items-end gap-2 px-3 py-2">
            <button type="button" className="text-surface-500 hover:text-white p-1 shrink-0"><Smile size={18} /></button>
            <button type="button" className="text-surface-500 hover:text-white p-1 shrink-0"><Paperclip size={18} /></button>
            <textarea
              ref={inputRef}
              className="flex-1 bg-transparent text-sm text-white placeholder-surface-500 resize-none outline-none py-1.5 max-h-28 min-h-[36px]"
              placeholder="Type a message"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            {/* Lang picker */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowLangPicker(p => !p)}
                className={`lang-badge flex items-center gap-1 ${getLangColor(replyLang)} cursor-pointer hover:opacity-80`}
              >
                {(replyLang || '').toUpperCase()}
                <ChevronDown size={10} />
              </button>
              {showLangPicker && (
                <div className="absolute bottom-full right-0 mb-2 bg-surface-700 border border-surface-600 rounded-xl shadow-xl w-52 max-h-60 overflow-y-auto z-10">
                  <div className="p-2 text-xs text-surface-400 font-medium px-3 pt-3">Reply in</div>
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => { setReplyLang(l.code); setShowLangPicker(false) }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-600 flex items-center gap-2 ${replyLang === l.code ? 'text-brand-400' : 'text-white'}`}
                    >
                      <span>{l.flag}</span> {l.name}
                      {replyLang === l.code && <span className="ml-auto text-brand-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="btn-primary p-2 rounded-xl shrink-0 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
        <div className="flex items-center justify-between px-1 mt-1.5">
          <span className="text-[11px] text-surface-600">Messages via {conv.platform || 'WhatsApp'} · {conv.contact_phone}</span>
          <span className="text-[11px] text-brand-600 flex items-center gap-1">
            <Globe2 size={10} /> Auto-translating {contactLang.flag} → {myLang.flag}
          </span>
        </div>
      </div>
    </div>
  )
}
