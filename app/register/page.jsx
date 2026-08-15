'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { registerUser as apiRegister, fetchDams } from '@/lib/api'
import { useLanguage } from '@/context/LanguageContext'
import { Label } from '@/components/ui'
import { ShieldCheck, User, Mail, Lock, Phone, Building2, AlertCircle, CheckCircle, ArrowLeft, Globe } from 'lucide-react'

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

      <div className="w-full max-w-lg glass-panel rounded-2xl shadow-panel p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-accent2 via-accent to-indigo-600 text-white shadow-glow mb-2">
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
        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
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
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5">{t('auth.register.fullNameLabel')}</Label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    placeholder={t('auth.register.fullNamePlaceholder')}
                    className="w-full bg-card2 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-tx placeholder:text-faint focus-visible:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1.5">{t('auth.register.usernameLabel')}</Label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder={t('auth.register.usernamePlaceholder')}
                    className="w-full bg-card2 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-tx placeholder:text-faint focus-visible:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5">{t('auth.register.emailLabel')}</Label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder={t('auth.register.emailPlaceholder')}
                    className="w-full bg-card2 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-tx placeholder:text-faint focus-visible:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1.5">{t('auth.register.phoneLabel')}</Label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder={t('auth.register.phonePlaceholder')}
                    className="w-full bg-card2 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-tx placeholder:text-faint focus-visible:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-1.5">{t('auth.register.passwordLabel')}</Label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={t('auth.register.passwordPlaceholder')}
                  className="w-full bg-card2 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-tx placeholder:text-faint focus-visible:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5">{t('auth.register.assignedDamLabel')}</Label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={form.assignedDamId}
                  onChange={e => setForm({ ...form, assignedDamId: e.target.value })}
                  className="w-full bg-card2 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-tx focus-visible:outline-none focus:border-accent transition-colors"
                >
                  <option value="">{t('auth.register.selectDamPlaceholder')}</option>
                  {dams.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.location})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-accent2 via-accent to-indigo-600 text-white rounded-lg font-bold hover:brightness-110 shadow-glow transition-all py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs mt-2"
            >
              <span>{loading ? t('auth.register.submittingBtn') : t('auth.register.submitBtn')}</span>
            </button>
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
