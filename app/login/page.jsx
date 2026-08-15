'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { Label } from '@/components/ui'
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight, Globe } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const { t, locale, toggleLanguage } = useLanguage()
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.usernameOrEmail || !form.password) {
      setError(t('auth.login.emptyFieldsError'))
      return
    }

    try {
      setLoading(true)
      setError(null)
      await login(form.usernameOrEmail, form.password)
    } catch (err) {
      setError(err.message || t('auth.login.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative font-sans">
      {/* Language Switcher on Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card2/70 border border-border rounded-lg text-[11px] font-bold text-tx cursor-pointer hover:border-accent/50 hover:text-accent transition-all"
          title="Chuyển đổi ngôn ngữ / Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-accent" />
          <span>{locale === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
        </button>
      </div>

      <div className="w-full max-w-sm glass-panel rounded-2xl shadow-panel p-8 relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent2 via-accent to-indigo-600 text-white shadow-glow mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-tx">
            {t('auth.login.title')}
          </h1>
          <p className="text-xs text-muted mt-1.5">
            {t('auth.login.subtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('auth.login.usernameOrEmailLabel')}</Label>
            <div className="relative">
              <User className="w-4 h-4 text-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={form.usernameOrEmail}
                onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
                placeholder={t('auth.login.usernameOrEmailPlaceholder')}
                className="w-full bg-card2 border border-border rounded-lg pl-10 pr-3.5 py-2.5 text-[13px] text-tx placeholder:text-faint focus-visible:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <Label>{t('auth.login.passwordLabel')}</Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t('auth.login.passwordPlaceholder')}
                className="w-full bg-card2 border border-border rounded-lg pl-10 pr-3.5 py-2.5 text-[13px] text-tx placeholder:text-faint focus-visible:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-accent2 via-accent to-indigo-600 text-white rounded-lg font-bold hover:brightness-110 shadow-glow transition-all py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm mt-2"
          >
            <span>{loading ? t('auth.login.submittingBtn') : t('auth.login.submitBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Register Link */}
        <div className="pt-4 mt-4 border-t border-border/60 text-center">
          <div className="text-xs text-muted">
            {t('auth.login.noAccount')}{' '}
            <Link href="/register" className="text-accent font-bold hover:underline no-underline">
              {t('auth.login.registerNow')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
