'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.usernameOrEmail || !form.password) {
      setError('Vui lòng nhập tên đăng nhập/email và mật khẩu')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await login(form.usernameOrEmail, form.password)
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-[#060b14]">
      {/* Full Uncropped Bright Background Image */}
      <img
        src="/login-bg.jpg"
        alt="Dam Monitoring"
        className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none z-0 select-none"
      />

      <div className="w-full max-w-md bg-card/95 backdrop-blur-md border border-border rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent/10 border border-accent/30 rounded-2xl text-accent mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-tx">
            HỆ THỐNG GIÁM SÁT ĐẬP
          </h1>
          <p className="text-xs text-muted">
            Đăng nhập hệ thống điều hành & quản lý an toàn đập thủy điện
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Tên đăng nhập hoặc Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={form.usernameOrEmail}
                onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
                placeholder="Nhập username hoặc email..."
                className="w-full bg-card2 border border-border/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-tx focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Nhập mật khẩu..."
                className="w-full bg-card2 border border-border/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-tx focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm"
          >
            <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials Info & Register Link */}
        <div className="pt-4 border-t border-border/40 space-y-3 text-center">
          <div className="text-[11px] text-muted">
            Tài khoản mặc định: <span className="font-mono font-bold text-tx">admin</span> / <span className="font-mono font-bold text-tx">admin123456</span>
          </div>

          <div className="text-xs text-muted">
            Chưa có tài khoản cán bộ?{' '}
            <Link href="/register" className="text-accent font-bold hover:underline no-underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
