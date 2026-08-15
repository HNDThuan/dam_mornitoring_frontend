'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { updateProfile } from '@/lib/api'
import { Panel, Mono } from '@/components/ui'
import { Field, TextInput, Button, FormAlert } from '@/components/form'
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Calendar,
  Clock,
  Lock,
  Eye,
  EyeOff,
  Info,
  BadgeCheck,
} from 'lucide-react'

const ROLE_LABEL = { ADMIN: 'Quản trị viên', OPERATOR: 'Cán bộ vận hành', VIEWER: 'Khách xem' }
const ROLE_BADGE = {
  ADMIN: 'bg-danger/10 text-danger border-danger/30',
  OPERATOR: 'bg-accent/10 text-accent border-accent/30',
  VIEWER: 'bg-muted/10 text-muted border-border',
}
const STATUS_LABEL = { ACTIVE: 'Hoạt động', PENDING_APPROVAL: 'Chờ phê duyệt', SUSPENDED: 'Bị khóa' }
const STATUS_BADGE = {
  ACTIVE: 'bg-safe/10 text-safe border-safe/30',
  PENDING_APPROVAL: 'bg-warning/10 text-warning border-warning/30',
  SUSPENDED: 'bg-danger/10 text-danger border-danger/30',
}

function formatDate(dateStr) {
  if (!dateStr) return 'Chưa có dữ liệu'
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className="flex items-center gap-2 text-[11px] text-muted">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </span>
      <span className="text-[12px] text-tx font-semibold text-right min-w-0 truncate">{children}</span>
    </div>
  )
}

export default function ProfilePage() {
  const { user, token, isOperator, refreshUser, assignedDamId } = useAuth()

  const [infoForm, setInfoForm] = useState({ fullName: user?.fullName || '', phoneNumber: user?.phoneNumber || '' })
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoMsg, setInfoMsg] = useState(null) // { type, text }

  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  if (!user) {
    return (
      <div className="p-8 min-h-[calc(100vh-48px)] flex items-center justify-center">
        <p className="text-sm text-muted">Đang tải thông tin tài khoản...</p>
      </div>
    )
  }

  const handleSaveInfo = async (e) => {
    e.preventDefault()
    setInfoMsg(null)
    try {
      setSavingInfo(true)
      await updateProfile({
        fullName: infoForm.fullName,
        phoneNumber: infoForm.phoneNumber,
      }, token)
      await refreshUser()
      setInfoMsg({ type: 'safe', text: 'Đã cập nhật thông tin cá nhân thành công!' })
    } catch (err) {
      setInfoMsg({ type: 'danger', text: err.message || 'Cập nhật thất bại' })
    } finally {
      setSavingInfo(false)
    }
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    setPwMsg(null)
    if (!pwForm.password || pwForm.password.length < 6) {
      setPwMsg({ type: 'danger', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
      return
    }
    if (pwForm.password !== pwForm.confirm) {
      setPwMsg({ type: 'danger', text: 'Xác nhận mật khẩu không khớp' })
      return
    }
    try {
      setSavingPw(true)
      await updateProfile({ password: pwForm.password }, token)
      setPwForm({ password: '', confirm: '' })
      setPwMsg({ type: 'safe', text: 'Đã đổi mật khẩu thành công!' })
    } catch (err) {
      setPwMsg({ type: 'danger', text: err.message || 'Đổi mật khẩu thất bại' })
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="p-4 min-h-[calc(100vh-48px)] space-y-4 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-panel flex items-center gap-4 flex-wrap">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent2 via-accent to-purple-500 flex items-center justify-center text-xl text-white font-bold uppercase shadow-inner shrink-0">
          {user.username ? user.username.slice(0, 2) : 'US'}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-tx m-0 truncate">{user.fullName || user.username}</h1>
          <Mono className="text-[11px] text-muted">@{user.username}</Mono>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${ROLE_BADGE[user.role] || ROLE_BADGE.VIEWER}`}>
              <Shield className="w-3 h-3" />
              {ROLE_LABEL[user.role] || user.role}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_BADGE[user.status] || STATUS_BADGE.ACTIVE}`}>
              <BadgeCheck className="w-3 h-3" />
              {STATUS_LABEL[user.status] || user.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Thông tin tài khoản (read-only) ── */}
        <Panel title="Thông tin tài khoản">
          <InfoRow icon={User} label="Tên đăng nhập"><Mono>{user.username}</Mono></InfoRow>
          <InfoRow icon={Mail} label="Email">{user.email}</InfoRow>
          <InfoRow icon={Phone} label="Số điện thoại">{user.phoneNumber || 'Chưa cập nhật'}</InfoRow>
          {isOperator && assignedDamId && (
            <InfoRow icon={Building2} label="Đập phụ trách"><Mono className="uppercase">{assignedDamId}</Mono></InfoRow>
          )}
          <InfoRow icon={Calendar} label="Ngày tạo tài khoản">{formatDate(user.createdAt)}</InfoRow>
          <InfoRow icon={Clock} label="Đăng nhập lần cuối">{formatDate(user.lastLoginAt)}</InfoRow>
        </Panel>

        {/* ── Chỉnh sửa thông tin cá nhân ── */}
        <Panel title="Thông tin cá nhân">
          <form onSubmit={handleSaveInfo} className="space-y-3">
            <Field label="Họ và tên" required htmlFor="profile-fullname">
              <TextInput
                id="profile-fullname"
                icon={User}
                required
                value={infoForm.fullName}
                onChange={e => setInfoForm(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Nguyễn Văn A"
              />
            </Field>
            <Field label="Số điện thoại" htmlFor="profile-phone">
              <TextInput
                id="profile-phone"
                icon={Phone}
                type="tel"
                value={infoForm.phoneNumber}
                onChange={e => setInfoForm(p => ({ ...p, phoneNumber: e.target.value }))}
                placeholder="0912345678"
              />
            </Field>
            {infoMsg && <FormAlert variant={infoMsg.type} icon={Info}>{infoMsg.text}</FormAlert>}
            <div className="flex justify-end pt-1">
              <Button type="submit" loading={savingInfo}>Lưu thay đổi</Button>
            </div>
          </form>
        </Panel>
      </div>

      {/* ── Đổi mật khẩu ── */}
      <Panel title="Đổi mật khẩu">
        <form onSubmit={handleSavePassword} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          <Field label="Mật khẩu mới" required htmlFor="profile-pw">
            <div className="relative">
              <TextInput
                id="profile-pw"
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                required
                value={pwForm.password}
                onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Tối thiểu 6 ký tự"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-faint hover:text-muted cursor-pointer"
                tabIndex={-1}
                aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="Xác nhận mật khẩu mới" required htmlFor="profile-pw-confirm">
            <TextInput
              id="profile-pw-confirm"
              icon={Lock}
              type={showPw ? 'text' : 'password'}
              required
              value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Nhập lại mật khẩu mới"
            />
          </Field>
          {pwMsg && (
            <div className="md:col-span-2">
              <FormAlert variant={pwMsg.type} icon={Info}>{pwMsg.text}</FormAlert>
            </div>
          )}
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" loading={savingPw}>Đổi mật khẩu</Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
