import { Link } from 'react-router-dom'
import {
  Globe2,
  Zap,
  Shield,
  MessageSquare,
  ArrowRight,
  Check,
  Sparkles
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-900 text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-120px] left-[-120px] w-[300px] h-[300px] bg-brand-600/20 blur-3xl rounded-full" />
        <div className="absolute bottom-[-120px] right-[-120px] w-[300px] h-[300px] bg-brand-500/10 blur-3xl rounded-full" />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-surface-700/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Globe2 size={18} className="text-white" />
          </div>

          <div>
            <h1 className="font-bold text-lg tracking-tight">
              TransMsg
            </h1>
            <p className="text-[11px] text-surface-500">
              Global messaging platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="btn-ghost text-sm"
          >
            Sign in
          </Link>

          <Link
            to="/register"
            className="btn-primary text-sm"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pt-24 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-950 border border-brand-800 text-brand-400 text-xs font-medium px-4 py-2 rounded-full mb-8">
              <Sparkles size={12} />
              AI-powered real-time translation
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Message anyone
              <br />
              in{' '}
              <span className="text-brand-400">
                any language
              </span>
            </h1>

            <p className="text-surface-400 text-lg leading-relaxed max-w-xl mb-10">
              TransMsg helps businesses communicate globally
              using real-time translation across WhatsApp,
              SMS and Telegram from one unified inbox.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link
                to="/register"
                className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
              >
                Create account
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/login"
                className="btn-ghost px-6 py-3 text-base"
              >
                Sign in
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-surface-400">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-green-500" />
                No credit card
              </div>

              <div className="flex items-center gap-2">
                <Check size={14} className="text-green-500" />
                Free starter plan
              </div>

              <div className="flex items-center gap-2">
                <Check size={14} className="text-green-500" />
                Setup in minutes
              </div>
            </div>
          </div>

          {/* RIGHT MOCKUP */}
          <div className="relative">
            <div className="bg-surface-800 border border-surface-700 rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="border-b border-surface-700 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center font-semibold">
                    A
                  </div>

                  <div>
                    <p className="font-medium">
                      Ahmed Hassan
                    </p>
                    <p className="text-xs text-green-500">
                      Online
                    </p>
                  </div>
                </div>

                <div className="text-xs text-surface-500">
                  Arabic → English
                </div>
              </div>

              {/* Messages */}
              <div className="p-5 space-y-4 bg-surface-900/40">
                <div className="max-w-[75%] bg-surface-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-sm">
                    مرحبا كيف حالك؟
                  </p>

                  <div className="mt-2 text-xs text-brand-400 border-t border-surface-600 pt-2">
                    Translation: Hello, how are you?
                  </div>
                </div>

                <div className="max-w-[75%] ml-auto bg-brand-600 rounded-2xl rounded-tr-sm px-4 py-3">
                  <p className="text-sm">
                    I’m good! Your order has been shipped.
                  </p>
                </div>

                <div className="max-w-[75%] bg-surface-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-sm">
                    شكرا جزيلا
                  </p>

                  <div className="mt-2 text-xs text-brand-400 border-t border-surface-600 pt-2">
                    Translation: Thank you very much
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-surface-700 p-4">
                <div className="bg-surface-700 rounded-xl px-4 py-3 text-sm text-surface-400">
                  Type a message...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">
            Everything in one inbox
          </h2>

          <p className="text-surface-400 max-w-2xl mx-auto">
            Built for international businesses, customer
            support teams and global communication.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Globe2 size={22} />,
              title: 'Real-Time Translation',
              desc:
                'Automatically translate incoming and outgoing messages instantly.'
            },
            {
              icon: <MessageSquare size={22} />,
              title: 'Unified Messaging',
              desc:
                'Manage WhatsApp, SMS and Telegram conversations from one dashboard.'
            },
            {
              icon: <Shield size={22} />,
              title: 'Enterprise Security',
              desc:
                'Secure authentication, encrypted APIs and scalable infrastructure.'
            }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-surface-800 border border-surface-700 rounded-2xl p-6 hover:border-brand-700 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-950 border border-brand-800 text-brand-400 flex items-center justify-center mb-5">
                {item.icon}
              </div>

              <h3 className="font-semibold text-lg mb-2">
                {item.title}
              </h3>

              <p className="text-surface-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="relative z-10 max-w-4xl mx-auto px-8 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Simple pricing
          </h2>

          <p className="text-surface-400">
            Start free and upgrade when you grow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              name: 'Starter',
              price: '$0',
              period: '/month',
              features: [
                '1 connected number',
                '500 messages/month',
                '5 languages',
                'Basic analytics'
              ],
              cta: 'Start free',
              highlight: false
            },
            {
              name: 'Pro',
              price: '$29',
              period: '/month',
              features: [
                'Unlimited numbers',
                'Unlimited messages',
                '20+ languages',
                'Advanced analytics',
                'API access',
                'Priority support'
              ],
              cta: 'Start trial',
              highlight: true
            }
          ].map((plan, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-7 ${
                plan.highlight
                  ? 'bg-brand-950 border-brand-700'
                  : 'bg-surface-800 border-surface-700'
              }`}
            >
              <div className="mb-6">
                <p className="text-surface-400 text-sm mb-2">
                  {plan.name}
                </p>

                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">
                    {plan.price}
                  </span>

                  <span className="text-surface-400 text-sm mb-1">
                    {plan.period}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Check
                      size={14}
                      className="text-green-500"
                    />

                    <span className="text-surface-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                to="/register"
                className={`block text-center py-3 rounded-xl font-medium transition-all ${
                  plan.highlight
                    ? 'bg-brand-600 hover:bg-brand-500'
                    : 'bg-surface-700 hover:bg-surface-600'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-surface-700 px-8 py-8 text-center text-sm text-surface-500">
        © 2026 TransMsg. Built for global communication.
      </footer>
    </div>
  )
}