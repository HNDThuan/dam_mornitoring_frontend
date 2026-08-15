'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { Field, TextInput, Button, FormAlert } from '@/components/form'
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight, Globe, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const { t, locale, toggleLanguage } = useLanguage()
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
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

      <div className="w-full max-w-sm bg-card border border-borderHi rounded-xl shadow-panel p-8 relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-accent text-white mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-tx">
            {t('auth.login.title')}
          </h1>
          <p className="text-xs text-muted mt-1.5">
            {t('auth.login.subtitle')}
          </p>
        </div>

        <div className="mb-4">
          <FormAlert variant="danger" icon={AlertCircle}>{error}</FormAlert>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label={t('auth.login.usernameOrEmailLabel')} required htmlFor="usernameOrEmail">
            <TextInput
              id="usernameOrEmail"
              icon={User}
              type="text"
              required
              autoComplete="username"
              value={form.usernameOrEmail}
              onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
              placeholder={t('auth.login.usernameOrEmailPlaceholder')}
            />
          </Field>

          <Field label={t('auth.login.passwordLabel')} required htmlFor="password">
            <div className="relative">
              <TextInput
                id="password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t('auth.login.passwordPlaceholder')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-faint hover:text-muted cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>

          <Button type="submit" loading={loading} className="w-full py-3 text-sm mt-2">
            <span>{loading ? t('auth.login.submittingBtn') : t('auth.login.submitBtn')}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </Button>
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
