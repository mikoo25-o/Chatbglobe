import { useState } from 'react'
import {
  Globe2,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCheck,
  Clock,
  Copy,
  Languages
} from 'lucide-react'

import { getLangColor, getLang } from '../lib/languages'
import api from '../lib/api'
import { useChatStore } from '../context/chatStore'
import toast from 'react-hot-toast'

function StatusIcon({ status }) {
  if (status === 'sending') {
    return (
      <Clock
        size={11}
        className="text-surface-500"
      />
    )
  }

  if (status === 'sent') {
    return (
      <Check
        size={11}
        className="text-surface-500"
      />
    )
  }

  if (status === 'delivered') {
    return (
      <CheckCheck
        size={11}
        className="text-surface-500"
      />
    )
  }

  if (status === 'read') {
    return (
      <CheckCheck
        size={11}
        className="text-brand-400"
      />
    )
  }

  return null
}

export default function MessageBubble({
  message,
  convId,
  isOwn
}) {
  const [showTranslation, setShowTranslation] =
    useState(true)

  const [translating, setTranslating] =
    useState(false)

  const { updateMessageTranslation } =
    useChatStore()

  const hasTranslation =
    !!message.translation

  const detectedLang =
    message.detected_lang

  const translatedLang =
    message.translated_lang

  const langInfo = detectedLang
    ? getLang(detectedLang)
    : null

  const translatedInfo = translatedLang
    ? getLang(translatedLang)
    : null

  const translate = async () => {
    //
    // TOGGLE EXISTING TRANSLATION
    //
    if (message.translation) {
      setShowTranslation(prev => !prev)
      return
    }

    setTranslating(true)

    try {
      const { data } = await api.post(
        `/conversations/${convId}/messages/${message.id}/translate`
      )

      updateMessageTranslation(
        convId,
        message.id,
        data.translation,
        data.target_lang
      )

      setShowTranslation(true)
    } catch {
      toast.error(
        'Translation failed'
      )
    } finally {
      setTranslating(false)
    }
  }

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)

      toast.success('Copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  const time = message.created_at
    ? new Date(
        message.created_at
      ).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    : ''

  //
  // OUTGOING MESSAGE
  //
  if (isOwn) {
    return (
      <div className="flex justify-end mb-3 msg-out">
        <div className="max-w-[75%]">
          <div className="bg-brand-700/80 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.body}
            </p>

            {hasTranslation &&
              showTranslation && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  <div className="flex items-center gap-1 mb-1">
                    <Languages
                      size={10}
                      className="text-brand-200"
                    />

                    <span className="text-[10px] text-brand-200 font-medium">
                      Translation
                    </span>

                    {translatedLang && (
                      <span className="text-[10px] text-brand-300">
                        →
                        {' '}
                        {translatedLang.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-brand-100 leading-relaxed whitespace-pre-wrap break-words">
                    {message.translation}
                  </p>
                </div>
              )}

            <div className="flex items-center justify-between mt-2 gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    copyText(message.body)
                  }
                  className="text-[10px] text-brand-200 hover:text-white flex items-center gap-1"
                >
                  <Copy size={10} />
                  Copy
                </button>

                {hasTranslation && (
                  <button
                    onClick={translate}
                    className="text-[10px] text-brand-200 hover:text-white flex items-center gap-1"
                  >
                    <Globe2 size={10} />

                    {showTranslation
                      ? 'Hide'
                      : 'Show'}

                    {showTranslation ? (
                      <ChevronUp size={10} />
                    ) : (
                      <ChevronDown size={10} />
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-brand-300">
                  {time}
                </span>

                <StatusIcon
                  status={message.status}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  //
  // INCOMING MESSAGE
  //
  return (
    <div className="flex gap-2 mb-3 msg-in">
      <div className="w-7 h-7 rounded-full bg-surface-600 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
        {message.sender_name?.[0]?.toUpperCase() ||
          '?'}
      </div>

      <div className="max-w-[75%]">
        <div className="bg-surface-700 text-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.body}
          </p>

          {hasTranslation &&
            showTranslation && (
              <div className="mt-2 pt-2 border-t border-surface-600">
                <div className="flex items-center gap-1 mb-1">
                  <Globe2
                    size={10}
                    className="text-brand-400"
                  />

                  <span className="text-[10px] text-brand-400 font-medium">
                    Translated
                  </span>

                  {translatedLang && (
                    <span className="text-[10px] text-surface-400">
                      →
                      {' '}
                      {translatedLang.toUpperCase()}
                    </span>
                  )}
                </div>

                <p className="text-xs text-surface-200 leading-relaxed whitespace-pre-wrap break-words">
                  {message.translation}
                </p>
              </div>
            )}

          <div className="flex items-center justify-between mt-2 gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {detectedLang && (
                <span
                  className={`lang-badge ${getLangColor(
                    detectedLang
                  )}`}
                >
                  {langInfo?.flag}
                  {' '}
                  {detectedLang.toUpperCase()}
                </span>
              )}

              <button
                onClick={translate}
                disabled={translating}
                className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
              >
                <Globe2 size={10} />

                {translating
                  ? 'Translating...'
                  : hasTranslation
                  ? showTranslation
                    ? 'Hide'
                    : 'Show'
                  : 'Translate'}

                {hasTranslation &&
                  (showTranslation ? (
                    <ChevronUp size={10} />
                  ) : (
                    <ChevronDown size={10} />
                  ))}
              </button>

              <button
                onClick={() =>
                  copyText(message.body)
                }
                className="text-[10px] text-surface-400 hover:text-white flex items-center gap-1"
              >
                <Copy size={10} />
                Copy
              </button>
            </div>

            <span className="text-[10px] text-surface-500 shrink-0">
              {time}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}