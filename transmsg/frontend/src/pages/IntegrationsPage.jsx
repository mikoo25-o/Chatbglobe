import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle
} from 'lucide-react'

import {
  FaWhatsapp,
  FaTelegram,
  FaFacebookMessenger
} from 'react-icons/fa'

import Sidebar from '../components/Sidebar'
import api from '../lib/api'
import toast from 'react-hot-toast'

const PLATFORMS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: <FaWhatsapp className="text-green-500 text-3xl" />,
    desc: 'Connect your WhatsApp account'
  },

  {
    id: 'telegram',
    name: 'Telegram',
    icon: <FaTelegram className="text-sky-500 text-3xl" />,
    desc: 'Connect your Telegram account'
  },

 {
  id: 'sms',
  name: 'Twilio SMS',
  icon: (
    <div className="bg-blue-500 text-white text-sm font-bold px-2 py-1 rounded-md">
      Twilio
    </div>
  ),
  desc: 'Connect your Twilio SMS account'
}
]

export default function IntegrationsPage() {
  const navigate = useNavigate()

  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(null)

  const [form, setForm] = useState({
    phone_number: '',
    api_key: '',
    api_secret: '',
    webhook_url: ''
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get('/integrations')
      .then((r) => setIntegrations(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const connect = async (platform) => {
    setSaving(true)

    try {
      const { data } = await api.post('/integrations', {
        platform,
        ...form
      })

      setIntegrations((p) => [...p, data])

      toast.success(`${platform} connected!`)

      setShowAdd(null)

      setForm({
        phone_number: '',
        api_key: '',
        api_secret: '',
        webhook_url: ''
      })
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Connection failed'
      )
    } finally {
      setSaving(false)
    }
  }

  const disconnect = async (id) => {
    if (!confirm('Disconnect this integration?')) return

    try {
      await api.delete(`/integrations/${id}`)

      setIntegrations((p) =>
        p.filter((i) => i.id !== id)
      )

      toast.success('Disconnected')
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto bg-surface-900">
        <div className="max-w-2xl mx-auto px-6 py-8">

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 text-surface-400 hover:text-white text-sm mb-6"
          >
            <ArrowLeft size={16} />
            Back to messages
          </button>

          <h1 className="text-2xl font-bold mb-2">
            Integrations
          </h1>

          <p className="text-surface-400 text-sm mb-8">
            Connect your messaging accounts to start
            chatting and translating conversations in
            real time.
          </p>

          {/* CONNECTED */}
          {integrations.length > 0 && (
            <div className="mb-8">

              <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">
                Connected
              </h2>

              <div className="space-y-3">

                {integrations.map((integ) => {
                  const plat = PLATFORMS.find(
                    (p) => p.id === integ.platform
                  )

                  return (
                    <div
                      key={integ.id}
                      className="bg-surface-800 border border-surface-700 rounded-xl p-4 flex items-center justify-between"
                    >

                      <div className="flex items-center gap-3">

                        {plat?.icon}

                        <div>

                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {plat?.name}
                            </span>

                            <CheckCircle
                              size={13}
                              className="text-green-400"
                            />
                          </div>

                          <p className="text-xs text-surface-400 mt-0.5">
                            {integ.phone_number ||
                              integ.identifier}
                          </p>

                        </div>
                      </div>

                      <button
                        onClick={() =>
                          disconnect(integ.id)
                        }
                        className="text-surface-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>

                    </div>
                  )
                })}

              </div>
            </div>
          )}

          {/* AVAILABLE */}
          <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">
            Add integration
          </h2>

          <div className="space-y-3">

            {PLATFORMS.map((plat) => {
              const isConnected = integrations.some(
                (i) => i.platform === plat.id
              )

              const isOpen = showAdd === plat.id

              return (
                <div
                  key={plat.id}
                  className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden"
                >

                  <div className="p-4 flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      {plat.icon}

                      <div>
                        <p className="font-medium text-sm">
                          {plat.name}
                        </p>

                        <p className="text-xs text-surface-400 mt-0.5">
                          {plat.desc}
                        </p>
                      </div>

                    </div>

                    {isConnected ? (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Connected
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          setShowAdd(
                            isOpen ? null : plat.id
                          )
                        }
                        className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
                      >
                        <Plus size={13} />
                        Connect
                      </button>
                    )}

                  </div>

                  {isOpen && (
                    <div className="border-t border-surface-700 p-4 space-y-3 bg-surface-900/50">

                      <div>

                        <label className="block text-xs font-medium text-surface-400 mb-1.5">
                          Phone Number
                        </label>

                        <input
                          type="text"
                          className="input-field"
                          placeholder="+1234567890"
                          value={form.phone_number}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              phone_number:
                                e.target.value
                            }))
                          }
                        />

                      </div>

                      <div className="flex gap-2 pt-1">

                        <button
                          onClick={() =>
                            setShowAdd(null)
                          }
                          className="btn-ghost flex-1 text-sm"
                        >
                          Cancel
                        </button>

                        <button
                          onClick={() =>
                            connect(plat.id)
                          }
                          disabled={saving}
                          className="btn-primary flex-1 text-sm"
                        >
                          {saving
                            ? 'Connecting...'
                            : 'Connect'}
                        </button>

                      </div>

                    </div>
                  )}

                </div>
              )
            })}

          </div>
        </div>
      </div>
    </div>
  )
}