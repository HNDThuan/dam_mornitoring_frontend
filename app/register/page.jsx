'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { registerUser as apiRegister, fetchDams } from '@/lib/api'
import { ShieldCheck, User, Mail, Lock, Phone, Building2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
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
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc (*)')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      const res = await apiRegister(form)
      setSuccess(res.message || 'Đăng ký tài khoản thành công! Vui lòng chờ Admin phê duyệt.')
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.')
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

      <div className="w-full max-w-lg bg-card/95 backdrop-blur-md border border-border rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 border border-accent/30 rounded-2xl text-accent mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-tx">
            ĐĂNG KÝ TÀI KHOẢN CÁN BỘ
          </h1>
          <p className="text-xs text-muted">
            Tài khoản cán bộ vận hành đập cần qua kiểm duyệt của Quản trị viên
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
              <span>Đăng ký thành công!</span>
            </div>
            <p className="text-muted">{success}</p>
            <Link
              href="/login"
              className="mt-2 inline-flex items-center justify-center gap-1.5 bg-safe text-white font-bold py-2 px-4 rounded-lg text-xs hover:bg-safe/90 no-underline"
            >
              <span>Quay lại Đăng nhập</span>
            </Link>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Họ và tên *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-card2 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tx focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Tên đăng nhập *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder="canbo_hoabinh"
                    className="w-full bg-card2 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tx focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Email *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="canbo@damsafe.vn"
                    className="w-full bg-card2 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tx focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Số điện thoại</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="0988xxxxxx"
                    className="w-full bg-card2 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tx focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase">Mật khẩu *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full bg-card2 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tx focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase">Đập phụ trách đăng ký</label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                <select
                  value={form.assignedDamId}
                  onChange={e => setForm({ ...form, assignedDamId: e.target.value })}
                  className="w-full bg-card2 border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs text-tx focus:outline-none focus:border-accent"
                >
                  <option value="">-- Chọn Đập Thủy điện phụ trách --</option>
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
              <span>{loading ? 'Đang đăng ký...' : 'Gửi Yêu Cầu Đăng Ký Tài Khoản'}</span>
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-border/40 text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent no-underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Đã có tài khoản? Quay lại Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
