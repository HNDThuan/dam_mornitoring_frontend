'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { registerUser as apiRegister, fetchDams } from '@/lib/api'
import { useLanguage } from '@/context/LanguageContext'
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-[#060b14]">
      {/* Full Cover Bright Background Image */}
      <img
        src="/login-bg.jpg"
        alt="Dam Monitoring"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0 select-none"
      />

      {/* Language Switcher on Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card/90 backdrop-blur-md border border-border rounded-xl text-[11px] font-bold text-tx cursor-pointer hover:border-accent hover:text-accent transition-all shadow-lg"
          title="Chuyển đổi ngôn ngữ / Switch Language"
        >
          <Globe className="w-4 h-4 text-accent" />
          <span>{locale === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
        </button>
      </div>

      <div className="w-full max-w-lg bg-card/95 backdrop-blur-md border border-border rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 border border-accent/30 rounded-2xl text-accent mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-tx">
            {t('auth.register.title')}
          </h1>
          <p className="text-xs text-muted">
            {t('auth.register.subtitle')}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-safe/10 border border-safe/30 rounded-xl text-safe text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{t('auth.register.successTitle')}</span>
            </div>
            <p className="text-muted">{success}</p>
            <Link
              href="/login"
              className="mt-2 inline-flex items-center justify-center gap-1.5 bg-safe text-white font-bold py-2 px-4 rounded-lg text-xs hover:bg-safe/90 no-underline"
            >
              <span>{t('auth.register.backToLogin')}</span>
            </Link>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">{t('auth.register.fullNameLabel')}</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    placeholder={t('auth.register.fullNamePlaceholder')}
                    className="w-full bg-card2 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tx focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">{t('auth.register.usernameLabel')}</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder={t('auth.register.usernamePlaceholder')}
                    className="w-full bg-card2 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tx focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">{t('auth.register.emailLabel')}</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder={t('auth.register.emailPlaceholder')}
                    className="w-full bg-card2 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tx focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">{t('auth.register.phoneLabel')}</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder={t('auth.register.phonePlaceholder')}
                    className="w-full bg-card2 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tx focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase">{t('auth.register.passwordLabel')}</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={t('auth.register.passwordPlaceholder')}
                  className="w-full bg-card2 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tx focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase">{t('auth.register.assignedDamLabel')}</label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                <select
                  value={form.assignedDamId}
                  onChange={e => setForm({ ...form, assignedDamId: e.target.value })}
                  className="w-full bg-card2 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tx focus:outline-none focus:border-accent"
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
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-xs mt-2"
            >
              <span>{loading ? t('auth.register.submittingBtn') : t('auth.register.submitBtn')}</span>
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-border/40 text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent no-underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('auth.register.hasAccount')} {t('auth.register.loginNow')}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
