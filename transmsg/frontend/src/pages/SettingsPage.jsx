import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Bell,
  Globe2,
  Shield,
  Save
} from 'lucide-react'

import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../context/authStore'
import { LANGUAGES } from '../lib/languages'
import api from '../lib/api'

import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, updateUser } =
    useAuthStore()

  const navigate = useNavigate()

  const [tab, setTab] =
    useState('profile')

  const [form, setForm] = useState({
    name: user?.name || '',
    company: user?.company || '',
    default_lang:
      user?.default_lang || 'en',
    auto_translate:
      user?.auto_translate ?? true,
    notifications:
      user?.notifications ?? true
  })

  const [saving, setSaving] =
    useState(false)

  const [pwForm, setPwForm] =
    useState({
      current: '',
      next: '',
      confirm: ''
    })

  const set = (k, v) =>
    setForm(p => ({
      ...p,
      [k]: v
    }))

  //
  // SAVE PROFILE
  //
  const saveProfile = async () => {
    setSaving(true)

    try {
      const { data } = await api.put(
        '/users/me',
        form
      )

      updateUser(data)

      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  //
  // CHANGE PASSWORD
  //
  const changePassword = async () => {
    if (pwForm.next !== pwForm.confirm) {
      toast.error(
        'Passwords do not match'
      )

      return
    }

    if (pwForm.next.length < 8) {
      toast.error('Password too short')

      return
    }

    setSaving(true)

    try {
      await api.post(
        '/users/me/password',
        {
          current_password:
            pwForm.current,

          new_password: pwForm.next
        }
      )

      toast.success('Password changed')

      setPwForm({
        current: '',
        next: '',
        confirm: ''
      })
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to change password'
      )
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    {
      id: 'profile',
      icon: User,
      label: 'Profile'
    },
    {
      id: 'translation',
      icon: Globe2,
      label: 'Translation'
    },
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications'
    },
    {
      id: 'security',
      icon: Shield,
      label: 'Security'
    }
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto bg-surface-900">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <button
            onClick={() =>
              navigate('/chat')
            }
            className="flex items-center gap-2 text-surface-400 hover:text-white text-sm mb-6"
          >
            <ArrowLeft size={16} />
            Back to messages
          </button>

          <h1 className="text-2xl font-bold mb-6">
            Settings
          </h1>

          <div className="flex gap-1 mb-6 bg-surface-800 border border-surface-700 rounded-xl p-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-surface-700 text-white'
                    : 'text-surface-400 hover:text-white'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-surface-800 border border-surface-700 rounded-xl p-6">
            {/* PROFILE */}
            {tab === 'profile' && (
              <div className="space-y-4">
                <h2 className="font-semibold mb-4">
                  Profile settings
                </h2>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Full name
                  </label>

                  <input
                    type="text"
                    className="input-field"
                    value={form.name}
                    onChange={e =>
                      set(
                        'name',
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Company
                  </label>

                  <input
                    type="text"
                    className="input-field"
                    value={form.company}
                    onChange={e =>
                      set(
                        'company',
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Email
                  </label>

                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field opacity-50 cursor-not-allowed"
                  />
                </div>

                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={14} />

                  {saving
                    ? 'Saving...'
                    : 'Save changes'}
                </button>
              </div>
            )}

            {/* TRANSLATION */}
            {tab === 'translation' && (
              <div className="space-y-4">
                <h2 className="font-semibold mb-4">
                  Translation settings
                </h2>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Default language
                  </label>

                  <select
                    className="input-field"
                    value={form.default_lang}
                    onChange={e =>
                      set(
                        'default_lang',
                        e.target.value
                      )
                    }
                  >
                    {LANGUAGES.map(l => (
                      <option
                        key={l.code}
                        value={l.code}
                      >
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>

                  <p className="text-xs text-surface-500 mt-1.5">
                    Incoming messages
                    will be translated
                    to this language
                  </p>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-surface-700">
                  <div>
                    <p className="text-sm font-medium">
                      Auto-translate
                      incoming messages
                    </p>

                    <p className="text-xs text-surface-500 mt-0.5">
                      Automatically
                      translate messages
                      from other
                      languages
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      set(
                        'auto_translate',
                        !form.auto_translate
                      )
                    }
                    className={`w-11 h-6 rounded-full transition-colors ${
                      form.auto_translate
                        ? 'bg-brand-600'
                        : 'bg-surface-600'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full transition-transform mx-1 ${
                        form.auto_translate
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={14} />

                  {saving
                    ? 'Saving...'
                    : 'Save changes'}
                </button>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {tab === 'notifications' && (
              <div className="space-y-4">
                <h2 className="font-semibold mb-4">
                  Notification
                  preferences
                </h2>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">
                      Push notifications
                    </p>

                    <p className="text-xs text-surface-500 mt-0.5">
                      Get notified for
                      new messages
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      set(
                        'notifications',
                        !form.notifications
                      )
                    }
                    className={`w-11 h-6 rounded-full transition-colors ${
                      form.notifications
                        ? 'bg-brand-600'
                        : 'bg-surface-600'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full transition-transform mx-1 ${
                        form.notifications
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={14} />

                  {saving
                    ? 'Saving...'
                    : 'Save changes'}
                </button>
              </div>
            )}

            {/* SECURITY */}
            {tab === 'security' && (
              <div className="space-y-4">
                <h2 className="font-semibold mb-4">
                  Change password
                </h2>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Current password
                  </label>

                  <input
                    type="password"
                    className="input-field"
                    value={pwForm.current}
                    onChange={e =>
                      setPwForm(p => ({
                        ...p,
                        current:
                          e.target.value
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    New password
                  </label>

                  <input
                    type="password"
                    className="input-field"
                    value={pwForm.next}
                    onChange={e =>
                      setPwForm(p => ({
                        ...p,
                        next:
                          e.target.value
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Confirm new password
                  </label>

                  <input
                    type="password"
                    className="input-field"
                    value={pwForm.confirm}
                    onChange={e =>
                      setPwForm(p => ({
                        ...p,
                        confirm:
                          e.target.value
                      }))
                    }
                  />
                </div>

                <button
                  onClick={changePassword}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Shield size={14} />

                  {saving
                    ? 'Updating...'
                    : 'Update password'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}