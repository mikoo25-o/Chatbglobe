import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe2, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../context/authStore'
import { LANGUAGES } from '../lib/languages'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', company: '', default_lang: 'en'
  })
  const [showPw, setShowPw] = useState(false)
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handle = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    const res = await register(form)
    if (res.success) {
      toast.success('Account created!')
      navigate('/chat')
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Globe2 size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-surface-400 text-sm mt-1">Start messaging across borders</p>
        </div>

        <div className="bg-surface-800 border border-surface-700 rounded-xl p-6">
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Full name</label>
              <input type="text" className="input-field" placeholder="Your name" value={form.name}
                onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Company (optional)</label>
              <input type="text" className="input-field" placeholder="Your company" value={form.company}
                onChange={e => set('company', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
              <input type="email" className="input-field" placeholder="you@company.com" value={form.email}
                onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Default language</label>
              <select className="input-field" value={form.default_lang} onChange={e => set('default_lang', e.target.value)}>
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field pr-10"
                  placeholder="Min. 8 characters" value={form.password}
                  onChange={e => set('password', e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white"
                  onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-surface-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
