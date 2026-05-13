import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([])

  const [form, setForm] = useState({
    name: '',
    message_template: '',
    platform: 'whatsapp',
    scheduled_at: ''
  })

  const [contactForms, setContactForms] = useState({})

  const [loading, setLoading] = useState(false)

  async function loadCampaigns() {
    try {
      const { data } = await api.get('/campaigns')
      setCampaigns(data)
    } catch {
      toast.error('Failed to load campaigns')
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  async function createCampaign(e) {
    e.preventDefault()

    if (!form.name || !form.message_template) {
      return toast.error('Fill all fields')
    }

    setLoading(true)

    try {
      const payload = {
        ...form,
        scheduled_at: form.scheduled_at || null
      }

      const { data } = await api.post('/campaigns', payload)

      setCampaigns(prev => [data, ...prev])

      setForm({
        name: '',
        message_template: '',
        platform: 'whatsapp',
        scheduled_at: ''
      })

      toast.success('Campaign created')
    } catch {
      toast.error('Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  async function startCampaign(id) {
    try {
      const { data } = await api.post(`/campaigns/${id}/start`)

      toast.success(`Queued ${data.queued} messages`)

      loadCampaigns()
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        'Failed to start campaign'
      )
    }
  }

  async function stopCampaign(id) {
    try {
      await api.post(`/campaigns/${id}/stop`)

      toast.success('Campaign stopped')

      loadCampaigns()
    } catch {
      toast.error('Failed to stop campaign')
    }
  }

  async function deleteCampaign(id) {
    if (!confirm('Delete this campaign?')) return

    try {
      await api.delete(`/campaigns/${id}`)

      setCampaigns(prev =>
        prev.filter(c => c.id !== id)
      )

      toast.success('Campaign deleted')
    } catch {
      toast.error('Failed to delete campaign')
    }
  }

  async function addContact(campaignId) {
    const form = contactForms[campaignId]

    if (!form?.contact_phone) {
      return toast.error('Phone required')
    }

    try {
      await api.post(
        `/campaigns/${campaignId}/contacts`,
        form
      )

      toast.success('Contact added')

      setContactForms(prev => ({
        ...prev,
        [campaignId]: {
          contact_name: '',
          contact_phone: '',
          language: 'en',
          opt_in: true
        }
      }))

      loadCampaigns()
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        'Failed to add contact'
      )
    }
  }

  function updateContactForm(campaignId, field, value) {
    setContactForms(prev => ({
      ...prev,
      [campaignId]: {
        contact_name: '',
        contact_phone: '',
        language: 'en',
        opt_in: true,
        ...prev[campaignId],
        [field]: value
      }
    }))
  }

  return (
    <div className="flex h-screen bg-surface-900">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            Campaigns
          </h1>

          {/* CREATE CAMPAIGN */}

          <form
            onSubmit={createCampaign}
            className="bg-surface-800 border border-surface-700 rounded-2xl p-5 mb-8 space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Campaign name"
                className="input-field"
                value={form.name}
                onChange={e =>
                  setForm(p => ({
                    ...p,
                    name: e.target.value
                  }))
                }
              />

              <select
                className="input-field"
                value={form.platform}
                onChange={e =>
                  setForm(p => ({
                    ...p,
                    platform: e.target.value
                  }))
                }
              >
                <option value="whatsapp">
                  WhatsApp
                </option>

                <option value="sms">
                  SMS
                </option>

                <option value="telegram">
                  Telegram
                </option>
              </select>
            </div>

            <textarea
              placeholder="Message template"
              className="input-field min-h-[120px]"
              value={form.message_template}
              onChange={e =>
                setForm(p => ({
                  ...p,
                  message_template: e.target.value
                }))
              }
            />

            <div>
              <label className="text-sm text-surface-400 mb-2 block">
                Schedule (optional)
              </label>

              <input
                type="datetime-local"
                className="input-field"
                value={form.scheduled_at}
                onChange={e =>
                  setForm(p => ({
                    ...p,
                    scheduled_at: e.target.value
                  }))
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading
                ? 'Creating...'
                : 'Create Campaign'}
            </button>
          </form>

          {/* CAMPAIGNS */}

          <div className="space-y-5">
            {campaigns.map(campaign => {
              const contactForm =
                contactForms[campaign.id] || {}

              return (
                <div
                  key={campaign.id}
                  className="bg-surface-800 border border-surface-700 rounded-2xl p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex-1">
                      <h2 className="font-semibold text-xl">
                        {campaign.name}
                      </h2>

                      <p className="text-surface-400 text-sm mt-2 whitespace-pre-wrap">
                        {campaign.message_template}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-4 text-xs">
                        <span className="px-2 py-1 rounded bg-surface-700">
                          {campaign.platform}
                        </span>

                        <span className="px-2 py-1 rounded bg-brand-500/20 text-brand-400">
                          {campaign.status}
                        </span>

                        <span className="px-2 py-1 rounded bg-surface-700">
                          Contacts:
                          {' '}
                          {campaign.contacts_count || 0}
                        </span>

                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">
                          Sent:
                          {' '}
                          {campaign.sent_count || 0}
                        </span>

                        <span className="px-2 py-1 rounded bg-red-500/20 text-red-400">
                          Failed:
                          {' '}
                          {campaign.failed_count || 0}
                        </span>
                      </div>

                      {campaign.scheduled_at && (
                        <div className="text-xs text-surface-500 mt-3">
                          Scheduled:
                          {' '}
                          {new Date(
                            campaign.scheduled_at
                          ).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          startCampaign(campaign.id)
                        }
                        className="btn-primary"
                      >
                        Start
                      </button>

                      <button
                        onClick={() =>
                          stopCampaign(campaign.id)
                        }
                        className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-400"
                      >
                        Stop
                      </button>

                      <button
                        onClick={() =>
                          deleteCampaign(campaign.id)
                        }
                        className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* ADD CONTACT */}

                  <div className="mt-6 border-t border-surface-700 pt-5">
                    <h3 className="font-medium mb-4">
                      Add Contact
                    </h3>

                    <div className="grid md:grid-cols-5 gap-3">
                      <input
                        type="text"
                        placeholder="Name"
                        className="input-field"
                        value={
                          contactForm.contact_name || ''
                        }
                        onChange={e =>
                          updateContactForm(
                            campaign.id,
                            'contact_name',
                            e.target.value
                          )
                        }
                      />

                      <input
                        type="text"
                        placeholder="Phone / Chat ID"
                        className="input-field"
                        value={
                          contactForm.contact_phone || ''
                        }
                        onChange={e =>
                          updateContactForm(
                            campaign.id,
                            'contact_phone',
                            e.target.value
                          )
                        }
                      />

                      <select
                        className="input-field"
                        value={
                          contactForm.language || 'en'
                        }
                        onChange={e =>
                          updateContactForm(
                            campaign.id,
                            'language',
                            e.target.value
                          )
                        }
                      >
                        <option value="en">
                          English
                        </option>

                        <option value="sw">
                          Swahili
                        </option>

                        <option value="fr">
                          French
                        </option>

                        <option value="es">
                          Spanish
                        </option>

                        <option value="ar">
                          Arabic
                        </option>
                      </select>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={
                            contactForm.opt_in !== false
                          }
                          onChange={e =>
                            updateContactForm(
                              campaign.id,
                              'opt_in',
                              e.target.checked
                            )
                          }
                        />

                        Opt-in
                      </label>

                      <button
                        onClick={() =>
                          addContact(campaign.id)
                        }
                        className="btn-primary"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}