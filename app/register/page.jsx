'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { registerUser as apiRegister, fetchDams } from '@/lib/api'
import { useLanguage } from '@/context/LanguageContext'
import { Field, TextInput, Select, Button, FormAlert } from '@/components/form'
import { ShieldCheck, User, Mail, Lock, Phone, Building2, AlertCircle, CheckCircle, ArrowLeft, Globe, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const { t, locale, toggleLanguage } = useLanguage()
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    assignedDamId: '',
  })
  const [dams, setDams] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchDams()
      .then(res => setDams(res.dams || []))
      .catch(() => setDams([]))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName || !form.username || !form.email || !form.password) {
      setError(t('auth.register.requiredFieldsError'))
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      const res = await apiRegister(form)
      setSuccess(res.message || t('auth.register.successTitle'))
    } catch (err) {
      setError(err.message || t('auth.register.registerFailed'))
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

      <div className="w-full max-w-lg bg-card border border-borderHi rounded-xl shadow-panel p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent text-white mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-tx">
            {t('auth.register.title')}
          </h1>
          <p className="text-xs text-muted mt-1.5">
            {t('auth.register.subtitle')}
          </p>
        </div>

        {/* Alerts */}
        {!success && (
          <div className="mb-4">
            <FormAlert variant="danger" icon={AlertCircle}>{error}</FormAlert>
          </div>
        )}

        {success && (
          <div className="p-4 bg-safe/10 border border-safe/20 rounded-lg text-safe text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{t('auth.register.successTitle')}</span>
            </div>
            <p className="text-muted">{success}</p>
            <Link
              href="/login"
              className="mt-2 inline-flex items-center justify-center gap-1.5 bg-safe text-white font-bold py-2 px-4 rounded-lg text-xs hover:brightness-110 transition-all no-underline"
            >
              <span>{t('auth.register.backToLogin')}</span>
            </Link>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('auth.register.fullNameLabel')} htmlFor="fullName">
                <TextInput
                  id="fullName"
                  icon={User}
                  type="text"
                  required
                  autoComplete="name"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder={t('auth.register.fullNamePlaceholder')}
                />
              </Field>

              <Field label={t('auth.register.usernameLabel')} htmlFor="username">
                <TextInput
                  id="username"
                  icon={User}
                  type="text"
                  required
                  autoComplete="username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder={t('auth.register.usernamePlaceholder')}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('auth.register.emailLabel')} htmlFor="email">
                <TextInput
                  id="email"
                  icon={Mail}
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder={t('auth.register.emailPlaceholder')}
                />
              </Field>

              <Field label={t('auth.register.phoneLabel')} htmlFor="phoneNumber">
                <TextInput
                  id="phoneNumber"
                  icon={Phone}
                  type="tel"
                  autoComplete="tel"
                  value={form.phoneNumber}
                  onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                  placeholder={t('auth.register.phonePlaceholder')}
                />
              </Field>
            </div>

            <Field label={t('auth.register.passwordLabel')} htmlFor="password">
              <div className="relative">
                <TextInput
                  id="password"
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={t('auth.register.passwordPlaceholder')}
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

            <Field label={t('auth.register.assignedDamLabel')} htmlFor="assignedDamId">
              <Select
                id="assignedDamId"
                value={form.assignedDamId}
                onChange={e => setForm({ ...form, assignedDamId: e.target.value })}
              >
                <option value="">{t('auth.register.selectDamPlaceholder')}</option>
                {dams.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.location})
                  </option>
                ))}
              </Select>
            </Field>

            <Button type="submit" loading={loading} className="w-full py-2.5 text-xs mt-2">
              <span>{loading ? t('auth.register.submittingBtn') : t('auth.register.submitBtn')}</span>
            </Button>
          </form>
        )}

        <div className="pt-3 mt-3 border-t border-border/60 text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent no-underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('auth.register.hasAccount')} {t('auth.register.loginNow')}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
