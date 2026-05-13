import { useMemo, useState } from 'react'
import {
  X,
  Search,
  MessageSquare,
  Globe2,
  Phone
} from 'lucide-react'

import { useChatStore } from '../context/chatStore'
import { LANGUAGES } from '../lib/languages'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function NewConversationModal({
  onClose
}) {
  const [form, setForm] = useState({
    contact_name: '',
    contact_phone: '',
    contact_lang: 'en',
    platform: 'whatsapp'
  })

  const [loading, setLoading] =
    useState(false)

  const [search, setSearch] =
    useState('')

  const {
    prependConversation,
    setActiveConversation
  } = useChatStore()

  const filteredLanguages = useMemo(() => {
    return LANGUAGES.filter(lang => {
      const q = search.toLowerCase()

      return (
        lang.name
          .toLowerCase()
          .includes(q) ||
        lang.code
          .toLowerCase()
          .includes(q)
      )
    })
  }, [search])

  const handle = async (e) => {
    e.preventDefault()

    if (
      !form.contact_name.trim() ||
      !form.contact_phone.trim()
    ) {
      toast.error(
        'Please fill all fields'
      )

      return
    }

    setLoading(true)

    try {
      const { data } = await api.post(
        '/conversations',
        {
          ...form,
          contact_name:
            form.contact_name.trim(),
          contact_phone:
            form.contact_phone.trim()
        }
      )

      prependConversation(data)

      await setActiveConversation(data)

      toast.success(
        'Conversation started'
      )

      onClose()
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to create conversation'
      )
    } finally {
      setLoading(false)
    }
  }

  const setField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-800 border border-surface-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e =>
          e.stopPropagation()
        }
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <div>
            <h3 className="font-semibold text-lg text-white">
              New conversation
            </h3>

            <p className="text-xs text-surface-400 mt-1">
              Start a multilingual chat
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-surface-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handle}
          className="p-5 space-y-4"
        >
          {/* NAME */}
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">
              Contact name
            </label>

            <div className="relative">
              <MessageSquare
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500"
              />

              <input
                type="text"
                className="input-field pl-9"
                placeholder="e.g. Carlos Mendez"
                value={form.contact_name}
                onChange={e =>
                  setField(
                    'contact_name',
                    e.target.value
                  )
                }
                required
              />
            </div>
          </div>

          {/* PHONE */}
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">
              Phone number
            </label>

            <div className="relative">
              <Phone
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500"
              />

              <input
                type="text"
                className="input-field pl-9"
                placeholder="+1234567890"
                value={form.contact_phone}
                onChange={e =>
                  setField(
                    'contact_phone',
                    e.target.value
                  )
                }
                required
              />
            </div>
          </div>

          {/* LANGUAGE */}
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">
              Contact language
            </label>

            <div className="bg-surface-900 border border-surface-700 rounded-xl overflow-hidden">
              <div className="relative border-b border-surface-700">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500"
                />

                <input
                  type="text"
                  placeholder="Search language..."
                  className="w-full bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none text-white"
                  value={search}
                  onChange={e =>
                    setSearch(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="max-h-40 overflow-y-auto">
                {filteredLanguages.map(
                  lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() =>
                        setField(
                          'contact_lang',
                          lang.code
                        )
                      }
                      className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${
                        form.contact_lang ===
                        lang.code
                          ? 'bg-brand-600/20 text-brand-400'
                          : 'hover:bg-surface-700 text-white'
                      }`}
                    >
                      <span>
                        {lang.flag}
                      </span>

                      <span>
                        {lang.name}
                      </span>

                      <span className="ml-auto text-xs opacity-70 uppercase">
                        {lang.code}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* PLATFORM */}
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5">
              Platform
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                'whatsapp',
                'sms',
                'telegram'
              ].map(platform => (
                <button
                  key={platform}
                  type="button"
                  onClick={() =>
                    setField(
                      'platform',
                      platform
                    )
                  }
                  className={`rounded-xl border px-3 py-3 text-sm font-medium capitalize transition-all ${
                    form.platform ===
                    platform
                      ? 'border-brand-500 bg-brand-500/20 text-brand-400'
                      : 'border-surface-700 bg-surface-900 text-surface-300 hover:border-surface-500'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* SUMMARY */}
          <div className="bg-surface-900 border border-surface-700 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-surface-400 mb-2">
              <Globe2 size={12} />
              Translation preview
            </div>

            <p className="text-sm text-white">
              Messages will translate
              automatically between your
              language and
              {' '}
              <span className="text-brand-400 font-medium">
                {
                  LANGUAGES.find(
                    l =>
                      l.code ===
                      form.contact_lang
                  )?.name
                }
              </span>
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading
                ? 'Creating...'
                : 'Start chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}