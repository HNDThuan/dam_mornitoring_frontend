This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
````
app/
  admin/
    dams/
      page.jsx
    gateways/
      page.jsx
    logs/
      page.jsx
    nodes/
      page.jsx
  alerts/
    page.jsx
  api/
    image/
      route.js
  dams/
    [id]/
      page.jsx
    page.jsx
  forecast/
    page.jsx
  history/
    page.jsx
  login/
    page.jsx
  profile/
    page.jsx
  register/
    page.jsx
  stations/
    [id]/
      page.jsx
    page.jsx
  users/
    page.jsx
  favicon.ico
  globals.css
  layout.jsx
  page.jsx
components/
  CameraViewer.jsx
  DamMap.jsx
  DamMapInner.jsx
  form.jsx
  LiveStatusBar.jsx
  LocationPickerMap.jsx
  LocationPickerMapInner.jsx
  NavBar.jsx
  StationDevicesTab.jsx
  ui.jsx
context/
  AuthContext.jsx
  LanguageContext.jsx
hooks/
  useAlarmData.js
  useDamData.js
  useSensorData.js
lib/
  i18n/
    en.js
    vi.js
  api.js
  exportHelpers.js
  mockData.js
  sensorHelpers.js
  socket.js
  statusConfig.js
public/
  login-bg.jpg
.gitattributes
.gitignore
jsconfig.json
next.config.js
package.json
postcss.config.js
README.md
tailwind.config.js
````

# Files

## File: app/profile/page.jsx
````javascript
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
````

## File: components/DamMap.jsx
````javascript
'use client'

import dynamic from 'next/dynamic'

// Dynamically import Leaflet inner map component with SSR disabled
const DamMapInner = dynamic(() => import('./DamMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] bg-card border border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted shadow-lg">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-semibold">Đang tải Bản đồ GIS Leaflet...</span>
    </div>
  ),
})

export default function DamMap(props) {
  return <DamMapInner {...props} />
}
````

## File: components/LocationPickerMap.jsx
````javascript
'use client'

import dynamic from 'next/dynamic'

const LocationPickerMapInner = dynamic(() => import('./LocationPickerMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[230px] bg-card2 border border-border/80 rounded-xl flex flex-col items-center justify-center gap-2 text-muted shadow-inner">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <span className="text-[10px] font-semibold text-muted">Đang tải bản đồ chọn tọa độ...</span>
    </div>
  ),
})

export default function LocationPickerMap(props) {
  return <LocationPickerMapInner {...props} />
}
````

## File: context/LanguageContext.jsx
````javascript
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { vi } from '@/lib/i18n/vi'
import { en } from '@/lib/i18n/en'

const translations = { vi, en }

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState('vi')

  useEffect(() => {
    const saved = localStorage.getItem('app_locale')
    if (saved && (saved === 'vi' || saved === 'en')) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = (lang) => {
    if (lang === 'vi' || lang === 'en') {
      setLocaleState(lang)
      localStorage.setItem('app_locale', lang)
    }
  }

  const toggleLanguage = () => {
    const next = locale === 'vi' ? 'en' : 'vi'
    setLocale(next)
  }

  /**
   * Helper function t(key, params)
   * e.g. t('nav.home') or t('dashboard.viewAllStations', { count: 8 })
   */
  const t = (keyPath, params = {}) => {
    const dict = translations[locale] || vi
    const keys = keyPath.split('.')
    let current = dict

    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k]
      } else {
        // Fallback to Vietnamese dictionary if key missing in EN
        let fallback = vi
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) fallback = fallback[fk]
          else return keyPath
        }
        current = typeof fallback === 'string' ? fallback : keyPath
        break
      }
    }

    if (typeof current !== 'string') return keyPath

    // Replace params: { count: 8 } -> replace "{count}"
    let result = current
    Object.keys(params).forEach(p => {
      result = result.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p])
    })

    return result
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
````

## File: lib/socket.js
````javascript
import { io } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

let socket = null

/**
 * Trả về socket singleton — chỉ tạo một lần, tái dùng cho mọi component
 */
export function getSocket() {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
````

## File: .gitattributes
````
# Auto detect text files and perform LF normalization
* text=auto
````

## File: jsconfig.json
````json
{
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  }
}
````

## File: postcss.config.js
````javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
````

## File: app/admin/gateways/page.jsx
````javascript
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchGateways,
  fetchDams,
  fetchStations,
  deleteGateway,
  deleteNode,
  deleteNodeSensor,
  deleteCamera,
} from '@/lib/api'
import { Mono, Panel, StatTile, Pagination } from '@/components/ui'
import { Modal, FormActions, Button, Toast } from '@/components/form'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Trash2,
  RefreshCw,
  Search,
  AlertTriangle,
  Cpu,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronRight,
  Droplets,
  Thermometer,
  Activity,
  Server,
  Video,
  Camera as CameraIcon,
  ExternalLink,
  MapPin,
  ShieldAlert,
  Zap,
  Sliders,
  CheckCircle2,
} from 'lucide-react'

const SENSOR_TYPE_CONFIG = {
  water_level: { label: 'Mực nước', icon: Droplets, color: 'text-sky-400', bgColor: 'bg-sky-400/10', defaultModel: 'HC-SR04', unit: 'cm' },
  wtl: { label: 'Mực nước', icon: Droplets, color: 'text-sky-400', bgColor: 'bg-sky-400/10', defaultModel: 'HC-SR04', unit: 'cm' },
  humidity: { label: 'Độ ẩm', icon: Thermometer, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', defaultModel: 'DHT22', unit: '%' },
  moisture: { label: 'Độ ẩm', icon: Thermometer, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', defaultModel: 'Capacitive v1.2', unit: '%' },
  mst: { label: 'Độ ẩm', icon: Thermometer, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', defaultModel: 'Capacitive v1.2', unit: '%' },
  vibration: { label: 'Độ rung', icon: Activity, color: 'text-orange-400', bgColor: 'bg-orange-400/10', defaultModel: 'MPU6050', unit: 'mm/s' },
  vib: { label: 'Độ rung', icon: Activity, color: 'text-orange-400', bgColor: 'bg-orange-400/10', defaultModel: 'MPU6050', unit: 'mm/s' },
}

const getSensorTypeConfig = (rawType) => {
  if (!rawType) return SENSOR_TYPE_CONFIG.water_level
  const t = String(rawType).toLowerCase()
  if (t === 'vib' || t === 'vibration' || t.startsWith('vib')) return SENSOR_TYPE_CONFIG.vibration
  if (t === 'wtl' || t === 'water_level' || t === 'water') return SENSOR_TYPE_CONFIG.water_level
  if (t === 'mst' || t === 'moisture' || t === 'humidity') return SENSOR_TYPE_CONFIG.moisture
  return SENSOR_TYPE_CONFIG[t] || SENSOR_TYPE_CONFIG.water_level
}

const STATUS_CONFIG = {
  online: { label: 'Online', dot: 'bg-safe', text: 'text-safe', bg: 'bg-safe-soft', border: 'border-safe-soft' },
  offline: { label: 'Offline', dot: 'bg-muted', text: 'text-muted', bg: 'bg-white/5', border: 'border-border' },
  error: { label: 'Lỗi', dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger-soft', border: 'border-danger-soft' },
}

const SENSOR_STATUS_CONFIG = {
  active: { label: 'Hoạt động', dot: 'bg-safe', text: 'text-safe' },
  inactive: { label: 'Ngừng', dot: 'bg-muted', text: 'text-muted' },
  faulty: { label: 'Lỗi', dot: 'bg-danger', text: 'text-danger' },
}

const CAMERA_STATUS_CONFIG = {
  active: { label: 'Hoạt động', dot: 'bg-safe', text: 'text-safe' },
  inactive: { label: 'Ngừng', dot: 'bg-muted', text: 'text-muted' },
  error: { label: 'Lỗi', dot: 'bg-danger', text: 'text-danger' },
}

export default function GatewaysPage() {
  const { user, isAdmin, isOperator, assignedDamId, loading: authLoading } = useAuth()
  const [gateways, setGateways] = useState([])
  const [dams, setDams] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterDamId, setFilterDamId] = useState('')
  const [filterStationId, setFilterStationId] = useState('')

  useEffect(() => {
    if (isOperator && assignedDamId) {
      setFilterDamId(assignedDamId)
    }
  }, [isOperator, assignedDamId])

  // Phân trang
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setPage(1)
  }

  // Hàng mở rộng: gateway -> khối Node/Camera, node -> danh sách Sensor
  const [expandedGateways, setExpandedGateways] = useState(new Set())
  const [expandedNodes, setExpandedNodes] = useState(new Set())

  // Xóa modal: { kind: 'gateway' | 'node' | 'camera' | 'sensor', id, name, parentId? }
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), duration)
  }, [])

  // ── Tải dữ liệu ──
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const activeDam = (isOperator && assignedDamId) ? assignedDamId : filterDamId
      const [gatewaysRes, damsRes, stationsRes] = await Promise.all([
        fetchGateways(filterStationId || undefined, activeDam || undefined, true),
        fetchDams(),
        fetchStations(activeDam || undefined),
      ])

      setGateways(gatewaysRes.gateways || [])
      setDams(damsRes.dams || [])
      setStations(stationsRes.stations || [])
    } catch (err) {
      setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [filterDamId, filterStationId, isOperator, assignedDamId])

  useEffect(() => {
    if (isAdmin || isOperator) {
      loadData(false)
    }
  }, [isAdmin, isOperator, loadData])

  // Trạm khả dụng cho ô lọc
  const filteredStations = filterDamId
    ? stations.filter((s) => s.damId === filterDamId)
    : stations

  // Tìm kiếm toàn cục
  const filteredGateways = gateways.filter((gw) => {
    if (!search) return true
    const q = search.toLowerCase()
    const inSelf =
      gw.gatewayId?.toLowerCase().includes(q) ||
      gw.name?.toLowerCase().includes(q) ||
      gw.macAddress?.toLowerCase().includes(q) ||
      gw.station?.name?.toLowerCase().includes(q)
    const inNodes = (gw.nodes || []).some(
      (n) => n.nodeId?.toLowerCase().includes(q) || n.name?.toLowerCase().includes(q),
    )
    const inCameras = (gw.cameras || []).some(
      (c) => c.cameraId?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q),
    )
    return inSelf || inNodes || inCameras
  })

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredGateways.length / pageSize))
    if (page > totalPages) setPage(totalPages)
  }, [filteredGateways.length, page, pageSize])

  const paginatedGateways = filteredGateways.slice((page - 1) * pageSize, page * pageSize)

  const toggleSet = (setter) => (key) => {
    setter((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }
  const toggleGateway = toggleSet(setExpandedGateways)
  const toggleNode = toggleSet(setExpandedNodes)

  // ── Xử lý Xóa Thiết Bị (Chỉ Admin) ──
  const DELETE_LABEL = {
    gateway: 'Gateway',
    node: 'Sensor Node',
    camera: 'Camera AI',
    sensor: 'Cảm biến',
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    const { kind, id, name, parentId } = deleteConfirm
    try {
      setDeleting(true)
      if (kind === 'gateway') await deleteGateway(id)
      else if (kind === 'node') await deleteNode(id)
      else if (kind === 'camera') await deleteCamera(id)
      else if (kind === 'sensor') await deleteNodeSensor(parentId, id)

      showToast(`Đã xóa ${DELETE_LABEL[kind]} ${name || id}!`, 'success')
      setDeleteConfirm(null)
      loadData(true)
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Chưa kết nối'
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 60000) return `${Math.floor(diff / 1000)}s trước`
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`
    return `${Math.floor(diff / 86400000)} ngày trước`
  }

  // ── KIỂM TRA QUYỀN TRUY CẬP (ADMIN & OPERATOR) ──
  if (authLoading) {
    return (
      <div className="p-12 min-h-[calc(100vh-48px)] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-accent" />
      </div>
    )
  }

  if (!isAdmin && !isOperator) {
    return (
      <div className="p-8 min-h-[calc(100vh-48px)] flex items-center justify-center">
        <div className="bg-card border border-border max-w-md w-full rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto border border-danger/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-tx">Quyền Truy Cập Bị Giới Hạn</h2>
          <p className="text-xs text-muted leading-relaxed">
            Trang Quản Trị Hạ Tầng Gateway & Thiết Bị chỉ dành cho <strong>Quản trị viên</strong> và <strong>Cán bộ vận hành đập</strong>.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Link
              href="/dams"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold no-underline hover:bg-accent/90 shadow-glow"
            >
              <span>Về Trang Đập</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Stats
  const onlineCount = gateways.filter((g) => g.status === 'online').length
  const offlineCount = gateways.filter((g) => g.status === 'offline').length
  const errorCount = gateways.filter((g) => g.status === 'error').length
  const totalNodes = gateways.reduce((acc, g) => acc + (g.nodes?.length || 0), 0)
  const totalCameras = gateways.reduce((acc, g) => acc + (g.cameras?.length || 0), 0)

  return (
    <div className="p-4 min-h-[calc(100vh-48px)] space-y-4">
      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-tx tracking-wide m-0">
              {isOperator ? `Quản Lý Hạ Tầng Gateway & Thiết Bị (${assignedDamId || 'Đập phụ trách'})` : 'Quản Lý Hạ Tầng Gateway & Thiết Bị (Toàn Hệ Thống)'}
            </h1>
            <span className="text-[9px] font-mono font-bold bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full">
              {isAdmin ? 'ADMIN' : 'OPERATOR'}
            </span>
          </div>
          <p className="text-[10px] text-muted m-0">
            {isOperator
              ? `Quản lý, giám sát và cấu hình các Gateway (Jetson TX2), Nodes (ESP32) và Camera AI thuộc đập ${assignedDamId || ''}.`
              : 'Giám sát và quản trị toàn bộ danh mục Gateways (Jetson TX2), Nodes (ESP32) và Camera AI trên toàn hệ thống.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {isAdmin ? (
            <select
              value={filterDamId}
              onChange={(e) => {
                setFilterDamId(e.target.value)
                setFilterStationId('')
              }}
              className="h-9 bg-card2 border border-border rounded-lg px-3 text-tx text-[11px] focus-visible:outline-none focus:border-accent shrink-0 cursor-pointer"
            >
              <option value="">Tất cả đập</option>
              {dams.map((d) => (
                <option key={d.damId} value={d.damId}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="h-9 bg-card2 border border-border rounded-lg px-3 flex items-center text-tx text-[11px] font-bold font-mono text-accent shrink-0">
              <span>Đập: {assignedDamId || 'Phụ trách'}</span>
            </div>
          )}

          <select
            value={filterStationId}
            onChange={(e) => setFilterStationId(e.target.value)}
            className="h-9 bg-card2 border border-border rounded-lg px-3 text-tx text-[11px] focus-visible:outline-none focus:border-accent shrink-0 cursor-pointer"
          >
            <option value="">Tất cả trạm</option>
            {filteredStations.map((s) => (
              <option key={s.stationId} value={s.stationId}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="h-9 flex items-center gap-2 bg-card2 border border-border rounded-lg px-3 w-56 shrink-0 focus-within:border-accent">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm Gateway, Node, Camera..."
              className="bg-transparent border-none outline-none text-tx text-[11px] w-full placeholder:text-muted"
            />
          </div>

          <button
            onClick={() => loadData(false)}
            className="h-9 flex items-center gap-1.5 px-3.5 border border-border rounded-lg text-tx text-[11px] font-semibold bg-card2 hover:bg-white/5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile
          icon={Server}
          label="Tổng Số Gateway"
          value={gateways.length}
          unit="thiết bị"
          status="info"
        />
        <StatTile
          icon={Wifi}
          label="Gateway Online"
          value={onlineCount}
          unit="đang chạy"
          status="safe"
        />
        <StatTile
          icon={WifiOff}
          label="Gateway Offline"
          value={offlineCount}
          unit="mất kết nối"
          status={offlineCount > 0 ? 'warning' : 'safe'}
        />
        <StatTile
          icon={Cpu}
          label="Tổng Sensor Node"
          value={totalNodes}
          unit="ESP32"
          status="info"
        />
        <StatTile
          icon={Video}
          label="Camera Giám Sát"
          value={totalCameras}
          unit="CSI / RTSP"
          status="safe"
        />
      </div>

      {/* Content List */}
      <Panel
        title={
          <div className="flex items-center gap-2">
            <span>Danh mục Gateway & Thiết bị toàn quốc</span>
            <span className="text-[9px] font-mono text-muted bg-card3 px-2 py-0.5 rounded-full border border-border">
              {filteredGateways.length} Gateway
            </span>
          </div>
        }
      >
        {loading ? (
          <div className="p-8 text-center text-muted text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-accent" />
            <span>Đang tải danh sách thiết bị...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-danger text-xs bg-danger/10 border border-danger/30 rounded-xl">
            Lỗi tải dữ liệu: {error}
          </div>
        ) : paginatedGateways.length === 0 ? (
          <div className="p-8 text-center text-muted text-xs italic">
            Không tìm thấy Gateway hoặc thiết bị nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedGateways.map((gw) => {
              const isGwExpanded = expandedGateways.has(gw.gatewayId)
              const gwStatus = STATUS_CONFIG[gw.status] || STATUS_CONFIG.offline
              const allStationCameras = gw.cameras || []

              return (
                <div
                  key={gw.gatewayId}
                  className="bg-card2 border border-border rounded-xl overflow-hidden shadow-panel transition-all"
                >
                  {/* Gateway Header */}
                  <div
                    onClick={() => toggleGateway(gw.gatewayId)}
                    className="px-4 py-3.5 bg-card3/40 hover:bg-card3 border-b border-border/70 flex items-center justify-between cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-muted hover:text-tx p-0.5 bg-transparent border-none cursor-pointer">
                        {isGwExpanded ? (
                          <ChevronDown className="w-4 h-4 text-accent" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                        <Server className="w-4 h-4 text-accent" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-tx">{gw.name}</span>
                          <Mono className="text-[10px] text-accent font-semibold bg-accent/10 border border-accent/20 px-1.5 py-0.2 rounded">
                            {gw.gatewayId}
                          </Mono>
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${gwStatus.text} ${gwStatus.bg} ${gwStatus.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${gwStatus.dot}`} />
                            {gwStatus.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted">
                          <span>
                            Trạm:{' '}
                            <strong className="text-tx">{gw.station?.name || gw.stationId || 'Chưa gán'}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            MAC: <Mono className="text-tx">{gw.macAddress || '—'}</Mono>
                          </span>
                          <span>•</span>
                          <span>
                            Firmware: <Mono className="text-tx">{gw.firmwareVersion || '—'}</Mono>
                          </span>
                          <span>•</span>
                          <span>Last seen: {timeAgo(gw.lastSeenAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: View at Station + Delete */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {gw.stationId && (
                        <Link
                          href={`/stations/${gw.stationId}?tab=devices`}
                          className="flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent border border-accent/30 rounded-lg text-[10px] font-bold hover:bg-accent/20 transition-colors no-underline"
                          title="Mở trang Trạm để cấu hình phần cứng"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Xem tại Trạm</span>
                        </Link>
                      )}

                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            kind: 'gateway',
                            id: gw.gatewayId,
                            name: gw.name,
                          })
                        }
                        className="p-1.5 text-muted hover:text-danger bg-card hover:bg-danger/10 border border-border rounded-lg transition-colors cursor-pointer"
                        title="Xóa Gateway"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Gateway Content (Nodes + Cameras) */}
                  {isGwExpanded && (
                    <div className="p-4 space-y-4 bg-card/30">
                      {/* CAMERAS */}
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                          <Video className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Camera Giám Sát AI ({gw.cameras?.length || 0})</span>
                        </div>

                        {gw.cameras && gw.cameras.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {gw.cameras.map((cam) => {
                              const camSt =
                                CAMERA_STATUS_CONFIG[cam.status] || CAMERA_STATUS_CONFIG.active
                              return (
                                <div
                                  key={cam.cameraId}
                                  className="bg-card border border-border rounded-lg p-2.5 flex items-start justify-between"
                                >
                                  <div className="flex items-start gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0 mt-0.5">
                                      <CameraIcon className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-tx truncate">
                                        {cam.name}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <Mono className="text-[9px] text-emerald-400">
                                          {cam.cameraId}
                                        </Mono>
                                        <span className="text-[9px] text-muted">
                                          ({cam.cameraType || 'CSI'})
                                        </span>
                                        <span className="text-[8px] font-mono text-muted">
                                          {cam.resolution}
                                        </span>
                                      </div>
                                      {cam.streamUrl && (
                                        <div
                                          className="text-[9px] font-mono text-muted truncate max-w-[200px] mt-0.5"
                                          title={cam.streamUrl}
                                        >
                                          {cam.streamUrl}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() =>
                                      setDeleteConfirm({
                                        kind: 'camera',
                                        id: cam.cameraId,
                                        name: cam.name,
                                      })
                                    }
                                    className="p-1 text-muted hover:text-danger bg-transparent border-none cursor-pointer shrink-0"
                                    title="Xóa Camera"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted italic bg-card/40 border border-border/50 rounded-lg p-2.5 text-center">
                            Chưa có Camera nào gắn vào Gateway này.
                          </div>
                        )}
                      </div>

                      {/* SENSOR NODES */}
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                          <Cpu className="w-3.5 h-3.5 text-info" />
                          <span>Danh Sách Sensor Nodes ESP32 ({gw.nodes?.length || 0})</span>
                        </div>

                        {gw.nodes && gw.nodes.length > 0 ? (
                          <div className="space-y-3">
                            {gw.nodes.map((node) => {
                              const isNodeExpanded = expandedNodes.has(node.nodeId)
                              const nodeSt = STATUS_CONFIG[node.status] || STATUS_CONFIG.offline
                              const mappedCam = allStationCameras.find(
                                (c) => c.cameraId === node.mappedCameraId,
                              )

                              return (
                                <div
                                  key={node.nodeId}
                                  className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
                                >
                                  {/* Node Header */}
                                  <div
                                    onClick={() => toggleNode(node.nodeId)}
                                    className="px-3.5 py-2.5 bg-card2/60 hover:bg-card2 border-b border-border/60 flex items-center justify-between cursor-pointer select-none transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <button className="text-muted hover:text-tx p-0.5 bg-transparent border-none cursor-pointer">
                                        {isNodeExpanded ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-info" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5" />
                                        )}
                                      </button>

                                      <div className="w-6 h-6 rounded-md bg-info/10 border border-info/20 flex items-center justify-center shrink-0">
                                        <Cpu className="w-3.5 h-3.5 text-info" />
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-tx">{node.name}</span>
                                          <Mono className="text-[10px] text-info font-semibold bg-info/10 border border-info/20 px-1.5 py-0.2 rounded">
                                            {node.nodeId}
                                          </Mono>
                                          <span
                                            className={`inline-flex items-center gap-1 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${nodeSt.text} ${nodeSt.bg} ${nodeSt.border}`}
                                          >
                                            <span className={`w-1 h-1 rounded-full ${nodeSt.dot}`} />
                                            {nodeSt.label}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-muted mt-0.5">
                                          <span>
                                            Vị trí:{' '}
                                            <strong className="text-tx">
                                              {node.installLocation || 'Thân đập'}
                                            </strong>
                                          </span>
                                          <span>•</span>
                                          <span>
                                            MAC: <Mono className="text-tx">{node.macAddress || '—'}</Mono>
                                          </span>
                                          <span>•</span>
                                          <span>
                                            Firmware: <Mono className="text-tx">{node.firmwareVersion || 'v1.0'}</Mono>
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Node Actions */}
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                      {mappedCam ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/30">
                                          <CameraIcon className="w-2.5 h-2.5" />
                                          <span>Cam AI: {mappedCam.name || mappedCam.cameraId}</span>
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-muted">Chưa gán Cam AI</span>
                                      )}

                                      <button
                                        onClick={() =>
                                          setDeleteConfirm({
                                            kind: 'node',
                                            id: node.nodeId,
                                            name: node.name,
                                          })
                                        }
                                        className="p-1 text-muted hover:text-danger bg-card hover:bg-danger/10 border border-border rounded transition-colors cursor-pointer"
                                        title="Xóa Node"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Node Body (Sensors + AI Thresholds) */}
                                  {isNodeExpanded && (
                                    <div className="p-3 space-y-2.5 bg-card/20">
                                      {/* AI Vibration Thresholds Display */}
                                      <div className="flex flex-wrap items-center gap-2 p-2 bg-card2 rounded-lg border border-border/50 text-[9px]">
                                        <span className="font-bold text-muted uppercase flex items-center gap-1">
                                          <Sliders className="w-3 h-3 text-warning" />
                                          Cấu hình Rung AI:
                                        </span>
                                        <span className="font-mono text-warning bg-warning-soft px-1.5 py-0.5 rounded border border-warning-soft">
                                          Cảnh báo: ≥ {node.warnHigh ?? 2.5} mm/s
                                        </span>
                                        <span className="font-mono text-critical bg-critical-soft px-1.5 py-0.5 rounded border border-critical-soft">
                                          Nguy cấp: ≥ {node.criticalHigh ?? 25.0} mm/s
                                        </span>
                                        <span className="font-mono text-muted bg-card px-1.5 py-0.5 rounded border border-border">
                                          Lọc ảo: {node.alertMinCount ?? 4} mẫu / {node.alertMinDurationSec ?? 6.0}s
                                        </span>
                                      </div>

                                      {/* Sensors Table */}
                                      {node.sensors && node.sensors.length > 0 ? (
                                        <div className="overflow-x-auto">
                                          <table className="w-full border-collapse text-left">
                                            <thead>
                                              <tr className="border-b border-border/60 text-[8px] text-muted uppercase tracking-wider bg-card2/70">
                                                <th className="py-1.5 px-2.5">Loại Cảm Biến</th>
                                                <th className="py-1.5 px-2.5">Model Phần Cứng</th>
                                                <th className="py-1.5 px-2.5">Hiệu Chuẩn (Offset)</th>
                                                <th className="py-1.5 px-2.5">Đơn Vị</th>
                                                <th className="py-1.5 px-2.5">Trạng Thái</th>
                                                <th className="py-1.5 px-2.5 text-right">Thao Tác</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {node.sensors.map((sensor) => {
                                                const sCfg = getSensorTypeConfig(sensor.sensorType)
                                                const Icon = sCfg.icon || Activity
                                                const sSt =
                                                  SENSOR_STATUS_CONFIG[sensor.status] ||
                                                  SENSOR_STATUS_CONFIG.active

                                                return (
                                                  <tr
                                                    key={sensor.id}
                                                    className="border-b border-border/30 hover:bg-card2/40 transition-colors text-[10px]"
                                                  >
                                                    <td className="py-1.5 px-2.5">
                                                      <span className="flex items-center gap-1.5 font-semibold text-tx">
                                                        <Icon className={`w-3.5 h-3.5 ${sCfg.color}`} />
                                                        <span>{sCfg.label}</span>
                                                      </span>
                                                    </td>
                                                    <td className="py-1.5 px-2.5 font-mono text-tx">
                                                      {sensor.model || sCfg.defaultModel}
                                                    </td>
                                                    <td className="py-1.5 px-2.5 font-mono text-tx">
                                                      {sensor.calibrationOffset > 0
                                                        ? `+${sensor.calibrationOffset}`
                                                        : sensor.calibrationOffset || 0}
                                                    </td>
                                                    <td className="py-1.5 px-2.5 font-mono text-muted">
                                                      {sensor.unit || sCfg.unit}
                                                    </td>
                                                    <td className="py-1.5 px-2.5">
                                                      <span
                                                        className={`inline-flex items-center gap-1 text-[8px] font-mono font-bold ${sSt.text}`}
                                                      >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${sSt.dot}`} />
                                                        {sSt.label}
                                                      </span>
                                                    </td>
                                                    <td className="py-1.5 px-2.5 text-right">
                                                      <button
                                                        onClick={() =>
                                                          setDeleteConfirm({
                                                            kind: 'sensor',
                                                            id: sensor.id,
                                                            name: `${sCfg.label} (${sensor.model || ''})`,
                                                            parentId: node.nodeId,
                                                          })
                                                        }
                                                        className="p-1 text-muted hover:text-danger bg-transparent border-none cursor-pointer"
                                                        title="Xóa cảm biến"
                                                      >
                                                        <Trash2 className="w-3 h-3" />
                                                      </button>
                                                    </td>
                                                  </tr>
                                                )
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-muted italic bg-card/40 border border-border/40 rounded p-2 text-center">
                                          Node này chưa có cảm biến nào.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted italic bg-card/40 border border-border/50 rounded-lg p-3 text-center">
                            Chưa có Sensor Node ESP32 nào gắn vào Gateway này.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Pagination */}
            {filteredGateways.length > pageSize && (
              <div className="pt-2">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={filteredGateways.length}
                  onPageChange={setPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* ── MODAL: CONFIRM DELETE ── */}
      <Modal
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title={`Xác Nhận Xóa ${deleteConfirm?.kind?.toUpperCase()}`}
        icon={AlertTriangle}
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Hủy
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleConfirmDelete}>
              Xóa Vĩnh Viễn
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-2">
          <p className="text-xs text-tx">
            Bạn có chắc chắn muốn xóa {DELETE_LABEL[deleteConfirm?.kind] || deleteConfirm?.kind}:{' '}
            <strong className="text-danger">{deleteConfirm?.name || deleteConfirm?.id}</strong> không?
          </p>
          {deleteConfirm?.kind === 'gateway' && (
            <p className="text-[11px] text-warning bg-warning/10 border border-warning/30 p-2 rounded">
              ⚠️ Cảnh báo: Việc xóa Gateway sẽ đồng thời xóa toàn bộ các Node, Cảm biến và Camera gắn kèm bên trong!
            </p>
          )}
          {deleteConfirm?.kind === 'node' && (
            <p className="text-[11px] text-warning bg-warning/10 border border-warning/30 p-2 rounded">
              ⚠️ Cảnh báo: Việc xóa Node sẽ xóa các Cảm biến trực thuộc!
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
````

## File: components/form.jsx
````javascript
'use client'

import { AlertCircle, ChevronDown, X, Loader2, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

const CONTROL_BASE = 'w-full bg-card2 border rounded-md text-tx text-[13px] placeholder:text-faint focus-visible:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const CONTROL_BORDER = (error) => (error ? 'border-danger focus:border-danger' : 'border-border focus:border-accent')

/** Uppercase field label with optional required marker */
export function FieldLabel({ children, required, htmlFor, className = '' }) {
  return (
    <label htmlFor={htmlFor} className={`block text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5 ${className}`}>
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </label>
  )
}

export function FieldError({ children }) {
  if (!children) return null
  return (
    <p className="mt-1.5 text-[11px] text-danger flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

export function FieldHint({ children }) {
  if (!children) return null
  return <p className="mt-1.5 text-[10px] text-faint">{children}</p>
}

/** Label + control + error/hint wrapper — the standard unit for one form field */
export function Field({ label, required, error, hint, htmlFor, children, className = '' }) {
  return (
    <div className={className}>
      {label && <FieldLabel required={required} htmlFor={htmlFor}>{label}</FieldLabel>}
      {children}
      <FieldError>{error}</FieldError>
      {!error && hint && <FieldHint>{hint}</FieldHint>}
    </div>
  )
}

/** Text/number/email/password input with optional leading icon and error state */
export function TextInput({ icon: Icon, error, className = '', ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="w-4 h-4 text-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />}
      <input
        {...props}
        className={`${CONTROL_BASE} ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 ${CONTROL_BORDER(error)} ${className}`}
      />
    </div>
  )
}

export function Textarea({ error, className = '', rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      {...props}
      className={`${CONTROL_BASE} px-3.5 py-2.5 resize-none ${CONTROL_BORDER(error)} ${className}`}
    />
  )
}

/** Native select with a themed chevron (the default browser arrow doesn't match the dark UI) */
export function Select({ error, className = '', children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${CONTROL_BASE} appearance-none pl-3.5 pr-9 py-2.5 cursor-pointer ${CONTROL_BORDER(error)} ${className}`}
      >
        {children}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-faint absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  )
}

/** Right-aligned action row, typically Cancel + Primary, with a divider above */
export function FormActions({ children, className = '' }) {
  return <div className={`flex justify-end gap-2 pt-4 mt-2 border-t border-border/40 ${className}`}>{children}</div>
}

const BUTTON_VARIANTS = {
  primary: 'bg-accent hover:bg-accent/90 text-white',
  secondary: 'border border-border text-muted bg-transparent hover:bg-white/5 hover:text-tx',
  danger: 'bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 hover:border-danger/40',
  safe: 'bg-safe hover:bg-safe/90 text-white',
}

/** Standard button — pass `loading` to show a spinner and auto-disable */
export function Button({ variant = 'primary', loading = false, disabled, className = '', children, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      {...props}
      className={`px-4 py-2.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
      {children}
    </button>
  )
}

/**
 * Standard dialog: scrim + solid card with a header (title/icon/close) and
 * scrollable body. Pass `footer` (typically FormActions) for the action row.
 */
export function Modal({ open, onClose, title, icon: Icon, children, footer, maxWidth = 'max-w-md' }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-card border border-borderHi rounded-lg w-full ${maxWidth} shadow-2xl max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4 text-accent shrink-0" />}
              <h3 className="text-sm font-bold text-tx">{title}</h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-muted hover:text-tx cursor-pointer p-1 rounded-md hover:bg-white/5 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="p-6 space-y-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 pb-6 shrink-0">{footer}</div>}
      </div>
    </div>
  )
}

/** Inline banner for top-of-form success/error feedback */
export function FormAlert({ variant = 'danger', icon: Icon, children }) {
  if (!children) return null
  const styles = {
    danger: 'bg-danger/10 border-danger/20 text-danger',
    safe: 'bg-safe/10 border-safe/30 text-safe',
    warning: 'bg-warning/10 border-warning/30 text-warning',
  }
  return (
    <div className={`p-3 rounded-md border text-xs font-semibold flex items-center gap-2 ${styles[variant]}`}>
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </div>
  )
}

const TOAST_CONFIG = {
  success: { bg: 'bg-safe', icon: CheckCircle2 },
  safe: { bg: 'bg-safe', icon: CheckCircle2 },
  info: { bg: 'bg-accent', icon: Info },
  warning: { bg: 'bg-warning', icon: AlertTriangle },
  danger: { bg: 'bg-danger', icon: AlertCircle },
  error: { bg: 'bg-danger', icon: AlertCircle },
}

/**
 * Floating toast notification, fixed bottom-right. Pass `toast` as
 * `{ message, type }` (type: success/info/warning/danger) or null to hide.
 */
export function Toast({ toast, onClose }) {
  if (!toast) return null
  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.success
  const Icon = cfg.icon
  return (
    <div className="fixed bottom-4 right-4 z-[10000] max-w-sm w-[calc(100vw-2rem)] sm:w-auto">
      <div className={`flex items-center gap-3 pl-3 pr-2.5 py-2.5 rounded-xl shadow-2xl text-white animate-toast-in ${cfg.bg}`}>
        <span className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </span>
        <span className="text-[12px] font-semibold flex-1 min-w-0">{toast.message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white cursor-pointer p-1 rounded-md hover:bg-white/15 transition-colors shrink-0"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
````

## File: components/LocationPickerMapInner.jsx
````javascript
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, Layers } from 'lucide-react'

// Custom animated pulsing pin icon
function createPickerIcon() {
  return L.divIcon({
    className: 'custom-picker-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 32px; height: 32px; background: rgba(56, 189, 248, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 26px; height: 26px; background: #0284c7; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

// Map Click Handler component
function MapEvents({ onChange }) {
  useMapEvents({
    click(e) {
      if (onChange) {
        onChange({
          latitude: +e.latlng.lat.toFixed(6),
          longitude: +e.latlng.lng.toFixed(6),
        })
      }
    },
  })
  return null
}

// Controller to smoothly pan/recenter map when coordinates change externally
function MapRecenter({ lat, lng }) {
  const map = useMap()
  const prevRef = useRef(null)

  useEffect(() => {
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
      if (prevRef.current !== key) {
        prevRef.current = key
        map.panTo([lat, lng], { animate: true, duration: 0.5 })
      }
    }
  }, [lat, lng, map])

  return null
}

export default function LocationPickerMapInner({
  latitude,
  longitude,
  onChange,
  height = '230px',
  defaultCenter = [21.0381, 105.8492],
  zoom = 13,
}) {
  const [activeLayer, setActiveLayer] = useState('terrain')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState(null)

  const numLat = typeof latitude === 'number' ? latitude : parseFloat(latitude)
  const numLng = typeof longitude === 'number' ? longitude : parseFloat(longitude)

  const isValidPos = !isNaN(numLat) && !isNaN(numLng) && numLat !== 0 && numLng !== 0
  const markerPos = isValidPos ? [numLat, numLng] : defaultCenter

  const customIcon = useMemo(() => createPickerIcon(), [])

  // Draggable marker event handlers
  const eventHandlers = useMemo(
    () => ({
      dragend(e) {
        const marker = e.target
        const position = marker.getLatLng()
        if (onChange) {
          onChange({
            latitude: +position.lat.toFixed(6),
            longitude: +position.lng.toFixed(6),
          })
        }
      },
    }),
    [onChange],
  )

  // Get current device GPS location
  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ GPS')
      return
    }
    setGpsLoading(true)
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false)
        if (onChange) {
          onChange({
            latitude: +pos.coords.latitude.toFixed(6),
            longitude: +pos.coords.longitude.toFixed(6),
          })
        }
      },
      (err) => {
        setGpsLoading(false)
        setGpsError('Không lấy được GPS (' + (err.message || 'Lỗi quyền') + ')')
        setTimeout(() => setGpsError(null), 3000)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/80 shadow-inner group isolate">
      {/* Top Floating Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[400] flex justify-between items-center pointer-events-none">
        {/* Coordinates Badge */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5 text-[10px] font-mono text-slate-200">
          <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
          <span>
            {isValidPos ? `${numLat.toFixed(5)}°N, ${numLng.toFixed(5)}°E` : 'Click bản đồ để chọn tọa độ'}
          </span>
        </div>

        {/* GPS Button & Layer Switcher */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleGetGps}
            disabled={gpsLoading}
            className="flex items-center gap-1 bg-slate-900/90 hover:bg-sky-500 text-sky-300 hover:text-white backdrop-blur-md border border-slate-700/80 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer shadow-lg"
            title="Lấy tọa độ GPS từ thiết bị hiện tại"
          >
            <Navigation className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Đang lấy...' : 'Vị trí của tôi'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer(l => (l === 'terrain' ? 'satellite' : 'terrain'))}
            className="p-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 backdrop-blur-md border border-slate-700/80 rounded-lg text-[10px] transition-colors cursor-pointer shadow-lg"
            title={activeLayer === 'terrain' ? 'Chuyển sang Vệ tinh' : 'Chuyển sang Địa hình'}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {gpsError && (
        <div className="absolute bottom-2 left-2.5 z-[400] bg-danger/90 text-white text-[9px] px-2 py-0.5 rounded shadow">
          {gpsError}
        </div>
      )}

      <div className="absolute bottom-1 right-2 z-[400] text-[8px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded pointer-events-none">
        Click hoặc kéo ghim để chọn vị trí
      </div>

      <MapContainer
        center={markerPos}
        zoom={zoom}
        style={{ height, width: '100%' }}
        zoomControl={false}
      >
        {activeLayer === 'terrain' ? (
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        <MapEvents onChange={onChange} />
        {isValidPos && <MapRecenter lat={numLat} lng={numLng} />}

        {isValidPos && (
          <Marker
            position={markerPos}
            icon={customIcon}
            draggable={true}
            eventHandlers={eventHandlers}
          />
        )}
      </MapContainer>
    </div>
  )
}
````

## File: lib/exportHelpers.js
````javascript
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

const SENSOR_TYPE_LABELS = {
  vibration: 'Độ rung thân đập (VIB)',
  vib: 'Độ rung thân đập (VIB)',
  water_level: 'Mực nước thượng/hạ lưu (WTL)',
  wtl: 'Mực nước thượng/hạ lưu (WTL)',
  moisture: 'Độ ẩm móng đập (MST)',
  mst: 'Độ ẩm móng đập (MST)',
  humidity: 'Độ ẩm môi trường',
}

const SENSOR_TYPE_UNITS = {
  vibration: 'mm/s',
  vib: 'mm/s',
  water_level: 'm',
  wtl: 'm',
  moisture: '%',
  mst: '%',
  humidity: '%',
}

const CATEGORY_MAP = {
  ALL: 'Tất cả nhật ký',
  AUTH: 'Đăng nhập / Đăng ký',
  DAM: 'Hạ tầng Đập',
  STATION: 'Trạm quan trắc',
  GATEWAY: 'Gateway (Jetson TX2)',
  THRESHOLD: 'Ngưỡng báo động',
}

/**
 * Loại bỏ dấu tiếng Việt để xuất file PDF hiển thị chuẩn xác, không bị lỗi font ký tự.
 */
function removeVietnameseTones(str) {
  if (!str) return ''
  str = String(str)
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i')
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
  str = str.replace(/đ/g, 'd')
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A')
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E')
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I')
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O')
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U')
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y')
  str = str.replace(/Đ/g, 'D')
  return str
}

/**
 * Xuất Nhật Ký Hệ Thống (Audit Logs) ra file Excel (.xlsx)
 */
export function exportLogsToExcel(logs, category = 'ALL', search = '') {
  if (!logs || logs.length === 0) {
    alert('Không có dữ liệu nhật ký hệ thống để xuất Excel!')
    return
  }

  const rows = logs.map((log, index) => {
    let formattedMetadata = ''
    if (log.metadata) {
      if (typeof log.metadata === 'object') {
        try {
          formattedMetadata = JSON.stringify(log.metadata)
        } catch {
          formattedMetadata = String(log.metadata)
        }
      } else {
        formattedMetadata = String(log.metadata)
      }
    }

    return {
      STT: index + 1,
      'Thời Gian': log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : '--',
      'Người Thực Hiện': log.username || 'System',
      'Vai Trò': log.userRole || 'SYSTEM',
      'Phân Loại': CATEGORY_MAP[log.category] || log.category || 'Hệ thống',
      'Loại Thao Tác': log.action || '--',
      'Chi Tiết Hành Động': log.description || '--',
      'Địa Chỉ IP': log.ipAddress || '--',
      'Thông Tin Bổ Sung (Metadata)': formattedMetadata,
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Tự động căn chỉnh độ rộng cột
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 22 }, // Thời Gian
    { wch: 18 }, // Người Thực Hiện
    { wch: 12 }, // Vai Trò
    { wch: 22 }, // Phân Loại
    { wch: 22 }, // Loại Thao Tác
    { wch: 55 }, // Chi Tiết Hành Động
    { wch: 16 }, // Địa Chỉ IP
    { wch: 35 }, // Metadata
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs')

  const catSuffix = category && category !== 'ALL' ? `_${category}` : ''
  const searchSuffix = search ? '_filtered' : ''
  const dateStr = new Date().toISOString().slice(0, 10)
  const fileName = `Nhat_Ky_He_Thong${catSuffix}${searchSuffix}_${dateStr}.xlsx`

  XLSX.writeFile(workbook, fileName)
}

/**
 * Xuất danh sách sự kiện cảnh báo ra file Excel (.xlsx)
 */
export function exportAlarmsToExcel(alarms, damName = 'Toan_Bo_Dap') {
  if (!alarms || alarms.length === 0) {
    alert('Không có dữ liệu cảnh báo để xuất Excel!')
    return
  }

  const rows = alarms.map((a, index) => {
    const sensorTypeKey = a.sensorType || ''
    const sensorLabel = SENSOR_TYPE_LABELS[sensorTypeKey] || sensorTypeKey || 'Cảm biến'
    const unit = SENSOR_TYPE_UNITS[sensorTypeKey] || ''

    const measuredVal = a.measuredVal != null ? `${a.measuredVal} ${unit}`.trim() : (a.value != null ? `${a.value} ${unit}`.trim() : '--')
    const thresholdVal = a.thresholdVal != null ? `${a.thresholdVal} ${unit}`.trim() : (a.thresholdValue != null ? `${a.thresholdValue} ${unit}`.trim() : '--')

    const severityLabel =
      a.severity === 'CRITICAL' ? 'NGUY CẤP (ĐỎ)' :
      a.severity === 'ALERT' ? 'BÁO ĐỘNG (CAM)' :
      a.severity === 'WARNING' ? 'CẢNH BÁO (VÀNG)' : (a.severity || 'THÔNG BÁO')

    const isResolved = Boolean(a.resolvedAt || a.resolved || a.status === 'RESOLVED')
    const triggeredTime = a.triggeredAt ? new Date(a.triggeredAt).toLocaleString('vi-VN') : (a.timestamp ? new Date(a.timestamp).toLocaleString('vi-VN') : '--')
    const resolvedTime = a.resolvedAt ? new Date(a.resolvedAt).toLocaleString('vi-VN') : (isResolved ? 'Đã xử lý' : 'Chưa xử lý')

    let aiStatus = 'Không kích hoạt'
    if (a.crackDetected != null) {
      aiStatus = a.crackDetected
        ? `Phát hiện nứt (${Math.round((a.crackConfidence || 0) * 100)}%)`
        : 'Không phát hiện vết nứt'
    } else if (a.cameraActivated) {
      aiStatus = 'Camera đã chụp ảnh'
    }

    return {
      STT: index + 1,
      'Mã Sự Cố': a.eventId || (a.id ? a.id.slice(0, 8).toUpperCase() : '--'),
      'Tên Đập': a.damName || a.damId || 'Đập Thủy Điện',
      'Trạm Quan Trắc': a.stationName || a.stationId || a.sensorId || 'Trạm Quan Trắc',
      'Vị Trí Cụ Thể': a.location || 'Thân đập',
      'Loại Cảm Biến': sensorLabel,
      'Mức Độ Rủi Ro': severityLabel,
      'Giá Trị Đo Thực Tế': measuredVal,
      'Ngưỡng An Toàn': thresholdVal,
      'Trạng Thái Xử Lý': isResolved ? 'ĐÃ XỬ LÝ' : 'CHỜ XỬ LÝ',
      'Thời Gian Ghi Nhận': triggeredTime,
      'Thời Gian Khắc Phục': resolvedTime,
      'Nhận Diện Vết Nứt (AI)': aiStatus,
      'Ghi Chú': a.notes || '--',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 14 }, // Mã Sự Cố
    { wch: 22 }, // Tên Đập
    { wch: 24 }, // Trạm Quan Trắc
    { wch: 24 }, // Vị Trí Cụ Thể
    { wch: 30 }, // Loại Cảm Biến
    { wch: 18 }, // Mức Độ Rủi Ro
    { wch: 18 }, // Giá Trị Đo Thực Tế
    { wch: 18 }, // Ngưỡng An Toàn
    { wch: 16 }, // Trạng Thái Xử Lý
    { wch: 22 }, // Thời Gian Ghi Nhận
    { wch: 22 }, // Thời Gian Khắc Phục
    { wch: 24 }, // Nhận Diện Vết Nứt
    { wch: 30 }, // Ghi Chú
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh Sách Cảnh Báo')

  const safeDamName = removeVietnameseTones(damName).replace(/\s+/g, '_')
  const fileName = `Bao_Cao_Canh_Bao_${safeDamName}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

/**
 * Xuất Danh Sách Bản Ghi Lịch Sử Đo Đạc CSDL ra Excel (.xlsx)
 */
export function exportHistoryToExcel(records, damName = 'He_Thong') {
  if (!records || records.length === 0) {
    alert('Không có bản ghi lịch sử nào để xuất Excel!')
    return
  }

  const rows = records.map((r, index) => ({
    STT: index + 1,
    'Thời Gian': r.time || '--',
    'Mã Thiết Bị': r.code || '--',
    'Trạm Quan Trắc': r.stationName || '--',
    'Đập Thủy Điện': r.damName || '--',
    'Vị Trí Chi Tiết': r.location || '--',
    'Loại Cảm Biến': SENSOR_TYPE_LABELS[r.sensorType] || r.sensorType || 'Cảm biến',
    'Giá Trị Đo Thực Tế': r.level || '--',
    'Trạng Thái Vận Hành': r.statusLbl || 'BÌNH THƯỜNG',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 22 }, // Thời Gian
    { wch: 18 }, // Mã Thiết Bị
    { wch: 24 }, // Trạm Quan Trắc
    { wch: 22 }, // Đập Thủy Điện
    { wch: 30 }, // Vị Trí Chi Tiết
    { wch: 28 }, // Loại Cảm Biến
    { wch: 18 }, // Giá Trị Đo Thực Tế
    { wch: 18 }, // Trạng Thái
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch Sử Đo Đạc')

  const safeDamName = removeVietnameseTones(damName).replace(/\s+/g, '_')
  const fileName = `Bao_Cao_Lich_Su_Do_Dac_${safeDamName}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

/**
 * Xuất phiếu báo cáo sự cố an toàn đập ra file PDF (.pdf) với dữ liệu chuẩn xác
 */
export function exportAlarmToPDF(alarm, locationInfo, reporterUser) {
  if (!alarm) {
    alert('Vui lòng chọn 1 sự kiện cảnh báo để xuất báo cáo PDF!')
    return
  }

  const doc = new jsPDF()

  const unit = SENSOR_TYPE_UNITS[alarm.sensorType] || ''
  const measuredVal = alarm.measuredVal != null ? `${alarm.measuredVal} ${unit}`.trim() : (alarm.value != null ? `${alarm.value} ${unit}`.trim() : '--')
  const thresholdVal = alarm.thresholdVal != null ? `${alarm.thresholdVal} ${unit}`.trim() : (alarm.thresholdValue != null ? `${alarm.thresholdValue} ${unit}`.trim() : '--')

  const triggeredTime = alarm.triggeredAt ? new Date(alarm.triggeredAt).toLocaleString('vi-VN') : (alarm.timestamp ? new Date(alarm.timestamp).toLocaleString('vi-VN') : '--')
  const isResolved = Boolean(alarm.resolvedAt || alarm.resolved || alarm.status === 'RESOLVED')
  const resolvedTime = alarm.resolvedAt ? new Date(alarm.resolvedAt).toLocaleString('vi-VN') : 'Dang trong tien trinh xu ly'

  const damNameClean = removeVietnameseTones(locationInfo?.damName || alarm.damName || 'Dap Thuy Dien')
  const damLocClean = removeVietnameseTones(locationInfo?.damLocation || 'Viet Nam')
  const stationNameClean = removeVietnameseTones(locationInfo?.stationName || alarm.stationName || 'Tram Quan Trac')
  const stationLocClean = removeVietnameseTones(locationInfo?.stationLoc || alarm.location || 'Than dap chinh')
  const reporterNameClean = removeVietnameseTones(reporterUser?.fullName || reporterUser?.username || 'Can bo truc ca')
  const reporterRoleClean = reporterUser?.role || 'OPERATOR'

  const sensorTypeClean = removeVietnameseTones(SENSOR_TYPE_LABELS[alarm.sensorType] || alarm.sensorType || 'Cam bien')
  const eventIdClean = alarm.eventId || (alarm.id ? `EVT-${alarm.id.slice(0, 8).toUpperCase()}` : 'EVT-001')

  let aiResultClean = 'Khong chup anh'
  if (alarm.crackDetected != null) {
    aiResultClean = alarm.crackDetected
      ? `PHAT HIEN VET NUT (Do tin cay: ${Math.round((alarm.crackConfidence || 0) * 100)}%)`
      : 'Khong phat hien vet nut'
  } else if (alarm.cameraActivated) {
    aiResultClean = 'Camera AI da chup anh'
  }

  // Header Tiêu đề Quốc gia
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CONG HOA XA HOI CHU NGHIA VIET NAM', 105, 14, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Doc lap - Tu do - Hanh phuc', 105, 19, { align: 'center' })
  doc.setLineWidth(0.5)
  doc.line(75, 22, 135, 22)

  // Tiêu đề báo cáo
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('PHIEU BAO CAO SU CO AN TOAN DAP THUY DIEN', 105, 33, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Ma su co: ${eventIdClean}`, 105, 39, { align: 'center' })
  doc.text(`Ngay xuat bao cao: ${new Date().toLocaleDateString('vi-VN')} - Gio: ${new Date().toLocaleTimeString('vi-VN')}`, 105, 44, { align: 'center' })

  // Khung 1: Thông tin Vị trí
  doc.setDrawColor(60, 80, 110)
  doc.setFillColor(245, 248, 252)
  doc.rect(14, 50, 182, 38, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('1. THONG TIN CONG TRINH VA VI TRI QUAN TRAC', 18, 57)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  doc.text(`- Dap Thuy Dien: ${damNameClean} (Dia diem: ${damLocClean})`, 22, 65)
  doc.text(`- Tram Quan Trac: ${stationNameClean}`, 22, 72)
  doc.text(`- Vi tri / Tuyen cong trinh: ${stationLocClean}`, 22, 79)

  // Khung 2: Chỉ số Đo Đạc & Cảnh Báo
  doc.setFillColor(255, 250, 240)
  doc.rect(14, 93, 182, 58, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(180, 83, 9)
  doc.text('2. THONG SO DO DAC VA MUC DO NGUY HIEM', 18, 100)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  doc.text(`- Loai cam bien: ${sensorTypeClean}`, 22, 108)
  doc.text(`- Gia tri do thuc te: ${measuredVal}`, 22, 115)
  doc.text(`- Nguong gioi han canh bao: ${thresholdVal}`, 22, 122)
  doc.text(`- Muc do rui ro: ${alarm.severity || 'CANH BAO'}`, 22, 129)
  doc.text(`- Nhan dien thi giac AI: ${aiResultClean}`, 22, 136)
  doc.text(`- Thoi gian ghi nhan vuot nguong: ${triggeredTime}`, 22, 143)

  // Khung 3: Tình trạng Xử lý & Xác nhận
  doc.setFillColor(240, 253, 244)
  doc.rect(14, 156, 182, 45, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(21, 128, 61)
  doc.text('3. TINH TRANG XU LY VA XAC NHAN VAN HANH', 18, 163)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  doc.text(`- Trang thai xu ly: ${isResolved ? 'DA XAC NHAN VA XU LY KHAC PHUC' : 'CHUA XU LY - DANG CANH BAO KHAN CAP'}`, 22, 171)
  doc.text(`- Thoi gian khac phuc hoan tat: ${resolvedTime}`, 22, 178)
  doc.text(`- Can bo bao cao: ${reporterNameClean} (Vai tro: ${reporterRoleClean})`, 22, 185)
  doc.text(`- Ghi chu phat sinh: ${removeVietnameseTones(alarm.notes || 'Khong co ghi chu')}`, 22, 192)

  // Chữ ký
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('CAN BO TRUC CA VAN HANH', 140, 220, { align: 'center' })
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('(Ky va ghi ro ho ten)', 140, 225, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(reporterNameClean, 140, 252, { align: 'center' })

  const safeFileId = eventIdClean.replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`Phieu_Bao_Cao_Su_Co_${safeFileId}.pdf`)
}

/**
 * Xuất Báo Cáo Hiện Trạng An Toàn Trạm Quan Trắc ra PDF (.pdf)
 */
export function exportStationReportToPDF(station, dam, telemetryData, alarms, reporterUser) {
  if (!station) {
    alert('Không tìm thấy thông tin trạm để xuất báo cáo!')
    return
  }

  const doc = new jsPDF()

  const damName = removeVietnameseTones(dam?.name || `Dap ${station.damId || ''}`)
  const stationName = removeVietnameseTones(station.name || station.stationId)
  const stationLoc = removeVietnameseTones(station.location || station.river || 'Than dap chinh')
  const reporterName = removeVietnameseTones(reporterUser?.fullName || reporterUser?.username || 'Can bo van hanh')

  // Header Tiêu đề Quốc gia
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CONG HOA XA HOI CHU NGHIA VIET NAM', 105, 14, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Doc lap - Tu do - Hanh phuc', 105, 19, { align: 'center' })
  doc.setLineWidth(0.5)
  doc.line(75, 22, 135, 22)

  // Tiêu đề báo cáo
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('BAO CAO HIEN TRANG AN TOAN TRAM QUAN TRAC', 105, 33, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Tram: ${stationName} - Ma: ${station.stationId || station.stationCode || '--'}`, 105, 39, { align: 'center' })
  doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`, 105, 44, { align: 'center' })

  // Khung 1: Hạ tầng Trạm
  doc.setDrawColor(60, 80, 110)
  doc.setFillColor(245, 248, 252)
  doc.rect(14, 50, 182, 38, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('1. THONG TIN CO SO HA TANG TRAM', 18, 57)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  doc.text(`- Dap Thuy Dien truc thuoc: ${damName}`, 22, 65)
  doc.text(`- Ten tram: ${stationName} (Ma tram: ${station.stationId})`, 22, 72)
  doc.text(`- Vi tri lap dat: ${stationLoc} (Toa do: ${station.lat || '--'}, ${station.lng || '--'})`, 22, 79)

  // Khung 2: Các Chỉ Số Telemetry Thực Tế
  doc.setFillColor(240, 253, 244)
  doc.rect(14, 93, 182, 50, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(21, 128, 61)
  doc.text('2. CHI SO QUAN TRAC MOI NHAT TU CAM BIEN', 18, 100)

  const wtl = telemetryData?.waterLevel != null ? `${telemetryData.waterLevel} m` : '--'
  const vib = telemetryData?.vibration != null ? `${telemetryData.vibration} mm/s` : '--'
  const mst = telemetryData?.moisture != null ? `${telemetryData.moisture} %` : '--'
  const status = station.status === 'danger' ? 'NGUY HIEM' : station.status === 'warning' ? 'CANH BAO' : 'AN TOAN'

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  doc.text(`- Muc nuoc thuong luu / ho chua: ${wtl}`, 22, 108)
  doc.text(`- Do rung dong than dap (MPU6050): ${vib}`, 22, 115)
  doc.text(`- Do am tham chan dap: ${mst}`, 22, 122)
  doc.text(`- Danh gia trang thai tong the: ${status}`, 22, 129)

  // Khung 3: Lịch sử Cảnh báo gần nhất
  doc.setFillColor(255, 250, 240)
  doc.rect(14, 148, 182, 52, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(180, 83, 9)
  doc.text('3. SU CO CANH BAO GHI NHAN TRONG KY', 18, 155)

  const recentAlarms = (alarms || []).slice(0, 3)
  if (recentAlarms.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(80, 80, 80)
    doc.text('Khong co su co vuot nguong nao ghi nhan trong ky quan trac.', 22, 165)
  } else {
    recentAlarms.forEach((a, i) => {
      const timeStr = a.triggeredAt ? new Date(a.triggeredAt).toLocaleDateString('vi-VN') : '--'
      const typeStr = removeVietnameseTones(SENSOR_TYPE_LABELS[a.sensorType] || a.sensorType || 'Su co')
      const valStr = `${a.measuredVal ?? a.value ?? '--'} ${SENSOR_TYPE_UNITS[a.sensorType] || ''}`
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(20, 20, 20)
      doc.text(`${i + 1}. [${timeStr}] ${typeStr}: ${valStr} (${a.severity || 'CANH BAO'})`, 22, 165 + (i * 7))
    })
  }

  // Chữ ký
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('NGUOI LAP BAO CAO', 140, 220, { align: 'center' })
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('(Ky va ghi ro ho ten)', 140, 225, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(reporterName, 140, 252, { align: 'center' })

  const safeStationId = removeVietnameseTones(station.stationId || 'Station').replace(/\s+/g, '_')
  doc.save(`Bao_Cao_Tram_${safeStationId}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
````

## File: lib/mockData.js
````javascript
// Mock data has been deprecated and replaced by real backend APIs via useDamData & useSensorData.
export const DAMS = []
export const STATIONS = []
export const ALERTS_DATA = []
export const HISTORY_RECORDS = []
````

## File: next.config.js
````javascript
/** @type {import('next').NextConfig} */
const backendUrl = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '')
  ? process.env.NEXT_PUBLIC_API_URL.trim()
  : 'https://library-opal-degraded.ngrok-free.dev'

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/sensor/:path*',
        destination: `${backendUrl}/sensor/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
````

## File: app/admin/dams/page.jsx
````javascript
import { redirect } from 'next/navigation'

export default function AdminDamsRedirectPage() {
  redirect('/dams')
}
````

## File: app/api/image/route.js
````javascript
/**
 * GET /api/image?url=<encoded_image_url>
 * Server-side image proxy an toàn để tải ảnh từ Backend/MinIO proxy (/sensor/images/*).
 * Chống lỗ hổng SSRF bằng Dynamic Host Validation, Path restriction và Content-Type verification.
 */

const getApiHost = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  try {
    return new URL(apiUrl).hostname
  } catch {
    return 'localhost'
  }
}

/**
 * Kiểm tra hostname động:
 * 1. Tự động khớp với Hostname trong biến môi trường NEXT_PUBLIC_API_URL khi đổi Ngrok / Domain.
 * 2. Chấp nhận các localhost dev ('localhost', '127.0.0.1').
 * 3. Chấp nhận tất cả domain Ngrok (*.ngrok-free.dev, *.ngrok.io, *.ngrok.app).
 */
function isAllowedHost(hostname) {
  if (!hostname) return false

  const currentApiHost = getApiHost()
  if (hostname.toLowerCase() === currentApiHost.toLowerCase()) return true

  if (['localhost', '127.0.0.1'].includes(hostname.toLowerCase())) return true

  const h = hostname.toLowerCase()
  if (h.endsWith('.ngrok-free.dev') || h.endsWith('.ngrok.io') || h.endsWith('.ngrok.app')) {
    return true
  }

  return false
}

export async function GET(request) {
  const raw = new URL(request.url).searchParams.get('url')
  if (!raw) {
    return new Response('Missing url parameter', { status: 400 })
  }

  let target
  try {
    // Nếu raw là path tương đối (ví dụ /sensor/images/...), tự ghép với API_URL
    if (raw.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      target = new URL(raw, baseUrl)
    } else {
      target = new URL(raw)
    }
  } catch {
    return new Response('Bad url format', { status: 400 })
  }

  // 1. Kiểm tra Protocol & Hostname nằm trong danh sách cho phép (động theo NEXT_PUBLIC_API_URL và *.ngrok-free.dev)
  if (!['http:', 'https:'].includes(target.protocol) || !isAllowedHost(target.hostname)) {
    return new Response('Forbidden host', { status: 403 })
  }

  // 2. Bắt buộc đường dẫn chỉ được phép lấy ảnh từ /sensor/images/
  if (!target.pathname.startsWith('/sensor/images/')) {
    return new Response('Forbidden path', { status: 403 })
  }

  try {
    // 3. Tắt tự động redirect (redirect: 'error') để chống bypass SSRF qua HTTP 301/302 Redirect
    const upstream = await fetch(target.toString(), {
      redirect: 'error',
      headers: {
        'ngrok-skip-browser-warning': '69420',
        'User-Agent': 'DamMonitoringApp/1.0',
      },
    })

    if (!upstream.ok) {
      return new Response(`Image fetch failed: ${upstream.status}`, { status: upstream.status })
    }

    // 4. Kiểm tra Content-Type từ upstream bắt buộc phải là hình ảnh (image/*)
    const contentType = upstream.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      return new Response('Not an image', { status: 415 })
    }

    const buffer = await upstream.arrayBuffer()

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    console.error('[ImageProxy] Error fetching image:', err.message)
    return new Response('Internal Server Error', { status: 500 })
  }
}
````

## File: app/forecast/page.jsx
````javascript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ForecastPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dams')
  }, [router])

  return null
}
````

## File: package.json
````json
{
  "name": "dyke-safe-monitor",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.1",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.383.0",
    "next": "14.2.5",
    "react": "^18",
    "react-dom": "^18",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.12.7",
    "socket.io-client": "^4.8.3",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.19",
    "eslint": "^8",
    "eslint-config-next": "14.2.5",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4"
  }
}
````

## File: README.md
````markdown
# DykeSafe Monitor — Frontend Application 🌊🗺️

Giao diện Web giám sát an toàn đập thủy điện và quản trị hạ tầng quan trắc thời gian thực, xây dựng trên nền tảng **Next.js 14 (App Router)**, **React 18**, **TailwindCSS**, **Bản đồ GIS Leaflet tương tác**, kết nối **WebSocket (Socket.IO)** và hệ thống xuất báo cáo dữ liệu chuyên nghiệp (**Excel / PDF**).

---

## 📋 Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Ngăn xếp công nghệ (Tech Stack)](#2-ngăn-xếp-công-nghệ-tech-stack)
3. [Phân quyền người dùng & Bảo mật giao diện (RBAC)](#3-phân-quyền-người-dùng--bảo-mật-giao-diện-rbac)
4. [Các trang & Chức năng chính](#4-các-trang--chức-năng-chính)
5. [Hệ thống Xuất Báo Cáo Excel & PDF](#5-hệ-thống-xuất-báo-cáo-excel--pdf)
6. [Bản đồ GIS Leaflet & Tối ưu hóa hiển thị](#6-bản-đồ-gis-leaflet--tối-ưu-hóa-hiển-thị)
7. [Cấu trúc thư mục dự án](#7-cấu-trúc-thư-mục-dự-án)
8. [Cài đặt & Khởi chạy](#8-cài-đặt--khởi-chạy)
9. [Đa ngôn ngữ & Quản trị trạng thái](#9-đa-ngôn-ngữ--quản-trị-trạng-thái)

---

## 1. Tổng quan hệ thống

**DykeSafe Monitor Frontend** là trung tâm điều hành và trực quan hóa dữ liệu giám sát an toàn đập thủy điện:
- **Giám sát trực quan**: Hiển thị liên tục mực nước thượng/hạ lưu, độ ẩm chân đập, độ rung động thân đập (FFT) và camera AI thời gian thực qua WebSocket.
- **Bản đồ GIS thời gian thực**: Bản đồ tương tác đa lớp (Địa hình & Vệ tinh), hiển thị vị trí toàn bộ các công trình đập và trạm quan trắc trên toàn quốc.
- **Cảnh báo khẩn cấp**: Kích hoạt âm thanh và cảnh báo trực quan đa cấp độ (`CRITICAL`, `ALERT`, `WARNING`), hiển thị ảnh bằng chứng AI phát hiện vết nứt từ MinIO, gửi email khẩn cấp tới cán bộ phụ trách.
- **Quản trị hạ tầng thiết bị**: Quản lý chi tiết Gateway (Jetson TX2), Sensor Node (ESP32), Cảm biến và Camera quan sát.
- **Báo cáo chuyên nghiệp**: Xuất báo cáo dữ liệu đo đạc, nhật ký sự cố và nhật ký hệ thống ra định dạng Excel (`.xlsx`) và PDF (`.pdf`) chuẩn xác.

---

## 2. Ngăn xếp công nghệ (Tech Stack)

- **Framework**: [Next.js 14.2](https://nextjs.org/) (App Router, React 18, Server & Client Components).
- **Styling & UI**: [TailwindCSS 3.4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/), Dark Glassmorphism Design System.
- **Bản đồ GIS**: [Leaflet](https://leafletjs.com/), `react-leaflet@^4.2.1` (Tích hợp OpenStreetMap và Esri World Imagery vệ tinh).
- **Biểu đồ & Trực quan hóa**: [Recharts 2.12](https://recharts.org/) (AreaChart, LineChart, BarChart, Sparklines, RadialGauge).
- **Giao tiếp Real-time**: [Socket.IO Client](https://socket.io/docs/v4/client-api/) (Tự động kết nối lại, quản lý luồng telemetry).
- **Hệ thống Xuất Báo Cáo**: [SheetJS (XLSX)](https://sheetjs.com/) cho Excel, [jsPDF](https://github.com/parallax/jsPDF) cho PDF chuẩn quốc gia.
- **Đa ngôn ngữ (i18n)**: Tiếng Việt (`vi`) & Tiếng Anh (`en`).

---

## 3. Phân quyền người dùng & Bảo mật giao diện (RBAC)

Hệ thống tích hợp xác thực Token JWT với cơ chế phân quyền 3 cấp độ (`ADMIN`, `OPERATOR`, `VIEWER`):

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 Phân Quyền RBAC                                  │
├───────────────────┬──────────────────────────────────────────────────────────────┤
│ 👑 ADMIN          │ Toàn quyền quản trị hệ thống toàn quốc:                      │
│ (Quản trị viên)   │ - Phê duyệt tài khoản cán bộ mới, gán đập phụ trách          │
│                   │ - Thêm/sửa/xóa Đập thủy điện & Trạm quan trắc                │
│                   │ - Quản trị Gateway/Node toàn cục & Xem Nhật ký Hệ thống (Logs)│
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ 👷 OPERATOR       │ Quản trị trong phạm vi đập được phân công (assignedDamId):   │
│ (Cán bộ vận hành) │ - Quản lý cấu hình Gateway, Node, Cảm biến, Camera của đập   │
│                   │ - Tiếp nhận cảnh báo, gửi Email khẩn cấp, khắc phục sự cố    │
│                   │ - Xuất báo cáo hiện trạng trạm và dữ liệu lịch sử đo đạc     │
├───────────────────┼──────────────────────────────────────────────────────────────┤
│ 👁️ VIEWER         │ Khách quan sát (Xem công khai hoặc chưa đăng nhập):          │
│ (Khách quan sát)  │ - Chỉ xem bản đồ GIS & chỉ số giám sát trực quan             │
│                   │ - Ẩn hoàn toàn Tab cấu hình phần cứng thiết bị               │
│                   │ - Chặn truy cập Trung tâm Cảnh báo, Quản lý User và Logs     │
└───────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 4. Các trang & Chức năng chính

### 4.1 Trang Chủ GIS (`/`)
- **Bản đồ toàn quốc**: Trực quan hóa vị trí các đập thủy điện và trạm quan trắc trên nền bản đồ GIS tương tác.
- **Chuyển đổi lớp bản đồ**: Chuyển đổi linh hoạt giữa lớp bản đồ Địa hình (Terrain) và Vệ tinh (Satellite).
- **Thanh trạng thái LiveStatusBar**: Hiển thị tổng số đập, trạm, thiết bị online/offline và nhịp tim dữ liệu realtime.
- **Thẻ tổng quan & Bộ lọc nhanh**: Xem thông số nhanh mực nước, lưu lượng xả, dung tích hồ chứa từng đập.

### 4.2 Quản Lý Đập Thủy Điện (`/dams` & `/dams/[id]`)
- **Danh mục đập**: Hiển thị danh sách toàn bộ các đập kèm chỉ số an toàn (`safe`, `warning`, `danger`).
- **Trang Chi tiết đập (`/dams/[id]`)**:
  - Bản đồ GIS tập trung riêng cho đập được chọn (`Focus Isolation`).
  - Danh sách trạm quan trắc trực thuộc đập.
  - Cấu hình ngưỡng cảnh báo kỹ thuật (Mực nước BĐ1/BĐ2/BĐ3, Độ ẩm, Biên độ rung).
  - Tích hợp widget dự báo thời tiết khu vực đập.
  - Thao tác chỉnh sửa thông tin, tọa độ GPS hoặc xóa đập (dành cho Admin).

### 4.3 Chi Tiết Trạm Quan Trắc (`/stations/[id]`)
Giao diện trạm được phân tách thành 2 phân hệ chuyên biệt:
- **Tab 1: Giám Sát & Trực Quan Hóa (Live Telemetry & GIS)**:
  - Đồng hồ đo mực nước RadialGauge, Sparklines đo độ ẩm và độ rung MPU6050.
  - Phổ tần số rung FFT thời gian thực.
  - Khung xem trực tiếp Camera AI (RTSP / CSI Stream) kèm bounding box phát hiện nứt.
  - **Nút "Xuất báo cáo"**: Xuất phiếu đánh giá hiện trạng an toàn trạm quan trắc ra file PDF.
- **Tab 2: Cấu Hình Thiết Bị Phần Cứng (`StationDevicesTab`)** *(Chỉ hiển thị cho Admin/Operator)*:
  - Quản lý danh sách Gateway Jetson TX2, Sensor Node ESP32, Cảm biến và Camera.
  - Thêm mới Gateway, thêm Node, thêm Cảm biến đo đạc, ghép đôi Node với Camera AI.
  - Theo dõi trạng thái Online/Offline, địa chỉ IP/MAC và thời gian nhận tín hiệu cuối cùng.

### 4.4 Trung Tâm Cảnh Báo Khẩn Cấp (`/alerts`)
- **Âm thanh cảnh báo**: Tự động phát âm thanh cảnh báo khi có sự kiện vi phạm ngưỡng nghiêm trọng.
- **Bộ lọc đa chiều**: Lọc theo mức độ nguy cấp (`CRITICAL`, `ALERT`, `WARNING`), trạng thái xử lý, theo đập và trạm.
- **Bằng chứng thị giác AI**: Hiển thị ảnh chụp hiện trường từ camera AI MinIO, kích thước vết nứt và độ tin cậy.
- **Xử lý sự cố**: Nút xác nhận đã khắc phục sự cố chỉ với 1 click.
- **Gửi Email khẩn cấp**: Tự động lấy danh sách email cán bộ phụ trách đập và phát thông báo qua SMTP.
- **Xuất báo cáo**: Nút **Xuất Excel** danh sách cảnh báo và **Xuất PDF** Phiếu báo cáo sự cố an toàn đập chính thức.

### 4.5 Lịch Sử & Phân Tích CSDL (`/history`)
- **Biểu đồ chuỗi thời gian Recharts**: Trực quan hóa diễn biến thông số cảm biến theo thời gian thực từ CSDL.
- **Biểu đồ phân bố sự cố**: Thống kê số lượng cảnh báo theo từng ngày và mức độ nghiêm trọng.
- **Bảng dữ liệu đo đạc CSDL**: Danh sách chi tiết các bản ghi, hỗ trợ phân trang (10, 20, 50, 100 dòng) và tìm kiếm.
- **Bộ lọc thời gian**: 24 giờ gần nhất, 7 ngày, 30 ngày hoặc toàn bộ lịch sử CSDL.
- **Xuất Excel**: Hỗ trợ xuất **Excel Đo Đạc Telemetry** hoặc **Excel Sự Cố Cảnh Báo**.

### 4.6 Quản Lý Hạ Tầng Gateway & Thiết Bị (`/admin/gateways`)
- Quản trị toàn bộ hệ thống phần cứng Jetson TX2, Node ESP32 và Camera AI.
- Chế độ xem toàn cục cho Quản trị viên (Admin) hoặc tự động lọc theo đập phụ trách cho Cán bộ vận hành (Operator).
- Theo dõi thống kê phần cứng: Số lượng Online, Offline, Error, Tổng Node, Tổng Camera.

### 4.7 Nhật Ký Thao Tác Hệ Thống (`/admin/logs`)
- Giám sát toàn bộ lịch sử đăng nhập, thay đổi thông số đập/trạm, cấu hình ngưỡng và thao tác thiết bị.
- Lọc theo danh mục (`AUTH`, `DAM`, `STATION`, `GATEWAY`, `THRESHOLD`).
- Tìm kiếm từ khóa tức thì (Debounced Search) và phân trang linh hoạt.
- **Nút "Xuất Excel"**: Xuất toàn bộ danh sách nhật ký hệ thống kèm đầy đủ metadata chi tiết.

### 4.8 Quản Lý Người Dùng (`/users`)
- Danh sách tài khoản người dùng trong hệ thống (Dành riêng cho Admin).
- Phê duyệt / Từ chối tài khoản cán bộ mới đăng ký (`PENDING_APPROVAL` -> `APPROVED`).
- Gán đập phụ trách (`assignedDamId`) cho cán bộ vận hành `OPERATOR`.
- Thay đổi vai trò quyền hạn người dùng.

---

## 5. Hệ thống Xuất Báo Cáo Excel & PDF

Hệ thống module hóa xuất báo cáo tại [`lib/exportHelpers.js`](file:///c:/Users/thuan/OneDrive/Máy%20tính/Dam/front/dam_mornitoring_frontend/lib/exportHelpers.js) đảm bảo dữ liệu luôn **chính xác 100%** với cấu trúc entity thực tế:

| Hàm Xuất Báo Cáo | Định Dạng | Vị Trí Sử Dụng | Nội Dung & Đặc Điểm Kỹ Thuật |
| :--- | :---: | :---: | :--- |
| `exportLogsToExcel` | `.xlsx` | `/admin/logs` | Xuất toàn bộ nhật ký Audit Logs khớp bộ lọc; tự động căn chỉnh độ rộng cột; hiển thị metadata JSON chi tiết. |
| `exportAlarmsToExcel` | `.xlsx` | `/alerts`, `/history` | Xuất danh sách sự cố cảnh báo; ánh xạ chính xác `measuredVal`, `thresholdVal`, đơn vị đo, kết quả nhận diện nứt AI và thời gian xử lý. |
| `exportHistoryToExcel` | `.xlsx` | `/history` | Xuất bảng dữ liệu chuỗi thời gian đo đạc telemetry từ CSDL PostgreSQL/TimescaleDB. |
| `exportAlarmToPDF` | `.pdf` | `/alerts` | Xuất Phiếu báo cáo sự cố an toàn đập chuẩn quốc gia; bố cục khung viền chuyên nghiệp; chuẩn hóa ký tự tiếng Việt không lỗi font. |
| `exportStationReportToPDF` | `.pdf` | `/stations/[id]` | Xuất Phiếu đánh giá hiện trạng an toàn trạm quan trắc (Mực nước, Độ rung, Độ ẩm, danh sách sự cố gần nhất). |

---

## 6. Bản đồ GIS Leaflet & Tối ưu hóa hiển thị

- **Component**: `components/DamMapInner.jsx` và `components/LocationPickerMapInner.jsx`.
- **Lớp bản đồ**:
  - **Địa hình (Terrain)**: Bản đồ chuẩn OpenStreetMap.
  - **Vệ tinh (Satellite)**: Bản đồ ảnh vệ tinh độ phân giải cao Esri World Imagery.
- **Tối ưu hóa hiệu năng**:
  - Tích hợp `React.memo` với hàm so sánh `damMapPropsAreEqual` giúp bản đồ **không bị re-render thừa** khi nhận dữ liệu WebSocket.
  - Sử dụng `MapController` với `useRef` lưu giữ vị trí camera và mức zoom mượt mà.
  - Popup giao diện tối `Dark Glassmorphism` tương phản cao, dễ đọc số liệu.

---

## 7. Cấu trúc thư mục dự án

```
dam_mornitoring_frontend/
├── app/
│   ├── layout.jsx                    # Root Layout + Navbar + LiveStatusBar
│   ├── page.jsx                      # Dashboard GIS Bản đồ chính
│   ├── dams/
│   │   ├── page.jsx                  # Danh sách Đập thủy điện
│   │   └── [id]/page.jsx             # Chi tiết Đập & Danh sách Trạm
│   ├── stations/
│   │   └── [id]/page.jsx             # Chi tiết Trạm (Giám sát & Cấu hình phần cứng)
│   ├── alerts/page.jsx               # Trung tâm Cảnh báo khẩn cấp & Xuất PDF/Excel
│   ├── history/page.jsx              # Lịch sử đo đạc & Phân tích biểu đồ CSDL
│   ├── admin/
│   │   ├── gateways/page.jsx         # Quản lý Hạ tầng Gateway Jetson TX2
│   │   └── logs/page.jsx             # Nhật ký thao tác hệ thống (Audit Logs)
│   ├── users/page.jsx                # Quản lý & Phê duyệt người dùng (Admin)
│   ├── profile/page.jsx              # Trang cá nhân & Đổi mật khẩu
│   ├── login/page.jsx                # Đăng nhập hệ thống
│   ├── register/page.jsx             # Đăng ký tài khoản cán bộ
│   └── api/image/route.js            # Proxy xử lý ảnh MinIO
├── components/
│   ├── DamMap.jsx                    # Dynamic SSR Wrapper cho Bản đồ GIS
│   ├── DamMapInner.jsx               # Component Leaflet Map chính
│   ├── StationDevicesTab.jsx         # Tab Quản lý phần cứng Gateway/Node/Sensors
│   ├── CameraViewer.jsx              # Trình phát video Camera RTSP/CSI & AI
│   ├── NavBar.jsx                    # Thanh điều hướng phân quyền theo Role
│   ├── LiveStatusBar.jsx             # Thanh trạng thái nhịp tim hệ thống
│   ├── ui.jsx                        # Thư viện UI components dùng chung (Panel, Card, Badge...)
│   └── form.jsx                      # Form components & Modal dialogs
├── context/
│   ├── AuthContext.jsx               # Quản lý phiên đăng nhập & Phân quyền RBAC
│   └── LanguageContext.jsx           # Quản lý đa ngôn ngữ (vi/en)
├── hooks/
│   ├── useAlarmData.js               # Hook quản lý sự kiện cảnh báo & WebSocket
│   ├── useDamData.js                 # Hook quản lý dữ liệu Đập, Trạm & Silent Refetch
│   └── useSensorData.js              # Hook WebSocket luồng telemetry cảm biến
├── lib/
│   ├── api.js                        # REST API Client kết nối Backend
│   ├── exportHelpers.js              # Hệ thống Xuất Báo Cáo Excel & PDF
│   ├── sensorHelpers.js              # Helper định dạng cảm biến, đơn vị, màu sắc
│   ├── statusConfig.js               # Cấu hình màu sắc trạng thái an toàn
│   └── socket.js                     # Singleton Socket.IO Client
├── public/                           # Tài nguyên tĩnh (Logo, Icons, Audio cảnh báo)
├── tailwind.config.js                # Cấu hình Theme & Bảng màu Design System
├── next.config.js                    # Cấu hình Next.js
└── package.json                      # Danh sách Dependencies
```

---

## 8. Cài đặt & Khởi chạy

### 8.1 Cấu hình biến môi trường
Tạo file `.env.local` tại thư mục gốc của frontend:

```env
# Địa chỉ URL của Backend Service
NEXT_PUBLIC_API_URL=http://localhost:3001

# Địa chỉ WebSocket Server
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 8.2 Khởi chạy môi trường phát triển (Development)

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy Next.js dev server
npm run dev
```

Mở trình duyệt truy cập: **[http://localhost:3000](http://localhost:3000)**

### 8.3 Build Production & Kiểm tra

```bash
# Build gói tối ưu production
npm run build

# Khởi chạy production server
npm run start
```

---

## 9. Đa ngôn ngữ & Quản trị trạng thái

- **Đa ngôn ngữ (i18n)**: Hỗ trợ chuyển đổi tức thì giữa Tiếng Việt và Tiếng Anh thông qua `LanguageContext` và từ điển tại `lib/i18n/vi.js` & `lib/i18n/en.js`.
- **Cập nhật dữ liệu ngầm (Silent Refetch)**: Mọi thao tác thêm/sửa/xóa hoặc đồng bộ cấu hình tự động kích hoạt chế độ làm mới dữ liệu nền không gây giật hay nhấp nháy giao diện.
- **Hệ thống Toast Notification**: Thông báo kết quả thao tác trực quan ở góc màn hình với thời gian hiển thị tự động 4 giây.
````

## File: app/layout.jsx
````javascript
import './globals.css'
import NavBar from '@/components/NavBar'
import LiveStatusBar from '@/components/LiveStatusBar'
import { LanguageProvider } from '@/context/LanguageContext'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  title: 'Dam Monitoring System',
  description: 'Hệ thống giám sát đê điều thời gian thực',
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-bg text-tx font-sans">
        <AuthProvider>
          <LanguageProvider>
            <NavBar />
            <LiveStatusBar />
            <main>{children}</main>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
````

## File: components/CameraViewer.jsx
````javascript
'use client'

import { useState } from 'react'
import { Mono, Panel, LiveDot } from '@/components/ui'
import { useLanguage } from '@/context/LanguageContext'
import { Video, VideoOff, Camera, Maximize2, ChevronLeft, ChevronRight, X } from 'lucide-react'

const CAMERAS = [
  { id: 1, label: 'Thân đê — Thượng lưu', code: 'CAM-01', status: 'safe' },
  { id: 2, label: 'Mặt đê — Km 45', code: 'CAM-02', status: 'safe' },
  { id: 3, label: 'Chân đê — Hạ lưu', code: 'CAM-03', status: 'warning' },
  { id: 4, label: 'Cửa xả — Trạm bơm', code: 'CAM-04', status: 'offline' },
]

const CAM_DOT = { safe: '#22c55e', warning: '#f59e0b', offline: '#5b6b85' }

export default function CameraViewer() {
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const { t, locale } = useLanguage()

  const cam = CAMERAS[active]
  const cl = CAM_DOT[cam.status]

  const prev = () => setActive(i => (i - 1 + CAMERAS.length) % CAMERAS.length)
  const next = () => setActive(i => (i + 1) % CAMERAS.length)

  const CamFeed = ({ large = false }) => (
    <div className={`relative bg-card3 overflow-hidden ${large ? '' : 'rounded-lg'}`}
      style={{ aspectRatio: '16/7' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        {cam.status === 'offline'
          ? <VideoOff className={`${large ? 'w-16 h-16' : 'w-10 h-10'} text-tx opacity-15`} />
          : <Video className={`${large ? 'w-20 h-20' : 'w-12 h-12'} text-tx opacity-5`} />}
      </div>

      {/* Top-left info */}
      <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: cl }} />
        <Mono className="text-[9px]" style={{ color: cl }}>{cam.code}</Mono>
        {cam.status === 'warning' && (
          <span className="font-mono text-[8px] text-warning bg-black/50 border border-warning/40 px-1.5 py-0.5 rounded">
            {t('camera.overflow')}
          </span>
        )}
      </div>
      <Mono className="absolute bottom-2 left-3 text-[8px] text-white/30">
        {new Date().toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US')} | FPS: 30
      </Mono>

      {/* Expand btn */}
      {!large && (
        <button onClick={() => setExpanded(true)}
          className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 border border-white/20 rounded flex items-center justify-center cursor-pointer transition-all"
          title={t('camera.zoomIn')}>
          <Maximize2 className="w-3.5 h-3.5 text-white/70" />
        </button>
      )}

      {/* Nav arrows */}
      <button onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/75 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white cursor-pointer transition-all select-none">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button onClick={next}
        className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/75 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white cursor-pointer transition-all select-none ${large ? 'right-3' : 'right-11'}`}>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )

  const Thumbnails = ({ gap = 'gap-1.5' }) => (
    <div className={`grid grid-cols-4 ${gap}`}>
      {CAMERAS.map((c, i) => {
        const tcl = CAM_DOT[c.status]
        return (
          <button key={c.id} onClick={() => setActive(i)}
            className="relative rounded overflow-hidden cursor-pointer transition-all p-0 border-none"
            style={{
              aspectRatio: '16/9', background: '#0a1119',
              outline: i === active ? '2px solid #818cf8' : '1px solid #22314a',
            }}>
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Video className="w-4 h-4 text-tx" />
            </div>
            {c.status === 'offline' && (
              <div className="absolute inset-0 flex items-center justify-center opacity-25">
                <VideoOff className="w-4 h-4 text-tx" />
              </div>
            )}
            <div className="absolute top-1 left-1">
              <div className="w-1 h-1 rounded-full" style={{ background: tcl }} />
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center py-0.5">
              <Mono className="text-[6px]" style={{ color: tcl }}>{c.code}</Mono>
            </div>
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      <Panel
        title={
          <span className="flex items-center gap-1.5 normal-case tracking-normal text-[12px] font-semibold text-tx">
            <Camera className="w-4 h-4 text-accent shrink-0" />
            <span>{t('camera.title')}</span>
          </span>
        }
        right={
          <span className="flex items-center gap-1.5">
            <LiveDot active />
            <Mono className="text-[9px] text-safe font-bold">{t('camera.live')}</Mono>
          </span>
        }
      >
        <CamFeed />

        {/* Label + dot indicator */}
        <div className="flex justify-between items-center mt-2.5 mb-2.5">
          <span className="text-[11px] font-semibold text-tx">{cam.label}</span>
          <div className="flex gap-1.5 items-center">
            {CAMERAS.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className="rounded-full cursor-pointer border-none p-0 transition-all"
                style={{
                  width: i === active ? 16 : 6, height: 6,
                  background: i === active ? '#818cf8' : '#22314a',
                  borderRadius: i === active ? 3 : '50%',
                }} />
            ))}
          </div>
        </div>

        <Thumbnails />

        {/* AI stats */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {[[t('camera.people'), '0', 'text-safe'], [t('camera.vehicles'), '2', 'text-tx'], [t('camera.cracks'), t('camera.none'), 'text-safe'], [t('camera.confidence'), '98.5%', 'text-info']].map(([lb, val, cl]) => (
            <div key={lb} className="bg-card2/70 border border-border/50 rounded px-2 py-1.5 text-center">
              <div className="text-[7px] text-muted uppercase tracking-wide mb-1">{lb}</div>
              <Mono className={`text-[11px] font-bold ${cl}`}>{val}</Mono>
            </div>
          ))}
        </div>
      </Panel>

      {/* Expanded modal */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ background: 'rgba(0,0,0,.88)' }}
          onClick={() => setExpanded(false)}>
          <div className="w-full max-w-3xl bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: cl }} />
                <Mono className="text-[11px]" style={{ color: cl }}>{cam.code}</Mono>
                <span className="text-[11px] font-semibold text-tx">{cam.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mono className="text-[9px] text-safe">● TRỰC TIẾP</Mono>
                <button onClick={() => setExpanded(false)}
                  className="text-muted hover:text-tx cursor-pointer bg-transparent border-none flex items-center justify-center p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <CamFeed large />
            <div className="p-3 bg-card3 border-t border-border">
              <Thumbnails gap="gap-2" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
````

## File: components/StationDevicesTab.jsx
````javascript
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchGateways,
  createGateway,
  updateGateway,
  deleteGateway,
  createNode,
  updateNode,
  deleteNode,
  mapNodeCamera,
  addNodeSensor,
  updateNodeSensor,
  deleteNodeSensor,
  createCamera,
  updateCamera,
  deleteCamera,
} from '@/lib/api'
import { Mono, Panel, Badge } from '@/components/ui'
import { Field, TextInput, Select, Modal, FormActions, Button, Toast } from '@/components/form'
import { useAuth } from '@/context/AuthContext'
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Cpu,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronRight,
  Droplets,
  Thermometer,
  Activity,
  Server,
  Video,
  Camera as CameraIcon,
  MapPin,
  CheckCircle2,
  Radio,
  Sliders,
  ShieldCheck,
  Zap,
} from 'lucide-react'

const SENSOR_TYPE_CONFIG = {
  water_level: { label: 'Mực nước', icon: Droplets, color: 'text-sky-400', bgColor: 'bg-sky-400/10', defaultModel: 'HC-SR04', unit: 'cm' },
  wtl: { label: 'Mực nước', icon: Droplets, color: 'text-sky-400', bgColor: 'bg-sky-400/10', defaultModel: 'HC-SR04', unit: 'cm' },
  humidity: { label: 'Độ ẩm', icon: Thermometer, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', defaultModel: 'DHT22', unit: '%' },
  moisture: { label: 'Độ ẩm', icon: Thermometer, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', defaultModel: 'Capacitive v1.2', unit: '%' },
  mst: { label: 'Độ ẩm', icon: Thermometer, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', defaultModel: 'Capacitive v1.2', unit: '%' },
  vibration: { label: 'Độ rung', icon: Activity, color: 'text-orange-400', bgColor: 'bg-orange-400/10', defaultModel: 'MPU6050', unit: 'mm/s' },
  vib: { label: 'Độ rung', icon: Activity, color: 'text-orange-400', bgColor: 'bg-orange-400/10', defaultModel: 'MPU6050', unit: 'mm/s' },
}

const getSensorTypeConfig = (rawType) => {
  if (!rawType) return SENSOR_TYPE_CONFIG.water_level
  const t = String(rawType).toLowerCase()
  if (t === 'vib' || t === 'vibration' || t.startsWith('vib')) return SENSOR_TYPE_CONFIG.vibration
  if (t === 'wtl' || t === 'water_level' || t === 'water') return SENSOR_TYPE_CONFIG.water_level
  if (t === 'mst' || t === 'moisture' || t === 'humidity') return SENSOR_TYPE_CONFIG.moisture
  return SENSOR_TYPE_CONFIG[t] || SENSOR_TYPE_CONFIG.water_level
}

const STATUS_CONFIG = {
  online: { label: 'Online', dot: 'bg-safe', text: 'text-safe', bg: 'bg-safe-soft', border: 'border-safe-soft' },
  offline: { label: 'Offline', dot: 'bg-muted', text: 'text-muted', bg: 'bg-white/5', border: 'border-border' },
  error: { label: 'Lỗi', dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger-soft', border: 'border-danger-soft' },
}

const SENSOR_STATUS_CONFIG = {
  active: { label: 'Hoạt động', dot: 'bg-safe', text: 'text-safe' },
  inactive: { label: 'Ngừng', dot: 'bg-muted', text: 'text-muted' },
  faulty: { label: 'Lỗi', dot: 'bg-danger', text: 'text-danger' },
}

const CAMERA_STATUS_CONFIG = {
  active: { label: 'Hoạt động', dot: 'bg-safe', text: 'text-safe' },
  inactive: { label: 'Ngừng', dot: 'bg-muted', text: 'text-muted' },
  error: { label: 'Lỗi', dot: 'bg-danger', text: 'text-danger' },
}

const EMPTY_GATEWAY_FORM = {
  gatewayId: '',
  name: '',
  description: '',
  macAddress: '',
  firmwareVersion: 'L4T-r32.7.3',
  stationId: '',
}

const EMPTY_NODE_FORM = {
  nodeId: '',
  name: '',
  description: '',
  macAddress: '',
  firmwareVersion: 'v1.0.0',
  installLocation: '',
  gatewayId: '',
  warnHigh: 2.5,
  criticalHigh: 25.0,
  alertMinCount: 4,
  alertMinDurationSec: 6.0,
  episodeResetGapSec: 3.0,
}

const EMPTY_SENSOR_FORM = {
  sensorType: 'water_level',
  model: 'HC-SR04',
  unit: 'cm',
  calibrationOffset: 0,
  status: 'active',
}

const EMPTY_CAMERA_FORM = {
  cameraId: '',
  cameraType: 'CSI',
  name: '',
  streamUrl: '',
  resolution: '1280x720',
  gatewayId: '',
  status: 'active',
}

export default function StationDevicesTab({ stationId, damId, stationName, onDataChange }) {
  const { isViewer } = useAuth()
  const [gateways, setGateways] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Accordion state
  const [expandedGateways, setExpandedGateways] = useState(new Set())
  const [expandedNodes, setExpandedNodes] = useState(new Set())

  // Modals state
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false)
  const [editingGateway, setEditingGateway] = useState(null)
  const [nodeModalOpen, setNodeModalOpen] = useState(false)
  const [editingNode, setEditingNode] = useState(null)
  const [sensorModalOpen, setSensorModalOpen] = useState(false)
  const [editingSensor, setEditingSensor] = useState(null)
  const [sensorNodeId, setSensorNodeId] = useState(null)
  const [cameraModalOpen, setCameraModalOpen] = useState(false)
  const [editingCamera, setEditingCamera] = useState(null)
  const [mapCameraModalOpen, setMapCameraModalOpen] = useState(false)
  const [mapNodeTarget, setMapNodeTarget] = useState(null)
  const [selectedCameraId, setSelectedCameraId] = useState('')

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Loading actions
  const [savingGateway, setSavingGateway] = useState(false)
  const [savingNode, setSavingNode] = useState(false)
  const [savingSensor, setSavingSensor] = useState(false)
  const [savingCamera, setSavingCamera] = useState(false)
  const [savingMapCamera, setSavingMapCamera] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form states
  const [gatewayForm, setGatewayForm] = useState(EMPTY_GATEWAY_FORM)
  const [nodeForm, setNodeForm] = useState(EMPTY_NODE_FORM)
  const [sensorForm, setSensorForm] = useState(EMPTY_SENSOR_FORM)
  const [cameraForm, setCameraForm] = useState(EMPTY_CAMERA_FORM)

  // Toast
  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), duration)
  }, [])

  // Load Data
  const loadData = useCallback(async (silent = false) => {
    if (!stationId || isViewer) return
    if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await fetchGateways(stationId, damId, true)
      const list = res.gateways || []
      setGateways(list)
      // Mặc định mở rộng tất cả Gateway khi tải xong
      setExpandedGateways(new Set(list.map((g) => g.gatewayId)))
      // Mặc định mở rộng tất cả Node
      const allNodeIds = list.flatMap((g) => (g.nodes || []).map((n) => n.nodeId))
      setExpandedNodes(new Set(allNodeIds))
    } catch (err) {
      setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [stationId, damId])

  useEffect(() => {
    loadData(false)
  }, [loadData])

  const toggleSet = (setter) => (key) => {
    setter((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }
  const toggleGateway = toggleSet(setExpandedGateways)
  const toggleNode = toggleSet(setExpandedNodes)

  // ── Tính toán thống kê nhanh tại trạm ──
  const stats = {
    totalGateways: gateways.length,
    onlineGateways: gateways.filter((g) => g.status === 'online').length,
    totalNodes: gateways.reduce((acc, g) => acc + (g.nodes?.length || 0), 0),
    onlineNodes: gateways.reduce(
      (acc, g) => acc + (g.nodes?.filter((n) => n.status === 'online')?.length || 0),
      0,
    ),
    totalCameras: gateways.reduce((acc, g) => acc + (g.cameras?.length || 0), 0),
    totalSensors: gateways.reduce(
      (acc, g) => acc + (g.nodes || []).reduce((nAcc, n) => nAcc + (n.sensors?.length || 0), 0),
      0,
    ),
  }

  // ── GATEWAY CRUD ──
  const openCreateGatewayModal = () => {
    setEditingGateway(null)
    setGatewayForm({
      ...EMPTY_GATEWAY_FORM,
      stationId: stationId,
    })
    setGatewayModalOpen(true)
  }

  const openEditGatewayModal = (gw, e) => {
    e?.stopPropagation()
    setEditingGateway(gw)
    setGatewayForm({
      gatewayId: gw.gatewayId,
      name: gw.name || '',
      description: gw.description || '',
      macAddress: gw.macAddress || '',
      firmwareVersion: gw.firmwareVersion || '',
      stationId: gw.stationId || stationId,
    })
    setGatewayModalOpen(true)
  }

  const handleSaveGateway = async () => {
    if (!gatewayForm.name?.trim()) {
      showToast('Tên Gateway không được để trống', 'error')
      return
    }
    if (!editingGateway && !gatewayForm.macAddress?.trim()) {
      showToast('Địa chỉ MAC không được để trống', 'error')
      return
    }
    try {
      setSavingGateway(true)
      if (editingGateway) {
        await updateGateway(editingGateway.gatewayId, {
          name: gatewayForm.name.trim(),
          description: gatewayForm.description?.trim() || null,
          macAddress: gatewayForm.macAddress?.trim() || undefined,
          firmwareVersion: gatewayForm.firmwareVersion?.trim() || null,
          stationId: stationId,
        })
        showToast(`Cập nhật Gateway ${editingGateway.gatewayId} thành công`)
      } else {
        await createGateway({
          gatewayId: gatewayForm.gatewayId?.trim() || undefined,
          name: gatewayForm.name.trim(),
          description: gatewayForm.description?.trim() || null,
          macAddress: gatewayForm.macAddress.trim(),
          firmwareVersion: gatewayForm.firmwareVersion?.trim() || 'L4T-r32.7.3',
          stationId: stationId,
        })
        showToast('Tạo Gateway mới thành công')
      }
      setGatewayModalOpen(false)
      loadData(true)
      onDataChange?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingGateway(false)
    }
  }

  // ── NODE CRUD ──
  const openCreateNodeModal = (gatewayId, e) => {
    e?.stopPropagation()
    setEditingNode(null)
    setNodeForm({
      ...EMPTY_NODE_FORM,
      gatewayId: gatewayId,
    })
    setNodeModalOpen(true)
  }

  const openEditNodeModal = (node, gatewayId, e) => {
    e?.stopPropagation()
    setEditingNode(node)
    setNodeForm({
      nodeId: node.nodeId,
      name: node.name || '',
      description: node.description || '',
      macAddress: node.macAddress || '',
      firmwareVersion: node.firmwareVersion || '',
      installLocation: node.installLocation || '',
      gatewayId: gatewayId || node.gatewayId || '',
      warnHigh: node.warnHigh ?? 2.5,
      criticalHigh: node.criticalHigh ?? 25.0,
      alertMinCount: node.alertMinCount ?? 4,
      alertMinDurationSec: node.alertMinDurationSec ?? 6.0,
      episodeResetGapSec: node.episodeResetGapSec ?? 3.0,
    })
    setNodeModalOpen(true)
  }

  const handleSaveNode = async () => {
    if (!nodeForm.name?.trim()) {
      showToast('Tên Node không được để trống', 'error')
      return
    }
    if (!editingNode && !nodeForm.macAddress?.trim()) {
      showToast('Địa chỉ MAC không được để trống', 'error')
      return
    }
    try {
      setSavingNode(true)
      const payload = {
        name: nodeForm.name.trim(),
        description: nodeForm.description?.trim() || null,
        macAddress: nodeForm.macAddress?.trim() || undefined,
        firmwareVersion: nodeForm.firmwareVersion?.trim() || null,
        installLocation: nodeForm.installLocation?.trim() || null,
        gatewayId: nodeForm.gatewayId,
        warnHigh: Number(nodeForm.warnHigh) || 2.5,
        criticalHigh: Number(nodeForm.criticalHigh) || 25.0,
        alertMinCount: Number(nodeForm.alertMinCount) || 4,
        alertMinDurationSec: Number(nodeForm.alertMinDurationSec) || 6.0,
        episodeResetGapSec: Number(nodeForm.episodeResetGapSec) || 3.0,
      }
      if (editingNode) {
        await updateNode(editingNode.nodeId, payload)
        showToast(`Cập nhật Node ${editingNode.nodeId} thành công`)
      } else {
        await createNode({
          ...payload,
          nodeId: nodeForm.nodeId?.trim() || undefined,
        })
        showToast('Tạo Sensor Node mới thành công')
      }
      setNodeModalOpen(false)
      loadData(true)
      onDataChange?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingNode(false)
    }
  }

  // ── SENSOR CRUD ──
  const openAddSensorModal = (nodeId, e) => {
    e?.stopPropagation()
    setEditingSensor(null)
    setSensorNodeId(nodeId)
    setSensorForm({ ...EMPTY_SENSOR_FORM })
    setSensorModalOpen(true)
  }

  const openEditSensorModal = (sensor, nodeId, e) => {
    e?.stopPropagation()
    setEditingSensor(sensor)
    setSensorNodeId(nodeId)
    setSensorForm({
      sensorType: sensor.sensorType || 'water_level',
      model: sensor.model || '',
      unit: sensor.unit || '',
      calibrationOffset: sensor.calibrationOffset ?? 0,
      status: sensor.status || 'active',
    })
    setSensorModalOpen(true)
  }

  const handleSaveSensor = async () => {
    if (!sensorNodeId) return
    try {
      setSavingSensor(true)
      const payload = {
        sensorType: sensorForm.sensorType,
        model: sensorForm.model?.trim() || null,
        unit: sensorForm.unit?.trim() || null,
        calibrationOffset: Number(sensorForm.calibrationOffset) || 0,
        status: sensorForm.status || 'active',
      }
      if (editingSensor) {
        await updateNodeSensor(sensorNodeId, editingSensor.id, payload)
        showToast(`Cập nhật cảm biến thành công`)
      } else {
        await addNodeSensor(sensorNodeId, payload)
        showToast(`Thêm cảm biến mới cho Node ${sensorNodeId} thành công`)
      }
      setSensorModalOpen(false)
      loadData(true)
      onDataChange?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingSensor(false)
    }
  }

  // ── CAMERA CRUD & MAPPING ──
  const openCreateCameraModal = (gatewayId, e) => {
    e?.stopPropagation()
    setEditingCamera(null)
    setCameraForm({
      ...EMPTY_CAMERA_FORM,
      gatewayId: gatewayId,
    })
    setCameraModalOpen(true)
  }

  const openEditCameraModal = (cam, gatewayId, e) => {
    e?.stopPropagation()
    setEditingCamera(cam)
    setCameraForm({
      cameraId: cam.cameraId,
      cameraType: cam.cameraType || 'CSI',
      name: cam.name || '',
      streamUrl: cam.streamUrl || '',
      resolution: cam.resolution || '1280x720',
      gatewayId: gatewayId || cam.gatewayId || '',
      status: cam.status || 'active',
    })
    setCameraModalOpen(true)
  }

  const handleSaveCamera = async () => {
    if (!cameraForm.name?.trim()) {
      showToast('Tên Camera không được để trống', 'error')
      return
    }
    try {
      setSavingCamera(true)
      const payload = {
        cameraType: cameraForm.cameraType,
        name: cameraForm.name.trim(),
        streamUrl: cameraForm.streamUrl?.trim() || null,
        resolution: cameraForm.resolution?.trim() || '1280x720',
        gatewayId: cameraForm.gatewayId,
        status: cameraForm.status || 'active',
      }
      if (editingCamera) {
        await updateCamera(editingCamera.cameraId, payload)
        showToast(`Cập nhật Camera ${editingCamera.cameraId} thành công`)
      } else {
        await createCamera({
          ...payload,
          cameraId: cameraForm.cameraId?.trim() || undefined,
        })
        showToast('Gắn Camera mới thành công')
      }
      setCameraModalOpen(false)
      loadData(true)
      onDataChange?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingCamera(false)
    }
  }

  const openMapCameraModal = (node, gateway, e) => {
    e?.stopPropagation()
    setMapNodeTarget(node)
    setSelectedCameraId(node.mappedCameraId || '')
    setMapCameraModalOpen(true)
  }

  const handleSaveMapCamera = async () => {
    if (!mapNodeTarget) return
    try {
      setSavingMapCamera(true)
      await mapNodeCamera(mapNodeTarget.nodeId, selectedCameraId || null)
      showToast(
        selectedCameraId
          ? `Đã gán Camera ${selectedCameraId} cho Node ${mapNodeTarget.nodeId}`
          : `Đã hủy gán Camera cho Node ${mapNodeTarget.nodeId}`,
      )
      setMapCameraModalOpen(false)
      loadData(true)
      onDataChange?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingMapCamera(false)
    }
  }

  // ── XÓA THIẾT BỊ ──
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    const { kind, id, parentId } = deleteConfirm
    try {
      setDeleting(true)
      if (kind === 'gateway') {
        await deleteGateway(id)
        showToast(`Đã xóa Gateway ${id}`)
      } else if (kind === 'node') {
        await deleteNode(id)
        showToast(`Đã xóa Node ${id}`)
      } else if (kind === 'sensor') {
        await deleteNodeSensor(parentId, id)
        showToast(`Đã xóa cảm biến khỏi Node ${parentId}`)
      } else if (kind === 'camera') {
        await deleteCamera(id)
        showToast(`Đã xóa Camera ${id}`)
      }
      setDeleteConfirm(null)
      loadData(true)
      onDataChange?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  // ── RENDER ──
  if (isViewer) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-xl space-y-3 shadow-panel">
        <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto border border-danger/30">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-tx">Truy cập bị giới hạn</h3>
        <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
          Tài khoản Người xem (Viewer) hoặc Khách chưa đăng nhập không có quyền truy cập vào cấu hình phần cứng và danh sách thiết bị.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── KPI HEADER THIẾT BỊ TẠI TRẠM ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 shadow-panel">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Gateways (Jetson TX2)</span>
            <Server className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <Mono className="text-xl font-bold text-tx">{stats.totalGateways}</Mono>
            <span className="text-[10px] font-mono text-safe bg-safe/10 px-1.5 py-0.5 rounded border border-safe/20">
              {stats.onlineGateways} Online
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 shadow-panel">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Sensor Nodes (ESP32)</span>
            <Cpu className="w-3.5 h-3.5 text-info" />
          </div>
          <div className="flex items-baseline gap-2">
            <Mono className="text-xl font-bold text-tx">{stats.totalNodes}</Mono>
            <span className="text-[10px] font-mono text-info bg-info/10 px-1.5 py-0.5 rounded border border-info/20">
              {stats.onlineNodes} Online
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 shadow-panel">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Cảm Biến Đang Gắn</span>
            <Zap className="w-3.5 h-3.5 text-warning" />
          </div>
          <div className="flex items-baseline gap-2">
            <Mono className="text-xl font-bold text-tx">{stats.totalSensors}</Mono>
            <span className="text-[10px] text-muted">VIB, WTL, MST</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 shadow-panel">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Camera AI (Vết Nứt)</span>
            <Video className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <Mono className="text-xl font-bold text-tx">{stats.totalCameras}</Mono>
            <span className="text-[10px] text-muted">CSI / RTSP</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-2.5 shadow-panel">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-tx uppercase tracking-wider">
            Sơ Đồ & Danh Sách Thiết Bị Trực Thuộc Trạm
          </span>
          <span className="text-[10px] font-mono text-muted bg-card2 px-2 py-0.5 rounded-full border border-border">
            {stationName || stationId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-muted hover:text-tx bg-card2 hover:bg-white/5 transition-colors text-[11px] font-semibold cursor-pointer"
            title="Làm mới danh sách thiết bị"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
            <span>Làm mới</span>
          </button>

          {!isViewer && (
            <button
              onClick={openCreateGatewayModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-[11px] font-bold shadow-glow hover:brightness-110 transition-all cursor-pointer border-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Gateway (Jetson TX2)</span>
            </button>
          )}
        </div>
      </div>

      {/* ── DANH SÁCH GATEWAYS & NODES ── */}
      {loading ? (
        <div className="p-12 text-center bg-card border border-border rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto mb-2" />
          <p className="text-xs text-muted">Đang tải cấu hình thiết bị của trạm...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-card border border-danger/30 rounded-xl">
          <AlertTriangle className="w-6 h-6 text-danger mx-auto mb-2" />
          <p className="text-xs text-danger font-semibold mb-2">Lỗi tải dữ liệu: {error}</p>
          <button
            onClick={() => loadData(false)}
            className="px-3 py-1 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs font-bold cursor-pointer hover:bg-danger/20"
          >
            Thử lại
          </button>
        </div>
      ) : gateways.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto border border-warning/30">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-tx">Trạm này chưa có Gateway Jetson TX2 nào</h3>
          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
            Để trạm có thể nhận dữ liệu từ các Sensor Node và kích hoạt AI chụp ảnh vết nứt, bạn cần lắp đặt và khai báo Gateway Jetson TX2 điều phối.
          </p>
          {!isViewer && (
            <button
              onClick={openCreateGatewayModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold shadow-glow hover:brightness-110 transition-all cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Gateway Jetson TX2 Đầu Tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {gateways.map((gw) => {
            const isGwExpanded = expandedGateways.has(gw.gatewayId)
            const gwStatus = STATUS_CONFIG[gw.status] || STATUS_CONFIG.offline
            const allStationCameras = gw.cameras || []

            return (
              <div
                key={gw.gatewayId}
                className="bg-[#0b1322] border-2 border-indigo-500/30 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-2xl transition-all"
              >
                {/* ── GATEWAY HEADER ROW ── */}
                <div
                  onClick={() => toggleGateway(gw.gatewayId)}
                  className="px-4 py-3.5 bg-gradient-to-r from-slate-900/90 via-[#0e172a] to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border-b border-indigo-500/30 flex items-center justify-between cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-white p-1 bg-transparent border-none cursor-pointer">
                      {isGwExpanded ? (
                        <ChevronDown className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-sm">
                      <Server className="w-5 h-5 text-indigo-300" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white tracking-wide">{gw.name}</span>
                        <Mono className="text-[11px] text-indigo-300 font-bold bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 rounded-md">
                          {gw.gatewayId}
                        </Mono>
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${gwStatus.text} ${gwStatus.bg} ${gwStatus.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${gwStatus.dot}`} />
                          {gwStatus.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-mono">
                        <span>
                          MAC: <strong className="text-slate-200">{gw.macAddress || '—'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Firmware: <strong className="text-slate-200">{gw.firmwareVersion || '—'}</strong>
                        </span>
                        {gw.lastSeenAt && (
                          <>
                            <span>•</span>
                            <span>
                              Cập nhật:{' '}
                              <strong className="text-slate-200">
                                {new Date(gw.lastSeenAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Gateway */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {!isViewer && (
                      <>
                        <button
                          onClick={(e) => openCreateNodeModal(gw.gatewayId, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all cursor-pointer border-none"
                          title="Thêm Sensor Node ESP32 vào Gateway này"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm Node</span>
                        </button>

                        <button
                          onClick={(e) => openCreateCameraModal(gw.gatewayId, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all cursor-pointer border-none"
                          title="Gắn Camera CSI/RTSP vào Gateway này"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Gắn Camera</span>
                        </button>

                        <button
                          onClick={(e) => openEditGatewayModal(gw, e)}
                          className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Sửa thông tin Gateway"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm({
                              kind: 'gateway',
                              id: gw.gatewayId,
                              name: gw.name,
                            })
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-300 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Xóa Gateway"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* ── GATEWAY CONTENT (EXPANDABLE) ── */}
                {isGwExpanded && (
                  <div className="p-4 space-y-5 bg-[#080e1a]">
                    {/* SECTION 1: CAMERAS GẮN VÀO GATEWAY */}
                    <div className="bg-[#0c1e1c]/60 border border-emerald-500/25 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Video className="w-4 h-4 text-emerald-400" />
                            Camera Giám Sát AI Trực Thuộc
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                            {gw.cameras?.length || 0}
                          </span>
                        </div>
                      </div>

                      {gw.cameras && gw.cameras.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {gw.cameras.map((cam) => {
                            const camSt = CAMERA_STATUS_CONFIG[cam.status] || CAMERA_STATUS_CONFIG.active
                            return (
                              <div
                                key={cam.cameraId}
                                className="bg-[#0d2623] border border-emerald-500/35 hover:border-emerald-500/60 rounded-xl p-3 flex items-start justify-between shadow-md transition-all"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                                    <CameraIcon className="w-4 h-4 text-emerald-300" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-white truncate">{cam.name}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Mono className="text-[10px] text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                        {cam.cameraId}
                                      </Mono>
                                      <span className="text-[9px] font-semibold text-emerald-200/90">({cam.cameraType || 'CSI'})</span>
                                      <span className="text-[9px] font-mono text-slate-300">{cam.resolution}</span>
                                    </div>
                                    {cam.streamUrl && (
                                      <div className="text-[9px] font-mono text-emerald-300/90 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/20 truncate max-w-[200px] mt-1" title={cam.streamUrl}>
                                        {cam.streamUrl}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {!isViewer && (
                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <button
                                      onClick={() => openEditCameraModal(cam, gw.gatewayId)}
                                      className="p-1.5 text-slate-300 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 rounded-lg cursor-pointer transition-colors"
                                      title="Sửa Camera"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeleteConfirm({
                                          kind: 'camera',
                                          id: cam.cameraId,
                                          name: cam.name,
                                        })
                                      }
                                      className="p-1.5 text-slate-300 hover:text-rose-300 bg-emerald-950/60 hover:bg-rose-950/80 border border-emerald-500/30 rounded-lg cursor-pointer transition-colors"
                                      title="Xóa Camera"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-[11px] text-emerald-400/80 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-center">
                          Chưa có Camera nào gắn vào Gateway này. (Bấm nút <strong>"+ Gắn Camera"</strong> ở trên để thêm)
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: SENSOR NODES (ESP32) */}
                    <div className="bg-[#091526]/80 border border-sky-500/25 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                          <span className="text-xs font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-sky-400" />
                            Danh Sách Sensor Nodes ESP32
                          </span>
                          <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                            {gw.nodes?.length || 0}
                          </span>
                        </div>
                      </div>

                      {gw.nodes && gw.nodes.length > 0 ? (
                        <div className="space-y-4">
                          {gw.nodes.map((node) => {
                            const isNodeExpanded = expandedNodes.has(node.nodeId)
                            const nodeSt = STATUS_CONFIG[node.status] || STATUS_CONFIG.offline
                            const mappedCam = allStationCameras.find(
                              (c) => c.cameraId === node.mappedCameraId,
                            )

                            return (
                              <div
                                key={node.nodeId}
                                className="bg-[#0b1626] border-2 border-sky-500/30 hover:border-sky-500/50 rounded-xl overflow-hidden shadow-lg transition-all"
                              >
                                {/* Node header */}
                                <div
                                  onClick={() => toggleNode(node.nodeId)}
                                  className="px-4 py-3 bg-gradient-to-r from-[#11213b] via-[#142847] to-[#11213b] hover:from-[#172e52] hover:to-[#172e52] border-b border-sky-500/25 flex items-center justify-between cursor-pointer select-none transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <button className="text-slate-400 hover:text-white p-0.5 bg-transparent border-none cursor-pointer">
                                      {isNodeExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-sky-400" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </button>

                                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0 shadow-sm">
                                      <Cpu className="w-4 h-4 text-sky-300" />
                                    </div>

                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-extrabold text-white tracking-wide">{node.name}</span>
                                        <Mono className="text-[10px] text-sky-300 font-bold bg-sky-500/20 border border-sky-500/40 px-2 py-0.2 rounded">
                                          {node.nodeId}
                                        </Mono>
                                        <span
                                          className={`inline-flex items-center gap-1 text-[8px] font-mono font-bold px-2 py-0.2 rounded-full border ${nodeSt.text} ${nodeSt.bg} ${nodeSt.border}`}
                                        >
                                          <span className={`w-1 h-1 rounded-full ${nodeSt.dot}`} />
                                          {nodeSt.label}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                                        <span>
                                          Vị trí: <strong className="text-slate-200">{node.installLocation || 'Thân đập'}</strong>
                                        </span>
                                        <span>•</span>
                                        <span>
                                          MAC: <strong className="text-slate-200">{node.macAddress || '—'}</strong>
                                        </span>
                                        <span>•</span>
                                        <span>
                                          Firmware: <strong className="text-slate-200">{node.firmwareVersion || 'v1.0'}</strong>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Node Quick Actions */}
                                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    {/* Mapped Camera Badge / Button */}
                                    <button
                                      onClick={(e) => openMapCameraModal(node, gw, e)}
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${mappedCam
                                          ? 'bg-purple-950/80 text-purple-300 border-purple-500/50 hover:bg-purple-900 shadow-sm'
                                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                                        }`}
                                      title="Cấu hình Camera AI chụp ảnh khi Node này rung bất thường"
                                    >
                                      <CameraIcon className="w-3 h-3 text-purple-400" />
                                      <span>
                                        {mappedCam ? `Cam AI: ${mappedCam.name || mappedCam.cameraId}` : 'Chưa gán Cam AI'}
                                      </span>
                                    </button>

                                    {!isViewer && (
                                      <>
                                        <button
                                          onClick={(e) => openAddSensorModal(node.nodeId, e)}
                                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer border-none"
                                          title="Thêm cảm biến (Rung, Mực nước, Độ ẩm) cho Node này"
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>Thêm Sensor</span>
                                        </button>

                                        <button
                                          onClick={(e) => openEditNodeModal(node, gw.gatewayId, e)}
                                          className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                                          title="Sửa thông tin Node"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setDeleteConfirm({
                                              kind: 'node',
                                              id: node.nodeId,
                                              name: node.name,
                                              parentId: gw.gatewayId,
                                            })
                                          }}
                                          className="p-1.5 text-slate-300 hover:text-rose-300 bg-slate-800 hover:bg-rose-950/80 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                                          title="Xóa Node"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Node Body (Sensors + Thresholds Config) */}
                                {isNodeExpanded && (
                                  <div className="p-3.5 space-y-3 bg-[#070e1a]">
                                    {/* AI Vibration Thresholds Summary */}
                                    <div className="flex flex-wrap items-center gap-2.5 p-2.5 bg-[#0d1726] rounded-xl border border-slate-700/80 text-[10px]">
                                      <span className="font-extrabold text-amber-400 uppercase flex items-center gap-1.5 tracking-wide">
                                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                                        Ngưỡng Rung AI:
                                      </span>
                                      <span className="font-mono text-amber-300 font-bold bg-amber-500/20 px-2.5 py-0.5 rounded-md border border-amber-500/40">
                                        Cảnh báo: ≥ {node.warnHigh ?? 2.5} mm/s
                                      </span>
                                      <span className="font-mono text-rose-300 font-bold bg-rose-500/20 px-2.5 py-0.5 rounded-md border border-rose-500/40">
                                        Nguy cấp: ≥ {node.criticalHigh ?? 25.0} mm/s
                                      </span>
                                      <span className="font-mono text-sky-300 font-bold bg-sky-500/20 px-2.5 py-0.5 rounded-md border border-sky-500/40">
                                        Bộ lọc lọc ảo: {node.alertMinCount ?? 4} mẫu / {node.alertMinDurationSec ?? 3.0}s
                                      </span>
                                    </div>

                                    {/* Sensors Table */}
                                    {node.sensors && node.sensors.length > 0 ? (
                                      <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-[#070e1a]">
                                        <table className="w-full border-collapse text-left">
                                          <thead>
                                            <tr className="border-b border-slate-700 text-[9px] text-slate-300 font-bold uppercase tracking-wider bg-[#131f33]">
                                              <th className="py-2 px-3">Loại Cảm Biến</th>
                                              <th className="py-2 px-3">Model Phần Cứng</th>
                                              <th className="py-2 px-3">Hiệu Chuẩn (Offset)</th>
                                              <th className="py-2 px-3">Đơn Vị</th>
                                              <th className="py-2 px-3">Trạng Thái</th>
                                              {!isViewer && <th className="py-2 px-3 text-right">Thao Tác</th>}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {node.sensors.map((sensor) => {
                                              const sCfg = getSensorTypeConfig(sensor.sensorType)
                                              const Icon = sCfg.icon || Activity
                                              const sSt = SENSOR_STATUS_CONFIG[sensor.status] || SENSOR_STATUS_CONFIG.active

                                              return (
                                                <tr
                                                  key={sensor.id}
                                                  className="border-b border-slate-800/80 odd:bg-[#070e1a] even:bg-[#0b1424] hover:bg-slate-800/50 transition-colors text-[11px]"
                                                >
                                                  <td className="py-2 px-3">
                                                    <span className="flex items-center gap-2 font-bold text-white">
                                                      <Icon className={`w-4 h-4 ${sCfg.color}`} />
                                                      <span>{sCfg.label}</span>
                                                    </span>
                                                  </td>
                                                  <td className="py-2 px-3 font-mono font-semibold text-slate-200">
                                                    <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80">
                                                      {sensor.model || sCfg.defaultModel}
                                                    </span>
                                                  </td>
                                                  <td className="py-2 px-3 font-mono font-bold text-cyan-300">
                                                    {sensor.calibrationOffset > 0 ? `+${sensor.calibrationOffset}` : sensor.calibrationOffset || 0}
                                                  </td>
                                                  <td className="py-2 px-3 font-mono font-semibold text-slate-300">
                                                    {sensor.unit || sCfg.unit}
                                                  </td>
                                                  <td className="py-2 px-3">
                                                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30`}>
                                                      <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse`} />
                                                      {sSt.label}
                                                    </span>
                                                  </td>
                                                  {!isViewer && (
                                                    <td className="py-2 px-3 text-right">
                                                      <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                          onClick={() => openEditSensorModal(sensor, node.nodeId)}
                                                          className="p-1.5 text-slate-400 hover:text-sky-300 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer transition-colors"
                                                          title="Sửa cảm biến"
                                                        >
                                                          <Pencil className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                          onClick={() =>
                                                            setDeleteConfirm({
                                                              kind: 'sensor',
                                                              id: sensor.id,
                                                              name: `${sCfg.label} (${sensor.model || ''})`,
                                                              parentId: node.nodeId,
                                                            })
                                                          }
                                                          className="p-1.5 text-slate-400 hover:text-rose-300 bg-slate-800/80 hover:bg-rose-950/80 rounded-lg border border-slate-700 cursor-pointer transition-colors"
                                                          title="Xóa cảm biến"
                                                        >
                                                          <Trash2 className="w-3 h-3" />
                                                        </button>
                                                      </div>
                                                    </td>
                                                  )}
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
                                        Node này chưa có cảm biến nào. (Bấm nút <strong>"+ Thêm Sensor"</strong> ở trên để khai báo cảm biến Rung/Mực nước/Độ ẩm)
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-[11px] text-sky-400/80 bg-sky-950/30 border border-sky-500/20 rounded-xl p-3 text-center">
                          Chưa có Sensor Node ESP32 nào gắn vào Gateway này. (Bấm nút <strong>"+ Thêm Node"</strong> ở trên để tạo)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT GATEWAY ── */}
      <Modal
        open={gatewayModalOpen}
        onClose={() => setGatewayModalOpen(false)}
        title={editingGateway ? `Sửa Gateway ${editingGateway.gatewayId}` : 'Thêm Gateway Mới (Jetson TX2)'}
        icon={Server}
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setGatewayModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={savingGateway} onClick={handleSaveGateway}>
              {editingGateway ? 'Lưu Thay Đổi' : 'Tạo Gateway'}
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-3">
          <Field label="Tên Gateway" required htmlFor="gw-name">
            <TextInput
              id="gw-name"
              required
              autoFocus
              value={gatewayForm.name}
              onChange={(e) => setGatewayForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="vd: Gateway Trạm Tân Ấp (Jetson TX2)"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Mã Gateway (Định danh)" htmlFor="gw-id" hint="Tự sinh nếu để trống">
              <TextInput
                id="gw-id"
                disabled={Boolean(editingGateway)}
                value={gatewayForm.gatewayId}
                onChange={(e) => setGatewayForm((p) => ({ ...p, gatewayId: e.target.value }))}
                placeholder="vd: GTW-ST01-TX2A"
                className="font-mono uppercase"
              />
            </Field>

            <Field label="Địa chỉ MAC" required htmlFor="gw-mac">
              <TextInput
                id="gw-mac"
                required
                value={gatewayForm.macAddress}
                onChange={(e) => setGatewayForm((p) => ({ ...p, macAddress: e.target.value }))}
                placeholder="vd: 00:04:4B:XX:XX:XX"
                className="font-mono uppercase"
              />
            </Field>
          </div>

          <Field label="Firmware Version" htmlFor="gw-fw">
            <TextInput
              id="gw-fw"
              value={gatewayForm.firmwareVersion}
              onChange={(e) => setGatewayForm((p) => ({ ...p, firmwareVersion: e.target.value }))}
              placeholder="vd: L4T-r32.7.3"
              className="font-mono"
            />
          </Field>

          <Field label="Mô tả ghi chú" htmlFor="gw-desc">
            <TextInput
              id="gw-desc"
              value={gatewayForm.description}
              onChange={(e) => setGatewayForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="vd: Đặt tại tủ điều khiển trung tâm trạm"
            />
          </Field>
        </div>
      </Modal>

      {/* ── MODAL: CREATE / EDIT NODE ── */}
      <Modal
        open={nodeModalOpen}
        onClose={() => setNodeModalOpen(false)}
        title={editingNode ? `Sửa Sensor Node ${editingNode.nodeId}` : 'Thêm Sensor Node Mới (ESP32)'}
        icon={Cpu}
        maxWidth="max-w-2xl"
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setNodeModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={savingNode} onClick={handleSaveNode}>
              {editingNode ? 'Lưu Thay Đổi' : 'Tạo Node'}
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-3">
          <Field label="Tên Node" required htmlFor="node-name">
            <TextInput
              id="node-name"
              required
              autoFocus
              value={nodeForm.name}
              onChange={(e) => setNodeForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="vd: Node Cảm Biến Thân Đập Khối 01"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Mã Node" htmlFor="node-id" hint="Tự sinh nếu để trống">
              <TextInput
                id="node-id"
                disabled={Boolean(editingNode)}
                value={nodeForm.nodeId}
                onChange={(e) => setNodeForm((p) => ({ ...p, nodeId: e.target.value }))}
                placeholder="vd: NOD-GW01-ESP01"
                className="font-mono uppercase"
              />
            </Field>

            <Field label="Địa chỉ MAC" required htmlFor="node-mac">
              <TextInput
                id="node-mac"
                required
                value={nodeForm.macAddress}
                onChange={(e) => setNodeForm((p) => ({ ...p, macAddress: e.target.value }))}
                placeholder="vd: 24:0A:C4:XX:XX:XX"
                className="font-mono uppercase"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Vị trí lắp đặt chi tiết" htmlFor="node-loc">
              <TextInput
                id="node-loc"
                value={nodeForm.installLocation}
                onChange={(e) => setNodeForm((p) => ({ ...p, installLocation: e.target.value }))}
                placeholder="vd: Thân đập chính K25+500"
              />
            </Field>

            <Field label="Firmware" htmlFor="node-fw">
              <TextInput
                id="node-fw"
                value={nodeForm.firmwareVersion}
                onChange={(e) => setNodeForm((p) => ({ ...p, firmwareVersion: e.target.value }))}
                placeholder="vd: v1.0.0"
                className="font-mono"
              />
            </Field>
          </div>

          {/* Cấu hình ngưỡng rung AI */}
          <div className="p-3 bg-card2/80 border border-border/80 rounded-xl space-y-2.5">
            <div className="text-[11px] font-bold text-warning uppercase flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Cấu hình phát hiện rung động AI (Đồng bộ xuống Jetson TX2)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Ngưỡng Cảnh Báo (mm/s)" htmlFor="node-warn">
                <TextInput
                  id="node-warn"
                  type="number"
                  step="0.1"
                  value={nodeForm.warnHigh}
                  onChange={(e) => setNodeForm((p) => ({ ...p, warnHigh: e.target.value }))}
                  className="font-mono"
                />
              </Field>

              <Field label="Ngưỡng Nguy Cấp (mm/s)" htmlFor="node-crit">
                <TextInput
                  id="node-crit"
                  type="number"
                  step="0.1"
                  value={nodeForm.criticalHigh}
                  onChange={(e) => setNodeForm((p) => ({ ...p, criticalHigh: e.target.value }))}
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Số mẫu vượt ngưỡng tối thiểu (minCount)" htmlFor="node-count">
                <TextInput
                  id="node-count"
                  type="number"
                  value={nodeForm.alertMinCount}
                  onChange={(e) => setNodeForm((p) => ({ ...p, alertMinCount: e.target.value }))}
                  className="font-mono"
                />
              </Field>

              <Field label="Thời gian duy trì tối thiểu (giây)" htmlFor="node-dur">
                <TextInput
                  id="node-dur"
                  type="number"
                  step="0.5"
                  value={nodeForm.alertMinDurationSec}
                  onChange={(e) => setNodeForm((p) => ({ ...p, alertMinDurationSec: e.target.value }))}
                  className="font-mono"
                />
              </Field>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: ADD / EDIT SENSOR ── */}
      <Modal
        open={sensorModalOpen}
        onClose={() => setSensorModalOpen(false)}
        title={editingSensor ? `Sửa Cảm Biến` : `Thêm Cảm Biến cho Node ${sensorNodeId}`}
        icon={Zap}
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setSensorModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={savingSensor} onClick={handleSaveSensor}>
              {editingSensor ? 'Lưu Cảm Biến' : 'Thêm Cảm Biến'}
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-3">
          <Field label="Loại Cảm Biến" required htmlFor="sensor-type">
            <Select
              id="sensor-type"
              value={sensorForm.sensorType}
              onChange={(e) => {
                const val = e.target.value
                const cfg = getSensorTypeConfig(val)
                setSensorForm((p) => ({
                  ...p,
                  sensorType: val,
                  model: cfg.defaultModel || p.model,
                  unit: cfg.unit || p.unit,
                }))
              }}
            >
              <option value="water_level">Mực nước (Water Level - HC-SR04/Áp suất)</option>
              <option value="vibration">Độ rung thân đập (Vibration - MPU6050)</option>
              <option value="moisture">Độ ẩm rò rỉ (Moisture - DHT22/Capacitive)</option>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Model Phần Cứng" htmlFor="sensor-model">
              <TextInput
                id="sensor-model"
                value={sensorForm.model}
                onChange={(e) => setSensorForm((p) => ({ ...p, model: e.target.value }))}
                placeholder="vd: MPU6050, HC-SR04"
                className="font-mono"
              />
            </Field>

            <Field label="Đơn vị đo" htmlFor="sensor-unit">
              <TextInput
                id="sensor-unit"
                value={sensorForm.unit}
                onChange={(e) => setSensorForm((p) => ({ ...p, unit: e.target.value }))}
                placeholder="vd: mm/s, m, %"
                className="font-mono"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Hiệu chuẩn Offset" htmlFor="sensor-offset" hint="Cộng/trừ bù sai số">
              <TextInput
                id="sensor-offset"
                type="number"
                step="0.01"
                value={sensorForm.calibrationOffset}
                onChange={(e) => setSensorForm((p) => ({ ...p, calibrationOffset: e.target.value }))}
                className="font-mono"
              />
            </Field>

            <Field label="Trạng thái" htmlFor="sensor-status">
              <Select
                id="sensor-status"
                value={sensorForm.status}
                onChange={(e) => setSensorForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="active">Hoạt động (Active)</option>
                <option value="inactive">Tạm dừng (Inactive)</option>
                <option value="faulty">Lỗi hỏng (Faulty)</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: CREATE / EDIT CAMERA ── */}
      <Modal
        open={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        title={editingCamera ? `Sửa Camera ${editingCamera.cameraId}` : 'Gắn Camera Mới vào Gateway'}
        icon={Video}
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setCameraModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={savingCamera} onClick={handleSaveCamera}>
              {editingCamera ? 'Lưu Camera' : 'Gắn Camera'}
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-3">
          <Field label="Tên Camera" required htmlFor="cam-name">
            <TextInput
              id="cam-name"
              required
              autoFocus
              value={cameraForm.name}
              onChange={(e) => setCameraForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="vd: Camera Quan Sát Khối 01 (CSI Sony IMX219)"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Mã Camera" htmlFor="cam-id" hint="Tự sinh nếu để trống">
              <TextInput
                id="cam-id"
                disabled={Boolean(editingCamera)}
                value={cameraForm.cameraId}
                onChange={(e) => setCameraForm((p) => ({ ...p, cameraId: e.target.value }))}
                placeholder="vd: CAM-CSI-ST01-01"
                className="font-mono uppercase"
              />
            </Field>

            <Field label="Loại Camera" htmlFor="cam-type">
              <Select
                id="cam-type"
                value={cameraForm.cameraType}
                onChange={(e) => setCameraForm((p) => ({ ...p, cameraType: e.target.value }))}
              >
                <option value="CSI">CSI (Gắn trực tiếp Jetson TX2)</option>
                <option value="RTSP">RTSP (Camera IP luồng mạng)</option>
                <option value="USB">USB Camera</option>
              </Select>
            </Field>
          </div>

          <Field label="Đường dẫn Stream / RTSP / Pipeline" htmlFor="cam-url">
            <TextInput
              id="cam-url"
              value={cameraForm.streamUrl}
              onChange={(e) => setCameraForm((p) => ({ ...p, streamUrl: e.target.value }))}
              placeholder="vd: rtsp://192.168.1.100:554/live hoặc /dev/video0"
              className="font-mono text-xs"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Độ phân giải" htmlFor="cam-res">
              <Select
                id="cam-res"
                value={cameraForm.resolution}
                onChange={(e) => setCameraForm((p) => ({ ...p, resolution: e.target.value }))}
              >
                <option value="1280x720">1280x720 (HD 720p)</option>
                <option value="1920x1080">1920x1080 (Full HD 1080p)</option>
                <option value="640x480">640x480 (VGA)</option>
              </Select>
            </Field>

            <Field label="Trạng thái" htmlFor="cam-status">
              <Select
                id="cam-status"
                value={cameraForm.status}
                onChange={(e) => setCameraForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="active">Hoạt động (Active)</option>
                <option value="inactive">Tạm dừng (Inactive)</option>
                <option value="error">Lỗi kết nối (Error)</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: MAP CAMERA TO NODE ── */}
      <Modal
        open={mapCameraModalOpen}
        onClose={() => setMapCameraModalOpen(false)}
        title={`Gán Camera AI Chụp Ảnh cho Node ${mapNodeTarget?.nodeId}`}
        icon={CameraIcon}
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setMapCameraModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={savingMapCamera} onClick={handleSaveMapCamera}>
              Lưu Ánh Xạ
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-muted leading-relaxed">
            Khi Node <strong className="text-info font-mono">{mapNodeTarget?.nodeId}</strong> phát hiện rung lắc vượt ngưỡng, Jetson TX2 sẽ tự động chụp ảnh từ camera được chọn dưới đây và chạy mô hình AI nhận diện vết nứt.
          </p>

          <Field label="Chọn Camera Giám Sát" htmlFor="map-cam-select">
            <Select
              id="map-cam-select"
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
            >
              <option value="">-- Không gán Camera (Hủy mapping) --</option>
              {gateways
                .flatMap((g) => g.cameras || [])
                .map((c) => (
                  <option key={c.cameraId} value={c.cameraId}>
                    {c.name} ({c.cameraId}) — {c.cameraType}
                  </option>
                ))}
            </Select>
          </Field>
        </div>
      </Modal>

      {/* ── MODAL: CONFIRM DELETE ── */}
      <Modal
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title={`Xác Nhận Xóa ${deleteConfirm?.kind?.toUpperCase()}`}
        icon={AlertTriangle}
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Hủy
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleConfirmDelete}>
              Xóa Vĩnh Viễn
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-2">
          <p className="text-xs text-tx">
            Bạn có chắc chắn muốn xóa {deleteConfirm?.kind}:{' '}
            <strong className="text-danger">{deleteConfirm?.name || deleteConfirm?.id}</strong> không?
          </p>
          {deleteConfirm?.kind === 'gateway' && (
            <p className="text-[11px] text-warning bg-warning/10 border border-warning/30 p-2 rounded">
              ⚠️ Cảnh báo: Việc xóa Gateway sẽ đồng thời xóa toàn bộ các Node, Cảm biến và Camera gắn kèm bên trong!
            </p>
          )}
          {deleteConfirm?.kind === 'node' && (
            <p className="text-[11px] text-warning bg-warning/10 border border-warning/30 p-2 rounded">
              ⚠️ Cảnh báo: Việc xóa Node sẽ xóa các Cảm biến trực thuộc!
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
````

## File: context/AuthContext.jsx
````javascript
'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { loginUser as apiLogin, logoutUser as apiLogout, fetchMe as apiFetchMe } from '@/lib/api'

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  isAdmin: false,
  isOperator: false,
  isViewer: false,
  assignedDamId: null,
})

// Các trang công khai cho Khách xem VIEWER truy cập không cần đăng nhập
const isPublicRoute = (path) => {
  if (['/', '/dams', '/login', '/register'].includes(path)) return true
  if (path.startsWith('/dams/') || path.startsWith('/stations/')) return true
  return false
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Khởi tạo & kiểm tra phiên làm việc từ Token / Cookie
  const initAuth = useCallback(async () => {
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (savedToken) setToken(savedToken)

      const profile = await apiFetchMe(savedToken)
      if (profile) {
        setUser(profile)
      } else {
        setUser(null)
        setToken(null)
        if (typeof window !== 'undefined') localStorage.removeItem('access_token')
      }
    } catch (err) {
      console.error('[AuthContext] Session init error:', err)
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Tải lại thông tin người dùng từ CSDL khi cần (sau login, cập nhật thông tin)
  const refreshUser = useCallback(async () => {
    try {
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : token
      if (!savedToken) return null
      const profile = await apiFetchMe(savedToken)
      if (profile) {
        setUser(profile)
      }
      return profile
    } catch {
      return null
    }
  }, [token])

  // Đồng bộ lại profile khi người dùng quay lại tab (window focus) thay vì gọi mỗi khi chuyển trang
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleFocus = () => {
      const savedToken = localStorage.getItem('access_token')
      if (savedToken && !loading) {
        refreshUser()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loading, refreshUser])

  // Điều hướng dựa vào phiên đăng nhập và vai trò (Role Policy Enforcement)
  useEffect(() => {
    if (loading) return

    const publicPage = isPublicRoute(pathname)
    const isPrivateForAdminOrOperator = ['/alerts', '/history', '/users', '/profile'].includes(pathname) || pathname.startsWith('/admin')

    if (!user && isPrivateForAdminOrOperator) {
      // Khách chưa đăng nhập cố truy cập trang riêng tư -> Redirect về /login
      router.push('/login')
    } else if (user && (pathname === '/login' || pathname === '/register')) {
      // Đã đăng nhập cố vào /login hay /register -> Redirect về /dams
      router.push('/dams')
    } else if (user && user.role === 'VIEWER' && isPrivateForAdminOrOperator) {
      // Tài khoản vai trò VIEWER cố truy cập trang riêng tư -> Redirect về /dams
      router.push('/dams')
    }
  }, [user, loading, pathname, router])

  const login = async (usernameOrEmail, password) => {
    const data = await apiLogin({ usernameOrEmail, password })
    if (data.accessToken) {
      setToken(data.accessToken)
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.accessToken)
      }
    }
    if (data.user) {
      setUser(data.user)
    }
    router.push('/dams')
    return data
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch {
      // ignore
    } finally {
      setUser(null)
      setToken(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
      }
      router.push('/dams')
    }
  }

  const isAdmin = user?.role === 'ADMIN'
  const isOperator = user?.role === 'OPERATOR'
  const isViewer = !user || user?.role === 'VIEWER'
  const assignedDamId = user?.assignedDamId || null

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        isAdmin,
        isOperator,
        isViewer,
        assignedDamId,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
````

## File: lib/statusConfig.js
````javascript
// Returns Tailwind-compatible class strings per status
export const STATUS = {
  critical: {
    label: 'NGUY CẤP',
    text: 'text-critical',
    bg: 'bg-critical-soft',
    border: 'border-critical-soft',
    leftBorder: 'border-l-critical',
    topBorder: 'border-t-critical',
    dot: 'bg-critical',
  },
  danger: {
    label: 'NGUY HIỂM',
    text: 'text-danger',
    bg: 'bg-danger-soft',
    border: 'border-danger-soft',
    leftBorder: 'border-l-danger',
    topBorder: 'border-t-danger',
    dot: 'bg-danger',
  },
  warning: {
    label: 'CẢNH BÁO',
    text: 'text-warning',
    bg: 'bg-warning-soft',
    border: 'border-warning-soft',
    leftBorder: 'border-l-warning',
    topBorder: 'border-t-warning',
    dot: 'bg-warning',
  },
  safe: {
    label: 'AN TOÀN',
    text: 'text-safe',
    bg: 'bg-safe-soft',
    border: 'border-safe-soft',
    leftBorder: 'border-l-safe',
    topBorder: 'border-t-safe',
    dot: 'bg-safe',
  },
  info: {
    label: 'CHÚ Ý',
    text: 'text-info',
    bg: 'bg-info-soft',
    border: 'border-info-soft',
    leftBorder: 'border-l-info',
    topBorder: 'border-t-info',
    dot: 'bg-info',
  },
  unknown: {
    label: 'KHÔNG XÁC ĐỊNH',
    text: 'text-unknown',
    bg: 'bg-unknown-soft',
    border: 'border-unknown-soft',
    leftBorder: 'border-l-unknown',
    topBorder: 'border-t-unknown',
    dot: 'bg-unknown',
  },
}

export const getStatus = (s) => STATUS[s] || STATUS.info

/** Map backend severity string → statusConfig key */
export const SEVERITY_TO_STATUS = {
  CRITICAL: 'critical',
  ALERT: 'danger',
  WARNING: 'warning',
  NORMAL: 'safe',
}

export const getStatusBySeverity = (severity) => getStatus(SEVERITY_TO_STATUS[severity] || 'info')
````

## File: app/admin/nodes/page.jsx
````javascript
import { redirect } from 'next/navigation'

// Sensor Node giờ được quản lý lồng trong Gateway (Jetson TX2) — xem /admin/gateways.
export default function AdminNodesRedirectPage() {
  redirect('/admin/gateways')
}
````

## File: app/login/page.jsx
````javascript
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
````

## File: app/stations/page.jsx
````javascript
import { redirect } from 'next/navigation'

export default function StationsRedirectPage() {
  redirect('/dams')
}
````

## File: hooks/useSensorData.js
````javascript
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import { fetchLatest } from '@/lib/api'

export function useSensorData(stationId, clusterId) {
  const [latest, setLatest]       = useState(null)
  const [history, setHistory]     = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError]         = useState(null)
  const mountedRef = useRef(true)

  // Lấy initial data qua REST khi mount hoặc khi stationId/clusterId đổi
  const loadInitial = useCallback(async () => {
    try {
      const res = await fetchLatest(stationId, clusterId)
      if (!mountedRef.current) return
      setLatest(res?.data || null)
      setHistory(res?.history || null)
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      setError('Không thể kết nối backend. Kiểm tra backend đang chạy tại ' +
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'))
    }
  }, [stationId, clusterId])

  useEffect(() => {
    mountedRef.current = true
    setLatest(null)
    setHistory(null)
    const socket = getSocket()

    // ── Socket events ──────────────────────────────────────────────
    const onConnect = () => {
      if (mountedRef.current) setConnected(true)
    }

    const onDisconnect = () => {
      if (mountedRef.current) setConnected(false)
    }

    const onConnectError = () => {
      if (mountedRef.current) {
        setConnected(false)
        setError('WebSocket không thể kết nối.')
      }
    }

    let frameId = null
    const latestRef = { current: null }

    const processBatchUpdate = () => {
      frameId = null
      const snap = latestRef.current
      if (!snap || !mountedRef.current) return

      setLatest(snap)
      setError(null)

      setHistory(prev => {
        if (!prev) return {
          timestamps: [snap.timestamp],
          freq:       [snap.freq],
          amp:        [snap.amp],
          waterLevel: [snap.waterLevel],
          moisture:   [snap.moisture],
          percent:    [snap.percent],
        }
        const MAX = 60
        return {
          timestamps: [...(prev.timestamps || []), snap.timestamp].slice(-MAX),
          freq:       [...(prev.freq || []),       snap.freq].slice(-MAX),
          amp:        [...(prev.amp || []),        snap.amp].slice(-MAX),
          waterLevel: [...(prev.waterLevel || []), snap.waterLevel].slice(-MAX),
          moisture:   [...(prev.moisture || []),   snap.moisture].slice(-MAX),
          percent:    [...(prev.percent || []),    snap.percent].slice(-MAX),
        }
      })
    }

    // Backend gửi `update` event mỗi khi có sensor data mới
    const onUpdate = (snapshot) => {
      if (!mountedRef.current || !snapshot) return

      // Lọc dữ liệu: Nếu có stationId thì bắt buộc snapshot phải có stationId khớp
      // stationId nay là mã trạm dạng chuỗi (STA-001-01) — so sánh trực tiếp, không ép số.
      if (stationId != null) {
        if (!snapshot.stationId || snapshot.stationId !== stationId) {
          return
        }
      }
      if (clusterId != null) {
        if (!snapshot.clusterId || snapshot.clusterId !== clusterId) {
          return
        }
      }

      latestRef.current = snapshot
      if (!frameId) {
        frameId = requestAnimationFrame(processBatchUpdate)
      }
    }

    // Backend gửi `history` ngay khi client kết nối lần đầu (chỉ dùng nếu không lọc theo trạm cụ thể)
    const onHistory = (h) => {
      if (!mountedRef.current) return
      if (stationId == null && clusterId == null) {
        setHistory(h)
      }
    }

    socket.on('connect',       onConnect)
    socket.on('disconnect',    onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('update',        onUpdate)
    socket.on('history',       onHistory)

    // Khởi động
    loadInitial()
    if (!socket.connected) {
      socket.connect()
    } else {
      setConnected(true)
    }

    return () => {
      mountedRef.current = false
      if (frameId) cancelAnimationFrame(frameId)
      socket.off('connect',       onConnect)
      socket.off('disconnect',    onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('update',        onUpdate)
      socket.off('history',       onHistory)
    }
  }, [loadInitial, stationId, clusterId])

  return { latest, history, connected, error }
}
````

## File: .gitignore
````
# Logs
/logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Diagnostic reports (https://nodejs.org/api/report.html)
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Snowpack dependency directory (https://snowpack.dev/)
web_modules/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
# Comment in the public line in if your project uses Gatsby and not Next.js
# https://nextjs.org/blog/next-9-1#public-directory-support
# public

# vuepress build output
.vuepress/dist

# vuepress v2.x temp and cache directory
.temp
.cache

# vitepress build output
**/.vitepress/dist

# vitepress cache directory
**/.vitepress/cache

# Docusaurus cache and generated files
.docusaurus

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

# agent skills
.agents
.claude


repomix-output.xml
````

## File: app/admin/logs/page.jsx
````javascript
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { fetchAuditLogs } from '@/lib/api'
import { exportLogsToExcel } from '@/lib/exportHelpers'
import { Mono, Panel, StatTile, Pagination } from '@/components/ui'
import {
  FileText,
  KeyRound,
  Building2,
  Sliders,
  RefreshCw,
  Search,
  Shield,
  Clock,
  Activity,
  Server,
  FileSpreadsheet,
} from 'lucide-react'

const CATEGORY_MAP = {
  ALL: { label: 'Tất cả nhật ký', icon: FileText, color: 'text-accent border-accent bg-accent/10' },
  AUTH: { label: 'Đăng nhập / Đăng ký', icon: KeyRound, color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10' },
  DAM: { label: 'Hạ tầng Đập', icon: Building2, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  STATION: { label: 'Trạm quan trắc', icon: Activity, color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
  GATEWAY: { label: 'Gateway (Jetson TX2)', icon: Server, color: 'text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/10' },
  THRESHOLD: { label: 'Ngưỡng báo động', icon: Sliders, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
}

export default function AuditLogsPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [categoryCounts, setCategoryCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [exporting, setExporting] = useState(false)

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setPage(1)
  }

  const handleExportExcel = async () => {
    try {
      setExporting(true)
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
      let logsToExport = logs
      if (total > logs.length) {
        const res = await fetchAuditLogs(selectedCategory, Math.min(total, 500), currentToken, 1, search || undefined)
        logsToExport = res.logs || []
      }
      exportLogsToExcel(logsToExport, selectedCategory, search)
    } catch (err) {
      console.error('[AuditLogsPage] Lỗi xuất excel:', err)
      exportLogsToExcel(logs, selectedCategory, search)
    } finally {
      setExporting(false)
    }
  }

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
      const res = await fetchAuditLogs(selectedCategory, pageSize, currentToken, page, search || undefined)
      setLogs(res.logs || [])
      setTotal(res.total || 0)
      setCategoryCounts(res.categoryCounts || {})
      setError(null)
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách nhật ký hệ thống')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, token, page, pageSize, search])

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        router.push('/dams')
      } else {
        loadLogs()
      }
    }
  }, [authLoading, isAdmin, loadLogs, router])

  // Debounce ô tìm kiếm — tìm kiếm chạy ở backend nên chờ người dùng gõ xong mới gọi API
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Reset về trang 1 khi đổi tab category
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat)
    setPage(1)
  }

  // Thống kê counts — luôn phản ánh toàn bộ dữ liệu khớp tìm kiếm, không phụ thuộc tab đang chọn
  const stats = useMemo(() => {
    const authCount = categoryCounts.AUTH || 0
    const damCount = (categoryCounts.DAM || 0) + (categoryCounts.STATION || 0)
    const thresholdCount = categoryCounts.THRESHOLD || 0
    return { total, authCount, damCount, thresholdCount }
  }, [categoryCounts, total])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-48px)]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-48px)] p-6 font-sans">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center space-y-4 shadow-panel">
          <Shield className="w-12 h-12 text-danger mx-auto" />
          <h2 className="text-lg font-bold text-tx">Khu Vực Hạn Chế Phân Quyền</h2>
          <p className="text-xs text-muted">
            Trang <strong>Nhật Ký Hệ Thống (Audit Logs)</strong> chỉ dành riêng cho tài khoản Quản trị viên (ADMIN).
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 min-h-[calc(100vh-48px)] space-y-4 max-w-7xl mx-auto font-sans">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card border border-border rounded-xl p-4 shadow-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-tx tracking-wide m-0">Nhật Ký Thao Tác Hệ Thống (Audit Logs)</h1>
              <p className="text-[10px] text-muted m-0">Theo dõi toàn bộ lịch sử đăng nhập, thay đổi thông số Đập, Trạm và cấu hình Ngưỡng báo động</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Ô Tìm kiếm */}
          <div className="flex items-center gap-1.5 bg-card2 border border-border rounded-lg px-3 py-1.5 flex-1 sm:w-64 focus-within:border-accent">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm người dùng, thao tác..."
              className="bg-transparent border-none outline-none text-tx text-[11px] w-full placeholder:text-muted"
            />
          </div>

          <button
            onClick={handleExportExcel}
            disabled={exporting || loading || logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/40 rounded-lg text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Xuất danh sách nhật ký hệ thống ra file Excel"
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${exporting ? 'animate-spin' : ''}`} />
            <span>{exporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </button>

          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-tx text-[11px] font-semibold bg-card2 hover:bg-white/5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={FileText} label="Tổng Thao Tác" value={stats.total} status="info" />
        <StatTile icon={KeyRound} label="Xác Thực (Auth)" value={stats.authCount} status="info" />
        <StatTile icon={Building2} label="Hạ Tầng Đập / Trạm" value={stats.damCount} status="safe" />
        <StatTile icon={Sliders} label="Cấu Hình Ngưỡng" value={stats.thresholdCount} status="warning" />
      </div>

      {/* Tabs Phân Loại */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/40">
        {Object.entries(CATEGORY_MAP).map(([catKey, catMeta]) => {
          const active = selectedCategory === catKey
          const IconComp = catMeta.icon
          return (
            <button
              key={catKey}
              onClick={() => handleCategoryChange(catKey)}
              className={`flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold rounded-xl cursor-pointer transition-all whitespace-nowrap border ${
                active
                  ? `${catMeta.color} shadow-sm`
                  : 'bg-card border-border/60 text-muted hover:text-tx hover:border-border'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{catMeta.label}</span>
            </button>
          )}
        )}
      </div>

      {/* Main Table */}
      <Panel
        title="Nhật Ký Chi Tiết"
        right={<Mono className="text-[10px] text-muted">{total} bản ghi</Mono>}
        bodyClassName="p-0"
        className="overflow-hidden"
      >
        {loading ? (
          <div className="py-20 text-center text-muted space-y-2">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs">Đang tải nhật ký hệ thống...</div>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-danger text-xs font-bold">{error}</div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-muted space-y-2">
            <FileText className="w-10 h-10 mx-auto text-muted/40" />
            <div className="text-xs">Chưa có nhật ký nào phù hợp trong danh sách.</div>
          </div>
        ) : (
          <div className="overflow-auto max-h-[560px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-card2 backdrop-blur border-b border-border/60 text-[10px] text-muted uppercase font-bold tracking-wider">
                  <th className="py-3 px-4 w-44">Thời Gian</th>
                  <th className="py-3 px-4 w-36">Người Thực Hiện</th>
                  <th className="py-3 px-4 w-36">Loại Thao Tác</th>
                  <th className="py-3 px-4">Chi Tiết Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {logs.map(log => {
                  const catMeta = CATEGORY_MAP[log.category] || CATEGORY_MAP.ALL
                  const formattedTime = new Date(log.timestamp).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })

                  return (
                    <tr key={log.id} className="hover:bg-card2/50 transition-colors">
                      {/* Thời gian */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-muted font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span>{formattedTime}</span>
                        </div>
                      </td>

                      {/* Người thực hiện */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold uppercase">
                            {log.username ? log.username.slice(0, 2) : 'US'}
                          </div>
                          <div>
                            <div className="font-bold text-tx text-[11px]">{log.username}</div>
                            <div className="text-[9px] text-muted font-mono uppercase">{log.userRole || 'ADMIN'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Loại Thao Tác */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold border font-mono ${catMeta.color}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Chi Tiết Hành Động */}
                      <td className="py-3 px-4">
                        <div className="text-tx font-medium text-[11.5px] leading-relaxed">
                          {log.description}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && (
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            itemLabel="bản ghi"
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </Panel>
    </div>
  )
}
````

## File: hooks/useDamData.js
````javascript
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchDams,
  fetchStations,
  createDam as apiCreateDam,
  updateDam as apiUpdateDam,
  deleteDam as apiDeleteDam,
  createStation as apiCreateStation,
  updateStation as apiUpdateStation,
  deleteStation as apiDeleteStation,
} from '@/lib/api'
import { getSocket } from '@/lib/socket'

// Hạ nhịp cập nhật số đo sống của mỗi Trạm xuống tối đa 1 lần/giây (nguồn phát ~20 lần/giây).
const STATION_PATCH_THROTTLE_MS = 1000

export function useDamData() {
  const [dams, setDams] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)
  const lastStationPatchRef = useRef(new Map())

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const [damsRes, stationsRes] = await Promise.all([fetchDams(), fetchStations()])
      if (!mountedRef.current) return
      setDams(damsRes.dams || [])
      setStations(stationsRes.stations || [])
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      setError('Không thể tải dữ liệu đập và trạm từ backend.')
      console.error('[useDamData]', err)
    } finally {
      if (!silent && mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadData(false)
    return () => {
      mountedRef.current = false
    }
  }, [loadData])

  // Trạng thái an toàn Station/Dam do backend tự tính (worst-case từ cảm biến + cảnh báo)
  // được đẩy real-time qua WebSocket — cập nhật ngay state local, không cần chờ refetch.
  useEffect(() => {
    const socket = getSocket()
    const onStatusChanged = (evt) => {
      if (!mountedRef.current || !evt) return
      if (evt.level === 'station' && evt.stationId) {
        setStations(prev => prev.map(s => s.stationId === evt.stationId ? { ...s, status: evt.status, statusReason: evt.statusReason ?? s.statusReason } : s))
      } else if (evt.level === 'dam' && evt.damId) {
        setDams(prev => prev.map(d => d.damId === evt.damId ? { ...d, status: evt.status, statusReason: evt.statusReason ?? d.statusReason } : d))
      }
    }
    // Dam.waterLevel = MAX(waterLevel) trong các Station thuộc Dam, fillPct suy ra từ đó
    // — backend tự tính, đẩy real-time.
    const onDamMetricsChanged = (evt) => {
      if (!mountedRef.current || !evt?.damId) return
      setDams(prev => prev.map(d =>
        d.damId === evt.damId ? { ...d, waterLevel: evt.waterLevel, fillPct: evt.fillPct ?? d.fillPct } : d
      ))
    }
    // Số đo sống của từng Trạm (mực nước / độ ẩm / biên độ rung) để thẻ trạm ở mọi trang
    // tự cập nhật mà không cần tải lại. Sự kiện `update` phát tới ~20 lần/giây nên phải
    // hạ nhịp, nếu không cả danh sách trạm sẽ re-render liên tục.
    const onSensorUpdate = (snapshot) => {
      if (!mountedRef.current || !snapshot?.stationId) return
      const stId = snapshot.stationId
      const now = Date.now()
      if (now - (lastStationPatchRef.current.get(stId) || 0) < STATION_PATCH_THROTTLE_MS) return
      lastStationPatchRef.current.set(stId, now)

      setStations(prev => prev.map(s => {
        if (s.stationId !== stId) return s
        const next = {
          waterLevel: snapshot.waterLevel,
          humidity: snapshot.moisture,
          vibration: snapshot.amp,
        }
        // Bỏ qua nếu không có gì thực sự đổi — tránh tạo object mới gây re-render thừa.
        if (s.waterLevel === next.waterLevel && s.humidity === next.humidity && s.vibration === next.vibration) {
          return s
        }
        return { ...s, ...next }
      }))
    }
    socket.on('station_status_changed', onStatusChanged)
    socket.on('dam_metrics_changed', onDamMetricsChanged)
    socket.on('update', onSensorUpdate)
    if (!socket.connected) socket.connect()
    return () => {
      socket.off('station_status_changed', onStatusChanged)
      socket.off('dam_metrics_changed', onDamMetricsChanged)
      socket.off('update', onSensorUpdate)
    }
  }, [])

  const createDam = async (data) => {
    const res = await apiCreateDam(data)
    await loadData(true)
    return res
  }

  const updateDam = async (id, data) => {
    const res = await apiUpdateDam(id, data)
    await loadData(true)
    return res
  }

  const deleteDam = async (id) => {
    const res = await apiDeleteDam(id)
    await loadData(true)
    return res
  }

  const createStation = async (data) => {
    const res = await apiCreateStation(data)
    await loadData(true)
    return res
  }

  const updateStation = async (id, data) => {
    const res = await apiUpdateStation(id, data)
    await loadData(true)
    return res
  }

  const deleteStation = async (id) => {
    const res = await apiDeleteStation(id)
    await loadData(true)
    return res
  }

  return {
    dams,
    stations,
    loading,
    error,
    refetch: loadData,
    createDam,
    updateDam,
    deleteDam,
    createStation,
    updateStation,
    deleteStation,
  }
}
````

## File: lib/sensorHelpers.js
````javascript
import { AlertOctagon, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'

/**
 * Chuyển history array của backend thành format recharts
 * Backend trả về: { timestamps: [], freq: [], amp: [], waterLevel: [], moisture: [], percent: [] }
 * Recharts cần:   [{ t, v }, ...]
 */
export function historyToChartData(history, field) {
  if (!history || !history.timestamps?.length) return []
  return history.timestamps.map((ts, i) => ({
    t: formatTime(ts),
    v: history[field]?.[i] ?? 0,
  }))
}

/**
 * Format ISO timestamp → "HH:MM"
 */
export function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--:--'
  }
}

/**
 * Tính trạng thái mực nước
 * - Hiển thị dùng bd1/bd2/bd3 truyền thống
 * - Logic cảnh báo lấy từ ThresholdConfig backend nếu có
 *
 * @param {number} waterLevel - Mực nước hiện tại
 * @param {number} bd3 - Ngưỡng Báo Động 3 (từ station data, dùng cho hiển thị)
 * @param {number} bd2 - Ngưỡng Báo Động 2
 * @param {number} bd1 - Ngưỡng Báo Động 1
 * @param {object} [thresholds] - ThresholdConfig từ backend { warnHigh, alertHigh, criticalHigh }
 */
export function getWaterStatus(waterLevel, bd3, bd2, bd1, thresholds) {
  // Nếu có ThresholdConfig từ backend → dùng logic backend
  if (thresholds) {
    if (waterLevel >= thresholds.criticalHigh)
      return { label: 'VƯỢT BĐ3', level: 'danger', severity: 'CRITICAL' }
    if (waterLevel >= thresholds.alertHigh)
      return { label: 'VƯỢT BĐ2', level: 'danger', severity: 'ALERT' }
    if (waterLevel >= thresholds.warnHigh)
      return { label: 'BĐ1', level: 'warning', severity: 'WARNING' }
    return { label: 'AN TOÀN', level: 'safe', severity: 'NORMAL' }
  }

  // Fallback: dùng bd1/bd2/bd3 truyền thống
  if (waterLevel >= bd3) return { label: 'VƯỢT BĐ3', level: 'danger', severity: 'CRITICAL' }
  if (waterLevel >= bd2) return { label: 'VƯỢT BĐ2', level: 'warning', severity: 'ALERT' }
  if (waterLevel >= bd1) return { label: 'BĐ1', level: 'warning', severity: 'WARNING' }
  return { label: 'AN TOÀN', level: 'safe', severity: 'NORMAL' }
}

/**
 * Tính trạng thái độ ẩm
 * Backend mặc định: warnHigh=75, alertHigh=85, criticalHigh=95
 * @param {number} moisture
 * @param {object} [thresholds] - ThresholdConfig từ backend
 */
export function getMoistureStatus(moisture, thresholds) {
  const critHigh = thresholds?.criticalHigh ?? 95
  const alertHigh = thresholds?.alertHigh ?? 85
  const warnHigh = thresholds?.warnHigh ?? 75

  if (moisture >= critHigh) return { label: 'NGUY CẤP', level: 'danger', severity: 'CRITICAL' }
  if (moisture >= alertHigh) return { label: 'BÁO ĐỘNG', level: 'danger', severity: 'ALERT' }
  if (moisture >= warnHigh) return { label: 'CẦN CHÚ Ý', level: 'warning', severity: 'WARNING' }
  return { label: 'ỔN ĐỊNH', level: 'safe', severity: 'NORMAL' }
}

/**
 * Tính trạng thái độ rung (amplitude mm/s)
 * Backend mặc định: warnHigh=2.5, alertHigh=15.0, criticalHigh=25.0
 * Đánh giá dựa trên biên độ rung (amp) — khớp với backend
 * @param {number} amp
 * @param {object} [thresholds] - ThresholdConfig từ backend
 */
export function getVibrationStatus(amp, thresholds) {
  const critHigh = thresholds?.criticalHigh ?? 25
  const alertHigh = thresholds?.alertHigh ?? 15
  const warnHigh = thresholds?.warnHigh ?? 2.5

  if (amp >= critHigh) return { label: 'NGUY CẤP', level: 'danger', severity: 'CRITICAL' }
  if (amp >= alertHigh) return { label: 'BÁO ĐỘNG', level: 'danger', severity: 'ALERT' }
  if (amp >= warnHigh) return { label: 'CẦN CHÚ Ý', level: 'warning', severity: 'WARNING' }
  return { label: 'AN TOÀN', level: 'safe', severity: 'NORMAL' }
}

/**
 * Tính delta giữa 2 giá trị cuối trong history
 */
export function calcDelta(arr) {
  if (!arr || arr.length < 2) return { delta: 0, up: null }
  const delta = +(arr[arr.length - 1] - arr[arr.length - 2]).toFixed(2)
  return { delta: Math.abs(delta), up: delta > 0 ? true : delta < 0 ? false : null }
}

/**
 * Tính min, max, avg của một mảng số
 */
export function calcStats(arr) {
  if (!arr?.length) return { min: 0, max: 0, avg: 0 }
  const min = Math.min(...arr)
  const max = Math.max(...arr)
  const avg = +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)
  return { min, max, avg }
}

// ── Alarm Helpers ──────────────────────────────────────────────────

/** Map backend severity → frontend display level */
export const SEVERITY_MAP = {
  CRITICAL: { label: 'NGUY CẤP', level: 'critical', icon: AlertOctagon, priority: 3 },
  ALERT: { label: 'BÁO ĐỘNG', level: 'danger', icon: AlertTriangle, priority: 2 },
  WARNING: { label: 'CẦN CHÚ Ý', level: 'warning', icon: AlertCircle, priority: 1 },
  NORMAL: { label: 'AN TOÀN', level: 'safe', icon: CheckCircle2, priority: 0 },
}

/** Map backend sensorType → Vietnamese label */
export const SENSOR_TYPE_LABELS = {
  vibration: 'Rung động',
  vib: 'Rung động',
  vibration_amp: 'Rung động (Biên độ)',
  vibration_freq: 'Rung động (Tần số)',
  water_level: 'Mực nước',
  wtl: 'Mực nước',
  humidity: 'Độ ẩm rò rỉ',
  moisture: 'Độ ẩm rò rỉ',
  mst: 'Độ ẩm rò rỉ',
}

/** Map backend sensorType → unit */
export const SENSOR_TYPE_UNITS = {
  vibration: 'mm/s',
  vib: 'mm/s',
  vibration_amp: 'mm/s',
  vibration_freq: 'Hz',
  water_level: 'm',
  wtl: 'm',
  humidity: '%',
  moisture: '%',
  mst: '%',
}

/** Format thời gian tương đối (vd: "5P TRƯỚC", "2H TRƯỚC") */
export function timeAgo(dateStr) {
  if (!dateStr) return '--'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins}P`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}H`
  const days = Math.floor(hours / 24)
  return `${days}N`
}
````

## File: tailwind.config.js
````javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        mono:  ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        // Base surfaces — deep navy control-room, layered elevation
        bg:      '#080d16',
        card:    '#0e1622',
        card2:   '#13202f',
        card3:   '#0a1119',
        border:  '#22314a',
        borderHi:'#3b526d',
        // Text
        tx:      '#f1f5f9',
        muted:   '#8b9cb8',
        faint:   '#5b6b85',
        // Brand / interaction — solid professional blue, no gradients
        accent:  '#2563eb',
        accent2: '#22d3ee',
        // Status
        danger:  '#fb4360',
        critical:'#a855f7',
        warning: '#f59e0b',
        safe:    '#22c55e',
        info:    '#38bdf8',
        unknown: '#64748b',
        // Status bg (low opacity — use bg-danger/10 etc.)
      },
      backgroundOpacity: {
        12: '0.12',
        15: '0.15',
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 30px -12px rgba(0,0,0,0.55)',
        glow: '0 0 0 1px rgba(129,140,248,0.25), 0 0 24px -4px rgba(129,140,248,0.45)',
        'glow-safe': '0 0 0 1px rgba(34,197,94,0.25), 0 0 20px -4px rgba(34,197,94,0.45)',
        'glow-danger': '0 0 0 1px rgba(251,67,96,0.3), 0 0 24px -4px rgba(251,67,96,0.55)',
      },
      backgroundImage: {
        'grid-faint': 'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '28px 28px',
      },
    },
  },
  plugins: [],
}
````

## File: app/register/page.jsx
````javascript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { registerUser as apiRegister } from '@/lib/api'
import { useLanguage } from '@/context/LanguageContext'
import { Field, TextInput, Button, FormAlert } from '@/components/form'
import { ShieldCheck, User, Mail, Lock, Phone, AlertCircle, CheckCircle, ArrowLeft, Globe, Eye, EyeOff, Info } from 'lucide-react'

export default function RegisterPage() {
  const { t, locale, toggleLanguage } = useLanguage()
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
````

## File: app/globals.css
````css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html,
  body {
    @apply bg-bg text-tx font-sans text-[14px] leading-relaxed;
    zoom: 1.1;
    scrollbar-width: thin;
    scrollbar-color: #22314a #080d16;
    background-image:
      radial-gradient(ellipse 1200px 600px at 50% -10%, rgba(129, 140, 248, 0.08), transparent),
      linear-gradient(rgba(148,163,184,0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148,163,184,0.045) 1px, transparent 1px);
    background-size: auto, 32px 32px, 32px 32px;
    background-attachment: fixed;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: #080d16;
  }

  ::-webkit-scrollbar-thumb {
    background: #22314a;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #3b526d;
  }

  select option {
    background: #0e1622;
    color: #f1f5f9;
  }

  :focus-visible {
    outline: 2px solid rgba(37, 99, 235, 0.7);
    outline-offset: 2px;
    border-radius: 2px;
  }
}

@layer utilities {

  /* Status badge backgrounds */
  .bg-critical-soft {
    background: rgba(147, 51, 234, 0.2);
  }

  .bg-danger-soft {
    background: rgba(244, 63, 94, 0.12);
  }

  .bg-warning-soft {
    background: rgba(251, 146, 60, 0.12);
  }

  .bg-safe-soft {
    background: rgba(52, 211, 153, 0.12);
  }

  .bg-info-soft {
    background: rgba(56, 189, 248, 0.12);
  }

  .bg-unknown-soft {
    background: rgba(100, 116, 139, 0.15);
  }

  .bg-accent-soft {
    background: rgba(129, 140, 248, 0.15);
  }

  /* Status borders */
  .border-critical-soft {
    border-color: rgba(147, 51, 234, 0.55);
  }

  .border-danger-soft {
    border-color: rgba(244, 63, 94, 0.4);
  }

  .border-warning-soft {
    border-color: rgba(251, 146, 60, 0.4);
  }

  .border-safe-soft {
    border-color: rgba(52, 211, 153, 0.4);
  }

  .border-info-soft {
    border-color: rgba(56, 189, 248, 0.4);
  }

  .border-unknown-soft {
    border-color: rgba(100, 116, 139, 0.45);
  }

  .border-accent-soft {
    border-color: rgba(129, 140, 248, 0.4);
  }

  @keyframes pulse-dot {

    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.35;
    }
  }

  .animate-pulse-dot {
    animation: pulse-dot 2s infinite;
  }

  @keyframes pulse-ring {
    0% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45);
    }
    100% {
      box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
    }
  }

  .animate-pulse-ring {
    animation: pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Glass surface — layered panel used across the HMI */
  .glass-panel {
    background: linear-gradient(180deg, rgba(19, 32, 47, 0.75), rgba(14, 22, 34, 0.75));
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(148, 163, 184, 0.12);
  }

  .glass-nav {
    background: rgba(10, 17, 25, 0.72);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .text-glow-accent {
    text-shadow: 0 0 18px rgba(129, 140, 248, 0.5);
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .animate-toast-in {
    animation: toast-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
}
````

## File: hooks/useAlarmData.js
````javascript
'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { getSocket } from '@/lib/socket'
import { fetchAlarmEvents, fetchThresholdConfigs, resolveAlarmEvent as apiResolve, getFormattedImageUrl } from '@/lib/api'
/**
 * Hook quản lý alarm events & threshold configs từ backend.
 * - Lấy danh sách alarm events ban đầu qua REST
 * - Lắng nghe event `alarm` từ WebSocket để nhận alarm mới real-time
 * - Lấy threshold configs từ backend
 */
export function useAlarmData(damId = 'all', stationId = null) {
    const [alarms, setAlarms] = useState([])
    const [thresholds, setThresholds] = useState(null)   // { vibration, water_level, humidity }
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const mountedRef = useRef(true)
    // ── Map thresholds array sang object theo sensorType ──
    const mapThresholds = (configs) => {
        if (!configs?.length) return null
        const map = {}
        configs.forEach(c => { map[c.sensorType] = c })
        return map
    }
    // ── Fetch initial data ──
    const loadInitial = useCallback(async () => {
        try {
            setLoading(true)
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
            const threshTarget = stationId || (!damId || damId === 'all' ? 'STA-001-01' : { damId })
            const [alarmsRes, threshRes] = await Promise.all([
                fetchAlarmEvents(damId, 50, undefined, undefined, token),
                fetchThresholdConfigs(threshTarget, true),
            ])
            if (!mountedRef.current) return
            setAlarms(alarmsRes?.alarms || [])
            setThresholds(mapThresholds(threshRes?.configs))
            setError(null)
        } catch (err) {
            if (!mountedRef.current) return
            console.error('[useAlarmData] loadInitial error:', err)
        } finally {
            if (mountedRef.current) setLoading(false)
        }
    }, [damId, stationId])
    // ── Resolve alarm ──
    const resolveAlarm = useCallback(async (id) => {
        try {
            const res = await apiResolve(id)
            if (!mountedRef.current) return
            // Cập nhật alarm đã resolve trong state local
            setAlarms(prev => prev.map(a =>
                a.id === id ? { ...a, resolvedAt: res.data?.resolvedAt || new Date().toISOString() } : a
            ))
        } catch (err) {
            console.error('[useAlarmData] resolve failed:', err)
        }
    }, [])
    useEffect(() => {
        mountedRef.current = true
        const socket = getSocket()
        // Lắng nghe alarm event mới từ WebSocket
        const onAlarm = (alarm) => {
            if (!mountedRef.current) return

            // Lọc theo đập: Nếu hook được gọi cho 1 đập cụ thể (không phải 'all'), bỏ qua cảnh báo của đập khác
            if (damId && damId !== 'all' && alarm?.damId && String(alarm.damId) !== String(damId)) {
                return
            }

            // Tải trước ảnh (Preload) vào Browser Cache ngay khi nhận tin từ WebSocket
            if (alarm?.imageUrl) {
                const imgUrl = getFormattedImageUrl(alarm.imageUrl)
                if (imgUrl) {
                    const img = new Image()
                    img.src = imgUrl
                }
            }
            setAlarms(prev => {
                // Nếu alarm đã tồn tại trong danh sách (theo id hoặc eventId), cập nhật thông tin mới
                const isMatch = (a) => a.id === alarm.id || (a.eventId && alarm.eventId && a.eventId === alarm.eventId)
                const exists = prev.some(isMatch)
                if (exists) {
                    return prev.map(a => isMatch(a) ? { ...a, ...alarm } : a)
                }
                // Ngược lại, thêm alarm mới vào đầu danh sách, giới hạn 100
                const next = [alarm, ...prev]
                if (next.length > 100) next.pop()
                return next
            })
        }
        const onAlarmResolved = ({ id, resolvedAt }) => {
            if (!mountedRef.current) return
            setAlarms(prev => prev.map(a => 
                a.id === id ? { ...a, resolvedAt } : a
            ))
        }

        socket.on('alarm', onAlarm)
        socket.on('alarm_resolved', onAlarmResolved)

        // Khởi tải dữ liệu
        loadInitial()
        // Đảm bảo socket đang kết nối
        if (!socket.connected) socket.connect()
        return () => {
            mountedRef.current = false
            socket.off('alarm', onAlarm)
            socket.off('alarm_resolved', onAlarmResolved)
        }
    }, [loadInitial, damId])
    // ── Derived: đếm chính xác số lượng alarm chưa xử lý ──
    const unresolvedCount = useMemo(() => {
        return alarms.filter(a => !a.resolvedAt || a.resolvedAt === null || a.resolvedAt === '').length
    }, [alarms])
    return { alarms, thresholds, loading, error, resolveAlarm, unresolvedCount, refetch: loadInitial }
}
````

## File: lib/i18n/en.js
````javascript
export const en = {
  appName: 'Dam Monitoring System',
  liveBar: {
    station: 'Station Location',
    selectStation: 'Select Monitoring Station',
    changeStation: 'Change Station',
    noNode: 'No Node',
    noData: 'No Data',
    noNodeConnected: 'Station is not connected to any sensor node',
    allStations: 'All Stations',
    waterLevel: 'Water Level',
    moisture: 'Moisture',
    freq: 'Vib Freq',
    amp: 'Amplitude',
    updated: 'Updated',
  },
  camera: {
    title: 'AI Camera — Monitoring',
    live: 'LIVE',
    overflow: 'OVERFLOW (98%)',
    zoomIn: 'Zoom In',
    people: 'People',
    vehicles: 'Vehicles',
    cracks: 'Cracks',
    none: 'None',
    confidence: 'Confidence',
  },
  sensorLabels: {
    vibration: 'Vibration',
    water_level: 'Water Level',
    humidity: 'Leak Moisture',
  },
  nav: {
    home: 'Home',
    dams: 'Dams & Stations List',
    forecast: 'Forecast & Simulation',
    alerts: 'Alerts',
    history: 'History',
    gateways: 'Gateways & Devices',
  },
  damsPage: {
    title: 'HYDROELECTRIC DAMS LIST',
    subtitle: 'Manage hydroelectric dams info and view affiliated stations',
    addDam: 'Add New Dam',
    addStation: 'Add Station To Dam',
    editDam: 'Update Dam Info',
    editStation: 'Update Station Info',
    viewStations: 'View stations ({count}) →',
    hideStations: 'Hide stations',
    stationsOfDam: 'Monitoring stations of {name}',
    noStations: 'No monitoring stations found in this dam.',
    searchPlaceholder: 'Search dam...',
    waterLevel: 'Water Level',
    flow: 'Flow Rate',
    fillCapacity: 'Capacity',
    status: 'Status',
    actions: 'Actions',
    stationDetail: 'STATION DETAILS',
  },
  damDetail: {
    breadcrumbDams: 'Dams List',
    title: 'MONITORING STATIONS — {name}',
    subtitle: 'Manage and monitor stations affiliated with {name} dam',
    addStation: 'Add New Station',
    noStations: 'No monitoring stations attached to this dam.',
    backToDams: '← Back to dams list',
    searchStation: 'Search station...',
  },
  status: {
    safe: 'Safe',
    warning: 'Warning',
    danger: 'Danger',
    critical: 'Critical',
    info: 'Notice',
    normal: 'Normal',
    unresolved: 'UNRESOLVED',
    resolved: 'RESOLVED',
    monitoring: 'MONITORING',
  },
  dashboard: {
    damList: 'Dam List',
    damCount: 'dams',
    waterLevel: 'Water Level',
    flow: 'Flow Rate',
    fillPct: 'Fill Pct',
    stationOverview: 'Station Overview',
    totalActive: 'Total Active',
    hotspotMap: 'HOTSPOT MAP',
    gisDeveloping: 'GIS Map Integration in Progress',
    keyStation: 'Key Station',
    risingFast: 'Rising Fast',
    pressure: 'Pressure',
    latestAlerts: 'Latest Alerts',
    viewAllAlerts: 'View All Alerts →',
    viewAllStations: 'View All {count} Stations →',
    systemStable: 'No active alerts — System Stable',
  },
  stationsPage: {
    title: 'MONITORING STATIONS LIST',
    filterTitle: 'Advanced Filters',
    searchPlaceholder: 'Search station...',
    stationName: 'Station Name',
    opStatus: 'Operational Status',
    region: 'Region',
    allRegions: 'All Regions',
    stationType: 'Station Type',
    moistureType: 'Dyke Sensor',
    cameraType: 'CCTV Camera',
    applyFilter: 'APPLY FILTER',
    realtime: 'Real-time',
    showingCount: 'Showing 1–{shown} of {total} stations',
    stationDetail: 'STATION DETAILS',
    refresh: 'Refresh',
  },
  stationDetail: {
    breadcrumbHome: 'Home',
    breadcrumbStations: 'Stations',
    breadcrumbDetail: 'Detailed Monitoring',
    exportReport: 'Export Report',
    websocketConnected: 'WebSocket Connected — Receiving Real-time Data',
    connecting: 'Connecting to backend...',
    moistureLeak: 'Dyke Moisture',
    vibFreq: 'Vibration (Freq)',
    vibAmp: 'Vibration (Amp)',
    average: 'Average',
    peak24h: '24h Peak',
    maxHigh: 'Maximum',
    threshold: 'Threshold',
    vibAndFlow: 'Vibration Amplitude & Flow',
    realtimeSensorData: 'Real-time Sensor Data',
    fillBar: 'Dam Capacity',
    alarmsAndEvents: 'Alerts & Events',
    viewAll: 'View All',
  },
  admin: {
    title: 'DAM & MONITORING STATION MANAGEMENT',
    subtitle: 'Direct CRUD operations on PostgreSQL / TimescaleDB Database',
    tabDams: 'Hydroelectric Dams',
    tabStations: 'Monitoring Stations',
    addDam: 'Add New Dam',
    addStation: 'Add New Station',
    editDam: 'Update Dam Info',
    editStation: 'Update Station Info',
    deleteConfirmTitle: 'Confirm Data Deletion',
    deleteWarning: 'This action cannot be undone!',
    deleteDamNotice: 'Warning: All monitoring stations belonging to this dam will also be removed from database.',
    confirmDelete: 'Confirm Delete',
    cancel: 'Cancel',
    save: 'Save Changes',
    create: 'Create',
    allDams: 'All Dams',
    table: {
      damId: 'DAM ID',
      damName: 'DAM NAME',
      location: 'LOCATION',
      waterLevel: 'WATER LEVEL (M)',
      flow: 'FLOW (M³/S)',
      fillPct: 'FILL PCT',
      stationCount: 'STATIONS',
      status: 'STATUS',
      actions: 'ACTIONS',
      stationName: 'STATION NAME',
      parentDam: 'BELONGS TO DAM',
      riverAndKm: 'RIVER & KM',
      pressure: 'PRESSURE',
      humidity: 'HUMIDITY',
      alarmLevels: 'ALERT L1 / L2 / L3',
    },
    form: {
      damIdSlug: 'Dam ID (Slug)',
      damNameLabel: 'Dam Name',
      locationLabel: 'Location / Province',
      waterLevelLabel: 'Water Level (m)',
      flowLabel: 'Flow Rate (m³/s)',
      fillPctLabel: 'Capacity (%)',
      statusLabel: 'Operational Status',
      cameraUrlLabel: 'AI Camera Jetson URL (e.g. http://192.168.1.50:8000)',
      belongToDam: 'Belongs to Dam',
      stationNameLabel: 'Station Name',
      riverLabel: 'River',
      kmLabel: 'Km Location',
      changeLabel: 'Delta Change (m)',
      pressureLabel: 'Pressure (atm)',
      bd1Label: 'Alert L1 Threshold (m)',
      bd2Label: 'Alert L2 Threshold (m)',
      bd3Label: 'Alert L3 Threshold (m)',
    }
  },
  history: {
    title: 'INCIDENT HISTORY & DATA ANALYSIS',
    subTitle: 'Last updated: ',
    filterTitle: 'Data Filters',
    timeRange: 'Time Period',
    selectStation: 'Select Station / Dyke',
    eventType: 'Event Type',
    exportExcel: 'Export Excel',
    exportPdf: 'Export PDF',
    totalAlerts: 'Total Period Alerts',
    peakWater: 'Peak Water Level',
    avgResponseTime: 'Avg Response Time',
    chartWaterCompare: 'Water Level vs Historical Flood Peaks',
    chartAlertDist: 'Alert Distribution by Day',
    tableDetails: 'Data Record Details',
    tableHeaders: {
      time: 'TIME',
      code: 'STATION CODE',
      location: 'LOCATION',
      waterLevel: 'WATER LEVEL',
      alertLevel: 'ALERT LEVEL',
      status: 'STATUS',
      actions: 'ACTIONS',
    }
  },
  auth: {
    login: {
      title: 'DAM MONITORING SYSTEM',
      subtitle: 'Sign in to dam safety management & operations system',
      usernameOrEmailLabel: 'Username or Email',
      usernameOrEmailPlaceholder: 'Enter username or email...',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter password...',
      submitBtn: 'Sign In to System',
      submittingBtn: 'Authenticating...',
      defaultAccount: 'Default Account',
      noAccount: "Don't have an officer account?",
      registerNow: 'Register now',
      emptyFieldsError: 'Please enter username/email and password',
      loginFailed: 'Login failed. Please check your credentials.',
    },
    register: {
      title: 'OFFICER REGISTRATION',
      subtitle: 'Operator accounts require Administrator approval before activation',
      fullNameLabel: 'Full Name *',
      fullNamePlaceholder: 'John Doe',
      usernameLabel: 'Username *',
      usernamePlaceholder: 'officer_01',
      emailLabel: 'Work Email *',
      emailPlaceholder: 'officer@agency.gov',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '+84 912345678',
      passwordLabel: 'Password *',
      passwordPlaceholder: 'Minimum 6 characters...',
      assignedDamLabel: 'Assigned Dam Facility',
      selectDamPlaceholder: '-- Select assigned dam --',
      notAssignedYet: '-- Not specifically assigned --',
      submitBtn: 'Submit Registration Request',
      submittingBtn: 'Processing...',
      successTitle: 'Registration Successful!',
      backToLogin: 'Back to Sign In',
      hasAccount: 'Already have an account?',
      loginNow: 'Sign in now',
      requiredFieldsError: 'Please fill in all required fields (*)',
      registerFailed: 'Registration failed. Please check your information.',
    }
  }
}
````

## File: lib/i18n/vi.js
````javascript
export const vi = {
  appName: 'Hệ Thống Giám Sát Hồ Đập',
  liveBar: {
    station: 'Vị trí trạm',
    selectStation: 'Chọn trạm quan trắc',
    changeStation: 'Đổi vị trí trạm',
    noNode: 'Chưa nối Node',
    noData: 'Chưa có dữ liệu',
    noNodeConnected: 'Trạm chưa kết nối Node cảm biến',
    allStations: 'Tất cả trạm',
    waterLevel: 'Mực nước',
    moisture: 'Độ ẩm',
    freq: 'Tần số rung',
    amp: 'Biên độ',
    updated: 'Cập nhật',
  },
  camera: {
    title: 'Camera AI — Giám Sát',
    live: 'TRỰC TIẾP',
    overflow: 'TRÀN NƯỚC (98%)',
    zoomIn: 'Phóng to',
    people: 'Người',
    vehicles: 'Phương tiện',
    cracks: 'Vết nứt',
    none: 'Không',
    confidence: 'Độ tin cậy',
  },
  sensorLabels: {
    vibration: 'Rung động',
    water_level: 'Mực nước',
    humidity: 'Độ ẩm rò rỉ',
  },
  nav: {
    home: 'Trang Chủ',
    dams: 'Danh Sách Đập & Trạm',
    forecast: 'Dự Báo & Mô Phỏng',
    alerts: 'Cảnh Báo',
    history: 'Lịch Sử',
    gateways: 'Gateway & Thiết bị',
  },
  damsPage: {
    title: 'DANH SÁCH ĐẬP THỦY ĐIỆN',
    subtitle: 'Quản lý thông tin đập thủy điện và xem danh sách trạm quan trắc',
    addDam: 'Thêm Đập Mới',
    addStation: 'Thêm Trạm Vào Đập',
    editDam: 'Cập Nhật Thông Tin Đập',
    editStation: 'Cập Nhật Trạm Quan Trắc',
    viewStations: 'Xem danh sách trạm ({count}) →',
    hideStations: 'Ẩn danh sách trạm',
    stationsOfDam: 'Trạm quan trắc thuộc {name}',
    noStations: 'Chưa có trạm quan trắc nào trong đập này.',
    searchPlaceholder: 'Tìm kiếm đập...',
    waterLevel: 'Mực nước',
    flow: 'Lưu lượng',
    fillCapacity: 'Mức chứa',
    status: 'Trạng thái',
    actions: 'Thao tác',
    stationDetail: 'CHI TIẾT TRẠM',
  },
  damDetail: {
    breadcrumbDams: 'Danh sách đập',
    title: 'DANH SÁCH TRẠM QUAN TRẮC — {name}',
    subtitle: 'Quản lý và theo dõi các trạm quan trắc trực thuộc đập {name}',
    addStation: 'Thêm Trạm Quan Trắc Mới',
    noStations: 'Chưa có trạm quan trắc nào được gắn với đập này.',
    backToDams: '← Quay lại danh sách đập',
    searchStation: 'Tìm trạm...',
  },
  status: {
    safe: 'An Toàn',
    warning: 'Cảnh Báo',
    danger: 'Nguy Hiểm',
    critical: 'Nguy Cấp',
    info: 'Chú Ý',
    normal: 'Bình Thường',
    unresolved: 'CHƯA XỬ LÝ',
    resolved: 'ĐÃ XỬ LÝ',
    monitoring: 'ĐANG GIÁM SÁT',
  },
  dashboard: {
    damList: 'Danh sách đập',
    damCount: 'đập',
    waterLevel: 'Mực nước',
    flow: 'Lưu lượng',
    fillPct: 'Mức chứa',
    stationOverview: 'Tổng quan trạm',
    totalActive: 'Tổng hoạt động',
    hotspotMap: 'BẢN ĐỒ ĐIỂM NÓNG',
    gisDeveloping: 'Tích hợp bản đồ GIS đang phát triển',
    keyStation: 'Trạm trọng điểm',
    risingFast: 'Tăng nhanh',
    pressure: 'Áp lực',
    latestAlerts: 'Cảnh báo mới nhất',
    viewAllAlerts: 'Xem tất cả thông báo →',
    viewAllStations: 'Xem tất cả {count} trạm →',
    systemStable: 'Không có cảnh báo — Hệ thống ổn định',
  },
  stationsPage: {
    title: 'DANH SÁCH TRẠM QUAN TRẮC',
    filterTitle: 'Bộ Lọc Nâng Cao',
    searchPlaceholder: 'Nhập tên trạm...',
    stationName: 'Tên trạm',
    opStatus: 'Trạng thái vận hành',
    region: 'Khu vực',
    allRegions: 'Tất cả khu vực',
    stationType: 'Loại trạm',
    moistureType: 'Cảm biến đê',
    cameraType: 'Camera giám sát',
    applyFilter: 'ÁP DỤNG BỘ LỌC',
    realtime: 'Thời gian thực',
    showingCount: 'Hiển thị 1–{shown} trong số {total} trạm',
    stationDetail: 'CHI TIẾT TRẠM',
    refresh: 'Làm mới',
  },
  stationDetail: {
    breadcrumbHome: 'Trang chủ',
    breadcrumbStations: 'Danh sách trạm',
    breadcrumbDetail: 'Giám sát chi tiết',
    exportReport: 'Xuất báo cáo',
    websocketConnected: 'WebSocket đã kết nối — Đang nhận dữ liệu thời gian thực',
    connecting: 'Đang kết nối backend...',
    moistureLeak: 'Độ ẩm thân đê',
    vibFreq: 'Độ rung (Freq)',
    vibAmp: 'Độ rung (Amplitude)',
    average: 'Trung bình',
    peak24h: 'Đỉnh 24h',
    maxHigh: 'Cao nhất',
    threshold: 'Ngưỡng',
    vibAndFlow: 'Biên độ rung & Lưu lượng',
    realtimeSensorData: 'Dữ liệu cảm biến thời gian thực',
    fillBar: 'Mức chứa hồ',
    alarmsAndEvents: 'Cảnh Báo & Sự Kiện',
    viewAll: 'Xem tất cả',
  },
  admin: {
    title: 'QUẢN LÝ ĐẬP THỦY ĐIỆN & TRẠM QUAN TRẮC',
    subtitle: 'Thao tác CRUD trực tiếp trên Database PostgreSQL / TimescaleDB',
    tabDams: 'Danh sách Đập Thủy Điện',
    tabStations: 'Danh sách Trạm Quan Trắc',
    addDam: 'Thêm Đập Mới',
    addStation: 'Thêm Trạm Mới',
    editDam: 'Cập Nhật Thông Tin Đập',
    editStation: 'Cập Nhật Trạm Quan Trắc',
    deleteConfirmTitle: 'Xác nhận xóa dữ liệu',
    deleteWarning: 'Hành động này không thể hoàn tác!',
    deleteDamNotice: 'Lưu ý: Tất cả các trạm quan trắc thuộc đập này cũng sẽ bị xóa khỏi cơ sở dữ liệu.',
    confirmDelete: 'Xác Nhận Xóa',
    cancel: 'Hủy',
    save: 'Lưu Cập Nhật',
    create: 'Tạo Mới',
    allDams: 'Tất cả các đập',
    table: {
      damId: 'MÃ ĐẬP (ID)',
      damName: 'TÊN ĐẬP THỦY ĐIỆN',
      location: 'VỊ TRÍ',
      waterLevel: 'MỰC NƯỚC (M)',
      flow: 'LƯU LƯỢNG (M³/S)',
      fillPct: 'MỨC CHỨA',
      stationCount: 'SỐ TRẠM',
      status: 'TRẠNG THÁI',
      actions: 'THAO TÁC',
      stationName: 'TÊN TRẠM',
      parentDam: 'THUỘC ĐẬP',
      riverAndKm: 'SÔNG & KM',
      pressure: 'ÁP LỰC',
      humidity: 'ĐỘ ẨM',
      alarmLevels: 'BĐ1 / BĐ2 / BĐ3',
    },
    form: {
      damIdSlug: 'Mã Đập (ID Slug)',
      damNameLabel: 'Tên Đập Thủy Điện',
      locationLabel: 'Vị trí / Tỉnh thành',
      waterLevelLabel: 'Mực nước (m)',
      flowLabel: 'Lưu lượng (m³/s)',
      fillPctLabel: 'Mức chứa (%)',
      statusLabel: 'Trạng thái vận hành',
      cameraUrlLabel: 'URL Camera AI Jetson (vd: http://192.168.1.50:8000)',
      belongToDam: 'Thuộc Đập Thủy Điện',
      stationNameLabel: 'Tên Trạm Quan Trắc',
      riverLabel: 'Tuyến Sông',
      kmLabel: 'Vị trí Km',
      changeLabel: 'Biến động change (m)',
      pressureLabel: 'Áp lực (atm)',
      bd1Label: 'Ngưỡng BĐ1 (m)',
      bd2Label: 'Ngưỡng BĐ2 (m)',
      bd3Label: 'Ngưỡng BĐ3 (m)',
    }
  },
  history: {
    title: 'LỊCH SỬ & PHÂN TÍCH DỮ LIỆU SỰ CỐ',
    subTitle: 'Dữ liệu cập nhật lần cuối: ',
    filterTitle: 'Bộ Lọc Dữ Liệu',
    timeRange: 'Khoảng thời gian',
    selectStation: 'Chọn Trạm / Đoạn đê',
    eventType: 'Loại sự kiện',
    exportExcel: 'Xuất Excel',
    exportPdf: 'Xuất PDF',
    totalAlerts: 'Tổng số cảnh báo trong kỳ',
    peakWater: 'Mực nước đỉnh',
    avgResponseTime: 'Thời gian phản ứng TB',
    chartWaterCompare: 'So sánh Mực nước & Đỉnh lũ lịch sử',
    chartAlertDist: 'Phân bố Cảnh báo theo Ngày',
    tableDetails: 'Chi tiết bản ghi dữ liệu',
    tableHeaders: {
      time: 'THỜI GIAN',
      code: 'MÃ TRẠM',
      location: 'VỊ TRÍ',
      waterLevel: 'MỰC NƯỚC',
      alertLevel: 'CẤP BÁO ĐỘNG',
      status: 'TRẠNG THÁI',
      actions: 'THAO TÁC',
    }
  },
  auth: {
    login: {
      title: 'HỆ THỐNG GIÁM SÁT ĐẬP',
      subtitle: 'Đăng nhập hệ thống điều hành & quản lý an toàn đập thủy điện',
      usernameOrEmailLabel: 'Tên đăng nhập hoặc Email',
      usernameOrEmailPlaceholder: 'Nhập username hoặc email...',
      passwordLabel: 'Mật khẩu',
      passwordPlaceholder: 'Nhập mật khẩu...',
      submitBtn: 'Đăng nhập vào Hệ thống',
      submittingBtn: 'Đang xác thực...',
      defaultAccount: 'Tài khoản mặc định',
      noAccount: 'Chưa có tài khoản cán bộ?',
      registerNow: 'Đăng ký ngay',
      emptyFieldsError: 'Vui lòng nhập tên đăng nhập/email và mật khẩu',
      loginFailed: 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.',
    },
    register: {
      title: 'ĐĂNG KÝ TÀI KHOẢN CÁN BỘ',
      subtitle: 'Tài khoản cán bộ vận hành đập cần qua kiểm duyệt của Quản trị viên',
      fullNameLabel: 'Họ và tên *',
      fullNamePlaceholder: 'Nguyễn Văn A',
      usernameLabel: 'Tên đăng nhập *',
      usernamePlaceholder: 'canbo_01',
      emailLabel: 'Email công vụ *',
      emailPlaceholder: 'canbo@thuyloi.gov.vn',
      phoneLabel: 'Số điện thoại liên hệ',
      phonePlaceholder: '0912345678',
      passwordLabel: 'Mật khẩu khởi tạo *',
      passwordPlaceholder: 'Tối thiểu 6 ký tự...',
      assignedDamLabel: 'Đập thủy điện phân công phụ trách',
      selectDamPlaceholder: '-- Chọn đập phụ trách --',
      notAssignedYet: '-- Chưa phân công cụ thể --',
      submitBtn: 'Gửi yêu cầu Đăng ký Tài khoản',
      submittingBtn: 'Đang xử lý...',
      successTitle: 'Đăng ký thành công!',
      backToLogin: 'Quay lại Đăng nhập',
      hasAccount: 'Đã có tài khoản cán bộ?',
      loginNow: 'Đăng nhập ngay',
      requiredFieldsError: 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)',
      registerFailed: 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.',
    }
  }
}
````

## File: app/users/page.jsx
````javascript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { fetchUsers, approveUser as apiApproveUser, updateUser as apiUpdateUser, deleteUser as apiDeleteUser, fetchDams } from '@/lib/api'
import { Mono, Panel, StatTile, Pagination } from '@/components/ui'
import { Field, Select, Modal, FormActions, Button, FormAlert } from '@/components/form'
import { Users, CheckCircle, XCircle, Shield, Building2, Trash2, Edit2, RefreshCw, AlertTriangle, UserCheck, Clock, Ban } from 'lucide-react'

export default function UsersPage() {
  const { token, isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [dams, setDams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionSuccess, setActionSuccess] = useState(null)

  // Edit / Approve modal state
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ role: 'OPERATOR', assignedDamId: '', status: 'ACTIVE' })
  const [savingEdit, setSavingEdit] = useState(false)

  // Phân trang
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setPage(1)
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
      const [usersRes, damsRes] = await Promise.all([fetchUsers(currentToken), fetchDams()])
      setUsers(usersRes.users || [])
      setDams(damsRes.dams || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin, loadData])

  // Giữ page trong giới hạn hợp lệ khi danh sách thay đổi (vd: sau khi xóa tài khoản)
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(users.length / pageSize))
    if (page > totalPages) setPage(totalPages)
  }, [users, page, pageSize])

  const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize)

  const handleApproveQuick = async (user) => {
    try {
      await apiApproveUser(user.id, { role: user.role || 'OPERATOR', assignedDamId: user.assignedDamId || undefined, status: 'ACTIVE' }, token)
      setActionSuccess(`Đã phê duyệt tài khoản "${user.username}" thành công!`)
      await loadData()
    } catch (err) {
      setError(err.message || 'Phê duyệt thất bại')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    try {
      setSavingEdit(true)
      await apiUpdateUser(editingUser.id, editForm, token)
      setActionSuccess(`Đã cập nhật thông tin người dùng "${editingUser.username}"!`)
      setEditingUser(null)
      await loadData()
    } catch (err) {
      setError(err.message || 'Cập nhật thất bại')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (id, username) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}" không?`)) return
    try {
      await apiDeleteUser(id, token)
      setActionSuccess(`Đã xóa tài khoản "${username}"`)
      await loadData()
    } catch (err) {
      setError(err.message || 'Xóa thất bại')
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertTriangle className="w-12 h-12 text-danger mx-auto" />
        <h2 className="text-lg font-bold text-tx">Không có quyền truy cập</h2>
        <p className="text-xs text-muted">Trang Quản lý Người dùng chỉ dành riêng cho Quản trị viên (ADMIN).</p>
      </div>
    )
  }

  const pendingCount = users.filter(u => u.status === 'PENDING_APPROVAL').length
  const activeCount = users.filter(u => u.status === 'ACTIVE').length

  return (
    <div className="p-4 min-h-[calc(100vh-48px)] space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border rounded-xl p-4 shadow-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-tx tracking-wide m-0">Quản lý Người dùng & Phân quyền</h1>
          </div>
          <p className="text-[10px] text-muted m-0">Phê duyệt tài khoản cán bộ, gán vai trò (ADMIN, OPERATOR, VIEWER) và đập phụ trách</p>
        </div>

        <button
          onClick={loadData}
          className="h-9 px-3.5 bg-card2 border border-border rounded-lg text-[11px] font-semibold text-tx hover:bg-white/5 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-accent" />
          <span>Tải lại</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile icon={Users} label="Tổng tài khoản" value={users.length} status="info" />
        <StatTile icon={Clock} label="Chờ phê duyệt" value={pendingCount} status={pendingCount > 0 ? 'warning' : 'safe'} />
        <StatTile icon={CheckCircle} label="Đang hoạt động" value={activeCount} status="safe" />
      </div>

      {/* Action Messages */}
      <FormAlert variant="safe" icon={CheckCircle}>{actionSuccess}</FormAlert>
      <FormAlert variant="danger" icon={XCircle}>{error}</FormAlert>

      {/* Table */}
      <Panel
        title="Danh Sách Người Dùng"
        right={<Mono className="text-[10px] text-muted">{users.length} tài khoản</Mono>}
        bodyClassName="p-0"
        className="overflow-hidden"
      >
        {loading ? (
          <div className="p-8 text-center text-xs text-muted">Đang tải danh sách tài khoản...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">Chưa có tài khoản nào trên hệ thống</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-card2/80 backdrop-blur border-b border-border text-[10px] uppercase text-muted font-bold tracking-wider">
                  <th className="py-3 px-4">Họ và tên / Username</th>
                  <th className="py-3 px-4">Email & SĐT</th>
                  <th className="py-3 px-4">Vai trò (Role)</th>
                  <th className="py-3 px-4">Đập phụ trách</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedUsers.map((u) => {
                  const damObj = dams.find((d) => d.damId === u.assignedDamId)
                  const isPending = u.status === 'PENDING_APPROVAL'

                  return (
                    <tr key={u.id} className="hover:bg-card2/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-tx">{u.fullName}</div>
                        <Mono className="text-[10px] text-muted">@{u.username}</Mono>
                      </td>
                      <td className="py-3 px-4 text-muted font-mono">
                        <div>{u.email}</div>
                        <div className="text-[10px]">{u.phoneNumber || '--'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            u.role === 'ADMIN'
                              ? 'bg-danger/10 text-danger border border-danger/30'
                              : u.role === 'OPERATOR'
                              ? 'bg-accent/10 text-accent border border-accent/30'
                              : 'bg-muted/10 text-muted border border-border'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {damObj ? (
                          <span className="font-bold text-tx flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-accent" />
                            {damObj.name}
                          </span>
                        ) : (
                          <span className="text-muted italic">Tất cả đập (Admin) / Chưa gán</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isPending ? (
                          <span className="px-2 py-0.5 bg-warning/10 border border-warning/30 text-warning rounded text-[10px] font-bold animate-pulse flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>CHỜ PHÊ DUYỆT</span>
                          </span>
                        ) : u.status === 'ACTIVE' ? (
                          <span className="px-2 py-0.5 bg-safe/10 border border-safe/30 text-safe rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            <span>HOẠT ĐỘNG</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-danger/10 border border-danger/30 text-danger rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                            <Ban className="w-3 h-3 shrink-0" />
                            <span>BỊ KHÓA</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleApproveQuick(u)}
                              className="px-2.5 py-1 bg-safe hover:bg-safe/90 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow"
                              title="Duyệt nhanh tài khoản này"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Duyệt</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setEditingUser(u)
                              setEditForm({
                                role: u.role || 'OPERATOR',
                                assignedDamId: u.assignedDamId || '',
                                status: u.status || 'ACTIVE',
                              })
                            }}
                            className="p-1.5 bg-accent/10 border border-accent/20 rounded-lg text-accent hover:bg-accent/20 hover:border-accent/40 transition-colors cursor-pointer"
                            title="Chỉnh sửa phân quyền"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(u.id, u.username)}
                            className="p-1.5 bg-danger/10 border border-danger/20 rounded-lg text-danger hover:bg-danger/20 hover:border-danger/40 transition-colors cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={users.length}
          onPageChange={setPage}
          itemLabel="tài khoản"
          pageSizeOptions={[10, 20, 50, 100]}
          onPageSizeChange={handlePageSizeChange}
        />
      </Panel>

      {/* Edit User Modal */}
      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Chỉnh sửa phân quyền: ${editingUser?.fullName || ''}`}
        icon={Shield}
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setEditingUser(null)}>Hủy</Button>
            <Button variant="primary" loading={savingEdit} onClick={handleSaveEdit}>Lưu Thay Đổi</Button>
          </FormActions>
        }
      >
        <Field label="Vai trò (Role)" htmlFor="edit-role">
          <Select
            id="edit-role"
            value={editForm.role}
            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
          >
            <option value="ADMIN">ADMIN (Quản trị viên toàn hệ thống)</option>
            <option value="OPERATOR">OPERATOR (Cán bộ trực đập)</option>
            <option value="VIEWER">VIEWER (Khách xem read-only)</option>
          </Select>
        </Field>

        <Field label="Đập phụ trách (Assigned Dam)" htmlFor="edit-dam">
          <Select
            id="edit-dam"
            value={editForm.assignedDamId}
            onChange={(e) => setEditForm({ ...editForm, assignedDamId: e.target.value })}
          >
            <option value="">-- Tất cả các đập (Dành cho Admin/Viewer) --</option>
            {dams.map((d) => (
              <option key={d.damId} value={d.damId}>
                {d.name} ({d.location})
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Trạng thái tài khoản" htmlFor="edit-status">
          <Select
            id="edit-status"
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
          >
            <option value="ACTIVE">ACTIVE (Hoạt động)</option>
            <option value="PENDING_APPROVAL">PENDING_APPROVAL (Chờ duyệt)</option>
            <option value="SUSPENDED">SUSPENDED (Bị khóa)</option>
          </Select>
        </Field>
      </Modal>
    </div>
  )
}
````

## File: components/DamMapInner.jsx
````javascript
'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'

// Fix default Leaflet icon paths in Next.js
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Create custom HTML markers for Dam and Station
const createDamIcon = (status) => {
  const colorMap = {
    safe: '#10b981',     // Emerald green
    warning: '#f59e0b',  // Amber/orange
    danger: '#ef4444',   // Red
    critical: '#a855f7', // Purple — khớp với --critical trong tailwind.config.js
    unknown: '#64748b',  // Xám — không có tín hiệu nào còn tươi (mất kết nối), khớp --unknown
  }
  const color = colorMap[status] || '#38bdf8' // Info blue cho trạng thái không xác định (không mặc định về "an toàn")

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
      <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: pulse 2s infinite ease-in-out;"></div>
      <div style="width: 26px; height: 26px; border-radius: 50%; background: #0f172a; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; shadow: 0 4px 12px rgba(0,0,0,0.5);">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
    </div>
  `

  return L.divIcon({
    html,
    className: 'custom-dam-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })
}

const createStationIcon = (status) => {
  const colorMap = {
    safe: '#3b82f6',     // Blue
    warning: '#f59e0b',  // Amber
    danger: '#ef4444',   // Red
    critical: '#a855f7', // Purple — khớp với --critical trong tailwind.config.js
    unknown: '#64748b',  // Xám — không có tín hiệu nào còn tươi (mất kết nối), khớp --unknown
  }
  const color = colorMap[status] || '#38bdf8' // Info blue cho trạng thái không xác định (không mặc định về "an toàn")

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px;">
      <div style="width: 20px; height: 20px; border-radius: 50%; background: #0f172a; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; shadow: 0 2px 8px rgba(0,0,0,0.4);">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="2"/>
          <path d="M16.2 7.8a6 6 0 0 1 0 8.4"/>
          <path d="M7.8 16.2a6 6 0 0 1 0-8.4"/>
        </svg>
      </div>
    </div>
  `

  return L.divIcon({
    html,
    className: 'custom-station-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  })
}

// Auto Recenter component — only repositions when exact lat/lng values change
function MapController({ center, zoom }) {
  const map = useMap()
  const prevKeyRef = useRef('')

  useEffect(() => {
    if (!center || !center[0] || !center[1]) return
    const key = `${center[0]}_${center[1]}_${zoom}`
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key
      map.setView(center, zoom || map.getZoom())
    }
  }, [center, zoom, map])

  return null
}

function damMapPropsAreEqual(prevProps, nextProps) {
  if (prevProps.selectedDamId !== nextProps.selectedDamId) return false
  if (prevProps.height !== nextProps.height) return false

  // Compare dams array
  const pDams = prevProps.dams || []
  const nDams = nextProps.dams || []
  if (pDams.length !== nDams.length) return false
  for (let i = 0; i < pDams.length; i++) {
    if (
      pDams[i].damId !== nDams[i].damId ||
      pDams[i].name !== nDams[i].name ||
      pDams[i].latitude !== nDams[i].latitude ||
      pDams[i].longitude !== nDams[i].longitude ||
      pDams[i].status !== nDams[i].status ||
      pDams[i].statusReason !== nDams[i].statusReason ||
      pDams[i].waterLevel !== nDams[i].waterLevel ||
      pDams[i].fillPct !== nDams[i].fillPct
    ) {
      return false
    }
  }

  // Compare stations array
  const pStations = prevProps.stations || []
  const nStations = nextProps.stations || []
  if (pStations.length !== nStations.length) return false
  for (let i = 0; i < pStations.length; i++) {
    if (
      pStations[i].stationId !== nStations[i].stationId ||
      pStations[i].name !== nStations[i].name ||
      pStations[i].latitude !== nStations[i].latitude ||
      pStations[i].longitude !== nStations[i].longitude ||
      pStations[i].status !== nStations[i].status ||
      pStations[i].statusReason !== nStations[i].statusReason ||
      pStations[i].damId !== nStations[i].damId ||
      pStations[i].waterLevel !== nStations[i].waterLevel ||
      pStations[i].humidity !== nStations[i].humidity
    ) {
      return false
    }
  }

  return true
}

const DamMapInner = memo(function DamMapInner({ dams = [], stations = [], selectedDamId = null, height = '450px' }) {
  const router = useRouter()
  const [activeLayer, setActiveLayer] = useState('terrain') // 'terrain' | 'satellite'

  // Filter dams & stations based on selectedDamId
  const displayDams = selectedDamId
    ? dams.filter(d => d.damId === selectedDamId)
    : dams

  const displayStations = selectedDamId
    ? stations.filter(st => st.damId === selectedDamId)
    : stations

  // Calculate focused map center & zoom level
  const targetDam = displayDams.length === 1
    ? displayDams[0]
    : (selectedDamId ? dams.find(d => d.damId === selectedDamId) : null)

  let mapCenter = [21.0381, 105.3265]
  let mapZoom = (selectedDamId || displayDams.length === 1) ? 12 : 8

  if (targetDam && targetDam.latitude != null && targetDam.longitude != null) {
    mapCenter = [targetDam.latitude, targetDam.longitude]
  } else if (displayStations.length === 1 && displayStations[0].latitude != null && displayStations[0].longitude != null) {
    mapCenter = [displayStations[0].latitude, displayStations[0].longitude]
    mapZoom = 13
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-2xl bg-card isolate" style={{ height }}>
      {/* ── MAP LAYER SWITCHER TOGGLE (Subtle & Non-intrusive) ── */}
      <div className="absolute top-2.5 right-2.5 z-[400] bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-lg p-0.5 flex items-center gap-0.5 shadow-md text-[10px] font-medium">
        <button
          onClick={() => setActiveLayer('terrain')}
          className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer border-none ${activeLayer === 'terrain'
            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
            : 'text-slate-400 hover:text-white bg-transparent'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <span>Địa hình</span>
        </button>
        <button
          onClick={() => setActiveLayer('satellite')}
          className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer border-none ${activeLayer === 'satellite'
            ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40 shadow-sm'
            : 'text-slate-400 hover:text-white bg-transparent'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
          <span>Vệ tinh</span>
        </button>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        {/* ── MAP TILES ── */}
        {activeLayer === 'terrain' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {/* ── DAM MARKERS ── */}
        {displayDams.map(dam => {
          const lat = dam.latitude ?? 20.8167
          const lng = dam.longitude ?? 105.3265
          const damStations = stations.filter(st => st.damId === dam.damId)

          return (
            <Marker
              key={`dam-${dam.damId}`}
              position={[lat, lng]}
              icon={createDamIcon(dam.status)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 min-w-[240px] max-w-[290px]">
                  {/* Header Badges */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2">
                    <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                      {dam.damId}
                    </span>
                    <span className={`text-[10px] font- px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${dam.status === 'safe'
                        ? 'bg-emerald-500 text-white'
                        : dam.status === 'warning'
                          ? 'bg-amber-400 text-slate-950'
                          : dam.status === 'critical'
                            ? 'bg-purple-500 text-white'
                            : dam.status === 'unknown'
                              ? 'bg-slate-500 text-white'
                              : 'bg-rose-500 text-white'
                      }`}>
                      {dam.status === 'safe' ? 'An toàn' : dam.status === 'warning' ? 'Cảnh báo' : dam.status === 'critical' ? 'Nguy cấp' : dam.status === 'unknown' ? 'Không xác định' : 'Nguy hiểm'}
                    </span>
                  </div>

                  {/* Dam Name & Coordinates */}
                  <h4 className="font-extrabold text-white text-base mb-1 tracking-tight">{dam.name}</h4>
                  <div className="text-[11px] text-slate-300 mb-2.5 font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E ({dam.location || 'N/A'})</span>
                  </div>

                  {/* Dam Metrics Box */}
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-700/80 text-center mb-2 shadow-inner">
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Mực nước</div>
                      <div className="font-extrabold text-emerald-400 font-mono text-xs">{dam.waterLevel}m</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Dung tích</div>
                      <div className="font-extrabold text-amber-400 font-mono text-xs">{dam.fillPct}%</div>
                    </div>
                  </div>

                  {/* Dam Status Reason */}
                  {dam.statusReason && (
                    <div className="text-[9px] text-slate-300 bg-slate-800/90 p-1.5 rounded-md border border-slate-700/70 mb-3 font-mono leading-tight">
                      <span className="text-amber-400 font-bold">ⓘ Lý do: </span>
                      <span>{dam.statusReason}</span>
                    </div>
                  )}

                  {/* List of Stations under this Dam */}
                  {damStations.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Trạm trực thuộc:</span>
                        <span className="text-emerald-400 font-mono">({damStations.length})</span>
                      </div>
                      <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1">
                        {damStations.map(st => (
                          <div
                            key={st.stationId}
                            onClick={() => router.push(`/stations/${st.stationId}`)}
                            className="flex items-center justify-between p-2 bg-slate-800/90 hover:bg-slate-700 rounded-lg border border-slate-700/70 cursor-pointer transition-all group"
                          >
                            <span className="text-[11px] text-slate-100 font-bold truncate max-w-[150px] group-hover:text-sky-300">
                              {st.name}
                            </span>
                            <span className="text-[10px] text-sky-400 font-extrabold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              <span>Xem</span> &rarr;
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dam Action Button */}
                  <button
                    onClick={() => router.push(`/dams/${dam.damId}`)}
                    className="w-full py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[12px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-lg active:scale-[0.98]"
                  >
                    <span>Xem chi tiết Đập</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* ── STATION MARKERS ── */}
        {displayStations.map(st => {
          const lat = st.latitude ?? 21.0381
          const lng = st.longitude ?? 105.8492

          return (
            <Marker
              key={`station-${st.stationId}`}
              position={[lat, lng]}
              icon={createStationIcon(st.status)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 min-w-[220px] max-w-[260px]">
                  {/* Header Badges */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2">
                    <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded border border-sky-500/30">
                      {st.stationId}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${st.status === 'safe'
                        ? 'bg-emerald-500 text-slate-950'
                        : st.status === 'warning'
                          ? 'bg-amber-400 text-slate-950'
                          : st.status === 'critical'
                            ? 'bg-purple-500 text-white'
                            : st.status === 'unknown'
                              ? 'bg-slate-500 text-white'
                              : 'bg-rose-500 text-white'
                      }`}>
                      {st.status === 'safe' ? 'An toàn' : st.status === 'warning' ? 'Cảnh báo' : st.status === 'critical' ? 'Nguy cấp' : st.status === 'unknown' ? 'Không xác định' : 'Nguy hiểm'}
                    </span>
                  </div>

                  {/* Station Name & Coordinates */}
                  <h4 className="font-extrabold text-white text-base mb-1 tracking-tight">{st.name}</h4>
                  <div className="text-[11px] text-slate-300 mb-2.5 font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E ({st.river || 'Sông Hồng'})</span>
                  </div>

                  {/* Station Metrics Box */}
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-700/80 text-center mb-2 shadow-inner">
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Mực nước</div>
                      <div className="font-extrabold text-sky-400 font-mono text-xs">{st.waterLevel} m</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Độ ẩm đất</div>
                      <div className="font-extrabold text-emerald-400 font-mono text-xs">{st.humidity}%</div>
                    </div>
                  </div>

                  {/* Station Status Reason */}
                  {st.statusReason && (
                    <div className="text-[9px] text-slate-300 bg-slate-800/90 p-1.5 rounded-md border border-slate-700/70 mb-3 font-mono leading-tight">
                      <span className="text-sky-400 font-bold">ⓘ Lý do: </span>
                      <span>{st.statusReason}</span>
                    </div>
                  )}

                  {/* Station Action Button */}
                  <button
                    onClick={() => router.push(`/stations/${st.stationId}`)}
                    className="w-full py-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-[12px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-lg active:scale-[0.98]"
                  >
                    <span>Xem chi tiết Trạm</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Global Style Inject for High-Contrast Leaflet Popups */}
      <style jsx global>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: #0f172a !important;
          color: #f8fafc !important;
          border: 1px solid #334155 !important;
          border-radius: 14px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75) !important;
          padding: 0 !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: #0f172a !important;
          border: 1px solid #334155 !important;
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 12px 14px !important;
          line-height: 1.4 !important;
        }
        .custom-leaflet-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
          padding: 6px !important;
          font-size: 16px !important;
        }
        .custom-leaflet-popup .leaflet-popup-close-button:hover {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  )
}, damMapPropsAreEqual)

export default DamMapInner
````

## File: components/ui.jsx
````javascript
import { getStatus } from '@/lib/statusConfig'

export function Mono({ children, className = '', ...rest }) {
  return <span className={`font-mono ${className}`} {...rest}>{children}</span>
}

export function Badge({ status, sm, title, label, className = '' }) {
  const s = getStatus(status)
  const displayLabel = label || s.label
  return (
    <span
      title={title || displayLabel}
      className={`
        inline-flex items-center gap-1.5 font-mono font-bold tracking-wider border
        ${sm ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'}
        rounded-full ${s.text} ${s.bg} ${s.border} ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
      {displayLabel}
    </span>
  )
}

export function Divider({ className = '', vertical = false }) {
  if (vertical) return <div className={`w-px bg-border my-auto h-8 ${className}`} />
  return <div className={`h-px bg-border/70 my-3 ${className}`} />
}

export function Label({ children, className = '' }) {
  return (
    <div className={`text-[11px] text-muted font-bold tracking-[0.14em] uppercase mb-2 ${className}`}>
      {children}
    </div>
  )
}

export function Card({ children, className = '', glass = false }) {
  return (
    <div className={`${glass ? 'glass-panel' : 'bg-card border border-border'} rounded-xl shadow-panel ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, className = '' }) {
  return (
    <h2 className={`text-xl font-bold text-tx tracking-wide ${className}`}>
      {children}
    </h2>
  )
}

/** Small pulsing indicator dot used for live/connected states */
export function LiveDot({ active = true, size = 'sm', pulse = true }) {
  const dim = size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2'
  return (
    <span className="relative inline-flex shrink-0">
      <span className={`${dim} rounded-full ${active ? 'bg-safe' : 'bg-faint'}`} />
      {active && pulse && (
        <span className={`absolute inset-0 rounded-full bg-safe animate-pulse-ring`} />
      )}
    </span>
  )
}

/**
 * Standard HMI panel: header (title + optional right-side slot) over a bordered body.
 * Use for any boxed section on the dashboard/pages to keep chrome consistent.
 */
export function Panel({ title, right, children, className = '', bodyClassName, glass = false }) {
  return (
    <Card glass={glass} className={`overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/70">
          <span className="text-[11px] text-muted font-bold tracking-[0.14em] uppercase">{title}</span>
          {right}
        </div>
      )}
      <div className={bodyClassName ?? 'p-3.5'}>{children}</div>
    </Card>
  )
}

/** KPI tile for top-of-dashboard summary rows. Pass `compact` for a dense single-row chip variant. */
export function StatTile({ icon: Icon, label, value, unit, trend, status = 'info', compact = false, className = '' }) {
  const s = getStatus(status)

  if (compact) {
    return (
      <Card className={`px-3 py-2 flex items-center gap-2.5 ${className}`}>
        {Icon && (
          <div className={`shrink-0 w-7 h-7 rounded-md ${s.bg} border ${s.border} flex items-center justify-center`}>
            <Icon className={`w-3.5 h-3.5 ${s.text}`} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[9px] text-muted font-bold tracking-[0.1em] uppercase truncate leading-tight">{label}</div>
          <div className="flex items-baseline gap-1">
            <Mono className={`text-base font-bold ${s.text} leading-tight`}>{value}</Mono>
            {unit && <span className="text-[9px] text-muted">{unit}</span>}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-3.5 relative overflow-hidden ${className}`}>
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${s.bg} blur-2xl opacity-60`} aria-hidden="true" />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[10px] text-muted font-bold tracking-[0.12em] uppercase mb-1.5 truncate">{label}</div>
          <div className="flex items-baseline gap-1">
            <Mono className={`text-2xl font-bold ${s.text} leading-none`}>{value}</Mono>
            {unit && <span className="text-[10px] text-muted">{unit}</span>}
          </div>
          {trend != null && (
            <div className={`mt-1.5 text-[10px] font-mono ${trend > 0 ? 'text-danger' : trend < 0 ? 'text-safe' : 'text-muted'}`}>
              {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {Math.abs(trend)}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`shrink-0 w-9 h-9 rounded-lg ${s.bg} border ${s.border} flex items-center justify-center`}>
            <Icon className={`w-4.5 h-4.5 ${s.text}`} />
          </div>
        )}
      </div>
    </Card>
  )
}

/** Compact SVG radial gauge — value 0-100, colored by status */
export function RadialGauge({ value = 0, size = 96, stroke = 8, status = 'info', label, sublabel }) {
  const s = getStatus(status)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const offset = c - (pct / 100) * c
  const colorVar = {
    danger: '#fb4360', critical: '#a855f7', warning: '#f59e0b', safe: '#22c55e', info: '#38bdf8',
  }[status] || '#38bdf8'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={colorVar} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Mono className={`font-bold ${s.text}`} style={{ fontSize: size * 0.2 }}>
          {label ?? `${Math.round(pct)}%`}
        </Mono>
        {sublabel && <span className="text-[8px] text-muted uppercase tracking-wide mt-0.5">{sublabel}</span>}
      </div>
    </div>
  )
}

/**
 * Standard pagination footer: "Hiển thị X–Y trong tổng số Z" + Trước/Sau controls,
 * plus an optional page-size selector. Controlled — pass current `page` (1-indexed)
 * and `onPageChange`. Pass `pageSizeOptions` + `onPageSizeChange` to let the user
 * adjust how many rows show per page; omit them to keep the old fixed-size behavior.
 * Renders nothing when there's no data, or when everything already fits on one page
 * and there's no size selector to interact with.
 */
export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel = 'bản ghi',
  className = '',
  pageSizeOptions,
  onPageSizeChange,
}) {
  const hasSizeSelector = Boolean(pageSizeOptions?.length && onPageSizeChange)
  if (totalItems <= 0) return null
  if (totalItems <= pageSize && !hasSizeSelector) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-center gap-2.5 px-3.5 py-2.5 border-t border-border/70 bg-card2/30 ${className}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <Mono className="text-[9px] text-muted">
          Hiển thị {start}–{end} trong tổng số {totalItems} {itemLabel}
        </Mono>

        {hasSizeSelector && (
          <label className="flex items-center gap-1.5 text-[9px] text-muted cursor-pointer">
            <span>Số dòng/trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-card2 border border-border rounded-md text-[10px] text-tx px-1.5 py-0.5 focus-visible:outline-none focus:border-accent cursor-pointer"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          className="px-2 py-0.5 rounded-lg text-[10px] border border-border bg-transparent text-muted hover:text-tx hover:bg-card2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Trước
        </button>
        <Mono className="text-[10px] text-tx px-2">
          Trang {page} / {totalPages}
        </Mono>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          className="px-2 py-0.5 rounded-lg text-[10px] border border-border bg-transparent text-muted hover:text-tx hover:bg-card2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Sau
        </button>
      </div>
    </div>
  )
}

/** Inline mini trend line for a series of numbers */
export function Sparkline({ data = [], width = 72, height = 24, status = 'info', strokeWidth = 1.5 }) {
  const colorVar = {
    danger: '#fb4360', critical: '#a855f7', warning: '#f59e0b', safe: '#22c55e', info: '#38bdf8',
  }[status] || '#38bdf8'

  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="flex items-center text-[9px] text-faint">—</div>
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ')
  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={areaPoints} fill={colorVar} fillOpacity={0.08} stroke="none" />
      <polyline points={points} fill="none" stroke={colorVar} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
````

## File: components/LiveStatusBar.jsx
````javascript
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSensorData } from '@/hooks/useSensorData'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
import { Mono, LiveDot, Divider } from '@/components/ui'
import { 
  Droplet, 
  CloudRain, 
  Activity, 
  TrendingUp, 
  MapPin, 
  ChevronDown, 
  Check, 
  Cpu, 
  ExternalLink,
  Layers,
  AlertCircle
} from 'lucide-react'

function Reading({ icon: Icon, iconClass, label, value, dim = false }) {
  return (
    <div className={`flex items-center gap-1.5 shrink-0 ${dim ? 'text-muted/60' : 'text-muted'}`}>
      <Icon className={`w-3.5 h-3.5 shrink-0 ${dim ? 'opacity-40' : iconClass}`} />
      <span className="text-[11px] font-semibold hidden sm:inline">{label}</span>
      <Mono className={`font-bold text-[12px] ${dim ? 'text-muted/50' : 'text-tx'}`}>{value}</Mono>
    </div>
  )
}

export default function LiveStatusBar() {
  const pathname = usePathname()
  const { t, locale } = useLanguage()
  const { stations, dams, loading: damsLoading } = useDamData()
  
  const [selectedStationId, setSelectedStationId] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // 1. Tự động đồng bộ với URL nếu đang ở trang chi tiết trạm /stations/[id]
  useEffect(() => {
    const match = pathname.match(/^\/stations\/(\d+)$/)
    if (match && match[1]) {
      const routeStationId = Number(match[1])
      setSelectedStationId(routeStationId)
      if (typeof window !== 'undefined') {
        localStorage.setItem('livebar_station_id', String(routeStationId))
      }
    }
  }, [pathname])

  // 2. Khởi tạo trạm được chọn từ localStorage hoặc mặc định trạm đầu tiên khi nạp danh sách
  useEffect(() => {
    if (stations.length > 0 && selectedStationId == null) {
      // URL trạm nay mang mã theo chuẩn đặt tên (/stations/STA-001-01), không còn id số.
      const match = pathname.match(/^\/stations\/([^/]+)$/)
      if (match && match[1]) {
        setSelectedStationId(decodeURIComponent(match[1]))
      } else {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('livebar_station_id') : null
        if (saved && stations.some(s => s.stationId === saved)) {
          setSelectedStationId(saved)
        } else {
          setSelectedStationId(stations[0].stationId)
        }
      }
    }
  }, [stations, pathname, selectedStationId])

  // 3. Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  // Trạm hiện tại đang được chọn
  const currentStation = useMemo(() => {
    if (!stations || stations.length === 0) return null
    return stations.find(s => s.stationId === selectedStationId) || stations[0]
  }, [stations, selectedStationId])

  // Tính số lượng Node cảm biến gắn vào trạm
  const nodeCount = useMemo(() => {
    if (!currentStation?.gateways) return 0
    return currentStation.gateways.reduce((acc, g) => acc + (g.nodes?.length || 0), 0)
  }, [currentStation])

  const hasNodes = nodeCount > 0

  // 4. Lấy dữ liệu cảm biến thời gian thực đúng cho trạm đã chọn
  const { latest, connected, error } = useSensorData(currentStation?.stationId)

  const handleSelectStation = (stId) => {
    setSelectedStationId(stId)
    setDropdownOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('livebar_station_id', String(stId))
    }
  }

  // Ẩn LiveStatusBar ở trang Login và Register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  // Phân nhóm trạm theo Đập để hiển thị trong menu chọn
  const stationsByDam = dams.map(dam => ({
    dam,
    stationList: stations.filter(st => st.damId === dam.damId)
  })).filter(g => g.stationList.length > 0)

  // Trường hợp có trạm không thuộc đập nào trong dams
  const orphanedStations = stations.filter(st => !dams.some(d => d.damId === st.damId))
  if (orphanedStations.length > 0) {
    stationsByDam.push({
      dam: { damId: 'other', name: 'Trạm độc lập / Khác' },
      stationList: orphanedStations
    })
  }

  const hasLiveData = connected && latest != null && hasNodes

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border/70 bg-card/60 backdrop-blur-md text-[12px] overflow-x-auto select-none font-sans relative z-40">
      
      {/* ── BỘ CHỌN VỊ TRÍ TRẠM (STATION SELECTOR & LOCATION) ── */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(prev => !prev)}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
            dropdownOpen
              ? 'bg-accent/15 border-accent text-accent shadow-glow-sm'
              : 'bg-card2/80 hover:bg-card2 border-border/80 text-tx hover:border-accent/40'
          }`}
          title={t('liveBar.changeStation')}
        >
          <div className="flex items-center gap-1.5 text-accent font-bold">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-accent animate-pulse" />
            <span className="text-[11px] uppercase tracking-wide hidden md:inline">
              {t('liveBar.station')}:
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 max-w-[200px] sm:max-w-[260px] truncate text-left">
            <span className="font-bold text-[12px] text-tx truncate">
              {currentStation ? currentStation.name : (damsLoading ? 'Đang tải...' : 'Chưa có trạm')}
            </span>
            {currentStation?.location && (
              <span className="text-[10px] text-muted truncate hidden sm:inline">
                ({currentStation.location})
              </span>
            )}
            {!currentStation?.location && currentStation?.river && (
              <span className="text-[10px] text-muted truncate hidden sm:inline">
                ({currentStation.river} {currentStation.km ? `- ${currentStation.km}` : ''})
              </span>
            )}
          </div>

          <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-accent' : ''}`} />
        </button>

        {/* Dropdown Menu chọn trạm */}
        {dropdownOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-80 max-h-96 overflow-y-auto rounded-xl glass-panel shadow-2xl border border-border/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted flex items-center justify-between border-b border-border/50 mb-1">
              <span>{t('liveBar.selectStation')}</span>
              <span className="font-mono text-accent">{stations.length} trạm</span>
            </div>

            {stationsByDam.length === 0 ? (
              <div className="p-3 text-center text-muted text-[11px]">
                Không có dữ liệu trạm quan trắc
              </div>
            ) : (
              stationsByDam.map(({ dam, stationList }) => (
                <div key={dam.damId} className="mb-2 last:mb-0">
                  <div className="px-2 py-1 text-[10px] font-bold text-accent2 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    <span className="truncate">{dam.name}</span>
                  </div>

                  <div className="space-y-1 mt-0.5">
                    {stationList.map(st => {
                      const isSelected = currentStation?.stationId === st.stationId
                      const stNodeCount = st.gateways?.reduce((acc, g) => acc + (g.nodes?.length || 0), 0) ?? 0
                      const stHasNodes = stNodeCount > 0

                      return (
                        <div
                          key={st.stationId}
                          onClick={() => handleSelectStation(st.stationId)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-accent/15 text-accent font-bold border border-accent/30'
                              : 'text-tx hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{st.name}</span>
                              {isSelected && <Check className="w-3 h-3 text-accent shrink-0" />}
                            </div>
                            <span className="text-[9.5px] text-muted truncate">
                              {st.location || (st.river ? `${st.river} ${st.km ? `- ${st.km}` : ''}` : `Mã: ${st.stationId}`)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {stHasNodes ? (
                              <span className="px-1.5 py-0.5 text-[8.5px] font-mono font-semibold rounded bg-safe/10 text-safe border border-safe/25 flex items-center gap-1">
                                <Cpu className="w-2.5 h-2.5" />
                                {stNodeCount} Node
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[8.5px] font-mono rounded bg-warning/10 text-warning border border-warning/25">
                                {t('liveBar.noNode')}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Quick link đến trang chi tiết trạm */}
            {currentStation && (
              <div className="pt-2 mt-1 border-t border-border/50">
                <Link
                  href={`/stations/${currentStation.stationId}`}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg bg-card2/80 hover:bg-card2 text-[11px] font-bold text-accent no-underline transition-colors border border-border/60"
                >
                  <span>Xem chi tiết trạm này</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <Divider vertical className="h-4 shrink-0" />

      {/* ── CONNECTION STATUS BADGE ── */}
      <div className="flex items-center gap-2 shrink-0">
        {!hasNodes ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-warning/10 border border-warning/30 text-warning text-[10.5px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
            <span>{t('liveBar.noNode')}</span>
          </div>
        ) : !connected ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10.5px] font-mono font-bold">
            <LiveDot active={false} />
            <span>OFFLINE</span>
          </div>
        ) : latest == null ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10.5px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
            <span>NO DATA</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-safe/10 border border-safe/30 text-safe text-[10.5px] font-mono font-bold">
            <LiveDot active={true} />
            <span>LIVE</span>
          </div>
        )}
      </div>

      <Divider vertical className="h-4 shrink-0" />

      {/* ── READINGS SECTION ── */}
      {hasLiveData ? (
        <>
          <Reading icon={Droplet} iconClass="text-sky-400" label={t('liveBar.waterLevel')} value={`${(latest.waterLevel ?? 0).toFixed(2)} m`} />
          <Reading icon={CloudRain} iconClass="text-blue-400" label={t('liveBar.moisture')} value={`${(latest.moisture ?? 0).toFixed(1)}%`} />
          <Reading icon={Activity} iconClass="text-indigo-400" label={t('liveBar.freq')} value={`${(latest.freq ?? 0).toFixed(2)} Hz`} />
          <Reading icon={TrendingUp} iconClass="text-orange-400" label={t('liveBar.amp')} value={`${(latest.amp ?? 0).toFixed(2)} mm`} />

          <div className="ml-auto text-faint text-[10px] shrink-0 whitespace-nowrap pl-2">
            {t('liveBar.updated')}:{' '}
            <Mono className="text-muted font-bold">
              {latest.timestamp
                ? new Date(latest.timestamp).toLocaleTimeString(
                    locale === 'vi' ? 'vi-VN' : 'en-US',
                  )
                : '--:--:--'}
            </Mono>
          </div>
        </>
      ) : (
        /* Khi trạm không có Node hoặc chưa có Data: Hiển thị rõ trạng thái không có dữ liệu */
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-3">
            <Reading icon={Droplet} dim label={t('liveBar.waterLevel')} value="-- m" />
            <Reading icon={CloudRain} dim label={t('liveBar.moisture')} value="-- %" />
            <Reading icon={Activity} dim label={t('liveBar.freq')} value="-- Hz" />
            <Reading icon={TrendingUp} dim label={t('liveBar.amp')} value="-- mm" />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted/80 bg-card2/50 px-2.5 py-0.5 rounded border border-border/50 font-medium">
            <AlertCircle className="w-3 h-3 text-warning shrink-0" />
            <span>
              {!hasNodes
                ? t('liveBar.noNodeConnected')
                : (error || t('liveBar.noData'))}
            </span>
          </div>

          <div className="ml-auto text-faint text-[10px] shrink-0 whitespace-nowrap pl-2">
            {t('liveBar.updated')}:{' '}
            <Mono className="text-muted/60 font-bold">--:--:--</Mono>
          </div>
        </div>
      )}
    </div>
  )
}
````

## File: app/history/page.jsx
````javascript
'use client'

import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getStatus, SEVERITY_TO_STATUS } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Card, Panel, LiveDot, Pagination } from '@/components/ui'
import { Field, Select, Button } from '@/components/form'
import { Download, AlertTriangle, Droplet, Clock, Search, Check, RefreshCw, Filter, ShieldAlert, MapPin } from 'lucide-react'
import { useAlarmData } from '@/hooks/useAlarmData'
import { useDamData } from '@/hooks/useDamData'
import { useAuth } from '@/context/AuthContext'
import { fetchLongTermHistory, fetchHistoryKpi } from '@/lib/api'
import { exportAlarmsToExcel, exportHistoryToExcel } from '@/lib/exportHelpers'
import { timeAgo, SENSOR_TYPE_LABELS, SENSOR_TYPE_UNITS } from '@/lib/sensorHelpers'

const TOOLTIP_STYLE = { background: '#13202f', border: '1px solid #22314a', borderRadius: 8, fontSize: 11, color: '#f1f5f9' }
const CHART_GRID_COLOR = '#22314a'
const CHART_TICK_STYLE = { fontSize: 8, fill: '#5b6b85' }

export default function HistoryPage() {
  const { user, isOperator, assignedDamId } = useAuth()
  const activeDamId = isOperator && assignedDamId ? assignedDamId : 'all'

  const { alarms, loading: alarmsLoading } = useAlarmData(activeDamId)
  const { dams, stations, loading: damLoading } = useDamData()

  // State Bộ lọc nâng cao
  const [selectedDamId, setSelectedDamId] = useState(isOperator && assignedDamId ? assignedDamId : 'all')
  const [selectedStationId, setSelectedStationId] = useState('all')
  const [sensorType, setSensorType] = useState('all')
  const [timeRange, setTimeRange] = useState('7d') // '24h' | '7d' | '30d' | 'all'
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Cập nhật selectedDamId khi auth state load xong
  useEffect(() => {
    if (isOperator && assignedDamId) {
      setSelectedDamId(assignedDamId)
    }
  }, [isOperator, assignedDamId])

  // Đập đang được chọn thực tế (Nếu là Operator thì khóa cứng vào assignedDamId)
  const effectiveDamId = isOperator && assignedDamId ? assignedDamId : selectedDamId

  // State Dữ liệu Thật từ Backend DB
  const [historyReadings, setHistoryReadings] = useState([])
  const [kpiData, setKpiData] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Tính toán khoảng thời gian từ timeRange
  const dateParams = useMemo(() => {
    if (timeRange === 'all') return {}
    const now = new Date()
    let startDate = new Date()

    if (timeRange === '24h') startDate.setHours(now.getHours() - 24)
    else if (timeRange === '7d') startDate.setDate(now.getDate() - 7)
    else if (timeRange === '30d') startDate.setDate(now.getDate() - 30)

    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    }
  }, [timeRange])

  // Lấy dữ liệu thực tế từ CSDL khi thay đổi bộ lọc
  const loadHistoryData = async () => {
    setLoadingHistory(true)
    try {
      const [readingsRes, kpiRes] = await Promise.all([
        fetchLongTermHistory({
          damId: effectiveDamId !== 'all' ? effectiveDamId : undefined,
          stationId: selectedStationId !== 'all' ? selectedStationId : undefined,
          type: sensorType,
          startDate: dateParams.startDate,
          endDate: dateParams.endDate,
          limit: 150,
        }),
        fetchHistoryKpi({
          damId: effectiveDamId !== 'all' ? effectiveDamId : undefined,
          startDate: dateParams.startDate,
          endDate: dateParams.endDate,
        }),
      ])

      setHistoryReadings(readingsRes.data || [])
      setKpiData(kpiRes.kpi || null)
    } catch (err) {
      console.error('[HistoryPage] Error loading history data:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadHistoryData()
    setPage(1)
  }, [effectiveDamId, selectedStationId, sensorType, dateParams])

  // Lọc dữ liệu Đập và Trạm phù hợp với phân quyền
  const availableDams = useMemo(() => {
    if (isOperator && assignedDamId) return dams.filter(d => d.damId === assignedDamId)
    return dams
  }, [dams, isOperator, assignedDamId])

  const availableStations = useMemo(() => {
    if (effectiveDamId && effectiveDamId !== 'all') {
      return stations.filter(s => s.damId === effectiveDamId)
    }
    if (isOperator && assignedDamId) {
      return stations.filter(s => s.damId === assignedDamId)
    }
    return stations
  }, [stations, effectiveDamId, isOperator, assignedDamId])

  // Scoped alarms thực tế từ CSDL
  const scopedAlarms = useMemo(() => {
    let list = alarms
    if (effectiveDamId && effectiveDamId !== 'all') {
      list = list.filter(a => a.damId === effectiveDamId)
    }
    if (selectedStationId && selectedStationId !== 'all') {
      list = list.filter(a => String(a.stationId) === String(selectedStationId) || String(a.sensorId) === String(selectedStationId))
    }
    if (sensorType && sensorType !== 'all') {
      const typeLower = sensorType.toLowerCase()
      list = list.filter(a => {
        const st = (a.sensorType || '').toLowerCase()
        if (typeLower === 'vibration' || typeLower === 'vib') return st.startsWith('vibration') || st === 'vib'
        if (typeLower === 'water_level' || typeLower === 'wtl') return st === 'water_level' || st === 'wtl' || st === 'water'
        if (typeLower === 'moisture' || typeLower === 'mst') return st === 'moisture' || st === 'humidity' || st === 'mst'
        return st === typeLower
      })
    }
    if (dateParams.startDate) {
      const startMs = new Date(dateParams.startDate).getTime()
      list = list.filter(a => new Date(a.triggeredAt).getTime() >= startMs)
    }
    return list
  }, [alarms, effectiveDamId, selectedStationId, sensorType, dateParams])

  // Biến đổi dữ liệu CSDL cho Biểu đồ Đường (LineChart)
  const lineChartData = useMemo(() => {
    if (!historyReadings || historyReadings.length === 0) return []
    return historyReadings.map(r => ({
      d: new Date(r.time).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      value: Number(r.value),
      sensorType: r.sensorType,
      unit: r.unit || SENSOR_TYPE_UNITS[r.sensorType] || '',
    }))
  }, [historyReadings])

  // Biến đổi dữ liệu CSDL cho Biểu đồ Cột (BarChart - Phân bố sự cố)
  const barChartData = useMemo(() => {
    if (!scopedAlarms || scopedAlarms.length === 0) return []
    const map = new Map()
    scopedAlarms.forEach(a => {
      const d = new Date(a.triggeredAt).toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' })
      if (!map.has(d)) map.set(d, { d, warning: 0, alert: 0, critical: 0 })
      const item = map.get(d)
      if (a.severity === 'CRITICAL') item.critical += 1
      else if (a.severity === 'ALERT') item.alert += 1
      else item.warning += 1
    })
    return Array.from(map.values()).slice(-10)
  }, [scopedAlarms])

  // Helper tra cứu vị trí Trạm & Đập
  const getLocationInfo = (alarm) => {
    if (!alarm) return { damName: 'Đập Thủy Điện', damLocation: 'Hà Nội', stationName: 'Trạm Quan Trắc', stationLoc: 'K25+500', fullLocation: '' }

    const station = stations.find(s =>
      (alarm.stationId && s.stationId === alarm.stationId) ||
      s.stationId === alarm.sensorId
    ) || stations.find(s => s.damId === alarm.damId) || stations[0]

    const dam = dams.find(d => d.damId === alarm.damId) || dams.find(d => d.damId === station?.damId) || dams[0]
    const damName = alarm.damName || dam?.name || `Đập ${alarm.damId || 'Thủy Điện'}`
    const damLocation = dam?.location || 'Việt Nam'

    const stationName = alarm.stationName || station?.name || `Trạm ${alarm.stationId || alarm.sensorId || 'Quan Trắc'}`
    const stationLoc = alarm.location || station?.location || 'Thân đập chính'

    const fullLocation = `${stationName} (${stationLoc}) — ${damName}`
    return { damName, damLocation, stationName, stationLoc, fullLocation }
  }

  // Danh sách bản ghi lịch sử kết hợp từ CSDL
  const historyRecords = useMemo(() => {
    if (scopedAlarms.length > 0) {
      return scopedAlarms.map(a => {
        const loc = getLocationInfo(a)
        return {
          time: new Date(a.triggeredAt).toLocaleString('vi-VN'),
          code: a.sensorId || `ALM-${a.id.slice(0, 6)}`,
          stationName: loc.stationName,
          damName: loc.damName,
          location: loc.fullLocation,
          sensorType: a.sensorType,
          level: `${a.measuredVal} ${SENSOR_TYPE_UNITS[a.sensorType] || ''}`,
          alertLv: SEVERITY_TO_STATUS[a.severity] || 'info',
          statusLv: a.resolvedAt ? 'safe' : 'warning',
          statusLbl: a.resolvedAt ? 'ĐÃ XỬ LÝ' : 'CHỜ XỬ LÝ',
          rawAlarm: a,
        }
      })
    }

    // Fallback: nếu chưa có sự kiện alarm, dùng bản ghi sensor readings từ CSDL
    return historyReadings.map(r => {
      const station = stations.find(s => s.damId === r.damId) || stations[0]
      const dam = dams.find(d => d.damId === r.damId) || dams[0]
      return {
        time: new Date(r.time).toLocaleString('vi-VN'),
        code: r.sensorId,
        stationName: station?.name || 'Trạm Quan Trắc',
        damName: dam?.name || `Đập ${r.damId}`,
        location: `${station?.name || 'Trạm'} — ${dam?.name || 'Đập'}`,
        sensorType: r.sensorType,
        level: `${r.value} ${r.unit || SENSOR_TYPE_UNITS[r.sensorType] || ''}`,
        alertLv: 'info',
        statusLv: 'safe',
        statusLbl: 'BÌNH THƯỜNG',
      }
    })
  }, [scopedAlarms, historyReadings, dams, stations])

  // Lọc theo từ khóa tìm kiếm
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return historyRecords
    const kw = search.toLowerCase()
    return historyRecords.filter(r =>
      r.code.toLowerCase().includes(kw) ||
      r.location.toLowerCase().includes(kw) ||
      r.statusLbl.toLowerCase().includes(kw)
    )
  }, [historyRecords, search])

  // Phân trang
  const [pageSize, setPageSize] = useState(10)
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, page, pageSize])

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setPage(1)
  }

  const isLoading = alarmsLoading || damLoading || loadingHistory

  return (
    <div className="grid gap-3.5 p-4 min-h-[calc(100vh-48px)]" style={{ gridTemplateColumns: '220px 1fr' }}>

      {/* ── SIDEBAR BỘ LỌC CSDL ── */}
      <Panel
        className="self-start"
        title={
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-accent" />
            <span>Bộ Lọc Dữ Liệu</span>
          </span>
        }
        right={
          <button
            onClick={loadHistoryData}
            className="p-1 hover:bg-card2 rounded text-muted hover:text-tx transition-colors bg-transparent border-none cursor-pointer"
            title="Làm mới dữ liệu từ CSDL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin text-accent' : ''}`} />
          </button>
        }
      >
        {/* 1. Chọn Đập Thủy Điện */}
        <Field label="Đập Thủy Điện" htmlFor="filter-dam" className="mb-3">
          {isOperator && assignedDamId ? (
            <div className="px-3 py-2 bg-accent/10 border border-accent/30 rounded-lg text-accent text-xs font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{dams.find(d => d.damId === assignedDamId)?.name || `Đập ${assignedDamId}`}</span>
            </div>
          ) : (
            <Select
              id="filter-dam"
              value={selectedDamId}
              onChange={e => {
                setSelectedDamId(e.target.value)
                setSelectedStationId('all')
              }}
            >
              <option value="all">-- Tất cả các Đập --</option>
              {availableDams.map(d => (
                <option key={d.damId} value={d.damId}>{d.name}</option>
              ))}
            </Select>
          )}
        </Field>

        {/* 2. Chọn Trạm Quan Trắc */}
        <Field label="Trạm Quan Trắc" htmlFor="filter-station" className="mb-3">
          <Select
            id="filter-station"
            value={selectedStationId}
            onChange={e => setSelectedStationId(e.target.value)}
          >
            <option value="all">-- Tất cả Trạm --</option>
            {availableStations.map(s => (
              <option key={s.stationId} value={s.stationId}>{s.name} ({s.location || s.river})</option>
            ))}
          </Select>
        </Field>

        {/* 3. Chọn Loại Cảm Biến */}
        <Field label="Loại Cảm Biến" htmlFor="filter-sensor-type" className="mb-3">
          <Select
            id="filter-sensor-type"
            value={sensorType}
            onChange={e => setSensorType(e.target.value)}
          >
            <option value="all">-- Tất cả loại Cảm biến --</option>
            <option value="water_level">Mực nước hồ (WTL)</option>
            <option value="vibration">Độ rung thân đập (VIB)</option>
            <option value="moisture">Độ ẩm móng đập (MST)</option>
          </Select>
        </Field>

        {/* 4. Khoảng Thời Gian */}
        <Field label="Khoảng Thời Gian" htmlFor="filter-time-range" className="mb-4">
          <Select
            id="filter-time-range"
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
          >
            <option value="24h">24 Giờ gần nhất</option>
            <option value="7d">7 Ngày gần nhất</option>
            <option value="30d">30 Ngày gần nhất</option>
            <option value="all">Toàn bộ lịch sử CSDL</option>
          </Select>
        </Field>

        <Button
          variant="primary"
          onClick={loadHistoryData}
          loading={loadingHistory}
          className="w-full"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Áp Dụng Bộ Lọc</span>
        </Button>
      </Panel>

      {/* ── KHU VỰC NỘI DUNG CHÍNH ── */}
      <div>
        {/* Header */}
        <div className="flex justify-between items-end mb-3.5">
          <div>
            <h1 className="text-xl font-bold text-tx tracking-wide flex items-center gap-2">
              <span>LỊCH SỬ & PHÂN TÍCH DỮ LIỆU CSDL THỰC TẾ</span>
              <span className="text-[10px] font-mono font-normal text-safe bg-safe-soft border border-safe-soft px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <LiveDot active size="sm" />
                LIVE DB DATA
              </span>
            </h1>
            <Mono className="text-[9px] text-muted">
              Đang xem dữ liệu Đập: <strong className="text-tx">{effectiveDamId === 'all' ? 'Tất cả đập' : (dams.find(d => d.damId === effectiveDamId)?.name || effectiveDamId)}</strong> | Cập nhật lúc {new Date().toLocaleTimeString('vi-VN')}
            </Mono>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportHistoryToExcel(filteredRecords, effectiveDamId || 'He_Thong')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-safe/40 rounded-lg bg-safe/10 text-safe text-[10px] font-bold cursor-pointer hover:bg-safe/20 transition-colors"
              title="Xuất bảng danh sách lịch sử đo đạc đang hiển thị ra Excel"
            >
              <Download className="w-3.5 h-3.5 text-safe shrink-0" />
              <span>Xuất Excel Đo Đạc</span>
            </button>
            {scopedAlarms.length > 0 && (
              <button
                onClick={() => exportAlarmsToExcel(scopedAlarms, effectiveDamId || 'Dam')}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-warning/40 rounded-lg bg-warning/10 text-warning text-[10px] font-bold cursor-pointer hover:bg-warning/20 transition-colors"
                title="Xuất danh sách các sự cố cảnh báo trong kỳ ra Excel"
              >
                <Download className="w-3.5 h-3.5 text-warning shrink-0" />
                <span>Xuất Excel Cảnh Báo ({scopedAlarms.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Thẻ Thống Kê KPI Thật */}
        <div className="grid grid-cols-3 gap-3 mb-3.5">
          <Card className="p-3.5">
            <div className="flex justify-between items-start mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <Mono className="text-[8px] text-warning bg-warning-soft border border-warning-soft px-1.5 py-0.5 rounded-sm font-semibold">
                {kpiData?.unresolvedCount ? `${kpiData.unresolvedCount} Chưa xử lý` : 'An toàn'}
              </Mono>
            </div>
            <Mono className="text-2xl font-bold block text-warning">
              {kpiData?.totalAlarms ?? scopedAlarms.length}
            </Mono>
            <p className="text-[10px] text-muted mt-1.5">Tổng số sự kiện cảnh báo trong kỳ</p>
          </Card>

          <Card className="p-3.5">
            <div className="flex justify-between items-start mb-2">
              <Droplet className="w-4 h-4 text-info" />
              <Mono className="text-[8px] text-info bg-info-soft border border-info-soft px-1.5 py-0.5 rounded-sm font-semibold">
                Đỉnh cao nhất
              </Mono>
            </div>
            <Mono className="text-2xl font-bold block text-info">
              {kpiData?.maxWaterLevel ? `${kpiData.maxWaterLevel.toFixed(2)} m` : `${dams[0]?.waterLevel || 0} m`}
            </Mono>
            <p className="text-[10px] text-muted mt-1.5">Mực nước cao nhất ghi nhận được</p>
          </Card>

          <Card className="p-3.5">
            <div className="flex justify-between items-start mb-2">
              <Clock className="w-4 h-4 text-safe" />
              <Mono className="text-[8px] text-safe bg-safe-soft border border-safe-soft px-1.5 py-0.5 rounded-sm font-semibold">
                Trung bình
              </Mono>
            </div>
            <Mono className="text-2xl font-bold block text-safe">
              {kpiData?.avgResponseTimeSec ? `${Math.round(kpiData.avgResponseTimeSec / 60)} phút` : '15 phút'}
            </Mono>
            <p className="text-[10px] text-muted mt-1.5">Thời gian phản ứng xử lý sự cố</p>
          </Card>
        </div>

        {/* ── BIỂU ĐỒ THỰC TẾ (RECHARTS) ── */}
        <div className="grid grid-cols-2 gap-3 mb-3.5">
          {/* Biểu đồ Đường: Chuỗi dữ liệu CSDL */}
          <Card className="p-3.5">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[12px] font-bold text-tx">Diễn Biến Thông Số Cảm Biến Realtime</div>
              <Mono className="text-[9px] text-muted">Số bản ghi: {lineChartData.length}</Mono>
            </div>
            <div className="flex gap-3 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-info" />
                <span className="text-[9px] text-muted">Đường đo CSDL ({sensorType === 'all' ? 'Tất cả' : sensorType})</span>
              </div>
            </div>
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={CHART_GRID_COLOR} />
                  <XAxis dataKey="d" tick={CHART_TICK_STYLE} tickLine={false} />
                  <YAxis tick={CHART_TICK_STYLE} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[150px] flex items-center justify-center text-[10px] text-muted italic bg-card2/50 rounded-lg">
                Chưa có dữ liệu cảm biến trong khoảng thời gian này
              </div>
            )}
          </Card>

          {/* Biểu đồ Cột: Phân bố sự cố theo Ngày từ CSDL */}
          <Card className="p-3.5">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[12px] font-bold text-tx">Phân Bố Cảnh Báo Sự Cố theo Ngày</div>
              <Mono className="text-[9px] text-muted">Số sự cố: {scopedAlarms.length}</Mono>
            </div>
            <div className="flex gap-3 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-warning" />
                <span className="text-[9px] text-muted">Cảnh báo (WARNING)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-danger" />
                <span className="text-[9px] text-muted">Báo động (ALERT)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-critical" />
                <span className="text-[9px] text-muted">Nguy cấp (CRITICAL)</span>
              </div>
            </div>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={CHART_GRID_COLOR} />
                  <XAxis dataKey="d" tick={CHART_TICK_STYLE} tickLine={false} />
                  <YAxis tick={CHART_TICK_STYLE} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="warning" name="Cảnh báo" fill="#f59e0b" opacity={0.85} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="alert" name="Báo động" fill="#fb4360" opacity={0.85} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="critical" name="Nguy cấp" fill="#e11d48" opacity={0.85} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[150px] flex items-center justify-center text-[10px] text-muted italic bg-card2/50 rounded-lg">
                Không ghi nhận sự cố cảnh báo nào trong kỳ
              </div>
            )}
          </Card>
        </div>

        {/* ── BẢNG DỮ LIỆU THỰC TẾ ── */}
        <Card className="overflow-hidden">
          <div className="flex justify-between items-center px-3.5 py-2.5 border-b border-border/70">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted font-bold tracking-[0.14em] uppercase">Danh Sách Bản Ghi Lịch Sử từ CSDL</span>
              <span className="text-[9px] font-mono text-muted bg-card3 px-2 py-0.5 rounded-full border border-border">
                {filteredRecords.length} bản ghi
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-card2 border border-border rounded-lg px-2.5 py-1 focus-within:border-accent transition-colors">
              <Search className="w-3.5 h-3.5 text-muted shrink-0" />
              <input
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Tìm trạm, đập, mã thiết bị..."
                className="bg-transparent border-none outline-none text-tx text-[10px] w-48 placeholder:text-faint"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-card2 border-b border-border">
                  {['THỜI GIAN', 'MÃ THIẾT BỊ', 'VỊ TRÍ THÂN ĐẬP', 'GIÁ TRỊ ĐO', 'MỨC CẢNH BÁO', 'TRẠNG THÁI', 'THAO TÁC'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[8px] text-muted font-bold uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((r, i) => {
                    const as = getStatus(r.alertLv)
                    const ss = getStatus(r.statusLv)
                    return (
                      <tr key={i} className="border-t border-border/70 hover:bg-card2/40 transition-colors">
                        <td className="px-3 py-2">
                          <Mono className="text-[9px] text-muted whitespace-nowrap">{r.time}</Mono>
                        </td>
                        <td className="px-3 py-2">
                          <Mono className="text-[10px] text-info font-bold">{r.code}</Mono>
                        </td>
                        <td className="px-3 py-2 text-[10.5px] text-tx whitespace-nowrap">
                          {r.location}
                        </td>
                        <td className="px-3 py-2">
                          <Mono className={`text-[12px] font-bold ${as.text}`}>{r.level}</Mono>
                        </td>
                        <td className="px-3 py-2">
                          <Badge status={r.alertLv} sm />
                        </td>
                        <td className="px-3 py-2">
                          <Badge status={r.statusLv} label={r.statusLbl} sm />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => {
                              alert(`Chi tiết bản ghi:\n- Mã: ${r.code}\n- Thời gian: ${r.time}\n- Vị trí: ${r.location}\n- Giá trị: ${r.level}`)
                            }}
                            className="text-accent text-[10px] font-bold bg-transparent border-none cursor-pointer hover:underline"
                          >
                            CHI TIẾT
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted italic">
                      {isLoading ? 'Đang nạp dữ liệu lịch sử từ CSDL...' : 'Không tìm thấy bản ghi dữ liệu lịch sử nào khớp với bộ lọc.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={filteredRecords.length}
            onPageChange={setPage}
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>

      </div>
    </div>
  )
}
````

## File: lib/api.js
````javascript
const API_URL = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') 
  ? process.env.NEXT_PUBLIC_API_URL.trim() 
  : 'https://library-opal-degraded.ngrok-free.dev'

const customHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '69420',
}

function getAuthHeaders(token = null) {
  const headers = { ...customHeaders }
  const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`
  }
  return headers
}

// ── In-Memory Cache with TTL & Request Deduplication ──
const memoryCache = new Map()
const inFlightRequests = new Map()

export const DEFAULT_CACHE_TTL = 30 * 1000 // 30 seconds
export const SHORT_CACHE_TTL = 5 * 1000    // 5 seconds

/**
 * Fetch với bộ nhớ đệm In-Memory Cache, tự hết hạn theo TTL và gộp trùng lặp request (Deduplication)
 * @param {string} key - Cache key (URL kèm query params)
 * @param {Function} fetcher - Hàm async gọi fetch thực tế
 * @param {number} ttlMs - Thời gian sống của cache (milliseconds)
 * @param {boolean} forceRefresh - Bỏ qua cache để lấy dữ liệu mới nhất
 */
export async function cachedFetch(key, fetcher, ttlMs = DEFAULT_CACHE_TTL, forceRefresh = false) {
  const now = Date.now()

  // 1. Trả về từ Cache nếu còn hạn và không ép refresh
  if (!forceRefresh && memoryCache.has(key)) {
    const entry = memoryCache.get(key)
    if (now < entry.expiry) {
      return entry.data
    }
    memoryCache.delete(key)
  }

  // 2. Gộp request (Deduplicate) nếu đang có request cùng key đang chạy
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)
  }

  // 3. Thực thi request và lưu vào Cache
  const promise = (async () => {
    try {
      const data = await fetcher()
      if (data !== undefined && data !== null) {
        memoryCache.set(key, {
          data,
          expiry: Date.now() + ttlMs,
        })
      }
      return data
    } finally {
      inFlightRequests.delete(key)
    }
  })()

  inFlightRequests.set(key, promise)
  return promise
}

/**
 * Xóa cache theo tiền tố hoặc danh sách tiền tố (Cache Invalidation)
 * @param {string|string[]} prefixes
 */
export function invalidateCache(prefixes) {
  const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes]
  for (const key of memoryCache.keys()) {
    for (const p of prefixList) {
      if (key.includes(p)) {
        memoryCache.delete(key)
        break
      }
    }
  }
}

/**
 * Xóa toàn bộ In-Memory Cache
 */
export function clearAllCache() {
  memoryCache.clear()
  inFlightRequests.clear()
}

/**
 * POST /sensor/all — gửi data sensor lên backend
 * @param {Object} data - { freq, amp, waterLevel, moisture, percent? }
 */
export async function postSensorData(data) {
  const res = await fetch(`${API_URL}/sensor/all`, {
    method: 'POST',
    headers: customHeaders,
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`POST /sensor/all failed: ${res.status}`)
  return res.json()
}

/**
 * GET /sensor/latest — lấy snapshot mới nhất + history 60 điểm cho một stationId hoặc clusterId
 * Dữ liệu realtime — luôn lấy snapshot mới nhất
 * Returns: { data: SensorSnapshot | null, history: SensorHistory }
 */
export async function fetchLatest(stationId, clusterId) {
  const params = new URLSearchParams()
  if (stationId) params.set('stationId', String(stationId))
  if (clusterId) params.set('clusterId', clusterId)
  const queryStr = params.toString() ? `?${params.toString()}` : ''

  const res = await fetch(`${API_URL}/sensor/latest${queryStr}`, {
    cache: 'no-store',
    headers: customHeaders,
  })
  if (!res.ok) throw new Error(`GET /sensor/latest failed: ${res.status}`)
  return res.json()
}

/**
 * GET /sensor/alarms — lấy danh sách sự kiện cảnh báo (Cache ngắn 5s)
 * @param {string} damId - ID đập (mặc định 'DAM-001')
 * @param {number} limit - Số lượng tối đa
 * @param {string} severity - Lọc theo mức: 'WARNING' | 'ALERT' | 'CRITICAL'
 * @param {boolean|undefined} resolved - Lọc theo trạng thái xử lý
 * Returns: { alarms: AlarmEvent[] }
 */
export async function fetchAlarmEvents(damId = 'DAM-001', limit = 50, severity, resolved, token = null, forceRefresh = false) {
  const headers = getAuthHeaders(token)

  const params = new URLSearchParams()
  if (damId) params.set('damId', damId)
  if (limit) params.set('limit', String(limit))
  if (severity) params.set('severity', severity)
  if (resolved !== undefined) params.set('resolved', String(resolved))
  const url = `${API_URL}/sensor/alarms?${params}`

  return cachedFetch(
    url,
    async () => {
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          headers,
          credentials: 'include',
        })
        if (!res.ok) {
          console.warn(`[API] GET /sensor/alarms error status: ${res.status}`)
          return { alarms: [] }
        }
        return await res.json()
      } catch (err) {
        console.error('[API] fetchAlarmEvents network error:', err)
        return { alarms: [] }
      }
    },
    SHORT_CACHE_TTL,
    forceRefresh,
  )
}

/**
 * GET /sensor/thresholds — lấy cấu hình ngưỡng cảnh báo theo Trạm (Cache 30s)
 * @param {string|object} target - stationId hoặc { stationId, damId }
 * Returns: { configs: ThresholdConfig[] }
 */
export async function fetchThresholdConfigs(target = 'STA-001-01', forceRefresh = false) {
  let query = ''
  if (typeof target === 'object' && target !== null) {
    if (target.stationId) query = `stationId=${target.stationId}`
    else if (target.damId) query = `damId=${target.damId}`
  } else if (typeof target === 'string') {
    if (target.startsWith('STA-') || target.includes('-')) {
      query = `stationId=${target}`
    } else {
      query = `damId=${target}`
    }
  } else {
    query = `stationId=STA-001-01`
  }

  const url = `${API_URL}/sensor/thresholds?${query}`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: customHeaders,
      })
      if (!res.ok) throw new Error(`GET /sensor/thresholds failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function updateThresholdConfig(id, data, token = null) {
  const res = await fetch(`${API_URL}/sensor/thresholds/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /sensor/thresholds/${id} failed: ${res.status}`)
  invalidateCache(['/sensor/thresholds', '/gateway', '/nodes', '/dams'])
  return json
}

/**
 * PUT /sensor/alarms/:id/resolve — đánh dấu sự kiện đã xử lý
 * @param {string} id - UUID của alarm event
 * Returns: { ok: true, data: AlarmEvent }
 */
export async function resolveAlarmEvent(id, token = null) {
  const res = await fetch(`${API_URL}/sensor/alarms/${id}/resolve`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /sensor/alarms/${id}/resolve failed: ${res.status}`)
  invalidateCache(['/sensor/alarms'])
  return json
}

/**
 * POST /sensor/send-email-alert — gửi email thông báo khẩn cấp
 * @param {Object} data - { toEmail, message, alarmId? }
 */
export async function sendEmailAlert(data, token = null) {
  const res = await fetch(`${API_URL}/sensor/send-email-alert`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /sensor/send-email-alert failed: ${res.status}`)
  return json
}

/**
 * GET /sensor/dam-managers — lấy danh sách Cán bộ phụ trách Đập tương ứng
 * @param {string} damId
 */
export async function fetchDamManagers(damId) {
  if (!damId) return { managers: [] }
  try {
    const res = await fetch(`${API_URL}/sensor/dam-managers?damId=${damId}`, {
      cache: 'no-store',
      headers: customHeaders,
    })
    if (!res.ok) return { managers: [] }
    return await res.json()
  } catch (err) {
    console.error('[API] fetchDamManagers error:', err)
    return { managers: [] }
  }
}

/**
 * GET /sensor/history/long-term — lấy chuỗi dữ liệu lịch sử cảm biến từ CSDL
 */
export async function fetchLongTermHistory(params = {}) {
  const query = new URLSearchParams()
  if (params.type && params.type !== 'all') query.set('type', params.type)
  if (params.damId && params.damId !== 'all') query.set('damId', params.damId)
  if (params.stationId) query.set('stationId', params.stationId)
  if (params.startDate) query.set('startDate', params.startDate)
  if (params.endDate) query.set('endDate', params.endDate)
  if (params.limit) query.set('limit', params.limit || 100)

  try {
    const res = await fetch(`${API_URL}/sensor/history/long-term?${query.toString()}`, {
      cache: 'no-store',
      headers: customHeaders,
    })
    if (!res.ok) return { data: [] }
    return await res.json()
  } catch (err) {
    console.error('[API] fetchLongTermHistory error:', err)
    return { data: [] }
  }
}

/**
 * GET /sensor/history/kpi — lấy thống kê KPI lịch sử thực tế từ CSDL
 */
export async function fetchHistoryKpi(params = {}) {
  const query = new URLSearchParams()
  if (params.damId && params.damId !== 'all') query.set('damId', params.damId)
  if (params.startDate) query.set('startDate', params.startDate)
  if (params.endDate) query.set('endDate', params.endDate)

  try {
    const res = await fetch(`${API_URL}/sensor/history/kpi?${query.toString()}`, {
      cache: 'no-store',
      headers: customHeaders,
    })
    if (!res.ok) return { kpi: null }
    return await res.json()
  } catch (err) {
    console.error('[API] fetchHistoryKpi error:', err)
    return { kpi: null }
  }
}

// ── Dam APIs (Cached 30s) ──
export async function fetchDams(forceRefresh = false) {
  const url = `${API_URL}/dams`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /dams failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function fetchDamById(id, forceRefresh = false) {
  const url = `${API_URL}/dams/${id}`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /dams/${id} failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function createDam(data, token = null) {
  const res = await fetch(`${API_URL}/dams`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /dams failed: ${res.status}`)
  invalidateCache(['/dams', '/stations'])
  return json
}

export async function updateDam(id, data, token = null) {
  const res = await fetch(`${API_URL}/dams/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /dams/${id} failed: ${res.status}`)
  invalidateCache(['/dams', '/stations'])
  return json
}

export async function deleteDam(id, token = null) {
  const res = await fetch(`${API_URL}/dams/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `DELETE /dams/${id} failed: ${res.status}`)
  invalidateCache(['/dams', '/stations'])
  return json
}

// ── Station APIs (Cached 30s) ──
export async function fetchStations(damId, forceRefresh = false) {
  const url = damId ? `${API_URL}/stations?damId=${damId}` : `${API_URL}/stations`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /stations failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function fetchStationById(id, forceRefresh = false) {
  const url = `${API_URL}/stations/${id}`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /stations/${id} failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function createStation(data, token = null) {
  const res = await fetch(`${API_URL}/stations`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /stations failed: ${res.status}`)
  invalidateCache(['/stations', '/dams', '/api/gateways', '/api/nodes'])
  return json
}

export async function updateStation(id, data, token = null) {
  const res = await fetch(`${API_URL}/stations/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /stations/${id} failed: ${res.status}`)
  invalidateCache(['/stations', '/dams', '/api/gateways', '/api/nodes'])
  return json
}

export async function deleteStation(id, token = null) {
  const res = await fetch(`${API_URL}/stations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `DELETE /stations/${id} failed: ${res.status}`)
  invalidateCache(['/stations', '/dams', '/api/gateways', '/api/nodes'])
  return json
}

/**
 * Chuẩn hóa URL ảnh vết nứt và proxy qua /api/image để tránh lỗi ERR_NGROK_6024.
 * <img src> không thể gửi header tới Ngrok, nên phải route qua Next.js API proxy server-side.
 * @param {string} url 
 * @returns {string|null}
 */
export function getFormattedImageUrl(url) {
  if (!url) return null

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') 
    ? process.env.NEXT_PUBLIC_API_URL.trim() 
    : 'https://library-opal-degraded.ngrok-free.dev'

  let path = url

  // Nếu chứa MinIO localhost port 9000 hoặc /dam-images/
  if (path.includes('/dam-images/')) {
    const parts = path.split('/dam-images/')
    path = `/sensor/images/${parts[1]}`
  } else if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const u = new URL(path)
      // Nếu domain là localhost hoặc 127.0.0.1, lấy pathname để proxy qua backend
      if (u.hostname.includes('localhost') || u.hostname.includes('127.0.0.1')) {
        path = u.pathname
      } else if (u.hostname.includes('vercel.app')) {
        path = u.pathname
      } else {
        // URL đầy đủ hợp lệ (Ngrok, domain khác) — bọc qua /api/image proxy để tránh lỗi 6024
        return `/api/image?url=${encodeURIComponent(path)}`
      }
    } catch {
      // ignore
    }
  }

  // Đảm bảo path bắt đầu bằng /sensor/images/
  if (!path.startsWith('/')) {
    path = `/${path}`
  }
  if (!path.startsWith('/sensor/images/')) {
    path = `/sensor/images${path.replace(/^\/sensor/, '')}`
  }

  // Tạo absolute URL Ngrok đầy đủ rồi bọc qua /api/image proxy
  const cleanBase = baseUrl.replace(/\/+$/, '')
  const absoluteUrl = `${cleanBase}${path}`
  return `/api/image?url=${encodeURIComponent(absoluteUrl)}`
}

// ── Gateway & Node IoT Management APIs (Cached 30s) ──

/**
 * GET /api/gateways — trả về nguyên cây thiết bị biên:
 * gateway → nodes (kèm sensors + mappedCamera) → cameras → station → dam.
 * Endpoint yêu cầu role ADMIN/OPERATOR nên BẮT BUỘC gửi kèm token.
 */
export async function fetchGateways(stationId, damId, forceRefresh = false) {
  const params = new URLSearchParams()
  if (stationId) params.set('stationId', String(stationId))
  if (damId && damId !== 'all') params.set('damId', String(damId))
  const queryStr = params.toString() ? `?${params.toString()}` : ''
  const url = `${API_URL}/api/gateways${queryStr}`

  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`GET /api/gateways failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function fetchGatewayById(id, forceRefresh = false) {
  const url = `${API_URL}/api/gateways/${id}`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`GET /api/gateways/${id} failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function createGateway(data, token = null) {
  const res = await fetch(`${API_URL}/api/gateways`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /api/gateways failed: ${res.status}`)
  invalidateCache(['/api/gateways', '/api/nodes', '/stations', '/dams'])
  return json
}

export async function updateGateway(id, data, token = null) {
  const res = await fetch(`${API_URL}/api/gateways/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /api/gateways/${id} failed: ${res.status}`)
  invalidateCache(['/api/gateways', '/api/nodes', '/stations', '/dams'])
  return json
}

export async function deleteGateway(id, token = null) {
  const res = await fetch(`${API_URL}/api/gateways/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `DELETE /api/gateways/${id} failed: ${res.status}`)
  invalidateCache(['/api/gateways', '/api/nodes', '/stations', '/dams'])
  return json
}

// ── Camera APIs (gắn vào Gateway — Jetson TX2 điều khiển) ──

const CAMERA_CACHE_KEYS = ['/api/cameras', '/api/gateways', '/api/nodes']

export async function fetchCameras(gatewayId, forceRefresh = false) {
  const params = new URLSearchParams()
  if (gatewayId) params.set('gatewayId', gatewayId)
  const queryStr = params.toString() ? `?${params.toString()}` : ''
  const url = `${API_URL}/api/cameras${queryStr}`

  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`GET /api/cameras failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function createCamera(data, token = null) {
  const res = await fetch(`${API_URL}/api/cameras`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /api/cameras failed: ${res.status}`)
  invalidateCache(CAMERA_CACHE_KEYS)
  return json
}

export async function updateCamera(id, data, token = null) {
  const res = await fetch(`${API_URL}/api/cameras/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /api/cameras/${id} failed: ${res.status}`)
  invalidateCache(CAMERA_CACHE_KEYS)
  return json
}

export async function deleteCamera(id, token = null) {
  const res = await fetch(`${API_URL}/api/cameras/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `DELETE /api/cameras/${id} failed: ${res.status}`)
  invalidateCache(CAMERA_CACHE_KEYS)
  return json
}

export async function fetchNodes(gatewayId, stationId, damId, forceRefresh = false) {
  const params = new URLSearchParams()
  if (gatewayId) params.set('gatewayId', gatewayId)
  if (stationId) params.set('stationId', String(stationId))
  if (damId && damId !== 'all') params.set('damId', String(damId))
  const queryStr = params.toString() ? `?${params.toString()}` : ''
  const url = `${API_URL}/api/nodes${queryStr}`

  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /api/nodes failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function fetchNodeById(id, forceRefresh = false) {
  const url = `${API_URL}/api/nodes/${id}`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /api/nodes/${id} failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function createNode(data, token = null) {
  const res = await fetch(`${API_URL}/api/nodes`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /api/nodes failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

export async function updateNode(id, data, token = null) {
  const res = await fetch(`${API_URL}/api/nodes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /api/nodes/${id} failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

export async function deleteNode(id, token = null) {
  const res = await fetch(`${API_URL}/api/nodes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `DELETE /api/nodes/${id} failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

export async function mapNodeCamera(nodeId, cameraId, token = null) {
  const res = await fetch(`${API_URL}/api/nodes/${nodeId}/map-camera`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify({ cameraId }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /api/nodes/${nodeId}/map-camera failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

export async function fetchNodeSensors(nodeId, forceRefresh = false) {
  const url = `${API_URL}/api/nodes/${nodeId}/sensors`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /api/nodes/${nodeId}/sensors failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function addNodeSensor(nodeId, data, token = null) {
  const res = await fetch(`${API_URL}/api/nodes/${nodeId}/sensors`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /api/nodes/${nodeId}/sensors failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

export async function updateNodeSensor(nodeId, sensorId, data, token = null) {
  const res = await fetch(`${API_URL}/api/nodes/${nodeId}/sensors/${sensorId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /api/nodes/${nodeId}/sensors/${sensorId} failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

export async function deleteNodeSensor(nodeId, sensorId, token = null) {
  const res = await fetch(`${API_URL}/api/nodes/${nodeId}/sensors/${sensorId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `DELETE /api/nodes/${nodeId}/sensors/${sensorId} failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

// ── Auth & User APIs ──
export async function loginUser(data) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: customHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Đăng nhập thất bại')
  clearAllCache()
  return json
}

export async function registerUser(data) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: customHeaders,
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Đăng ký thất bại')
  return json
}

export async function logoutUser() {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: customHeaders,
    credentials: 'include',
  })
  clearAllCache()
  if (!res.ok) throw new Error('Đăng xuất thất bại')
  return res.json()
}

export async function fetchMe(token) {
  const headers = { ...customHeaders }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}/auth/me`, {
    headers,
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

/**
 * PUT /auth/me — tự cập nhật hồ sơ cá nhân (fullName/phoneNumber/password) của
 * chính người dùng đang đăng nhập. Khác với updateUser() (chỉ ADMIN mới gọi được
 * PUT /users/:id) — endpoint này mở cho mọi role đã đăng nhập, tự sửa hồ sơ của mình.
 */
export async function updateProfile(data, token = null) {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Cập nhật hồ sơ thất bại')
  return json
}

export async function fetchUsers(token, forceRefresh = false) {
  const headers = { ...customHeaders }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const url = `${API_URL}/users`

  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, {
        headers,
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Không thể lấy danh sách người dùng')
      return res.json()
    },
    10000,
    forceRefresh,
  )
}

export async function approveUser(id, data, token) {
  const headers = { ...customHeaders }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}/users/${id}/approve`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Phê duyệt thất bại')
  invalidateCache(['/users'])
  return json
}

export async function updateUser(id, data, token) {
  const headers = { ...customHeaders }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Cập nhật thất bại')
  invalidateCache(['/users'])
  return json
}

// ── Audit Logs API (Dành riêng cho ADMIN) ──
/**
 * GET /audit-logs — phân trang thật ở backend (skip/take), trả về
 * { logs, total, page, pageSize } để frontend dựng UI phân trang.
 */
export async function fetchAuditLogs(category = 'ALL', limit = 20, token = null, page = 1) {
  const headers = { ...customHeaders }
  const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
  if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

  const query = new URLSearchParams()
  if (category && category !== 'ALL') query.append('category', category)
  if (limit) query.append('limit', String(limit))
  if (page) query.append('page', String(page))

  const res = await fetch(`${API_URL}/audit-logs?${query.toString()}`, {
    headers,
    credentials: 'include',
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Không thể lấy nhật ký hệ thống')
  return json
}

export async function deleteUser(id, token) {
  const headers = { ...customHeaders }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Xóa thất bại')
  invalidateCache(['/users'])
  return json
}
````

## File: app/alerts/page.jsx
````javascript
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAlarmData } from '@/hooks/useAlarmData'
import { useDamData } from '@/hooks/useDamData'
import { useAuth } from '@/context/AuthContext'
import { sendEmailAlert, fetchDamManagers, getFormattedImageUrl } from '@/lib/api'
import { exportAlarmsToExcel, exportAlarmToPDF } from '@/lib/exportHelpers'
import { getStatusBySeverity } from '@/lib/statusConfig'
import { SEVERITY_MAP, SENSOR_TYPE_LABELS, SENSOR_TYPE_UNITS, timeAgo, formatTime } from '@/lib/sensorHelpers'
import { Mono, Badge, Divider, Label, Card } from '@/components/ui'
import { Field, TextInput, Textarea, Button } from '@/components/form'
import { AlertTriangle, Check, CheckCircle2, Printer, Video, Maximize2, Camera, Bell, Shield, Send, X, Calendar, Clock, Fingerprint, MapPin, Database, Radio, FileSpreadsheet, Mail, ExternalLink, ArrowRight } from 'lucide-react'

export default function AlertsPage() {
  const { user, isOperator, isViewer, assignedDamId } = useAuth()
  const damIdForAlerts = isOperator && assignedDamId ? assignedDamId : 'all'
  const { alarms, thresholds, loading, error, resolveAlarm, unresolvedCount } = useAlarmData(damIdForAlerts)
  const { dams, stations } = useDamData()

  const [selId, setSelId] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'CRITICAL' | 'ALERT' | 'WARNING' | 'resolved'
  const [selectedDam, setSelectedDam] = useState(isOperator && assignedDamId ? assignedDamId : 'all')
  const [selectedStation, setSelectedStation] = useState('all')
  const [modes, setModes] = useState({ sms: false, zalo: false, email: true })
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [fullImg, setFullImg] = useState(false)

  // Quản lý danh sách Email người nhận thực tế do Admin chủ động tạo
  const [emailList, setEmailList] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_email_recipients')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        } catch (e) { }
      }
    }
    return ['ruka13312002@gmail.com']
  })
  const [newEmailInput, setNewEmailInput] = useState('')
  const [damManagers, setDamManagers] = useState([])

  // Helper tra cứu vị trí Trạm & Đập
  const getLocationInfo = (alarm) => {
    if (!alarm) return { damName: 'Đập Thủy Điện', damLocation: 'Hà Nội', stationName: 'Trạm Quan Trắc', stationLoc: 'K25+500', river: '', km: '', fullLocation: '', stationId: '', damId: '' }

    const station = stations.find(s =>
      (alarm.stationId && s.stationId === alarm.stationId) ||
      (alarm.stationCode && s.stationCode === alarm.stationCode) ||
      (alarm.stationId && String(s.id) === String(alarm.stationId)) ||
      s.stationId === alarm.sensorId
    ) || stations.find(s => s.damId === alarm.damId) || stations[0]

    const dam = dams.find(d => d.damId === alarm.damId) || dams.find(d => d.damId === station?.damId) || dams[0]
    const damId = alarm.damId || dam?.damId || 'dam_1'
    const damName = alarm.damName || dam?.name || `Đập ${alarm.damId || 'Thủy Điện'}`
    const damLocation = dam?.location || 'Việt Nam'

    const stationId = station?.stationId || alarm.stationId || alarm.stationCode || (stations[0]?.stationId) || ''
    const stationName = alarm.stationName || station?.name || `Trạm ${alarm.stationId || alarm.sensorId || 'Quan Trắc'}`
    const stationLoc = alarm.location || station?.location || 'Thân đập chính'
    const river = station?.river || ''
    const km = station?.km || ''

    const riverKm = [river, km].filter(Boolean).join(' ')
    const locDesc = riverKm ? `${stationLoc} — ${riverKm}` : stationLoc
    const fullLocation = `${stationName} (${locDesc}) thuộc ${damName} (${damLocation})`

    return { station, dam, stationId, damId, damName, damLocation, stationName, stationLoc, river, km, fullLocation }
  }

  const addEmailContact = () => {
    const trimmed = newEmailInput.trim().toLowerCase()
    if (!trimmed) return
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      alert('Vui lòng nhập định dạng Email hợp lệ!')
      return
    }
    if (emailList.includes(trimmed)) {
      alert('Email này đã tồn tại trong danh sách!')
      return
    }
    const updated = [...emailList, trimmed]
    setEmailList(updated)
    setNewEmailInput('')
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_email_recipients', JSON.stringify(updated))
    }
  }

  const removeEmailContact = (emailToRemove) => {
    const updated = emailList.filter(e => e !== emailToRemove)
    setEmailList(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_email_recipients', JSON.stringify(updated))
    }
  }

  // Scoped alarms cho Operator (Chỉ thấy đập phụ trách)
  const scopedAlarms = useMemo(() => {
    if (isOperator && assignedDamId) {
      return alarms.filter(a => a.damId === assignedDamId || !a.damId)
    }
    return alarms
  }, [alarms, isOperator, assignedDamId])

  // Danh sách trạm thuộc Đập được chọn (hoặc tất cả trạm)
  const availableStations = useMemo(() => {
    if (selectedDam === 'all') return stations
    return stations.filter(s => s.damId === selectedDam)
  }, [stations, selectedDam])

  // Reset station filter nếu đập thay đổi và trạm không còn thuộc đập đó
  useEffect(() => {
    if (selectedStation !== 'all') {
      const stillValid = availableStations.some(s => s.stationId === selectedStation)
      if (!stillValid) setSelectedStation('all')
    }
  }, [selectedDam, availableStations, selectedStation])

  // Lọc alarms theo Đập và Trạm được chọn
  const damStationScopedAlarms = useMemo(() => {
    return scopedAlarms.filter(a => {
      // Lọc theo Đập
      if (selectedDam !== 'all') {
        const stationOfAlarm = stations.find(s =>
          (a.stationId && s.stationId === a.stationId) ||
          (a.stationCode && s.stationCode === a.stationCode) ||
          (a.stationId && String(s.id) === String(a.stationId))
        )
        const aDamId = a.damId || stationOfAlarm?.damId
        if (aDamId !== selectedDam) return false
      }
      // Lọc theo Trạm
      if (selectedStation !== 'all') {
        const match =
          a.stationId === selectedStation ||
          (stations.find(s => s.stationId === selectedStation)?.stationCode === a.stationCode) ||
          (String(stations.find(s => s.stationId === selectedStation)?.id) === String(a.stationId))
        if (!match) return false
      }
      return true
    })
  }, [scopedAlarms, selectedDam, selectedStation, stations])

  // Filter alarms cho danh sách hiển thị
  const shown = useMemo(() => {
    if (filter === 'all') return damStationScopedAlarms
    if (filter === 'resolved') return damStationScopedAlarms.filter(a => a.resolvedAt)
    return damStationScopedAlarms.filter(a => a.severity === filter && !a.resolvedAt)
  }, [damStationScopedAlarms, filter])

  // Tự chọn alarm đầu tiên trong danh sách đã filter
  const sel = useMemo(() => {
    if (selId) {
      const found = shown.find(a => a.id === selId)
      if (found) return found
    }
    return shown[0] || null
  }, [selId, shown])

  // Counts per severity (dựa trên bộ lọc Đập/Trạm đang chọn)
  const counts = useMemo(() => ({
    CRITICAL: damStationScopedAlarms.filter(a => a.severity === 'CRITICAL' && !a.resolvedAt).length,
    ALERT: damStationScopedAlarms.filter(a => a.severity === 'ALERT' && !a.resolvedAt).length,
    WARNING: damStationScopedAlarms.filter(a => a.severity === 'WARNING' && !a.resolvedAt).length,
    resolved: damStationScopedAlarms.filter(a => a.resolvedAt).length,
  }), [damStationScopedAlarms])

  // Cập nhật message template khi chọn alarm khác
  const defaultMsg = useMemo(() => {
    if (!sel) return ''
    const sevInfo = SEVERITY_MAP[sel.severity] || SEVERITY_MAP.WARNING
    const typeLb = SENSOR_TYPE_LABELS[sel.sensorType] || sel.sensorType
    const unit = SENSOR_TYPE_UNITS[sel.sensorType] || ''
    const locInfo = getLocationInfo(sel)
    return `[${sevInfo.label}] Cảnh báo ${typeLb} tại vị trí: ${locInfo.fullLocation}. Giá trị đo: ${sel.measuredVal} ${unit} (Ngưỡng: ${sel.thresholdVal} ${unit}). ${sel.notes || ''}`
  }, [sel, dams, stations])

  // Tự động tải Email Cán bộ phụ trách Đập xảy ra sự cố khi chọn cảnh báo
  useEffect(() => {
    if (!sel) return
    const loc = getLocationInfo(sel)
    const targetDamId = sel.damId || 'dam_1'
    fetchDamManagers(targetDamId).then(res => {
      const managers = res.managers || []
      setDamManagers(managers)
      const managerEmails = managers.map(m => m.email).filter(Boolean)
      if (managerEmails.length > 0) {
        setEmailList(managerEmails)
      } else {
        setEmailList(['ruka13312002@gmail.com'])
      }
    }).catch(() => { })
  }, [sel])

  // Sensor data rows cho bảng chi tiết (dùng real alarm data)
  const sensorRows = useMemo(() => {
    if (!sel) return []
    // Lấy tối đa 4 alarm gần nhất cùng sensorType
    const related = alarms
      .filter(a => a.sensorType === sel.sensorType)
      .slice(0, 4)
      .reverse()

    return related.map(a => ({
      t: formatTime(a.triggeredAt),
      val: a.measuredVal,
      threshold: a.thresholdVal,
      severity: a.severity,
      unit: SENSOR_TYPE_UNITS[a.sensorType] || '',
    }))
  }, [sel, alarms])

  const handleSend = async () => {
    if (sending) return
    setSending(true)
    setStatusMsg('')
    try {
      const recipientsToSend = emailList.length > 0 ? emailList : ['ruka13312002@gmail.com']
      const data = await sendEmailAlert({
        toEmail: recipientsToSend,
        message: msg || defaultMsg,
        alarmId: sel?.id,
        damId: sel?.damId,
      })
      if (data.success) {
        setSent(true)
        setStatusMsg(data.message || 'Đã gửi Email cảnh báo thành công!')
        setTimeout(() => {
          setSent(false)
          setStatusMsg('')
        }, 5000)
      } else {
        setStatusMsg(data.message || 'Gửi email thất bại')
      }
    } catch (err) {
      console.error('[AlertsPage] Lỗi gửi email:', err)
      setStatusMsg('Lỗi kết nối tới Backend server')
    } finally {
      setSending(false)
    }
  }


  // Loading state
  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-48px)]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-[11px] text-muted">Đang tải dữ liệu cảnh báo...</div>
      </div>
    </div>
  )

  // Block Viewer role from viewing Emergency Alert Center
  if (isViewer) return (
    <div className="flex items-center justify-center h-[calc(100vh-48px)] p-6 font-sans">
      <Card glass className="p-8 max-w-md text-center space-y-4">
        <Shield className="w-12 h-12 text-danger mx-auto" />
        <h2 className="text-lg font-bold text-tx">Khu Vực Hạn Chế Phân Quyền</h2>
        <p className="text-xs text-muted">
          Tài khoản vai trò <strong className="text-accent">VIEWER (Khách quan sát)</strong> chỉ có quyền xem bản đồ & chỉ số tổng quan, không có quyền truy cập Trung tâm Cảnh Báo Khẩn Cấp.
        </p>
      </Card>
    </div>
  )

  return (
    <>
      <div className="grid gap-3 p-3 h-[calc(100vh-98px)] overflow-hidden font-sans"
        style={{ gridTemplateColumns: '330px minmax(0, 1fr) 340px' }}>

        {/* LEFT: Alert list */}
        <div className="overflow-y-auto">
          <div className="flex justify-between items-center mb-2.5">
            <Label className="mb-0">Cảnh báo gần đây</Label>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => exportAlarmsToExcel(shown, selectedDam !== 'all' ? selectedDam : 'He_Thong')}
                className="p-1 px-2 rounded-md bg-safe/10 border border-safe/30 text-safe text-[9px] font-bold flex items-center gap-1 hover:bg-safe/20 transition-colors cursor-pointer"
                title="Xuất toàn bộ danh sách cảnh báo đang lọc ra Excel"
              >
                <FileSpreadsheet className="w-3 h-3 shrink-0" />
                <span>Xuất Excel</span>
              </button>
              <Mono className="text-[9px] text-danger bg-danger-soft px-1.5 py-0.5 rounded-sm">
                {unresolvedCount} CHƯA XỬ LÝ
              </Mono>
            </div>
          </div>

          {/* ── BỘ LỌC ĐẬP & TRẠM (DAM & STATION FILTERS) ── */}
          <div className="bg-card border border-border/80 rounded-xl p-2.5 mb-2.5 space-y-2 shadow-sm">
            {/* Lọc theo Đập */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-muted mb-1 font-semibold">
                <span className="flex items-center gap-1 text-accent">
                  <Database className="w-3 h-3 text-accent" />
                  <span>Lọc theo Đập</span>
                </span>
                {selectedDam !== 'all' && !(isOperator && assignedDamId) && (
                  <button
                    type="button"
                    onClick={() => setSelectedDam('all')}
                    className="text-[9px] text-muted hover:text-tx cursor-pointer bg-transparent border-none p-0"
                  >
                    Tất cả
                  </button>
                )}
              </div>
              <select
                value={selectedDam}
                onChange={(e) => setSelectedDam(e.target.value)}
                disabled={isOperator && Boolean(assignedDamId)}
                className="w-full bg-card2 border border-border rounded-lg px-2 py-1 text-[11px] text-tx outline-none focus:border-accent transition-colors cursor-pointer"
              >
                <option value="all">Tất cả các đập ({dams.length})</option>
                {dams.map((d) => (
                  <option key={d.damId} value={d.damId}>
                    {d.damId} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Trạm */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-muted mb-1 font-semibold">
                <span className="flex items-center gap-1 text-sky-400">
                  <Radio className="w-3 h-3 text-sky-400" />
                  <span>Lọc theo Trạm</span>
                </span>
                {selectedStation !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedStation('all')}
                    className="text-[9px] text-muted hover:text-tx cursor-pointer bg-transparent border-none p-0"
                  >
                    Tất cả
                  </button>
                )}
              </div>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full bg-card2 border border-border rounded-lg px-2 py-1 text-[11px] text-tx outline-none focus:border-accent transition-colors cursor-pointer"
              >
                <option value="all">Tất cả các trạm ({availableStations.length})</option>
                {availableStations.map((st) => (
                  <option key={st.stationId} value={st.stationId}>
                    {st.stationCode ? `[${st.stationCode}] ` : ''}{st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex gap-1 mb-2.5 flex-wrap">
            {[
              ['all', 'Tất cả'],
              ['CRITICAL', `Nguy cấp (${counts.CRITICAL})`],
              ['ALERT', `Báo động (${counts.ALERT})`],
              ['WARNING', `Cảnh báo (${counts.WARNING})`],
              ['resolved', `Đã xử lý (${counts.resolved})`],
            ].map(([id, lb]) => (
              <button key={id} onClick={() => setFilter(id)}
                className={`px-2 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-colors
                ${filter === id ? 'bg-accent-soft border-accent-soft text-accent' : 'bg-transparent border-border text-muted hover:text-tx'}`}>
                {lb}
              </button>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-warning/10 border border-warning/30 rounded px-2.5 py-2 mb-2.5 text-[10px] text-warning flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Alarm list */}
          <div className="flex flex-col gap-1.5">
            {shown.length === 0 && (
              <div className="text-center py-8 text-[11px] text-muted">
                {error ? 'Không thể kết nối backend' : 'Không có cảnh báo nào'}
              </div>
            )}
            {shown.map(al => {
              const s = getStatusBySeverity(al.severity)
              const sevInfo = SEVERITY_MAP[al.severity] || SEVERITY_MAP.WARNING
              const isSel = sel?.id === al.id
              const typeLb = SENSOR_TYPE_LABELS[al.sensorType] || al.sensorType
              const loc = getLocationInfo(al)

              return (
                <div key={al.id} onClick={() => setSelId(al.id)}
                  className={`border-l-[3px] ${s.leftBorder} rounded-lg p-2.5 cursor-pointer transition-all
                  ${isSel ? `${s.bg} ${s.border} border` : 'bg-card border border-border hover:bg-card2/60'}
                  ${al.resolvedAt ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between mb-1">
                    <Mono className={`text-[10px] uppercase font-bold ${s.text} flex items-center gap-1`}>
                      {sevInfo.icon && <sevInfo.icon className="w-3 h-3 shrink-0" />}
                      <span>{sevInfo.label}</span>
                    </Mono>
                    <Mono className="text-[10px] text-muted">{timeAgo(al.triggeredAt)} TRƯỚC</Mono>
                  </div>

                  <div className="text-[12px] font-bold text-tx mb-1">
                    {typeLb}: {al.measuredVal} {SENSOR_TYPE_UNITS[al.sensorType] || ''}
                  </div>

                  {/* Vị trí Trạm & Đập */}
                  <div className="text-[10px] text-muted space-y-0.5 my-1 bg-card2 p-1.5 rounded border border-border/40">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 text-tx font-medium truncate">
                        <Radio className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="truncate">{loc.stationName} ({loc.stationLoc})</span>
                      </div>
                      {loc.stationId && (
                        <Link
                          href={`/stations/${loc.stationId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[9px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-0.5 hover:underline shrink-0 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 transition-colors"
                          title="Xem chi tiết tại trạm này"
                        >
                          <span>Trạm</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted truncate">
                      <Database className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="truncate">{loc.damName} ({loc.damLocation})</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-muted line-clamp-2">{al.notes}</div>
                  {al.resolvedAt && (
                    <Mono className="text-[9px] text-safe mt-1 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>Đã xử lý</span>
                    </Mono>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* CENTER: Detail */}
        {sel && (() => {
          const s = getStatusBySeverity(sel.severity)
          const sevInfo = SEVERITY_MAP[sel.severity] || SEVERITY_MAP.WARNING
          const typeLb = SENSOR_TYPE_LABELS[sel.sensorType] || sel.sensorType
          const unit = SENSOR_TYPE_UNITS[sel.sensorType] || ''
          const triggeredDate = sel.triggeredAt ? new Date(sel.triggeredAt) : null
          const loc = getLocationInfo(sel)

          return (
            <div className="overflow-y-auto space-y-3">
              {/* Header */}
              <Card className="flex justify-between items-start p-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="text-xl font-bold text-tx m-0">{typeLb} vượt ngưỡng</h2>
                    <span className={`font-mono text-[11px] font-bold ${s.text} ${s.bg} ${s.border} border px-2.5 py-0.5 rounded flex items-center gap-1`}>
                      {sevInfo.icon && <sevInfo.icon className="w-3 h-3 shrink-0" />}
                      <span>{sevInfo.label}</span>
                    </span>
                    {sel.resolvedAt && (
                      <span className="font-mono text-[11px] font-bold text-safe bg-safe-soft border border-safe-soft px-2.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>ĐÃ XỬ LÝ</span>
                      </span>
                    )}
                  </div>
                  <Mono className="text-[11px] text-muted flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-muted shrink-0" /> {triggeredDate?.toLocaleDateString('vi-VN')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-muted shrink-0" /> {triggeredDate?.toLocaleTimeString('vi-VN')}</span>
                    <span className="flex items-center gap-1"><Fingerprint className="w-3.5 h-3.5 text-muted shrink-0" /> ID: {sel.id || sel.sensorId}</span>
                  </Mono>
                </div>
                <div className="flex gap-2 flex-wrap items-center">

                  {!sel.resolvedAt && (
                    <button onClick={() => resolveAlarm(sel.id)}
                      className="px-3 py-1.5 border border-safe/40 rounded-lg bg-safe/10 text-safe text-[11px] font-bold cursor-pointer hover:bg-safe/20 transition-colors flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Đánh dấu đã xử lý</span>
                    </button>
                  )}

                  {/* Nút Xuất Excel */}
                  <button
                    onClick={() => exportAlarmsToExcel(shown, loc.damName)}
                    className="px-3 py-1.5 border border-safe/40 rounded-lg bg-safe/10 text-safe text-[11px] font-bold cursor-pointer hover:bg-safe/20 transition-colors flex items-center gap-1"
                    title="Xuất bảng nhật ký cảnh báo ra file Excel"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                    <span>Xuất Excel</span>
                  </button>

                  {/* Nút Xuất PDF Báo Cáo */}
                  <button
                    onClick={() => exportAlarmToPDF(sel, loc, user)}
                    className="px-3 py-1.5 border border-accent/40 rounded-lg bg-accent/10 text-accent text-[11px] font-bold cursor-pointer hover:bg-accent/20 transition-colors flex items-center gap-1"
                    title="Xuất phiếu báo cáo sự cố PDF chính thức"
                  >
                    <Printer className="w-3.5 h-3.5 shrink-0" />
                    <span>Xuất PDF</span>
                  </button>
                </div>
              </Card>

              {/* DEDICATED LOCATION CARD */}
              <div className="bg-card2/60 border border-border rounded-xl p-4 shadow-panel space-y-2">
                <div className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-accent shrink-0" />
                  <span>VỊ TRÍ XẢY RA CẢNH BÁO</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Đập thủy điện */}
                  <Card className="p-3 flex items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted uppercase font-semibold">Đập Thủy Điện</div>
                        <div className="text-[13px] font-bold text-tx">{loc.damName}</div>
                        <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-muted shrink-0" />
                          <span>Vị trí đập: <strong>{loc.damLocation}</strong></span>
                        </div>
                      </div>
                    </div>
                    {loc.damId && (
                      <Link
                        href={`/dams/${loc.damId}`}
                        className="px-2.5 py-1.5 text-[10px] font-semibold text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-lg flex items-center gap-1 shrink-0 transition-colors no-underline"
                        title="Xem chi tiết đập thủy điện"
                      >
                        <span>Chi tiết đập</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                    )}
                  </Card>

                  {/* Trạm quan trắc */}
                  <Card className="p-3 flex items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-info/15 text-info border border-info/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted uppercase font-semibold">Trạm Quan Trắc</div>
                        <div className="text-[13px] font-bold text-tx">{loc.stationName}</div>
                        <div className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-muted shrink-0" />
                          <span>Vị trí: <strong>{loc.stationLoc}</strong> </span>
                        </div>
                      </div>
                    </div>
                    {loc.stationId && (
                      <Link
                        href={`/stations/${loc.stationId}`}
                        className="px-2.5 py-1.5 text-[10px] font-semibold text-sky-400 bg-sky-400/10 hover:bg-sky-400/20 border border-sky-400/30 rounded-lg flex items-center gap-1 shrink-0 transition-colors no-underline shadow-sm"
                        title="Xem dữ liệu trực tiếp tại trạm quan trắc"
                      >
                        <Radio className="w-3 h-3 shrink-0" />
                        <span>Xem tại trạm</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </Link>
                    )}
                  </Card>
                </div>
              </div>

              {/* Metrics Cards */}
              <div className="grid gap-2.5 mb-3" style={{ gridTemplateColumns: '1.3fr 1fr 1fr' }}>
                {/* Camera AI */}
                <Card className="p-3">
                  <div className="flex justify-between mb-2">
                    <Mono className="text-[9px] text-tx">Camera AI — {sel.sensorId}</Mono>
                    <Mono className={`text-[7px] ${sel.cameraActivated ? 'text-safe' : 'text-muted'}`}>
                      {sel.cameraActivated ? '● ACTIVE' : '○ STANDBY'}
                    </Mono>
                  </div>
                  <div className={`bg-card2 rounded ${sel.imageUrl ? 'h-48' : 'h-20'} overflow-hidden flex items-center justify-center relative mb-2`}>
                    {sel.imageUrl ? (
                      <img src={getFormattedImageUrl(sel.imageUrl)} alt="AI Camera Capture" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-muted opacity-30 shrink-0" />
                    )}
                    {sel.cameraActivated && (
                      <div className="absolute top-1.5 left-1.5 font-mono text-[7px] text-danger bg-danger-soft border border-danger-soft px-1.5 py-0.5 rounded">
                        {sel.crackDetected === null || sel.crackDetected === undefined ? (
                          'ĐANG PHÂN TÍCH...'
                        ) : sel.crackDetected ? (
                          `NỨT VỠ (${((sel.crackConfidence || 0) * 100).toFixed(0)}%)`
                        ) : (
                          'AN TOÀN (0%)'
                        )}
                      </div>
                    )}
                    <Mono className="absolute bottom-1 left-1.5 text-[7px] text-muted bg-black/60 px-1 rounded-sm">
                      {triggeredDate?.toLocaleTimeString('vi-VN')} | {sel.damId}
                    </Mono>
                    {sel.imageUrl && (
                      <button onClick={() => setFullImg(true)}
                        className="absolute bottom-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded bg-black/60 hover:bg-black/80 border border-white/20 text-white cursor-pointer transition-all hover:scale-110"
                        title="Xem ảnh đầy đủ">
                        <Maximize2 className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-tx leading-relaxed">{sel.notes}</p>
                </Card>

                {/* Giá trị đo */}
                <Card className="p-3.5 flex flex-col justify-center">
                  <Label className="mb-2">Giá trị đo</Label>
                  <Mono className={`text-2xl font-bold ${s.text}`}>{sel.measuredVal} {unit}</Mono>
                  <p className="text-[12px] text-muted mt-1.5">Ngưỡng: {sel.thresholdVal} {unit}</p>
                  <div className="h-1 bg-border rounded-full mt-2">
                    <div className={`h-full rounded-full ${s.dot} opacity-85`}
                      style={{ width: `${Math.min((sel.measuredVal / (sel.thresholdVal * 1.5)) * 100, 100)}%` }} />
                  </div>
                </Card>

                {/* Duration / Thông tin thêm */}
                <Card className="p-3.5 flex flex-col justify-center">
                  <Label className="mb-2">Thời gian vượt ngưỡng</Label>
                  <Mono className={`text-2xl font-bold ${s.text}`}>
                    {sel.durationS > 0 ? `${sel.durationS.toFixed(3)}s` : 'Tức thì'}
                  </Mono>
                  <p className="text-[12px] text-tx font-bold mt-1.5">
                    Loại: {typeLb}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {sel.cameraActivated && (
                      <span className="text-[10px] font-mono text-info bg-info-soft border border-info-soft px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Camera className="w-3 h-3" />
                        <span>CAM</span>
                      </span>
                    )}
                    {sel.crackDetected && (
                      <span className="text-[10px] font-mono text-danger bg-danger-soft border border-danger-soft px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        <span>NỨT</span>
                      </span>
                    )}
                  </div>
                </Card>
              </div>

              {/* Sensor table — Lịch sử cảnh báo cùng loại */}
              <Card className="overflow-hidden">
                <div className="flex justify-between items-center px-3.5 py-2.5 border-b border-border/70">
                  <span className="text-[11px] text-muted font-bold tracking-[0.14em] uppercase">Lịch sử cảnh báo — {typeLb}</span>
                  <Mono className="text-[11px] text-tx">{sensorRows.length} bản ghi</Mono>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-card2/60">
                      {['THỜI GIAN', 'GIÁ TRỊ ĐO', 'NGƯỠNG', 'MỨC CẢNH BÁO'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] text-muted font-bold uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sensorRows.map((r, i) => {
                      const rs = getStatusBySeverity(r.severity)
                      const ri = SEVERITY_MAP[r.severity] || SEVERITY_MAP.WARNING
                      return (
                        <tr key={i} className="border-t border-border/70">
                          <td className="px-3 py-2"><Mono className="text-[12px] text-muted">{r.t}</Mono></td>
                          <td className="px-3 py-2"><Mono className={`text-[13px] font-bold ${rs.text}`}>{r.val} {r.unit}</Mono></td>
                          <td className="px-3 py-2"><Mono className="text-[12px] text-tx">{r.threshold} {r.unit}</Mono></td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold tracking-widest border rounded-[3px] px-1.5 py-0.5 ${rs.text} ${rs.bg} ${rs.border}`}>
                              {ri.icon && <ri.icon className="w-2.5 h-2.5 shrink-0" />}
                              <span>{ri.label}</span>
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {sensorRows.length === 0 && (
                      <tr><td colSpan={4} className="px-3 py-4 text-center text-[10px] text-muted">Chưa có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          )
        })()}

        {/* No selection placeholder */}
        {!sel && (
          <div className="flex items-center justify-center">
            <div className="text-center text-muted flex flex-col items-center">
              <Bell className="w-8 h-8 mb-2 opacity-30 text-muted shrink-0" />
              <div className="text-[12px]">Chưa có cảnh báo nào</div>
              <div className="text-[10px] mt-1">Hệ thống sẽ tự động hiển thị khi phát hiện bất thường</div>
            </div>
          </div>
        )}

        {/* RIGHT: Dispatch */}
        <div className="overflow-y-auto">
          <Card className="p-3 mb-2.5">
            <Mono className="text-[8px] text-muted tracking-widest block mb-1">ĐIỀU PHỐI</Mono>
            <div className="text-[13px] font-bold text-tx mb-3">TRUNG TÂM CHỈ HUY KHẨN CẤP</div>
            <button className="w-full py-2 mb-2 rounded-md text-white text-[11px] font-bold tracking-wide border-none cursor-pointer bg-gradient-to-r from-danger to-danger/70 shadow-glow-danger flex items-center justify-center gap-1.5">
              <Bell className="w-3.5 h-3.5 animate-bounce shrink-0" />
              <span>KÍCH HOẠT CÒI BÁO ĐỘNG</span>
            </button>
            <button className="w-full py-2 rounded-md border border-border bg-transparent text-tx text-[11px] font-bold tracking-wide cursor-pointer hover:bg-card2 transition-colors flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-muted shrink-0" />
              <span>PHÊ DUYỆT SOP — P-03</span>
            </button>
          </Card>

          <Card className="p-3">
            <div className="text-[12px] font-bold text-tx mb-3">GỬI THÔNG BÁO KHẨN CẤP</div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <Label className="mb-0">Danh sách Email nhận thông báo ({emailList.length})</Label>
              </div>

              {/* Thông tin Cán bộ quản lý đập được phân công */}
              {damManagers.length > 0 && (
                <div className="text-[9px] text-safe bg-safe-soft border border-safe-soft px-2 py-1 rounded mb-2 font-semibold flex items-center justify-between">
                  <span>Cán bộ phụ trách Đập ({sel?.damId || 'Sự cố'}):</span>
                  <span className="font-mono text-tx font-bold">{damManagers.map(m => m.fullName || m.username).join(', ')}</span>
                </div>
              )}

              {/* Danh sách Email dạng thẻ (Badges) do Admin quản lý */}
              <div className="flex flex-wrap gap-1.5 mb-2 max-h-28 overflow-y-auto bg-card2 border border-border p-2 rounded-lg">
                {emailList.map(email => (
                  <span key={email} className="inline-flex items-center gap-1 bg-accent-soft border border-accent/40 text-accent font-mono text-[9px] px-2 py-0.5 rounded-full">
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmailContact(email)}
                      className="hover:text-danger cursor-pointer ml-1 font-bold text-[11px] border-none bg-transparent text-accent/70"
                      title="Xóa Email này"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {emailList.length === 0 && (
                  <span className="text-[9px] text-muted p-1">Danh sách trống. Hãy thêm Email thật của Admin bên dưới.</span>
                )}
              </div>

              {/* Form Admin tự thêm Email thật mới */}
              <div className="flex gap-1.5 items-start">
                <TextInput
                  icon={Mail}
                  type="email"
                  value={newEmailInput}
                  onChange={e => setNewEmailInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmailContact())}
                  placeholder="Thêm Email người nhận mới..."
                  className="text-[10px] py-1.5"
                />
                <Button type="button" variant="secondary" onClick={addEmailContact} className="shrink-0 py-1.5">
                  + Thêm Email
                </Button>
              </div>
            </div>

            <div className="mb-2.5">
              <Label className="mb-1.5">Phương thức liên lạc</Label>
              <div className="flex gap-1.5">
                {[['sms', 'SMS'], ['zalo', 'Zalo'], ['email', 'Email (Mặc định)']].map(([k, lb]) => (
                  <button key={k} onClick={() => setModes(p => ({ ...p, [k]: !p[k] }))}
                    className={`flex-1 py-1.5 rounded border text-[10px] font-semibold cursor-pointer transition-colors
                    ${modes[k] ? 'bg-accent-soft border-accent text-accent' : 'bg-transparent border-border text-muted hover:text-tx'}`}>
                    {lb}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-2.5">
              <div className="flex justify-between mb-1.5">
                <Label className="mb-0">Nội dung cảnh báo</Label>
                <span className="text-[9px] text-accent cursor-pointer font-semibold hover:underline"
                  onClick={() => setMsg(defaultMsg)}>
                  Mẫu soạn sẵn
                </span>
              </div>
              <Textarea
                value={msg || defaultMsg}
                onChange={e => setMsg(e.target.value)}
                rows={4}
                maxLength={500}
                className="text-[10px] py-2 leading-relaxed"
              />
              <Mono className="text-[8px] text-muted">{(msg || defaultMsg).length}/500 ký tự</Mono>
            </div>

            {statusMsg && (
              <div className={`p-2 rounded-lg text-[10px] font-semibold mb-2.5 ${sent ? 'bg-safe-soft text-safe border border-safe-soft' : 'bg-warning-soft text-warning border border-warning-soft'}`}>
                {statusMsg}
              </div>
            )}

            <button onClick={handleSend} disabled={sending}
              className={`w-full py-2 rounded-md border-none text-white text-[11px] font-bold tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1.5
              ${sent ? 'bg-gradient-to-r from-safe to-safe/70 shadow-glow-safe' : 'bg-gradient-to-r from-danger to-danger/70 shadow-glow-danger'} ${sending ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>ĐANG GỬI EMAIL...</span>
                </>
              ) : sent ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>ĐÃ GỬI THÀNH CÔNG</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span>GỬI THÔNG BÁO KHẨN CẤP</span>
                </>
              )}
            </button>


            <Divider />

            {/* Nhật ký — từ alarm events gần nhất */}
            <div className="text-[11px] font-bold text-tx mb-2">Nhật ký hoạt động</div>
            {alarms.slice(0, 5).map((al, i) => {
              const sevInfo = SEVERITY_MAP[al.severity] || SEVERITY_MAP.WARNING
              const typeLb = SENSOR_TYPE_LABELS[al.sensorType] || al.sensorType
              const dotCl = al.resolvedAt ? 'bg-safe' : al.severity === 'CRITICAL' ? 'bg-danger' : 'bg-warning'
              return (
                <div key={al.id || i} className="flex gap-2 mb-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${dotCl} mt-1.5 shrink-0`} />
                  <div>
                    <div className="text-[10px] text-tx flex items-center gap-1">
                      {al.resolvedAt ? (
                        <CheckCircle2 className="w-3 h-3 text-safe shrink-0" />
                      ) : (
                        sevInfo.icon && <sevInfo.icon className="w-3 h-3 shrink-0 text-current" />
                      )}
                      <span>
                        {al.resolvedAt ? 'Đã xử lý: ' : ''}
                        {typeLb} — {al.measuredVal} {SENSOR_TYPE_UNITS[al.sensorType] || ''}
                      </span>
                    </div>
                    <Mono className="text-[8px] text-muted">
                      {timeAgo(al.triggeredAt)} TRƯỚC — {al.resolvedAt ? 'Admin' : 'Hệ thống'}
                    </Mono>
                  </div>
                </div>
              )
            })}
            {alarms.length === 0 && (
              <div className="text-[10px] text-muted text-center py-2">Chưa có hoạt động</div>
            )}
          </Card>
        </div>
      </div>

      {/* Fullscreen image modal */}
      {fullImg && sel?.imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setFullImg(false)}>
          <button onClick={() => setFullImg(false)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer transition-colors z-10">
            <X className="w-4 h-4" />
          </button>
          <img src={getFormattedImageUrl(sel.imageUrl)} alt="AI Camera Capture — Full" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
````

## File: app/dams/[id]/page.jsx
````javascript
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { getSocket } from '@/lib/socket'
import { getStatus } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Panel, RadialGauge, LiveDot } from '@/components/ui'
import { Field, TextInput, Select, Modal, FormActions, Button, Toast } from '@/components/form'
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Database,
  Radio,
  MapPin,
  ExternalLink,
  ArrowLeft,
  Droplet,
  Activity,
  Sliders,
  Zap,
  Map as MapIcon,
} from 'lucide-react'
import { fetchNodes, updateNode } from '@/lib/api'
import DamMap from '@/components/DamMap'
import LocationPickerMap from '@/components/LocationPickerMap'

export default function DamDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const {
    dams,
    stations,
    loading,
    error,
    refetch,
    createDam,
    updateDam,
    deleteDam,
    createStation,
    updateStation,
    deleteStation,
  } = useDamData()
  const { t, locale } = useLanguage()
  const { isAdmin, isOperator, isViewer, assignedDamId } = useAuth()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('map') // 'map' | 'stations'
  const tabBtnClass = (active) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer border-none transition-colors ${
      active ? 'bg-accent/15 text-accent' : 'bg-transparent text-muted hover:text-tx hover:bg-white/5'
    }`

  // Real-time Socket.IO live updating for station sensors
  const [liveStationMap, setLiveStationMap] = useState({})

  useEffect(() => {
    const socket = getSocket()
    const onUpdate = (snapshot) => {
      if (!snapshot) return
      const stId = snapshot.stationId
      if (stId) {
        setLiveStationMap(prev => ({
          ...prev,
          [stId]: {
            waterLevel: snapshot.waterLevel,
            humidity: snapshot.moisture,
            vibration: snapshot.amp,
            freq: snapshot.freq,
            clusterId: snapshot.clusterId,
            timestamp: snapshot.timestamp || new Date().toISOString(),
            status: 'online',
          }
        }))
      }
    }

    socket.on('update', onUpdate)
    socket.connect()

    return () => {
      socket.off('update', onUpdate)
    }
  }, [])

  // Modals state for Dam
  const [damModalOpen, setDamModalOpen] = useState(false)
  const [deleteDamConfirm, setDeleteDamConfirm] = useState(false)
  const [savingDam, setSavingDam] = useState(false)
  const [deletingDam, setDeletingDam] = useState(false)
  // Chỉ chứa thông tin tĩnh do người dùng nhập. Mực nước / mức chứa / trạng thái an toàn
  // đều do backend tự tính từ cảm biến nên không đưa vào form (sửa tay sẽ bị ghi đè ngay).
  const [damForm, setDamForm] = useState({
    name: '',
    location: '',
    latitude: 20.8167,
    longitude: 105.3265,
    cameraUrl: '',
  })

  // Modals state for Stations
  const [stationModalOpen, setStationModalOpen] = useState(false)
  const [editingStation, setEditingStation] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name }
  const [savingStation, setSavingStation] = useState(false)
  const [deletingStation, setDeletingStation] = useState(false)

  const damId = String(id)
  // Fallback khi chưa tải xong / không tìm thấy: KHÔNG bịa số đo, để 0 + trạng thái 'unknown'
  // thay vì hiển thị số liệu giả trông như thật.
  const dam = dams.find(d => d.damId === damId) || {
    damId,
    name: `Đập ${damId}`,
    location: '',
    waterLevel: 0,
    fillPct: 0,
    status: 'unknown',
    cameraUrl: '',
  }
  const damStatus = getStatus(dam.status)

  // Filter stations for this dam
  const damStations = useMemo(() => {
    return stations.filter(st => {
      const isThisDam = st.damId === damId
      const matchesSearch = !search || st.name.toLowerCase().includes(search.toLowerCase()) || (st.location && st.location.toLowerCase().includes(search.toLowerCase()))
      return isThisDam && matchesSearch
    })
  }, [stations, damId, search])

  // Station Pagination state & calculation
  const [stationPage, setStationPage] = useState(1)
  const STATIONS_PER_PAGE = 6

  // Reset page when search or damId changes
  useEffect(() => {
    setStationPage(1)
  }, [search, damId])

  const totalStationPages = Math.ceil(damStations.length / STATIONS_PER_PAGE) || 1

  // Clamp current page if needed
  useEffect(() => {
    setStationPage(p => Math.min(p, totalStationPages))
  }, [totalStationPages])

  const paginatedStations = useMemo(() => {
    const start = (stationPage - 1) * STATIONS_PER_PAGE
    return damStations.slice(start, start + STATIONS_PER_PAGE)
  }, [damStations, stationPage])

  // Dam Handlers
  const [damEditErrors, setDamEditErrors] = useState({})

  const validateDamEditForm = () => {
    const errs = {}
    if (!damForm.name || !damForm.name.trim()) {
      errs.name = 'Vui lòng nhập tên đập thủy điện'
    } else if (damForm.name.trim().length < 3) {
      errs.name = 'Tên đập phải có ít nhất 3 ký tự'
    }

    const lat = Number(damForm.latitude)
    if (damForm.latitude === '' || isNaN(lat)) {
      errs.latitude = 'Vui lòng nhập vĩ độ hợp lệ'
    } else if (lat < -90 || lat > 90) {
      errs.latitude = 'Vĩ độ phải từ -90° đến 90°'
    }

    const lng = Number(damForm.longitude)
    if (damForm.longitude === '' || isNaN(lng)) {
      errs.longitude = 'Vui lòng nhập kinh độ hợp lệ'
    } else if (lng < -180 || lng > 180) {
      errs.longitude = 'Kinh độ phải từ -180° đến 180°'
    }

    setDamEditErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openEditDamModal = () => {
    setDamEditErrors({})
    setDamForm({
      name: dam.name || '',
      location: dam.location || '',
      latitude: dam.latitude ?? 20.8167,
      longitude: dam.longitude ?? 105.3265,
      cameraUrl: dam.cameraUrl || '',
    })
    setDamModalOpen(true)
  }

  const handleSaveDam = async (e) => {
    e.preventDefault()
    if (!validateDamEditForm()) return

    try {
      setSavingDam(true)
      await updateDam(dam.damId, {
        name: damForm.name.trim(),
        location: damForm.location.trim(),
        latitude: Number(damForm.latitude),
        longitude: Number(damForm.longitude),
        cameraUrl: damForm.cameraUrl,
      })
      showToast('Cập nhật thông tin đập thành công!', 'success')
      setDamModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingDam(false)
    }
  }

  const handleConfirmDeleteDam = async () => {
    try {
      setDeletingDam(true)
      await deleteDam(dam.damId)
      showToast(`Đã xóa đập thủy điện ${dam.name}!`, 'success')
      setDeleteDamConfirm(false)
      setTimeout(() => {
        router.push('/dams')
      }, 1000)
    } catch (err) {
      showToast(`Lỗi khi xóa đập: ${err.message}`, 'error')
    } finally {
      setDeletingDam(false)
    }
  }

  // Toast State
  const [toast, setToast] = useState(null) // { message: string, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Form state for Station
  const [stationForm, setStationForm] = useState({
    name: '',
    location: '',
    latitude: 21.0381,
    longitude: 105.8492,
    river: '',
    km: '',
    damId: damId,
  })
  const [stationErrors, setStationErrors] = useState({})

  const validateStationForm = () => {
    const errs = {}
    if (!stationForm.name || !stationForm.name.trim()) {
      errs.name = 'Vui lòng nhập tên trạm quan trắc'
    } else if (stationForm.name.trim().length < 3) {
      errs.name = 'Tên trạm phải có ít nhất 3 ký tự'
    } else {
      const isDuplicate = damStations.some(
        s => s.name.trim().toLowerCase() === stationForm.name.trim().toLowerCase() && s.stationId !== editingStation?.stationId
      )
      if (isDuplicate) {
        errs.name = 'Trạm quan trắc với tên này đã tồn tại trên đập này!'
      }
    }

    const lat = Number(stationForm.latitude)
    if (stationForm.latitude === '' || isNaN(lat)) {
      errs.latitude = 'Vui lòng nhập vĩ độ hợp lệ'
    } else if (lat < -90 || lat > 90) {
      errs.latitude = 'Vĩ độ phải từ -90° đến 90°'
    }

    const lng = Number(stationForm.longitude)
    if (stationForm.longitude === '' || isNaN(lng)) {
      errs.longitude = 'Vui lòng nhập kinh độ hợp lệ'
    } else if (lng < -180 || lng > 180) {
      errs.longitude = 'Kinh độ phải từ -180° đến 180°'
    }

    setStationErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openCreateStationModal = () => {
    setEditingStation(null)
    setStationErrors({})
    setStationForm({
      name: '',
      location: dam.location || '',
      latitude: dam.latitude || 21.0381,
      longitude: dam.longitude || 105.8492,
      river: 'Sông Hồng',
      km: 'K10+000',
      damId: damId,
    })
    setStationModalOpen(true)
  }

  const openEditStationModal = (st) => {
    setEditingStation(st)
    setStationErrors({})
    setStationForm({
      name: st.name || '',
      location: st.location || '',
      latitude: st.latitude ?? 21.0381,
      longitude: st.longitude ?? 105.8492,
      river: st.river || '',
      km: st.km || '',
      damId: st.damId || damId,
    })
    setStationModalOpen(true)
  }

  const handleSaveStation = async (e) => {
    e.preventDefault()
    if (!validateStationForm()) return

    try {
      setSavingStation(true)
      if (editingStation) {
        await updateStation(editingStation.stationId, {
          name: stationForm.name.trim(),
          location: stationForm.location.trim(),
          latitude: Number(stationForm.latitude),
          longitude: Number(stationForm.longitude),
          river: stationForm.river.trim(),
          km: stationForm.km.trim(),
          damId: damId,
        })
        showToast('Cập nhật trạm quan trắc thành công!', 'success')
      } else {
        await createStation({
          ...stationForm,
          name: stationForm.name.trim(),
          location: stationForm.location.trim(),
          river: stationForm.river.trim(),
          km: stationForm.km.trim(),
          latitude: Number(stationForm.latitude),
          longitude: Number(stationForm.longitude),
          damId: damId,
        })
        showToast(`Tạo trạm "${stationForm.name}" thành công!`, 'success')
      }
      setStationModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingStation(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      setDeletingStation(true)
      await deleteStation(deleteConfirm.id)
      showToast(`Đã xóa trạm ${deleteConfirm.name}!`, 'success')
      setDeleteConfirm(null)
      refetch(true)
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error')
    } finally {
      setDeletingStation(false)
    }
  }

  // Operator Restriction: Cannot access other dams
  if (isOperator && assignedDamId && assignedDamId !== id) {
    return (
      <div className="p-8 min-h-[calc(100vh-48px)] flex items-center justify-center">
        <div className="bg-card border border-border max-w-md w-full rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto border border-danger/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-tx">Truy cập bị giới hạn</h2>
          <p className="text-xs text-muted leading-relaxed">
            Bạn là Cán bộ phụ trách đập <strong className="text-accent">{assignedDamId}</strong>. Bạn không có quyền truy cập hoặc xem dữ liệu của đập khác.
          </p>
          <Link
            href={`/dams/${assignedDamId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white font-bold text-xs rounded-xl no-underline hover:bg-accent/90"
          >
            <span>Về trang Đập của bạn ({assignedDamId})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 min-h-[calc(100vh-48px)] space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px]">
        <Link href="/dams" className="text-muted no-underline hover:text-tx flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('damDetail.breadcrumbDams')}</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-muted shrink-0" />
        <span className="text-tx font-bold">{dam.name}</span>
      </div>

      {/* Dam Summary Card */}
      <div className={`bg-card border border-border border-l-4 ${damStatus.leftBorder} rounded-xl p-5 shadow-panel`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-accent bg-accent/10 px-2.5 py-0.5 rounded border border-accent/20">
                {dam.damId}
              </span>
              <h1 className="text-xl font-bold text-tx tracking-wide m-0">{dam.name}</h1>
              <Badge status={dam.status} title={dam.statusReason} />
            </div>
            {dam.location && (
              <div className="text-[11px] text-muted flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>{dam.location}</span>
              </div>
            )}
            {dam.statusReason && (
              <div className={`mt-2 text-[10px] flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
                dam.status === 'safe'
                  ? 'bg-safe/5 text-safe/90 border-safe/20'
                  : dam.status === 'unknown'
                    ? 'bg-card2 text-muted border-border/50'
                    : 'bg-danger/10 text-danger border-danger/30 font-semibold'
              }`}>
                <span className="shrink-0">ⓘ</span>
                <span><strong>Lý do:</strong> {dam.statusReason}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Dam Action Buttons: Sửa, Xóa */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 border-r border-border/60 pr-3">
                <button
                  onClick={openEditDamModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-accent text-[11px] font-bold bg-card2 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Sửa thông tin Đập"
                >
                  <Pencil className="w-3.5 h-3.5 shrink-0" />
                  <span>Sửa đập</span>
                </button>
                <button
                  onClick={() => setDeleteDamConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-danger/30 rounded-lg text-danger text-[11px] font-bold bg-danger/10 hover:bg-danger/20 transition-colors cursor-pointer"
                  title="Xóa Đập Thủy Điện"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Xóa đập</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-4 bg-card2 border border-border rounded-xl p-3">
              <RadialGauge value={dam.fillPct} size={65} stroke={5} status={dam.status} sublabel={t('damsPage.fillCapacity')} />
              <Divider vertical />
              <div>
                <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.waterLevel')}</div>
                <Mono className={`text-base font-bold ${damStatus.text}`}>{dam.waterLevel} m</Mono>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABBED SECTION: BẢN ĐỒ / TRẠM QUAN TRẮC ── */}
      <div className="bg-card border border-border rounded-xl shadow-panel overflow-hidden flex flex-col">
        {/* Tab Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-card2/70 border-b border-border/70 gap-2 shrink-0">
          <div className="flex items-center gap-1.5" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'map'}
              onClick={() => setActiveTab('map')}
              className={tabBtnClass(activeTab === 'map')}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Bản đồ</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'stations'}
              onClick={() => setActiveTab('stations')}
              className={tabBtnClass(activeTab === 'stations')}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Trạm quan trắc</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border font-bold ${
                  activeTab === 'stations'
                    ? 'bg-accent/20 border-accent/40 text-accent'
                    : 'bg-card border-border text-muted'
                }`}
              >
                {damStations.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'map' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-safe/10 border border-safe/20 mr-1">
                <LiveDot active />
                <span className="text-[9px] font-mono text-safe font-bold">LIVE</span>
              </span>
            ) : (
              <>
                {/* Search box inside stations tab */}
                <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 w-48 sm:w-56 focus-within:border-accent transition-colors">
                  <Search className="w-3.5 h-3.5 text-muted shrink-0" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('damDetail.searchStation')}
                    className="bg-transparent border-none outline-none text-tx text-[11px] w-full placeholder:text-muted"
                  />
                </div>

                {/* ── HEADER / TOP PAGINATION CONTROLS (ĐẦU DANH SÁCH) ── */}
                {totalStationPages > 1 && (
                  <div className="flex items-center gap-1 bg-card px-1.5 py-1 rounded-lg border border-border/80 text-[10px]">
                    <button
                      disabled={stationPage === 1}
                      onClick={() => setStationPage((p) => Math.max(p - 1, 1))}
                      className="p-1 text-muted hover:text-tx disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-transparent border-none flex items-center"
                      title="Trang trước"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-tx px-1">
                      {stationPage} / {totalStationPages}
                    </span>
                    <button
                      disabled={stationPage >= totalStationPages}
                      onClick={() => setStationPage((p) => Math.min(p + 1, totalStationPages))}
                      className="p-1 text-muted hover:text-tx disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-transparent border-none flex items-center"
                      title="Trang sau"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-tx text-[11px] font-semibold bg-card hover:bg-white/5 transition-colors cursor-pointer"
              title={t('stationsPage.refresh')}
            >
              <RefreshCw className="w-3.5 h-3.5 text-accent" />
              <span>{t('stationsPage.refresh')}</span>
            </button>

            {!isViewer && (
              <button
                onClick={openCreateStationModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent/90 rounded-md text-white text-[11px] font-bold cursor-pointer border-none transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('damDetail.addStation')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'map' ? (
          <div className="w-full relative [&_.leaflet-container]:rounded-b-xl overflow-hidden min-h-[480px]">
            <DamMap dams={[dam]} stations={damStations} selectedDamId={dam.damId} height="520px" />
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="p-4">
              {damStations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {paginatedStations.map(st => {
                    const gateways = st.gateways || []
                    const allNodes = gateways.flatMap(g => g.nodes || [])
                    const hasNodes = allNodes.length > 0
                    const onlineNodes = allNodes.filter(n => n.status === 'online')

                    const live = liveStationMap[st.stationId] || {}
                    const isLiveStreamActive = Boolean(live.timestamp) && hasNodes

                    let isConnected = false
                    let connectionStatusLabel = 'CHƯA GẮN SENSOR NODE'
                    let connectionStatusColor = 'text-muted'

                    if (isLiveStreamActive || onlineNodes.length > 0) {
                      isConnected = true
                      connectionStatusLabel = 'SENSOR NODE ONLINE'
                      connectionStatusColor = 'text-safe'
                    } else if (hasNodes) {
                      isConnected = false
                      connectionStatusLabel = 'MẤT KẾT NỐI (OFFLINE)'
                      connectionStatusColor = 'text-danger'
                    }

                    const effectiveStatus = hasNodes ? (st.status || 'unknown') : 'unknown'
                    const effectiveStatusReason = hasNodes 
                      ? (st.statusReason || '') 
                      : (st.status === 'unknown' && st.statusReason ? st.statusReason : 'Chưa gắn Sensor Node vào trạm')
                    const stS = getStatus(effectiveStatus)

                    const currentWater = hasNodes && (isLiveStreamActive || isConnected || st.waterLevel > 0) ? (live.waterLevel ?? st.waterLevel ?? 0) : null
                    const currentHumidity = hasNodes && (isLiveStreamActive || isConnected || st.humidity > 0) ? (live.humidity ?? st.humidity ?? 0) : null
                    const currentVibration = hasNodes && (isLiveStreamActive || isConnected || st.vibration > 0) ? (live.vibration ?? st.vibration ?? null) : null

                    const isWaterBreached = effectiveStatusReason?.toLowerCase().includes('mực nước')
                    const isHumidBreached = effectiveStatusReason?.toLowerCase().includes('độ ẩm')
                    const isVibBreached = effectiveStatusReason?.toLowerCase().includes('độ rung')

                    return (
                      <div
                        key={st.stationId}
                        className={`bg-card2 border border-border border-t-2 ${stS.topBorder} rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-panel hover:-translate-y-0.5 hover:border-borderHi transition-all duration-150`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-[13px] font-bold text-tx flex items-center gap-2">
                                <span>{st.name}</span>
                                {isLiveStreamActive && (
                                  <span className="px-1.5 py-0.5 bg-safe/10 border border-safe/30 text-safe text-[8px] font-mono rounded font-bold animate-pulse">
                                    ● LIVE
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-muted flex items-center gap-1 mt-0.5 font-mono">
                                <MapPin className="w-3 h-3 text-muted shrink-0" />
                                <span>
                                  {st.latitude != null && st.longitude != null
                                    ? `${st.latitude}°N, ${st.longitude}°E`
                                    : (st.location || 'Chưa có tọa độ')}
                                </span>
                              </div>
                            </div>
                            <Badge status={effectiveStatus} sm title={effectiveStatusReason} />
                          </div>

                          <div className="text-[10px] text-muted mb-2 flex items-center justify-between">
                            <div><span>{st.river || 'Tuyến sông'}</span> • <Mono className="text-tx">{st.km || 'K0+000'}</Mono></div>
                            {live.timestamp && hasNodes && (
                              <Mono className="text-[8px] text-sky-400 font-bold">
                                {new Date(live.timestamp).toLocaleTimeString('vi-VN')}
                              </Mono>
                            )}
                          </div>

                          {/* Trạng thái kết nối thực tế của Sensor Node ở Trạm này */}
                          <div className="flex items-center justify-between py-1.5 px-2 bg-card rounded-md border border-border/40 text-[9px] mb-2">
                            <span className="text-muted text-[8px] uppercase tracking-wider font-semibold">Sensor Node:</span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold ${connectionStatusColor}`}>
                                <LiveDot active={isConnected} size="sm" pulse={isConnected} />
                                <span>{connectionStatusLabel}</span>
                              </span>
                            </div>
                          </div>

                          {/* Dòng hiển thị nguyên nhân trạng thái an toàn */}
                          {effectiveStatusReason && (
                            <div className={`text-[9px] px-2 py-1 rounded-md border flex items-start gap-1 mb-2 font-mono ${
                              effectiveStatus === 'safe'
                                ? 'bg-safe/5 text-safe/90 border-safe/20'
                                : effectiveStatus === 'unknown'
                                  ? 'bg-card text-muted border-border/40'
                                  : 'bg-danger/10 text-danger border-danger/30 font-semibold'
                            }`}>
                              <span className="shrink-0">ⓘ</span>
                              <span className="leading-tight">{effectiveStatusReason}</span>
                            </div>
                          )}

                          {/* Dữ liệu thu được từ Cảm biến Mực nước, Độ ẩm, Độ rung */}
                          <div className="grid grid-cols-3 gap-1 bg-card p-2.5 rounded-lg text-[10px] my-2 border border-border/40">
                            <div className={`p-1 rounded ${isWaterBreached ? 'bg-danger/10 border border-danger/40' : ''}`}>
                              <div className="text-[7px] text-muted uppercase flex items-center gap-0.5 mb-0.5">
                                <Activity className="w-2.5 h-2.5 text-sky-400" />
                                <span>Mực nước</span>
                              </div>
                              <Mono className={`font-bold ${isWaterBreached ? 'text-danger' : currentWater != null ? stS.text : 'text-muted'}`}>
                                {currentWater != null ? `${currentWater} m` : '--'}
                              </Mono>
                            </div>
                            <div className={`p-1 rounded ${isHumidBreached ? 'bg-danger/10 border border-danger/40' : ''}`}>
                              <div className="text-[7px] text-muted uppercase flex items-center gap-0.5 mb-0.5">
                                <Droplet className="w-2.5 h-2.5 text-indigo-400" />
                                <span>Độ ẩm</span>
                              </div>
                              <Mono className={`font-bold ${isHumidBreached ? 'text-danger' : currentHumidity != null ? 'text-tx' : 'text-muted'}`}>
                                {currentHumidity != null ? `${currentHumidity}%` : '--'}
                              </Mono>
                            </div>
                            <div className={`p-1 rounded ${isVibBreached ? 'bg-danger/10 border border-danger/40' : ''}`}>
                              <div className="text-[7px] text-muted uppercase flex items-center gap-0.5 mb-0.5">
                                <Radio className="w-2.5 h-2.5 text-emerald-400" />
                                <span>Độ rung</span>
                              </div>
                              <Mono className={`font-bold ${currentVibration != null ? 'text-tx' : 'text-muted'}`}>
                                {currentVibration != null && currentVibration > 0 ? `${currentVibration} mm/s` : '--'}
                              </Mono>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2.5 border-t border-border/40">
                          <Link
                            href={`/stations/${st.stationId}`}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-accent hover:underline no-underline"
                          >
                            <span>{t('damsPage.stationDetail')}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {!isViewer && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEditStationModal(st)}
                                className="p-1.5 bg-card border border-border rounded-lg text-accent hover:border-accent cursor-pointer transition-colors"
                                title={t('damsPage.editStation')}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ id: st.stationId, name: st.name })}
                                className="p-1.5 bg-card border border-border rounded-lg text-danger hover:border-danger cursor-pointer transition-colors"
                                title="Xóa Trạm"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-card2/50 border border-border rounded-xl text-muted text-xs shadow-sm">
                  {search ? 'Không tìm thấy trạm quan trắc nào phù hợp với từ khóa tìm kiếm.' : t('damDetail.noStations')}
                </div>
              )}
            </div>

            {/* ── FOOTER / BOTTOM PAGINATION CONTROLS (CUỐI DANH SÁCH) ── */}
            {damStations.length > 0 && (
              <div className="px-4 py-2.5 bg-card2/50 border-t border-border/70 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs rounded-b-xl">
                <div className="text-muted font-mono text-[11px]">
                  Hiển thị <strong className="text-tx">{(stationPage - 1) * STATIONS_PER_PAGE + 1}</strong> -{' '}
                  <strong className="text-tx">{Math.min(stationPage * STATIONS_PER_PAGE, damStations.length)}</strong>{' '}
                  / <strong className="text-accent">{damStations.length}</strong> trạm
                </div>

                {totalStationPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      disabled={stationPage === 1}
                      onClick={() => setStationPage((p) => Math.max(p - 1, 1))}
                      className="p-1 px-2.5 rounded-md border border-border text-tx bg-card hover:bg-card2 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalStationPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setStationPage(pageNum)}
                          className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                            stationPage === pageNum
                              ? 'bg-accent text-white border-accent shadow-sm'
                              : 'bg-card border-border text-muted hover:text-tx hover:border-border/80'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={stationPage >= totalStationPages}
                      onClick={() => setStationPage((p) => Math.min(p + 1, totalStationPages))}
                      className="p-1 px-2.5 rounded-md border border-border text-tx bg-card hover:bg-card2 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Sau</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── MODAL: CREATE / EDIT STATION (SPLIT-VIEW) ── */}
      <Modal
        open={stationModalOpen}
        onClose={() => setStationModalOpen(false)}
        title={editingStation ? t('damsPage.editStation') : t('damDetail.addStation')}
        icon={Radio}
        maxWidth="max-w-4xl"
        footer={
          <FormActions>
            <Button type="button" variant="secondary" onClick={() => setStationModalOpen(false)}>
              {t('admin.cancel')}
            </Button>
            <Button type="submit" form="station-form" variant="primary" loading={savingStation}>
              {editingStation ? t('admin.save') : t('admin.create')}
            </Button>
          </FormActions>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* CỘT TRÁI: Form nhập liệu */}
          <form id="station-form" onSubmit={handleSaveStation} className="md:col-span-6 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <Field label={t('admin.form.stationNameLabel')} required error={stationErrors.name} htmlFor="station-name">
                <TextInput
                  id="station-name"
                  required
                  autoFocus
                  error={stationErrors.name}
                  value={stationForm.name}
                  onChange={e => {
                    setStationForm(p => ({ ...p, name: e.target.value }))
                    if (stationErrors.name) setStationErrors(p => ({ ...p, name: null }))
                  }}
                  placeholder="vd: Trạm Tân Ấp 1"
                />
              </Field>

              <Field label={t('admin.form.belongToDam')}>
                <TextInput disabled value={`${dam.name} (${dam.damId})`} className="font-semibold text-xs" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label={t('admin.form.riverLabel')} htmlFor="station-river">
                <TextInput
                  id="station-river"
                  value={stationForm.river}
                  onChange={e => setStationForm(p => ({ ...p, river: e.target.value }))}
                  placeholder="vd: Sông Hồng"
                />
              </Field>

              <Field label={t('admin.form.kmLabel')} htmlFor="station-km">
                <TextInput
                  id="station-km"
                  value={stationForm.km}
                  onChange={e => setStationForm(p => ({ ...p, km: e.target.value }))}
                  placeholder="vd: K25+500"
                  className="font-mono"
                />
              </Field>
            </div>

            <Field label="Địa danh / Vị trí trạm" htmlFor="station-location">
              <TextInput
                id="station-location"
                value={stationForm.location}
                onChange={e => setStationForm(p => ({ ...p, location: e.target.value }))}
                placeholder="vd: Hoàn Kiếm, Hà Nội"
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Vĩ độ (Latitude °N)" required error={stationErrors.latitude} htmlFor="station-lat">
                <TextInput
                  id="station-lat"
                  type="number"
                  step="0.0001"
                  required
                  error={stationErrors.latitude}
                  value={stationForm.latitude}
                  onChange={e => {
                    setStationForm(p => ({ ...p, latitude: e.target.value }))
                    if (stationErrors.latitude) setStationErrors(p => ({ ...p, latitude: null }))
                  }}
                  placeholder="vd: 21.0381"
                  className="font-mono"
                />
              </Field>

              <Field label="Kinh độ (Longitude °E)" required error={stationErrors.longitude} htmlFor="station-lng">
                <TextInput
                  id="station-lng"
                  type="number"
                  step="0.0001"
                  required
                  error={stationErrors.longitude}
                  value={stationForm.longitude}
                  onChange={e => {
                    setStationForm(p => ({ ...p, longitude: e.target.value }))
                    if (stationErrors.longitude) setStationErrors(p => ({ ...p, longitude: null }))
                  }}
                  placeholder="vd: 105.8492"
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="bg-card2/60 border border-border/60 rounded-lg p-2 text-[10px] text-muted">
              Mực nước, độ ẩm, độ rung và trạng thái an toàn được hệ thống tự tính từ dữ liệu cảm biến — không nhập tay tại đây.
            </div>
          </form>

          {/* CỘT PHẢI: Bản đồ chọn tọa độ + Live Preview Card */}
          <div className="md:col-span-6 space-y-3 flex flex-col justify-between">
            <div>
              <label className="text-[11px] font-bold text-tx mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Bản đồ chọn tọa độ GIS (Click hoặc kéo ghim)</span>
              </label>
              <LocationPickerMap
                latitude={stationForm.latitude}
                longitude={stationForm.longitude}
                onChange={({ latitude, longitude }) => setStationForm(p => ({ ...p, latitude, longitude }))}
                defaultCenter={[dam.latitude ?? 21.0381, dam.longitude ?? 105.8492]}
                height="190px"
              />
            </div>

            {/* Live Preview Card */}
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Xem trước thẻ trạm (Live Preview):</span>
                <span className="text-accent text-[9px] font-mono">Tự động cập nhật</span>
              </div>
              <div className="bg-card2 border border-border border-t-2 border-t-sky-500 rounded-xl p-3 shadow-panel">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-sm font-bold text-tx truncate m-0">
                      {stationForm.name || 'Tên Trạm Quan Trắc'}
                    </h4>
                    <div className="text-[9px] text-muted flex items-center gap-1 mt-0.5 font-mono">
                      <MapPin className="w-3 h-3 text-muted shrink-0" />
                      <span className="truncate">
                        {stationForm.latitude && stationForm.longitude
                          ? `${Number(stationForm.latitude).toFixed(4)}°N, ${Number(stationForm.longitude).toFixed(4)}°E`
                          : (stationForm.location || 'Chưa có tọa độ')}
                      </span>
                    </div>
                  </div>
                  <Badge status={editingStation ? editingStation.status : 'unknown'} sm />
                </div>
                <div className="text-[10px] text-muted mb-1.5 flex items-center justify-between">
                  <div><span>{stationForm.river || 'Tuyến sông'}</span> • <Mono className="text-tx">{stationForm.km || 'K0+000'}</Mono></div>
                </div>
                <div className="flex items-center justify-between py-1 px-2 bg-card3 rounded border border-border/40 text-[8px] font-mono text-muted">
                  <span>SENSOR NODE:</span>
                  <span className="text-muted font-bold">CHƯA GẮN SENSOR NODE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── DELETE CONFIRM MODAL ── */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('admin.deleteConfirmTitle')}
        icon={AlertTriangle}
        maxWidth="max-w-md"
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              {t('admin.cancel')}
            </Button>
            <Button variant="danger" loading={deletingStation} onClick={handleConfirmDelete}>
              {t('admin.confirmDelete')}
            </Button>
          </FormActions>
        }
      >
        <p className="text-[10px] text-muted m-0">{t('admin.deleteWarning')}</p>
        <p className="text-[11px] text-tx leading-relaxed bg-card2 p-3 rounded-lg border border-border">
          Xóa Trạm quan trắc <strong className="text-danger">{deleteConfirm?.name}</strong> (ID: {deleteConfirm?.id})?
        </p>
      </Modal>

      {/* ── MODAL: EDIT DAM (SPLIT-VIEW) ── */}
      <Modal
        open={damModalOpen}
        onClose={() => setDamModalOpen(false)}
        title={`Chỉnh sửa thông tin Đập thủy điện (${dam.damId})`}
        icon={Database}
        maxWidth="max-w-4xl"
        footer={
          <FormActions>
            <Button type="button" variant="secondary" onClick={() => setDamModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" form="dam-edit-form" variant="primary" loading={savingDam}>
              Lưu thay đổi
            </Button>
          </FormActions>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <form id="dam-edit-form" onSubmit={handleSaveDam} className="md:col-span-6 space-y-3">
            <Field label="Mã Đập Thủy Điện (ID)">
              <TextInput disabled readOnly value={dam.damId} className="font-mono cursor-not-allowed select-none" />
            </Field>

            <Field label="Tên Đập Thủy Điện" required error={damEditErrors.name} htmlFor="dam-edit-name">
              <TextInput
                id="dam-edit-name"
                required
                autoFocus
                error={damEditErrors.name}
                value={damForm.name}
                onChange={e => {
                  setDamForm(p => ({ ...p, name: e.target.value }))
                  if (damEditErrors.name) setDamEditErrors(p => ({ ...p, name: null }))
                }}
                placeholder="vd: Đập Thủy điện Hòa Bình"
              />
            </Field>

            <Field label="Địa danh / Vị trí hành chính" htmlFor="dam-edit-location">
              <TextInput
                id="dam-edit-location"
                value={damForm.location}
                onChange={e => setDamForm(p => ({ ...p, location: e.target.value }))}
                placeholder="vd: Hòa Bình"
              />
            </Field>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Vĩ độ (Latitude °N)" required error={damEditErrors.latitude} htmlFor="dam-edit-lat">
                <TextInput
                  id="dam-edit-lat"
                  type="number"
                  step="0.0001"
                  required
                  error={damEditErrors.latitude}
                  value={damForm.latitude}
                  onChange={e => {
                    setDamForm(p => ({ ...p, latitude: e.target.value }))
                    if (damEditErrors.latitude) setDamEditErrors(p => ({ ...p, latitude: null }))
                  }}
                  placeholder="vd: 20.8167"
                  className="font-mono"
                />
              </Field>
              <Field label="Kinh độ (Longitude °E)" required error={damEditErrors.longitude} htmlFor="dam-edit-lng">
                <TextInput
                  id="dam-edit-lng"
                  type="number"
                  step="0.0001"
                  required
                  error={damEditErrors.longitude}
                  value={damForm.longitude}
                  onChange={e => {
                    setDamForm(p => ({ ...p, longitude: e.target.value }))
                    if (damEditErrors.longitude) setDamEditErrors(p => ({ ...p, longitude: null }))
                  }}
                  placeholder="vd: 105.3265"
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="bg-card2/60 border border-border/60 rounded-lg p-2 text-[10px] text-muted">
              Mực nước, mức chứa và trạng thái an toàn được hệ thống tự tính từ dữ liệu cảm biến — không nhập tay tại đây.
            </div>
          </form>

          {/* CỘT PHẢI: Bản đồ chọn tọa độ + Live Preview */}
          <div className="md:col-span-6 space-y-3 flex flex-col justify-between">
            <div>
              <label className="text-[11px] font-bold text-tx mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Bản đồ chọn tọa độ GIS (Click hoặc kéo ghim)</span>
              </label>
              <LocationPickerMap
                latitude={damForm.latitude}
                longitude={damForm.longitude}
                onChange={({ latitude, longitude }) => setDamForm(p => ({ ...p, latitude, longitude }))}
                height="190px"
              />
            </div>

            {/* Live Preview Card */}
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Xem trước thẻ đập (Live Preview):</span>
                <span className="text-accent text-[9px] font-mono">Tự động cập nhật</span>
              </div>
              <div className="bg-card2 border border-border border-l-4 border-l-safe rounded-xl p-4 shadow-panel">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20 font-bold shrink-0">
                        {dam.damId}
                      </span>
                      <h4 className="text-base font-bold text-tx m-0 leading-tight">
                        {damForm.name || dam.name}
                      </h4>
                    </div>
                    <div className="text-[10px] text-muted flex items-center gap-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="truncate">
                        {damForm.latitude && damForm.longitude
                          ? `${Number(damForm.latitude).toFixed(4)}°N, ${Number(damForm.longitude).toFixed(4)}°E`
                          : 'Chưa có tọa độ'}
                        {damForm.location ? ` (${damForm.location})` : ''}
                      </span>
                    </div>
                  </div>
                  <Badge status={dam.status} sm title={dam.statusReason} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: DELETE DAM CONFIRMATION ── */}
      <Modal
        open={deleteDamConfirm}
        onClose={() => setDeleteDamConfirm(false)}
        title="Xác nhận xóa Đập Thủy Điện?"
        icon={AlertTriangle}
        maxWidth="max-w-sm"
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setDeleteDamConfirm(false)}>
              Hủy
            </Button>
            <Button variant="danger" loading={deletingDam} onClick={handleConfirmDeleteDam}>
              Xóa vĩnh viễn
            </Button>
          </FormActions>
        }
      >
        <p className="text-xs text-muted leading-relaxed m-0">
          Bạn có chắc chắn muốn xóa đập <strong className="text-tx">{dam.name}</strong> ({dam.damId}) và toàn bộ các trạm trực thuộc? Thao tác này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  )
}
````

## File: app/dams/page.jsx
````javascript
'use client'

import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { getStatus } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Panel, RadialGauge, LiveDot } from '@/components/ui'
import { Field, TextInput, Select, Modal, FormActions, Button, Toast } from '@/components/form'
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Database,
  Radio,
  MapPin,
  Lock,
  Map as MapIcon,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react'
import DamPinMap from '@/components/DamMap'
import LocationPickerMap from '@/components/LocationPickerMap'

export default function DamsPage() {
  const router = useRouter()
  const {
    dams,
    stations,
    loading,
    error,
    refetch,
    createDam,
    updateDam,
    deleteDam,
  } = useDamData()
  const { t } = useLanguage()
  const { isAdmin, isOperator, assignedDamId } = useAuth()

  const [search, setSearch] = useState('')
  const [showMap, setShowMap] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'safe' | 'warning' | 'critical'
  const [currentPage, setCurrentPage] = useState(1)

  // Modals state
  const [damModalOpen, setDamModalOpen] = useState(false)
  const [editingDam, setEditingDam] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name }
  const [savingDam, setSavingDam] = useState(false)
  const [deletingDam, setDeletingDam] = useState(false)

  // Toast State
  const [toast, setToast] = useState(null) // { message: string, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Form states
  // Chỉ chứa thông tin tĩnh do người dùng nhập. Mực nước / mức chứa / trạng thái an toàn
  // đều do backend tự tính từ cảm biến nên không đưa vào form (sửa tay sẽ bị ghi đè ngay).
  const [damForm, setDamForm] = useState({
    id: '',
    name: '',
    location: '',
    latitude: 20.8167,
    longitude: 105.3265,
    cameraUrl: '',
  })
  const [damErrors, setDamErrors] = useState({})

  const validateDamForm = () => {
    const errs = {}
    if (!damForm.name || !damForm.name.trim()) {
      errs.name = 'Vui lòng nhập tên đập thủy điện'
    } else if (damForm.name.trim().length < 3) {
      errs.name = 'Tên đập phải có ít nhất 3 ký tự'
    } else {
      const isDuplicate = dams.some(
        d => d.name.trim().toLowerCase() === damForm.name.trim().toLowerCase() && d.damId !== editingDam?.damId
      )
      if (isDuplicate) {
        errs.name = 'Tên đập thủy điện này đã tồn tại trên hệ thống'
      }
    }

    const lat = Number(damForm.latitude)
    if (damForm.latitude === '' || isNaN(lat)) {
      errs.latitude = 'Vui lòng nhập vĩ độ hợp lệ'
    } else if (lat < -90 || lat > 90) {
      errs.latitude = 'Vĩ độ phải từ -90° đến 90°'
    }

    const lng = Number(damForm.longitude)
    if (damForm.longitude === '' || isNaN(lng)) {
      errs.longitude = 'Vui lòng nhập kinh độ hợp lệ'
    } else if (lng < -180 || lng > 180) {
      errs.longitude = 'Kinh độ phải từ -180° đến 180°'
    }

    setDamErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Dam Form Handlers
  const openCreateDamModal = () => {
    setEditingDam(null)
    setDamErrors({})
    setDamForm({
      id: '',
      name: '',
      location: '',
      latitude: 20.8167,
      longitude: 105.3265,
      cameraUrl: '',
    })
    setDamModalOpen(true)
  }

  const openEditDamModal = (dam, e) => {
    e?.stopPropagation()
    setEditingDam(dam)
    setDamErrors({})
    setDamForm({
      id: dam.damId,
      name: dam.name || '',
      location: dam.location || '',
      latitude: dam.latitude ?? 20.8167,
      longitude: dam.longitude ?? 105.3265,
      cameraUrl: dam.cameraUrl || '',
    })
    setDamModalOpen(true)
  }

  const handleSaveDam = async (e) => {
    e.preventDefault()
    if (!validateDamForm()) return

    try {
      setSavingDam(true)
      if (editingDam) {
        await updateDam(editingDam.damId, {
          name: damForm.name.trim(),
          location: damForm.location.trim(),
          latitude: Number(damForm.latitude),
          longitude: Number(damForm.longitude),
          cameraUrl: damForm.cameraUrl,
        })
        showToast('Cập nhật đập thủy điện thành công!', 'success')
      } else {
        const payload = {
          name: damForm.name.trim(),
          location: damForm.location.trim(),
          latitude: Number(damForm.latitude),
          longitude: Number(damForm.longitude),
          cameraUrl: damForm.cameraUrl,
        }
        const res = await createDam(payload)
        const newId = res?.dam?.damId || ''
        showToast(`Tạo đập thủy điện thành công! (Mã: ${newId})`, 'success')
      }
      setDamModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingDam(false)
    }
  }

  // Delete Confirm Handler
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      setDeletingDam(true)
      await deleteDam(deleteConfirm.id)
      showToast(`Đã xóa đập ${deleteConfirm.name}!`, 'success')
      setDeleteConfirm(null)
      refetch(true)
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error')
    } finally {
      setDeletingDam(false)
    }
  }

  // Scope dams and stations for operators
  const visibleDams = isOperator && assignedDamId ? dams.filter(d => d.damId === assignedDamId) : dams
  const visibleStations = isOperator && assignedDamId ? stations.filter(s => s.damId === assignedDamId) : stations

  // Counts per status
  const statusCounts = useMemo(() => ({
    all: visibleDams.length,
    safe: visibleDams.filter(d => d.status === 'safe').length,
    warning: visibleDams.filter(d => d.status === 'warning').length,
    critical: visibleDams.filter(d => d.status === 'critical').length,
    unknown: visibleDams.filter(d => d.status === 'unknown' || !d.status).length,
  }), [visibleDams])

  // Filter dams
  const filteredDams = useMemo(() => {
    return visibleDams.filter(d => {
      if (statusFilter !== 'all') {
        const dStatus = d.status || 'unknown'
        if (dStatus !== statusFilter) return false
      }
      if (!search) return true
      const q = search.toLowerCase()
      return (
        d.name?.toLowerCase().includes(q) ||
        d.damId?.toLowerCase().includes(q) ||
        (d.location && d.location.toLowerCase().includes(q))
      )
    })
  }, [visibleDams, statusFilter, search])

  // Page height: measured from the real distance to the viewport bottom instead of a
  // hardcoded "navbar is 98px" guess, which drifts with zoom/DPI/font metrics and was
  // the actual source of the outer page needing a scroll to reach the pagination bar.
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (!pageRef.current) return
      const top = pageRef.current.getBoundingClientRect().top
      const h = Math.max(200, Math.floor(window.innerHeight - top))
      setPageHeight(prev => (prev === h ? prev : h))
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Items per page: measured dynamically so the list always fits the screen without
  // scrolling — whatever doesn't fit spills onto the next page instead.
  const listBodyRef = useRef(null)
  const gridRef = useRef(null)
  const [itemsPerPage, setItemsPerPage] = useState(showMap ? 9 : 12)

  useLayoutEffect(() => {
    const computeFit = () => {
      const bodyEl = listBodyRef.current
      const gridEl = gridRef.current
      if (!bodyEl || !gridEl) return

      const firstCard = gridEl.querySelector('[data-dam-card]')
      if (!firstCard) return

      const columns = getComputedStyle(gridEl).gridTemplateColumns.split(' ').filter(Boolean).length || 1
      const rowGap = parseFloat(getComputedStyle(gridEl).rowGap) || 0
      const cardHeight = firstCard.getBoundingClientRect().height
      if (!cardHeight) return

      const availableHeight = bodyEl.clientHeight
      const rows = Math.max(1, Math.floor((availableHeight + rowGap) / (cardHeight + rowGap)))
      const count = Math.max(columns, rows * columns)

      setItemsPerPage(prev => (prev === count ? prev : count))
    }

    computeFit()
    const ro = new ResizeObserver(computeFit)
    if (listBodyRef.current) ro.observe(listBodyRef.current)
    window.addEventListener('resize', computeFit)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', computeFit)
    }
  }, [showMap, filteredDams.length, pageHeight])

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, search, showMap])

  // Total pages and paginated items
  const totalPages = Math.ceil(filteredDams.length / itemsPerPage) || 1

  // Clamp current page if it overflows after itemsPerPage / filter changes
  useEffect(() => {
    setCurrentPage(p => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedDams = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredDams.slice(start, start + itemsPerPage)
  }, [filteredDams, currentPage, itemsPerPage])

  return (
    <div
      ref={pageRef}
      style={pageHeight != null ? { height: pageHeight, maxHeight: pageHeight } : undefined}
      className="p-3 h-[calc(100vh-98px)] max-h-[calc(100vh-98px)] flex flex-col gap-3 overflow-hidden select-none font-sans"
    >
      {/* Top Bar / Header */}
      <div className="flex justify-between items-center bg-card border border-border rounded-xl px-4 py-2.5 shadow-panel shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 rounded-lg bg-accent-soft text-accent border border-accent-soft flex items-center justify-center">
              <Database className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-lg font-bold text-tx tracking-wide m-0">{t('damsPage.title')}</h1>
          </div>
          <p className="text-[10px] text-muted m-0">{t('damsPage.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Search */}
          <div className="h-8 flex items-center gap-2 bg-card2 border border-border rounded-lg px-2.5 w-56 shrink-0 focus-within:border-accent transition-colors">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('damsPage.searchPlaceholder')}
              className="bg-transparent border-none outline-none text-tx text-[11px] w-full placeholder:text-muted"
            />
          </div>

          <button
            onClick={() => setShowMap(!showMap)}
            className={`h-8 flex items-center gap-1.5 px-3 border rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${showMap
              ? 'bg-accent/15 text-accent border-accent/40 hover:bg-accent/25'
              : 'bg-card2 text-muted border-border hover:text-tx hover:border-border/80'
              }`}
            title={showMap ? 'Ẩn bản đồ GIS' : 'Hiện bản đồ GIS'}
          >
            {showMap ? <EyeOff className="w-3.5 h-3.5 text-accent" /> : <MapIcon className="w-3.5 h-3.5 text-accent" />}
            <span>{showMap ? 'Ẩn Bản Đồ' : 'Hiện Bản Đồ'}</span>
          </button>

          <button
            onClick={() => refetch()}
            className="h-8 flex items-center gap-1.5 px-3 border border-border rounded-lg text-tx text-[11px] font-semibold bg-card2 hover:bg-white/5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 text-accent" />
            <span>{t('stationsPage.refresh')}</span>
          </button>

          {isAdmin && (
            <button
              onClick={openCreateDamModal}
              className="h-8 flex items-center gap-1.5 px-3.5 bg-accent hover:bg-accent/90 rounded-md text-white text-[11px] font-bold cursor-pointer border-none shrink-0 whitespace-nowrap transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('damsPage.addDam')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2-COLUMN SPLIT VIEW: TRÁI (BẢN ĐỒ GIS) & PHẢI (DANH SÁCH ĐẬP) ── */}
      <div
        className={
          showMap
            ? "grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch overflow-hidden"
            : "flex-1 min-h-0 flex flex-col overflow-hidden"
        }
      >
        {/* KHỐI TRÁI: BẢN ĐỒ SỐ GIS */}
        {showMap && (
          <div className="lg:col-span-5 xl:col-span-5 h-full bg-card border border-border rounded-xl shadow-panel flex flex-col overflow-hidden">
            {/* Header bản đồ */}
            <div className="px-4 py-2.5 bg-card2/70 border-b border-border/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <MapIcon className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-xs font-bold text-tx uppercase tracking-wider">
                  Bản Đồ Số GIS Định Vị
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-safe/10 border border-safe/20">
                  <LiveDot active />
                  <span className="text-[9px] font-mono text-safe font-bold">LIVE</span>
                </span>
                <button
                  onClick={() => setShowMap(false)}
                  className="p-1 text-muted hover:text-tx hover:bg-white/10 rounded transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1 text-[11px]"
                  title="Ẩn bản đồ GIS"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ẩn</span>
                </button>
              </div>
            </div>

            {/* Thân bản đồ */}
            <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-card2">
              <DamPinMap dams={visibleDams} stations={visibleStations} height="100%" />
            </div>
          </div>
        )}

        {/* KHỐI PHẢI: DANH SÁCH ĐẬP QUẢN LÝ */}
        <div
          className={
            (showMap ? "lg:col-span-7 xl:col-span-7" : "w-full") +
            " h-full bg-card border border-border rounded-xl shadow-panel flex flex-col justify-between overflow-hidden"
          }
        >
          {/* Header danh sách đập */}
          <div className="px-4 py-2.5 bg-card2/70 border-b border-border/70 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="text-xs font-bold text-tx uppercase tracking-wider">
                Danh Sách Đập Quản Lý
              </span>
              <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20 font-bold">
                {filteredDams.length}
              </span>
            </div>

            {/* Filter buttons & Header Pagination */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                ['all', `Tất cả (${statusCounts.all})`],
                ['safe', `An toàn (${statusCounts.safe})`],
                ['warning', `Cảnh báo (${statusCounts.warning})`],
                ['critical', `Nguy cấp (${statusCounts.critical})`],
                ['unknown', `Không xác định (${statusCounts.unknown})`],
              ].map(([id, lb]) => (
                <button
                  key={id}
                  onClick={() => setStatusFilter(id)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                    statusFilter === id
                      ? 'bg-accent/15 border-accent/40 text-accent font-bold shadow-sm'
                      : 'bg-transparent border-border text-muted hover:text-tx hover:bg-white/5'
                  }`}
                >
                  {lb}
                </button>
              ))}

              {!showMap && (
                <button
                  onClick={() => setShowMap(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-accent text-white rounded text-[10px] font-bold transition-all cursor-pointer border-none ml-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Hiện Bản Đồ</span>
                </button>
              )}

              {/* ── HEADER PAGINATION CONTROLS (ĐẦU DANH SÁCH) ── */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1 bg-card px-1.5 py-0.5 rounded-lg border border-border/80 text-[10px] ml-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-1 text-muted hover:text-tx disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-transparent border-none flex items-center"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-tx px-1">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="p-1 text-muted hover:text-tx disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-transparent border-none flex items-center"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Thân danh sách đập (Compact Cards, fit-to-screen, no scroll) */}
          <div ref={listBodyRef} className="flex-1 min-h-0 p-3 overflow-hidden flex flex-col justify-start">
            <div
              ref={gridRef}
              className={
                showMap
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5"
              }
            >
              {paginatedDams.map((dam) => {
                const s = getStatus(dam.status)
                const damStations = visibleStations.filter((st) => st.damId === dam.damId)

                return (
                  <div
                    key={dam.damId}
                    data-dam-card
                    onClick={() => router.push(`/dams/${dam.damId}`)}
                    className={`bg-card2 border border-border border-l-4 ${s.leftBorder} rounded-xl p-3 cursor-pointer hover:border-accent/60 hover:-translate-y-0.5 transition-all duration-150 shadow-sm hover:shadow-md group flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="min-w-0 flex-1 mr-1.5">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="font-mono text-[9px] text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20 font-bold shrink-0">
                              {dam.damId}
                            </span>
                            <h2 className="text-sm font-bold text-tx group-hover:text-accent transition-colors m-0 leading-snug" title={dam.name}>
                              {dam.name}
                            </h2>
                          </div>
                          <div className="text-[10px] text-muted flex items-center gap-1 font-mono truncate">
                            <MapPin className="w-3 h-3 text-muted shrink-0" />
                            <span className="truncate">
                              {dam.latitude != null && dam.longitude != null
                                ? `${dam.latitude}°N, ${dam.longitude}°E`
                                : (dam.location || 'Chưa có tọa độ')}
                              {dam.location && dam.latitude != null ? ` (${dam.location})` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Badge status={dam.status} sm title={dam.statusReason} />
                          {isAdmin && (
                            <div className="flex items-center gap-1 ml-0.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => openEditDamModal(dam, e)}
                                className="p-1.5 bg-card border border-border rounded text-accent hover:border-accent transition-colors cursor-pointer"
                                title={t('damsPage.editDam')}
                              >
                                <Pencil className="w-3 h-3" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteConfirm({ id: dam.damId, name: dam.name })
                                }}
                                className="p-1.5 bg-card border border-border rounded text-danger hover:border-danger transition-colors cursor-pointer"
                                title="Xóa Đập"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-2 bg-card p-1.5 rounded-lg my-1.5 border border-border/40">
                        <RadialGauge
                          value={dam.fillPct}
                          size={40}
                          stroke={4}
                          status={dam.status}
                          sublabel=""
                        />
                        <div className="flex-1 min-w-0 text-[9px]">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[8px] text-muted uppercase tracking-wide">
                              {t('damsPage.waterLevel')}
                            </span>
                            <Mono className={`text-[12px] font-bold ${s.text}`}>{dam.waterLevel} m</Mono>
                          </div>
                          <div className="text-[8px] text-muted truncate mt-0.5">
                            Mức chứa: <strong className="text-tx font-mono">{dam.fillPct}%</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer link to stations */}
                    <div className="flex justify-between items-center pt-1 border-t border-border/40 text-[9px]">
                      <div className="flex items-center gap-1 text-muted">
                        <Radio className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>
                          <strong className="text-info">{damStations.length}</strong> trạm
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 text-accent font-bold text-[9px] group-hover:translate-x-0.5 transition-transform">
                        <span>{t('damsPage.viewStations', { count: damStations.length })}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredDams.length === 0 && (
                <div className="col-span-full text-center py-16 bg-card2/50 border border-border rounded-xl text-muted text-xs shadow-sm">
                  Không tìm thấy đập thủy điện nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm.
                </div>
              )}
            </div>
          </div>

          {/* ── PAGINATION FOOTER ── */}
          {filteredDams.length > 0 && (
            <div className="px-4 py-2 bg-card2/50 border-t border-border/70 flex items-center justify-between shrink-0 text-xs">
              <div className="text-muted font-mono text-[11px]">
                Hiển thị <strong className="text-tx">{(currentPage - 1) * itemsPerPage + 1}</strong> -{' '}
                <strong className="text-tx">{Math.min(currentPage * itemsPerPage, filteredDams.length)}</strong>{' '}
                / <strong className="text-accent">{filteredDams.length}</strong> đập
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-1 px-2 rounded-md border border-border text-tx bg-card hover:bg-card2 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                          currentPage === pageNum
                            ? 'bg-accent text-white border-accent shadow-sm'
                            : 'bg-card border-border text-muted hover:text-tx hover:bg-card2'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="p-1 px-2 rounded-md border border-border text-tx bg-card hover:bg-card2 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── MODAL: CREATE / EDIT DAM (SPLIT-VIEW) ── */}
      <Modal
        open={damModalOpen}
        onClose={() => setDamModalOpen(false)}
        title={editingDam ? t('damsPage.editDam') : t('damsPage.addDam')}
        icon={Database}
        maxWidth="max-w-4xl"
        footer={
          <FormActions>
            <Button type="button" variant="secondary" onClick={() => setDamModalOpen(false)}>
              {t('admin.cancel')}
            </Button>
            <Button type="submit" form="dam-form" variant="primary" loading={savingDam}>
              {editingDam ? t('admin.save') : t('admin.create')}
            </Button>
          </FormActions>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* CỘT TRÁI: Form nhập liệu */}
          <form id="dam-form" onSubmit={handleSaveDam} className="md:col-span-6 space-y-3">
            <Field label="Mã Đập Thủy Điện (ID)" hint="Tự động sinh bởi Backend">
              <TextInput
                icon={Lock}
                disabled
                readOnly
                value={editingDam ? damForm.id : '(Tự động sinh bởi Backend)'}
                className="font-mono cursor-not-allowed select-none"
              />
            </Field>

            <Field label={t('admin.form.damNameLabel')} required error={damErrors.name} htmlFor="dam-name">
              <TextInput
                id="dam-name"
                required
                autoFocus
                error={damErrors.name}
                value={damForm.name}
                onChange={e => {
                  setDamForm(p => ({ ...p, name: e.target.value }))
                  if (damErrors.name) setDamErrors(p => ({ ...p, name: null }))
                }}
                placeholder="vd: Đập Thủy điện Hòa Bình"
              />
            </Field>

            <Field label="Địa danh / Vị trí hành chính" htmlFor="dam-location">
              <TextInput
                id="dam-location"
                value={damForm.location}
                onChange={e => setDamForm(p => ({ ...p, location: e.target.value }))}
                placeholder="vd: Hòa Bình"
              />
            </Field>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Vĩ độ (Latitude °N)" required error={damErrors.latitude} htmlFor="dam-lat">
                <TextInput
                  id="dam-lat"
                  type="number"
                  step="0.0001"
                  required
                  error={damErrors.latitude}
                  value={damForm.latitude}
                  onChange={e => {
                    setDamForm(p => ({ ...p, latitude: e.target.value }))
                    if (damErrors.latitude) setDamErrors(p => ({ ...p, latitude: null }))
                  }}
                  placeholder="vd: 20.8167"
                  className="font-mono"
                />
              </Field>
              <Field label="Kinh độ (Longitude °E)" required error={damErrors.longitude} htmlFor="dam-lng">
                <TextInput
                  id="dam-lng"
                  type="number"
                  step="0.0001"
                  required
                  error={damErrors.longitude}
                  value={damForm.longitude}
                  onChange={e => {
                    setDamForm(p => ({ ...p, longitude: e.target.value }))
                    if (damErrors.longitude) setDamErrors(p => ({ ...p, longitude: null }))
                  }}
                  placeholder="vd: 105.3265"
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="bg-card2/60 border border-border/60 rounded-lg p-2 text-[10px] text-muted">
              Mực nước, mức chứa và trạng thái an toàn được hệ thống tự tính từ dữ liệu cảm biến — không nhập tay tại đây.
            </div>
          </form>

          {/* CỘT PHẢI: Bản đồ chọn tọa độ + Live Preview Card */}
          <div className="md:col-span-6 space-y-3 flex flex-col justify-between">
            <div>
              <label className="text-[11px] font-bold text-tx mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Bản đồ chọn tọa độ GIS (Click hoặc kéo ghim)</span>
              </label>
              <LocationPickerMap
                latitude={damForm.latitude}
                longitude={damForm.longitude}
                onChange={({ latitude, longitude }) => setDamForm(p => ({ ...p, latitude, longitude }))}
                height="190px"
              />
            </div>

            {/* Live Preview Card */}
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Xem trước thẻ đập (Live Preview):</span>
                <span className="text-accent text-[9px] font-mono">Tự động cập nhật</span>
              </div>
              <div className="bg-card2 border border-border border-l-4 border-l-safe rounded-xl p-4 shadow-panel">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20 font-bold shrink-0">
                        {editingDam ? damForm.id : 'MÃ TỰ ĐỘNG'}
                      </span>
                      <h4 className="text-base font-bold text-tx m-0 leading-tight">
                        {damForm.name || 'Tên Đập Thủy Điện'}
                      </h4>
                    </div>
                    <div className="text-[10px] text-muted flex items-center gap-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="truncate">
                        {damForm.latitude && damForm.longitude
                          ? `${Number(damForm.latitude).toFixed(4)}°N, ${Number(damForm.longitude).toFixed(4)}°E`
                          : 'Chưa có tọa độ'}
                        {damForm.location ? ` (${damForm.location})` : ''}
                      </span>
                    </div>
                  </div>
                  <Badge status="unknown" sm title="Đập mới tạo chưa có trạm kết nối" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── DELETE CONFIRM MODAL ── */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('admin.deleteConfirmTitle')}
        icon={AlertTriangle}
        maxWidth="max-w-md"
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              {t('admin.cancel')}
            </Button>
            <Button variant="danger" loading={deletingDam} onClick={handleConfirmDelete}>
              {t('admin.confirmDelete')}
            </Button>
          </FormActions>
        }
      >
        <p className="text-[10px] text-muted m-0">{t('admin.deleteWarning')}</p>
        <p className="text-[11px] text-tx leading-relaxed bg-card2 p-3 rounded-lg border border-border">
          Xóa Đập thủy điện <strong className="text-danger">{deleteConfirm?.name}</strong> (ID: {deleteConfirm?.id})?
          <span className="flex items-center gap-1 text-[10px] text-warning mt-1">
            <AlertTriangle className="w-3 h-3 text-warning shrink-0" />
            <span>{t('admin.deleteDamNotice')}</span>
          </span>
        </p>
      </Modal>
    </div>
  )
}
````

## File: app/page.jsx
````javascript
'use client'
import Link from 'next/link'
import { getStatus, getStatusBySeverity } from '@/lib/statusConfig'
import { useState, useRef, useLayoutEffect } from 'react'
import { Mono, Badge, Divider, Label, Panel, Card, LiveDot, StatTile, RadialGauge } from '@/components/ui'
import { useAlarmData } from '@/hooks/useAlarmData'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { SEVERITY_MAP, SENSOR_TYPE_LABELS, SENSOR_TYPE_UNITS, timeAgo } from '@/lib/sensorHelpers'
import { MapPin, Map as MapIcon, ArrowUp, ChevronUp, ChevronDown, Minus, CheckCircle, Database, AlertTriangle, AlertOctagon, ShieldCheck, BellRing, Siren, LayoutDashboard, Radio } from 'lucide-react'

import DamMap from '@/components/DamMap'

export default function DashboardPage() {
  const { user, isOperator, assignedDamId } = useAuth()
  const damIdForDashboard = isOperator && assignedDamId ? assignedDamId : 'all'
  const { alarms, unresolvedCount } = useAlarmData(damIdForDashboard)
  const { dams, stations, loading, error } = useDamData()
  const { t } = useLanguage()

  const visibleDams = isOperator && assignedDamId ? dams.filter(d => d.damId === assignedDamId) : dams
  const visibleStations = isOperator && assignedDamId ? stations.filter(s => s.damId === assignedDamId) : stations
  const visibleAlarms = isOperator && assignedDamId ? alarms.filter(a => a.damId === assignedDamId || !a.damId) : alarms

  const counts = {
    critical: visibleStations.filter(s => s.status === 'critical').length,
    danger: visibleStations.filter(s => s.status === 'danger').length,
    warning: visibleStations.filter(s => s.status === 'warning').length,
    safe: visibleStations.filter(s => s.status === 'safe').length,
  }

  const featured = visibleStations[0]
  const featuredStatus = getStatus(featured?.status)

  const [centerTab, setCenterTab] = useState('map') // 'map' | 'stations'
  const tabBtnClass = (active) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer border-none transition-colors ${
      active ? 'bg-accent/15 text-accent' : 'bg-transparent text-muted hover:text-tx hover:bg-white/5'
    }`

  // Page height: measured from the real distance to the viewport bottom (not a hardcoded
  // "navbar is Npx" guess) so the whole dashboard fits one screen with no page scroll —
  // each column then stretches to fill it evenly instead of leaving mismatched gaps.
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (!pageRef.current) return
      const top = pageRef.current.getBoundingClientRect().top
      const h = Math.max(400, Math.floor(window.innerHeight - top))
      setPageHeight(prev => (prev === h ? prev : h))
    }
    updateHeight()

    // NavBar/LiveStatusBar sit above <main> and can grow after mount (nav items that
    // depend on the logged-in role, an alert badge, a wrapped row on a narrower window) —
    // a one-time top measurement would go stale and let the page scroll again, hiding the
    // header. Watch every sibling before <main> so any of that reflows the computed height.
    const mainEl = pageRef.current?.closest('main')
    const watched = []
    for (let sib = mainEl?.previousElementSibling; sib; sib = sib.previousElementSibling) {
      watched.push(sib)
    }

    const ro = new ResizeObserver(updateHeight)
    watched.forEach(el => ro.observe(el))
    window.addEventListener('resize', updateHeight)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return (
    <div
      ref={pageRef}
      style={pageHeight != null ? { height: pageHeight, maxHeight: pageHeight } : undefined}
      className="p-4 flex flex-col gap-4 overflow-hidden"
    >
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent-soft text-accent flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-tx tracking-wide m-0 leading-tight">Tổng Quan Hệ Thống</h1>
            <p className="text-[10px] text-muted m-0">Giám sát trạng thái đập và trạm quan trắc theo thời gian thực</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-safe-soft border border-safe-soft shrink-0">
          <LiveDot active />
          <span className="text-[10px] font-mono text-safe font-bold">LIVE</span>
        </span>
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0">
        <StatTile compact icon={Database} label={t('dashboard.damList')} value={visibleDams.length} status="info" />
        <StatTile compact icon={Siren} label={t('status.critical')} value={counts.critical} status="critical" />
        <StatTile compact icon={AlertOctagon} label={t('status.danger')} value={counts.danger} status="danger" />
        <StatTile compact icon={AlertTriangle} label={t('status.warning')} value={counts.warning} status="warning" />
        <StatTile compact icon={ShieldCheck} label={t('status.safe')} value={counts.safe} status="safe" />
        <StatTile compact icon={BellRing} label={t('status.unresolved')} value={unresolvedCount} status={unresolvedCount > 0 ? 'danger' : 'safe'} />
      </div>

      {/* ── MAIN GRID — items-stretch so all 3 columns share the same height, no dead space ── */}
      <div className="grid items-stretch gap-4 grid-cols-1 lg:grid-cols-[260px_1fr_280px] flex-1 min-h-0">
        {/* ── LEFT ── */}
        <div className="h-full flex flex-col gap-3 min-h-0">
          <Panel
            title={t('dashboard.damList')}
            right={<Mono className="text-[10px] text-muted">{visibleDams.length} {t('dashboard.damCount')}</Mono>}
            className="flex-1 min-h-0 flex flex-col"
            bodyClassName="p-2.5 flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5"
          >
            {visibleDams.map(d => {
              const s = getStatus(d.status)
              return (
                <Link key={d.damId} href={`/dams/${d.damId}`}
                  title={d.statusReason || d.name}
                  className={`flex items-center gap-2 bg-card2/60 border border-border border-l-[3px] ${s.leftBorder} rounded-lg px-2.5 py-2 no-underline hover:bg-card2 transition-colors shrink-0`}>
                  <span className="text-[11px] font-semibold text-tx truncate flex-1 min-w-0">{d.name}</span>
                  <Mono className={`text-[11px] font-bold ${s.text} shrink-0`}>{d.waterLevel}m</Mono>
                  <Mono className="text-[10px] text-muted shrink-0 w-9 text-right">{d.fillPct}%</Mono>
                  <Badge status={d.status} sm className="shrink-0" />
                </Link>
              )
            })}
          </Panel>

          {/* Summary */}
          <Panel title={t('dashboard.stationOverview')} className="shrink-0">
            {[[t('status.critical'), counts.critical, 'text-critical', 'bg-critical'], [t('status.danger'), counts.danger, 'text-danger', 'bg-danger'], [t('status.warning'), counts.warning, 'text-warning', 'bg-warning'], [t('status.safe'), counts.safe, 'text-safe', 'bg-safe']].map(([lb, ct, cl, dot]) => (
              <div key={lb} className="flex justify-between items-center mb-2.5 last:mb-0">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  <span className="text-[12px] text-tx">{lb}</span>
                </div>
                <Mono className={`text-base font-bold ${cl}`}>{ct}</Mono>
              </div>
            ))}
            <Divider />
            <div className="flex justify-between">
              <span className="text-[11px] text-muted">{t('dashboard.totalActive')}</span>
              <Mono className="text-[13px] text-tx">{visibleStations.length} trạm</Mono>
            </div>
          </Panel>
        </div>

        {/* ── CENTER — tabbed: Bản đồ / Trạm quan trắc (only one visible at a time) ── */}
        <div className="h-full flex flex-col min-h-0">
          <Card className="h-full flex flex-col min-h-0 overflow-hidden [&_.leaflet-container]:rounded-b-xl">
            <div className="flex items-center justify-between px-2.5 py-2 border-b border-border/70 shrink-0">
              <div className="flex items-center gap-1" role="tablist">
                <button role="tab" aria-selected={centerTab === 'map'} onClick={() => setCenterTab('map')} className={tabBtnClass(centerTab === 'map')}>
                  <MapIcon className="w-3 h-3" /> Bản đồ
                </button>
                <button role="tab" aria-selected={centerTab === 'stations'} onClick={() => setCenterTab('stations')} className={tabBtnClass(centerTab === 'stations')}>
                  <Radio className="w-3 h-3" /> Trạm quan trắc
                </button>
              </div>
              {centerTab === 'map' ? (
                <span className="flex items-center gap-1.5 shrink-0">
                  <LiveDot active /><span className="text-[10px] font-mono text-safe font-bold">LIVE</span>
                </span>
              ) : (
                <Mono className="text-[10px] text-muted shrink-0">{visibleStations.length} trạm</Mono>
              )}
            </div>

            {centerTab === 'map' ? (
              <div className="flex-1 min-h-0">
                <DamMap dams={visibleDams} stations={visibleStations} height="100%" />
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {visibleStations.slice(0, 6).map(st => {
                    const allNodes = (st.gateways || []).flatMap(g => g.nodes || [])
                    const isUnlinked = (st.gateways && st.gateways.length > 0 && allNodes.length === 0) || (st.gateways && st.gateways.length === 0)
                    const effectiveStatus = (st.status === 'unknown' || isUnlinked) ? 'unknown' : (st.status || 'unknown')
                    const effectiveReason = (effectiveStatus === 'unknown' && !st.statusReason) ? 'Chưa gắn Sensor Node vào trạm' : (st.statusReason || '')
                    const s = getStatus(effectiveStatus)
                    const hasVal = effectiveStatus !== 'unknown' && st.waterLevel > 0

                    return (
                      <Link key={st.stationId} href={`/stations/${st.stationId}`}
                        className={`bg-card border border-border border-t-2 ${s.topBorder} rounded-xl p-3 cursor-pointer no-underline block
                          hover:-translate-y-0.5 hover:border-borderHi transition-all duration-150 shadow-panel`}>
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[11px] font-semibold text-tx">{st.name}</span>
                          <Badge status={effectiveStatus} sm title={effectiveReason} />
                        </div>
                        <div className="flex items-baseline gap-1 mb-1">
                          <Mono className={`text-xl font-bold ${s.text}`}>{hasVal ? st.waterLevel : '--'}</Mono>
                          <span className="text-[9px] text-muted">m</span>
                          {hasVal && (
                            <span className={`text-[9px] ${st.change > 0 ? 'text-danger' : st.change < 0 ? 'text-safe' : 'text-muted'} inline-flex items-center gap-0.5`}>
                              {st.change > 0 ? <ChevronUp className="w-2.5 h-2.5 shrink-0" /> : st.change < 0 ? <ChevronDown className="w-2.5 h-2.5 shrink-0" /> : <Minus className="w-2.5 h-2.5 shrink-0" />}
                              <span>{Math.abs(st.change)}m</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-muted mb-1.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted shrink-0" />
                          <span className="truncate">{st.location || `${st.river || ''} ${st.km || ''}`}</span>
                        </div>
                        {effectiveReason && effectiveStatus !== 'safe' && (
                          <div className="text-[8px] text-muted font-mono truncate bg-card2/80 px-1.5 py-0.5 rounded border border-border/40" title={effectiveReason}>
                            ⓘ {effectiveReason}
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
                <div className="text-center mt-3">
                  <Link href="/dams"
                    className="inline-block border border-border rounded-lg text-accent text-[11px] font-semibold px-4 py-1.5 no-underline hover:bg-accent/10 hover:border-accent/40 transition-colors">
                    {t('dashboard.viewAllStations', { count: visibleStations.length })}
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ── RIGHT ── */}
        <div className="h-full flex flex-col gap-3 min-h-0">
          {/* Featured station */}
          <Panel
            title="Trạm trọng điểm"
            right={featured && <Badge status={featured.status} sm />}
            className="shrink-0"
          >
            {featured ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  {/* Station không có fillPct riêng — lấy mức chứa của Đập chứa nó (backend tự tính) */}
                  <RadialGauge value={visibleDams.find(d => d.damId === featured.damId)?.fillPct ?? 0} size={72} stroke={7} status={featured.status} label={`${featured.waterLevel}`} sublabel="mét" />
                  <div className="min-w-0">
                    <div className="text-base font-bold text-tx truncate">{featured.name}</div>
                    <div className="text-[10px] text-muted flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{featured.location}</span>
                    </div>
                    <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${featured.change > 0 ? 'text-danger' : featured.change < 0 ? 'text-safe' : 'text-muted'}`}>
                      {featured.change > 0 ? <ChevronUp className="w-3 h-3 shrink-0" /> : featured.change < 0 ? <ChevronDown className="w-3 h-3 shrink-0" /> : <Minus className="w-3 h-3 shrink-0" />}
                      <span>{featured.change > 0 ? 'Tăng' : featured.change < 0 ? 'Giảm' : 'Ổn định'} {Math.abs(featured.change ?? 0)}m</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Độ ẩm', featured.humidity != null ? `${featured.humidity}%` : '—'],
                    ['Độ rung', featured.vibration != null ? `${featured.vibration} mm/s` : '—'],
                  ].map(([lb, val]) => (
                    <div key={lb} className="bg-card2/70 rounded-lg px-2.5 py-2 border border-border/50">
                      <div className="text-[8px] text-muted uppercase tracking-wide mb-1">{lb}</div>
                      <Mono className="text-[12px] text-tx font-semibold">{val}</Mono>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-[11px] text-muted text-center py-4">Chưa có dữ liệu trạm</div>
            )}
          </Panel>

          {/* Alerts — Real alarm data từ backend */}
          <Panel
            title="Cảnh báo mới nhất"
            right={
              <Mono className="text-[9px] text-danger bg-danger-soft px-1.5 py-0.5 rounded-full font-bold">
                {unresolvedCount} CHƯA XỬ LÝ
              </Mono>
            }
            className="flex-1 min-h-0 flex flex-col"
            bodyClassName="p-3.5 flex-1 min-h-0 flex flex-col"
          >
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-0.5">
              {
                visibleAlarms.slice(0, 4).map(al => {
                  const s = getStatusBySeverity(al.severity)
                  const sevInfo = SEVERITY_MAP[al.severity] || SEVERITY_MAP.WARNING
                  const typeLb = SENSOR_TYPE_LABELS[al.sensorType] || al.sensorType

                  const station = visibleStations.find(st =>
                    (al.stationId && st.stationId === al.stationId) ||
                    st.stationId === al.sensorId
                  ) || visibleStations.find(st => st.damId === al.damId) || visibleStations[0] || stations[0]

                  const dam = visibleDams.find(d => d.damId === al.damId) || visibleDams.find(d => d.damId === station?.damId) || visibleDams[0] || dams[0]

                  const damName = al.damName || dam?.name || 'Đập Thủy Điện'
                  const stName = al.stationName || station?.name || 'Trạm Quan Trắc'

                  return (
                    <div key={al.id}
                      className={`bg-card2/60 border border-border border-l-[3px] ${s.leftBorder} rounded-lg px-2.5 py-2 shrink-0
                      ${al.resolvedAt ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-mono text-[9px] uppercase font-bold ${s.text} flex items-center gap-1`}>
                          {sevInfo.icon && <sevInfo.icon className="w-3 h-3 shrink-0" />}
                          <span>{sevInfo.label}</span>
                        </span>
                        <span className="font-mono text-[9px] text-faint">{timeAgo(al.triggeredAt)} trước</span>
                      </div>

                      <div className="text-[12px] font-bold text-tx mb-0.5 truncate">
                        {typeLb}: {al.measuredVal} {SENSOR_TYPE_UNITS[al.sensorType] || ''}
                      </div>

                      <div className="text-[9px] text-muted flex items-center gap-1 truncate">
                        <MapPin className="w-2.5 h-2.5 text-muted shrink-0" />
                        <span className="truncate">{stName} · {damName}</span>
                      </div>
                    </div>
                  )
                })
              }
              {
                visibleAlarms.length === 0 && (
                  <div className="bg-card2/40 border border-border/60 rounded-lg px-2.5 py-4 text-center text-[10px] text-muted flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-safe shrink-0" />
                    <span>Không có cảnh báo — Hệ thống ổn định</span>
                  </div>
                )
              }
            </div>
            <div className="text-center mt-2.5 shrink-0">
              <Link href="/alerts" className="text-[10px] text-accent font-semibold no-underline hover:underline">
                Xem tất cả thông báo →
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
````

## File: components/NavBar.jsx
````javascript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAlarmData } from '@/hooks/useAlarmData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Home, TrendingUp, AlertTriangle, Calendar, Database, Globe, Server, Users, LogOut, ShieldCheck, User, FileText, Eye, ChevronDown, UserCircle } from 'lucide-react'

export default function NavBar() {
  const pathname = usePathname()
  const { locale, toggleLanguage, t } = useLanguage()
  const { user, logout, isAdmin, isOperator, isViewer } = useAuth()

  const damIdForBadge = isOperator && user?.assignedDamId ? user.assignedDamId : 'all'
  const { unresolvedCount } = useAlarmData(damIdForBadge)

  const NAV = [
    { href: '/', label: t('nav.home'), icon: Home, badge: 0 },
    { href: '/dams', label: t('nav.dams'), icon: Database, badge: 0 },
  ]

  if (isAdmin || isOperator) {
    NAV.push({ href: '/alerts', label: t('nav.alerts'), icon: AlertTriangle, badge: unresolvedCount })
    NAV.push({ href: '/history', label: t('nav.history'), icon: Calendar, badge: 0 })
    NAV.push({ href: '/admin/gateways', label: t('nav.gateways') || 'Gateway & Thiết bị', icon: Server, badge: 0 })
  }

  if (isAdmin) {
    NAV.push({ href: '/users', label: 'Quản lý User', icon: Users, badge: 0 })
    NAV.push({ href: '/admin/logs', label: 'Nhật ký Hệ thống', icon: FileText, badge: 0 })
  }

  // Ẩn NavBar ở trang Login và Register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <header className="h-14 glass-nav border-b border-border/70 px-4 flex items-center justify-between sticky top-0 z-50 font-sans">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mr-4 shrink-0 no-underline group">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent2 via-accent to-indigo-600 flex items-center justify-center text-white shadow-glow shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span className="font-bold text-[15px] text-tx tracking-wide whitespace-nowrap">
          {t('appName')}
        </span>
      </Link>

      {/* Nav Menu Items */}
      <nav className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all no-underline shrink-0 relative ${
                active
                  ? 'bg-accent/12 text-accent font-bold border border-accent/25'
                  : 'text-muted hover:text-tx hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-accent' : 'text-muted'}`} />
              <span>{label}</span>
              {badge > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-danger text-white font-mono text-[9px] font-bold rounded-full shadow-glow-danger animate-pulse">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card2/70 border border-border rounded-lg text-[11px] font-bold text-tx cursor-pointer hover:border-accent/50 hover:text-accent transition-all shrink-0"
          title="Chuyển đổi ngôn ngữ / Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-accent" />
          <span>{locale === 'vi' ? 'VI' : 'EN'}</span>
        </button>

        {/* User Auth Info & Dropdown on Hover */}
        {user ? (
          <div className="relative group shrink-0">
            {/* Bo tròn dạng pill */}
            <div className="flex items-center gap-2 pl-1 pr-2.5 py-1 bg-card2/70 hover:bg-card border border-border hover:border-accent/40 rounded-full cursor-pointer transition-all duration-200">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent2 via-accent to-purple-500 flex items-center justify-center text-[9px] text-white font-bold uppercase shadow-inner">
                {user.username ? user.username.slice(0, 2) : 'US'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] text-tx font-bold leading-tight max-w-[110px] truncate">
                  {user.fullName || user.username}
                </span>
                <span className="text-[8.5px] font-mono text-accent font-bold leading-none">
                  {user.role}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-muted group-hover:text-tx group-hover:rotate-180 transition-transform duration-200" />
            </div>

            {/* Dropdown Menu hiện ra khi hover */}
            <div className="absolute right-0 top-full pt-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 translate-y-1 transition-all duration-200 z-50">
              <div className="w-56 glass-panel rounded-2xl shadow-2xl p-3">
                {/* Header User Info */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-border">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent2 via-accent to-purple-500 flex items-center justify-center text-[12px] text-white font-bold uppercase shadow-sm shrink-0">
                    {user.username ? user.username.slice(0, 2) : 'US'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] text-tx font-bold truncate">
                      {user.fullName || user.username}
                    </span>
                    <span className="text-[10px] text-muted truncate">
                      {user.email || `@${user.username}`}
                    </span>
                    <span className="inline-block mt-0.5 text-[8.5px] font-mono font-bold text-accent px-1.5 py-0.2 bg-accent-soft border border-accent-soft rounded-md w-fit">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Đập được phân công nếu có */}
                {user.assignedDamId && (
                  <div className="py-2 text-[10px] text-muted flex items-center justify-between border-b border-border">
                    <span>Đập phụ trách:</span>
                    <span className="font-mono font-bold text-tx uppercase">{user.assignedDamId}</span>
                  </div>
                )}

                {/* Hồ sơ cá nhân */}
                <div className="py-2 border-b border-border">
                  <Link
                    href="/profile"
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-tx hover:bg-white/5 no-underline transition-colors cursor-pointer"
                  >
                    <UserCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                </div>

                {/* Nút Logout */}
                <div className="pt-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-danger bg-danger/10 hover:bg-danger/20 border border-danger/20 hover:border-danger/40 cursor-pointer transition-all"
                    title="Đăng xuất khỏi hệ thống"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2.5 py-1 bg-card2/70 border border-border rounded-lg text-[10px] text-muted font-bold font-mono hidden sm:flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-muted shrink-0" />
              <span>KHÁCH QUAN SÁT</span>
            </div>
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-accent2 via-accent to-indigo-600 text-white rounded-lg text-[11px] font-bold hover:brightness-110 no-underline shrink-0 shadow-glow transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Đăng nhập Cán bộ</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
````

## File: app/stations/[id]/page.jsx
````javascript
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getStatus, getStatusBySeverity } from "@/lib/statusConfig";
import { Mono, Badge, Label, Panel, LiveDot, RadialGauge } from "@/components/ui";
import { Field, TextInput, Modal, FormActions, Button, Toast } from "@/components/form";
import { useSensorData } from "@/hooks/useSensorData";
import { useDamData } from "@/hooks/useDamData";
import { useLanguage } from "@/context/LanguageContext";
import {
  historyToChartData,
  calcDelta,
  calcStats,
  getWaterStatus,
  getMoistureStatus,
  getVibrationStatus,
  SEVERITY_MAP,
  timeAgo,
  SENSOR_TYPE_LABELS,
  SENSOR_TYPE_UNITS
} from "@/lib/sensorHelpers";
import CameraViewer from "@/components/CameraViewer";
import DamMap from "@/components/DamMap";
import LocationPickerMap from "@/components/LocationPickerMap";
import StationDevicesTab from "@/components/StationDevicesTab";
import { useAlarmData } from "@/hooks/useAlarmData";
import { useAuth } from "@/context/AuthContext";
import { exportStationReportToPDF } from "@/lib/exportHelpers";
import { AlertTriangle, ChevronRight, Download, CheckCircle2, ChevronUp, ChevronDown, Minus, Camera, Maximize2, Pencil, Trash2, MapPin, Radio, Sliders, Droplet, Activity, Cpu, Server, Save, Zap } from "lucide-react";
import { updateThresholdConfig } from "@/lib/api";

const CHART_STYLE = {
  background: "#0e1622",
  border: "1px solid #22314a",
  borderRadius: 8,
  fontSize: 10,
};
const STATUS_HEX = {
  danger: "#fb4360",
  warning: "#f59e0b",
  safe: "#22c55e",
  info: "#38bdf8",
};
const STATUS_CL = {
  danger: "text-danger bg-danger/10 border-danger/30",
  warning: "text-warning bg-warning/10 border-warning/30",
  safe: "text-safe bg-safe/10 border-safe/30",
};

// ── Connection status banner ───────────────────────────────────────────────────
function ConnectionBanner({ connected, error, hasNodes, latest }) {
  if (!hasNodes)
    return (
      <div className="flex items-center gap-2 px-3.5 py-2 bg-warning/10 border border-warning/30 rounded-lg mb-3">
        <span className="w-2 h-2 rounded-full bg-warning" />
        <span className="text-[10px] font-mono font-semibold tracking-wide text-warning">
          TRẠM CHƯA ĐƯỢC KẾT NỐI VỚI SENSOR NODE NÀO — KHÔNG CÓ DỮ LIỆU CẢM BIẾN
        </span>
      </div>
    );
  if (connected && latest)
    return (
      <div className="flex items-center gap-2 px-3.5 py-2 bg-safe/10 border border-safe/30 rounded-lg mb-3">
        <LiveDot active />
        <span className="text-[10px] font-mono font-semibold tracking-wide text-safe">
          REAL-TIME STREAMING ACTIVE (ĐANG TRUYỀN DATA)
        </span>
      </div>
    );
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 bg-card2/60 border border-border rounded-lg mb-3">
      <LiveDot active={false} />
      <span className="text-[10px] text-muted">
        {error ? `Mất kết nối: ${error}` : "Đang chờ dữ liệu từ thiết bị IoT..."}
      </span>
    </div>
  );
}

// ── Metric Card with sparkline ─────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaUp,
  statusLabel,
  statusCl,
  color,
  data,
  threshold,
  stats,
}) {
  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col shadow-panel hover:-translate-y-0.5 hover:border-borderHi transition-all duration-150"
      style={{ borderTop: `2px solid ${color}` }}
    >
      <div className="px-3.5 pt-3.5 pb-0 flex justify-between items-start">
        <div className="min-w-0">
          <Label className="mb-1.5 truncate">{label}</Label>
          <div className="flex items-baseline gap-1.5">
            <Mono
              className="text-2xl font-bold leading-none"
              style={{ color }}
            >
              {value}
            </Mono>
            <span className="text-[11px] text-muted">{unit}</span>
            {delta !== null && (
              <span
                className={`text-[10px] font-semibold ${deltaUp === true ? "text-danger" : deltaUp === false ? "text-safe" : "text-muted"} inline-flex items-center gap-0.5`}
              >
                {deltaUp === true ? (
                  <ChevronUp className="w-2.5 h-2.5 shrink-0" />
                ) : deltaUp === false ? (
                  <ChevronDown className="w-2.5 h-2.5 shrink-0" />
                ) : (
                  <Minus className="w-2.5 h-2.5 shrink-0" />
                )}{" "}
                {delta}
              </span>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[8px] font-mono font-bold tracking-wide px-2 py-0.5 rounded-full border mt-1 whitespace-nowrap ${statusCl}`}
        >
          <span className={`w-1 h-1 rounded-full ${statusCl.includes("text-danger") ? "bg-danger" : statusCl.includes("text-warning") ? "bg-warning" : "bg-safe"} shrink-0`} />
          {statusLabel}
        </span>
      </div>

      {/* Sparkline */}
      <div className="px-1 pt-1 flex items-center justify-center" style={{ height: 76 }}>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
            >
              <defs>
                <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={CHART_STYLE}
                itemStyle={{ color: "#f1f5f9" }}
                labelStyle={{ color: "#8b9cb8" }}
                formatter={(v) => [`${v} ${unit}`, label]}
                labelFormatter={(l) => `Thời gian: ${l}`}
              />
              {threshold && (
                <ReferenceLine
                  y={threshold}
                  stroke="#fb4360"
                  strokeDasharray="3 3"
                  label={{
                    value: `BĐ: ${threshold}`,
                    fill: "#fb4360",
                    fontSize: 8,
                    position: "insideTopRight",
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#grad-${label})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-[10px] text-muted/50 font-mono italic">
            Chưa có chuỗi dữ liệu
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 border-t border-border/70 mt-auto">
        {stats.map(({ lb, val, cl }, i) => (
          <div
            key={lb}
            className={`px-3 py-2.5 ${i < 2 ? "border-r border-border/70" : ""}`}
          >
            <div className="text-[8px] text-muted uppercase tracking-wide mb-1 truncate">
              {lb}
            </div>
            <Mono className={`text-[13px] font-semibold ${cl}`}>{val}</Mono>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function StationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAdmin, isOperator, isViewer, assignedDamId } = useAuth();
  const { dams, stations, refetch, updateStation, deleteStation } = useDamData();
  const { t, locale } = useLanguage();
  // Fallback khi chưa tải xong / không tìm thấy: KHÔNG bịa số đo, để 0 + trạng thái 'unknown'.
  const defaultSt = { stationId: String(id), name: 'Trạm Quan Trắc', location: '', latitude: 21.0381, longitude: 105.8492, river: '', km: '', status: 'unknown', waterLevel: 0, humidity: 0, vibration: 0 };
  const st = stations.find((s) => s.stationId === String(id)) || defaultSt;
  const stStatus = getStatus(st.status);

  // Tab State: 'monitoring' (Giám sát) | 'devices' (Thiết bị phần cứng)
  const [activeTab, setActiveTab] = useState('monitoring');

  // Khi là viewer hoặc chưa đăng nhập, tự động khóa ở tab 'monitoring'
  useEffect(() => {
    if (isViewer && activeTab !== 'monitoring') {
      setActiveTab('monitoring');
    }
  }, [isViewer, activeTab]);

  // Toast State
  const [toast, setToast] = useState(null) // { message, type }
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Threshold Modal State & Form cho Trạm
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false)
  const [savingThresholds, setSavingThresholds] = useState(false)
  const [threshForm, setThreshForm] = useState({
    water_level: { warnHigh: 42.5, alertHigh: 50.0, criticalHigh: 55.0, tankHeight: 50.0 },
    vibration: { warnHigh: 2.5, alertHigh: 15.0, criticalHigh: 25.0, sustainedSeconds: 3 },
    humidity: { warnHigh: 75.0, alertHigh: 85.0, criticalHigh: 95.0 },
  })

  const openThresholdModal = () => {
    if (thresholds) {
      setThreshForm({
        water_level: {
          warnHigh: thresholds.water_level?.warnHigh ?? 42.5,
          alertHigh: thresholds.water_level?.alertHigh ?? 50.0,
          criticalHigh: thresholds.water_level?.criticalHigh ?? 55.0,
          tankHeight: thresholds.water_level?.tankHeight ?? 50.0,
        },
        vibration: {
          warnHigh: thresholds.vibration?.warnHigh ?? 2.5,
          alertHigh: thresholds.vibration?.alertHigh ?? 15.0,
          criticalHigh: thresholds.vibration?.criticalHigh ?? 25.0,
          sustainedSeconds: thresholds.vibration?.sustainedSeconds ?? 3,
        },
        humidity: {
          warnHigh: thresholds.humidity?.warnHigh ?? 75.0,
          alertHigh: thresholds.humidity?.alertHigh ?? 85.0,
          criticalHigh: thresholds.humidity?.criticalHigh ?? 95.0,
        },
      })
    }
    setThresholdModalOpen(true)
  }

  // Edit / Delete Modal State
  const [editingModalOpen, setEditingModalOpen] = useState(false)
  const [savingStation, setSavingStation] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [stationForm, setStationForm] = useState({
    name: '',
    location: '',
    latitude: 21.0381,
    longitude: 105.8492,
    river: '',
    km: '',
    status: 'safe',
  })

  const openEditModal = () => {
    setStationForm({
      name: st.name || '',
      location: st.location || '',
      latitude: st.latitude ?? 21.0381,
      longitude: st.longitude ?? 105.8492,
      river: st.river || '',
      km: st.km || '',
      status: st.status || 'safe',
    })
    setStationErrors({})
    setEditingModalOpen(true)
  }

  const [stationErrors, setStationErrors] = useState({})

  const validateStationForm = () => {
    const errs = {}
    if (!stationForm.name || !stationForm.name.trim()) {
      errs.name = 'Vui lòng nhập tên trạm quan trắc'
    } else if (stationForm.name.trim().length < 3) {
      errs.name = 'Tên trạm phải có ít nhất 3 ký tự'
    }

    const lat = Number(stationForm.latitude)
    if (stationForm.latitude === '' || isNaN(lat)) {
      errs.latitude = 'Vui lòng nhập vĩ độ hợp lệ'
    } else if (lat < -90 || lat > 90) {
      errs.latitude = 'Vĩ độ phải từ -90° đến 90°'
    }

    const lng = Number(stationForm.longitude)
    if (stationForm.longitude === '' || isNaN(lng)) {
      errs.longitude = 'Vui lòng nhập kinh độ hợp lệ'
    } else if (lng < -180 || lng > 180) {
      errs.longitude = 'Kinh độ phải từ -180° đến 180°'
    }

    setStationErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveStation = async () => {
    if (!validateStationForm()) return

    try {
      setSavingStation(true)
      await updateStation(st.stationId, {
        name: stationForm.name.trim(),
        location: stationForm.location.trim(),
        latitude: Number(stationForm.latitude),
        longitude: Number(stationForm.longitude),
        river: stationForm.river.trim(),
        km: stationForm.km.trim(),
        status: stationForm.status,
      })
      showToast('Cập nhật thông tin trạm quan trắc thành công!', 'success')
      setEditingModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingStation(false)
    }
  }

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true)
      await deleteStation(st.stationId)
      showToast(`Đã xóa trạm quan trắc ${st.name}!`, 'success')
      setDeleteConfirm(false)
      setTimeout(() => {
        router.push(st.damId ? `/dams/${st.damId}` : '/dams')
      }, 1000)
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error')
    } finally {
      setDeleting(false)
    }
  }

  // ── Real-time data từ backend (chỉ nhận dữ liệu đúng của Trạm này) ──
  const { latest, history, connected, error } = useSensorData(String(id));
  const { alarms, thresholds, refetch: refetchAlarmData } = useAlarmData(st.damId, String(id))

  const handleSaveThresholds = async () => {
    try {
      setSavingThresholds(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

      if (thresholds?.water_level?.id) {
        await updateThresholdConfig(thresholds.water_level.id, {
          warnHigh: Number(threshForm.water_level.warnHigh),
          alertHigh: Number(threshForm.water_level.alertHigh),
          criticalHigh: Number(threshForm.water_level.criticalHigh),
          tankHeight: Number(threshForm.water_level.tankHeight),
        }, token)
      }

      if (thresholds?.vibration?.id) {
        await updateThresholdConfig(thresholds.vibration.id, {
          warnHigh: Number(threshForm.vibration.warnHigh),
          alertHigh: Number(threshForm.vibration.alertHigh),
          criticalHigh: Number(threshForm.vibration.criticalHigh),
          sustainedSeconds: Number(threshForm.vibration.sustainedSeconds),
        }, token)
      }

      if (thresholds?.humidity?.id) {
        await updateThresholdConfig(thresholds.humidity.id, {
          warnHigh: Number(threshForm.humidity.warnHigh),
          alertHigh: Number(threshForm.humidity.alertHigh),
          criticalHigh: Number(threshForm.humidity.criticalHigh),
        }, token)
      }

      showToast(`Đã lưu cấu hình ngưỡng riêng của Trạm ${st.name} & tự động đồng bộ xuống tất cả Gateway/Node!`, 'success')
      setThresholdModalOpen(false)
      refetchAlarmData?.()
      refetch?.(true)
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu cấu hình ngưỡng', 'error')
    } finally {
      setSavingThresholds(false)
    }
  }

  // Ưu tiên số đo sống từ WebSocket, fallback về giá trị mới nhất backend đã ghi vào Station.
  // Không bịa số mặc định khi chưa có dữ liệu — để 0 và UI hiển thị theo trạng thái 'unknown'.
  const waterLevel = latest?.waterLevel ?? st.waterLevel ?? 0;
  const moisture = latest?.moisture ?? st.humidity ?? 0;
  const freq = latest?.freq ?? 0;
  const amp = latest?.amp ?? st.vibration ?? 0;
  const percent = latest?.percent ?? 0;

  const hasConnectedNodes = useMemo(() => {
    if (!st?.gateways) return false;
    return st.gateways.some(g => g.nodes && g.nodes.length > 0);
  }, [st]);

  // Build chart data từ history backend (chỉ dùng dữ liệu thật, không tạo fake mock lines)
  const waterChartData = useMemo(() => {
    if (history?.waterLevel?.length)
      return historyToChartData(history, "waterLevel");
    return [];
  }, [history]);

  const humidChartData = useMemo(() => {
    if (history?.moisture?.length)
      return historyToChartData(history, "moisture");
    return [];
  }, [history]);

  const vibChartData = useMemo(() => {
    if (history?.freq?.length) return historyToChartData(history, "freq");
    return [];
  }, [history]);

  const ampChartData = useMemo(() => {
    if (history?.amp?.length) return historyToChartData(history, "amp");
    return [];
  }, [history]);

  // Stats
  const waterStats = useMemo(() => calcStats(history?.waterLevel), [history]);
  const humidStats = useMemo(() => calcStats(history?.moisture), [history]);
  const ampStats = useMemo(() => calcStats(history?.amp), [history]);
  const vibStats = useMemo(() => calcStats(history?.freq), [history]);

  // Deltas
  const waterDelta = useMemo(() => calcDelta(history?.waterLevel), [history]);
  const humidDelta = useMemo(() => calcDelta(history?.moisture), [history]);
  const vibDelta = useMemo(() => calcDelta(history?.freq), [history]);
  const ampDelta = useMemo(() => calcDelta(history?.amp), [history]);


  // Status — ngưỡng lấy từ ThresholdConfig của Đập (nguồn duy nhất, xem modal Ngưỡng Cảnh Báo).
  const waterSt = getWaterStatus(waterLevel, undefined, undefined, undefined, thresholds?.water_level)
  const humidSt = getMoistureStatus(moisture, thresholds?.humidity)
  const vibSt = getVibrationStatus(amp, thresholds?.vibration)
  // Threshold values từ backend cho MetricCard
  const waterThreshold = thresholds?.water_level?.alertHigh ?? null
  const humThreshold = thresholds?.humidity?.alertHigh ?? null
  const vibThreshold = thresholds?.vibration?.alertHigh ?? null
  // Hiển thị '—' khi đập chưa có cấu hình ngưỡng, thay vì nội suy chuỗi ra "nullm".
  const fmtThreshold = (v, unit) => (v == null ? '—' : `${v}${unit}`)

  const mainColor = STATUS_HEX[waterSt.level] || "#f59e0b";

  // Operator Restriction: Cannot access stations outside assigned dam
  if (isOperator && assignedDamId && st?.damId && st.damId !== assignedDamId) {
    return (
      <div className="p-8 min-h-[calc(100vh-48px)] flex items-center justify-center">
        <div className="bg-card border border-border max-w-md w-full rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto border border-danger/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-tx">Truy cập bị giới hạn</h2>
          <p className="text-xs text-muted leading-relaxed">
            Bạn là Cán bộ phụ trách đập <strong className="text-accent">{assignedDamId}</strong>. Trạm quan trắc này thuộc đập khác.
          </p>
          <Link
            href={`/dams/${assignedDamId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white font-bold text-xs rounded-xl no-underline hover:bg-accent/90"
          >
            <span>Về trang Đập của bạn ({assignedDamId})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-3 text-[11px]">
        <Link href="/" className="text-muted no-underline hover:text-tx">
          {t('stationDetail.breadcrumbHome')}
        </Link>
        <ChevronRight className="w-3 h-3 text-muted shrink-0" />
        <Link
          href="/stations"
          className="text-muted no-underline hover:text-tx"
        >
          {t('stationDetail.breadcrumbStations')}
        </Link>
        <ChevronRight className="w-3 h-3 text-muted shrink-0" />
        <span className="text-tx">{t('stationDetail.breadcrumbDetail')}</span>
      </div>

      {/* Connection banner */}
      <ConnectionBanner connected={connected} error={error} hasNodes={hasConnectedNodes} latest={latest} />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-xl font-bold text-tx tracking-wide m-0">
              {st.name} ({st.river} — {st.km})
            </h1>
            <Badge status={st.status} title={st.statusReason} />
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full animate-pulse-dot ${stStatus.dot}`}
            />
            <span className="text-[10px] text-muted">
              {st.stationId}
              {latest?.timestamp && (
                <>
                  {" "}
                  • {t('liveBar.updated')}:{" "}
                  {new Date(latest.timestamp).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                </>
              )}
            </span>
          </div>
          {st.statusReason && (
            <div className={`mt-2 text-[10px] flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
              st.status === 'safe'
                ? 'bg-safe/5 text-safe/90 border-safe/20'
                : st.status === 'unknown'
                  ? 'bg-card2 text-muted border-border/50'
                  : 'bg-danger/10 text-danger border-danger/30 font-semibold'
            }`}>
              <span className="shrink-0">ⓘ</span>
              <span><strong>Lý do an toàn:</strong> {st.statusReason}</span>
            </div>
          )}
        </div>

        {/* Action Buttons: Sửa, Xóa, Xuất báo cáo */}
        <div className="flex items-center gap-2">
          {!isViewer && (
            <>
              <button
                onClick={openThresholdModal}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-warning/40 rounded-lg text-warning text-[11px] font-bold bg-warning/10 hover:bg-warning/20 transition-colors cursor-pointer"
                title="Cấu hình Ngưỡng Cảnh Báo riêng cho Trạm này"
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span>Cấu hình Ngưỡng Trạm</span>
              </button>
              <button
                onClick={openEditModal}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-accent text-[11px] font-bold bg-card2 hover:bg-white/5 transition-colors cursor-pointer"
                title="Chỉnh sửa thông tin Trạm"
              >
                <Pencil className="w-3.5 h-3.5 shrink-0" />
                <span>Sửa thông tin</span>
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-danger/30 rounded-lg text-danger text-[11px] font-bold bg-danger/10 hover:bg-danger/20 transition-colors cursor-pointer"
                title="Xóa Trạm quan trắc"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Xóa trạm</span>
              </button>
            </>
          )}
          <button
            onClick={() => exportStationReportToPDF(st, dam, latest, stationAlarms, user)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold border-none cursor-pointer bg-gradient-to-r from-info to-accent shadow-glow hover:brightness-110 transition-all"
            title="Xuất phiếu báo cáo hiện trạng an toàn trạm quan trắc ra file PDF"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>{t('stationDetail.exportReport')}</span>
          </button>
        </div>
      </div>

      {/* ── TAB SWITCHER: GIÁM SÁT VS THIẾT BỊ PHẦN CỨNG (Chỉ hiển thị cho Cán bộ / Quản trị viên) ── */}
      {!isViewer && (
        <div className="flex items-center gap-2 mb-4 border-b border-border/70 pb-3">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'monitoring'
                ? 'bg-accent text-white border-accent shadow-glow'
                : 'bg-card text-muted border-border hover:text-tx hover:bg-card2'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Giám Sát & Trực Quan Hóa (Live Telemetry & GIS)</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'devices'
                ? 'bg-accent text-white border-accent shadow-glow'
                : 'bg-card text-muted border-border hover:text-tx hover:bg-card2'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Thiết Bị & Cấu Hình Phần Cứng (Gateways, Nodes, Sensors)</span>
          </button>
        </div>
      )}

      {/* ── TAB 1: GIÁM SÁT & TRỰC QUAN HÓA (Hiển thị cho viewer/khách và khi activeTab === 'monitoring') ── */}
      {(isViewer || activeTab === 'monitoring') && (
        <>
          {/* ── GIS MAP BẢN ĐỒ TỌA ĐỘ TRẠM ── */}
          <Panel
            title={
              <span className="flex items-center gap-1.5 normal-case text-xs font-bold text-tx tracking-normal">
                <MapPin className="w-4 h-4 text-info shrink-0" />
                <span>Vị trí địa lý & Tọa độ GIS Trạm quan trắc</span>
              </span>
            }
            right={
              <span className="font-mono text-[10px] text-muted flex items-center gap-1">
                <MapPin className="w-3 h-3 text-muted shrink-0" />
                <span>Tọa độ: {st.latitude != null && st.longitude != null ? `${st.latitude}°N, ${st.longitude}°E` : (st.location || 'Chưa cập nhật')}</span>
              </span>
            }
            bodyClassName="p-0"
            className="mb-4 [&_.leaflet-container]:rounded-b-xl"
          >
            <DamMap dams={dams.filter(d => d.damId === st.damId)} stations={[st]} height="320px" />
          </Panel>

          {/* ── 3 Metric Cards ── */}
          <div className="grid grid-cols-4 gap-3 mb-3">
            {/* Mực nước */}
            <MetricCard
              label={t('dashboard.waterLevel')}
              value={waterLevel.toFixed(2)}
              unit="m"
              delta={waterDelta.delta ? `${waterDelta.delta}m` : null}
              deltaUp={waterDelta.up}
              statusLabel={waterSt.label}
              statusCl={STATUS_CL[waterSt.level]}
              color={mainColor}
              data={waterChartData}
              threshold={waterThreshold}
              stats={[
                { lb: t('stationDetail.average'), val: `${waterStats.avg}m`, cl: "text-tx" },
                {
                  lb: t('stationDetail.peak24h'),
                  val: `${waterStats.max}m`,
                  cl: `text-${waterSt.level === "danger" ? "danger" : "warning"}`,
                },
                { lb: "BĐ3", val: fmtThreshold(waterThreshold, 'm'), cl: "text-danger" },
              ]}
            />

            {/* Độ ẩm */}
            <MetricCard
              label={t('stationDetail.moistureLeak')}
              value={moisture.toFixed(1)}
              unit="%"
              delta={humidDelta.delta ? `${humidDelta.delta}%` : null}
              deltaUp={humidDelta.up}
              statusLabel={humidSt.label}
              statusCl={STATUS_CL[humidSt.level]}
              color="#38bdf8"
              data={humidChartData}
              threshold={humThreshold}
              stats={[
                { lb: t('stationDetail.average'), val: `${humidStats.avg}%`, cl: "text-tx" },
                { lb: t('stationDetail.maxHigh'), val: `${humidStats.max}%`, cl: "text-info" },
                { lb: t('stationDetail.threshold'), val: fmtThreshold(humThreshold, '%'), cl: "text-warning" },
              ]}
            />

            {/* Tần số rung (Hz) — ThresholdConfig chỉ có ngưỡng cho BIÊN ĐỘ (mm/s), không có ngưỡng
                cho tần số, nên card này không gắn ngưỡng thay vì mượn nhầm ngưỡng khác đơn vị. */}
            <MetricCard
              label={t('stationDetail.vibFreq')}
              value={freq.toFixed(2)}
              unit="Hz"
              delta={vibDelta.delta ? `${vibDelta.delta}Hz` : null}
              deltaUp={vibDelta.up}
              statusLabel={vibSt.label}
              statusCl={STATUS_CL[vibSt.level]}
              color="#818cf8"
              data={vibChartData}
              stats={[
                { lb: t('stationDetail.average'), val: `${vibStats.avg} Hz`, cl: "text-tx" },
                { lb: t('stationDetail.peak24h'), val: `${vibStats.max} Hz`, cl: "text-warning" },
              ]}
            />

            <MetricCard
              label={t('stationDetail.vibAmp')}
              value={amp.toFixed(2)} unit="mm/s"
              delta={ampDelta.delta ? `${ampDelta.delta}mm/s` : null}
              deltaUp={ampDelta.up}
              statusLabel={vibSt.label}
              statusCl={STATUS_CL[vibSt.level]}
              color="#f59e0b"
              data={ampChartData}
              threshold={vibThreshold}
              stats={[
                { lb: t('stationDetail.average'), val: `${ampStats.avg} mm/s`, cl: 'text-tx' },
                { lb: t('stationDetail.peak24h'), val: `${ampStats.max} mm/s`, cl: 'text-warning' },
                { lb: 'BĐ', val: fmtThreshold(vibThreshold, ' mm/s'), cl: 'text-danger' },
              ]}
            />
          </div>

          {/* ── Bottom 2-col ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Camera */}
            <CameraViewer />

            {/* Right: Amplitude + Events */}
            <div className="flex flex-col gap-3">
              {/* Amplitude / Pressure card */}
              <Panel
                title={
                  <span className="normal-case tracking-normal">
                    <div className="text-[12px] font-semibold text-tx">
                      Biên độ rung & Mức chứa
                    </div>
                    <div className="text-[9px] text-muted mt-0.5 font-normal">
                      Dữ liệu cảm biến thời gian thực
                    </div>
                  </span>
                }
                right={
                  latest && (
                    <span className="flex items-center gap-1.5">
                      <LiveDot active />
                      <span className="font-mono text-[9px] text-safe font-bold">LIVE</span>
                    </span>
                  )
                }
              >
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    {
                      lb: "Biên độ rung",
                      val: `${amp.toFixed(2)} mm`,
                      sub: "Amplitude sensor",
                      cl: "text-accent",
                    },
                    {
                      lb: "Mức chứa",
                      val: `${percent}%`,
                      sub: "Theo mực nước hiện tại",
                      cl: "text-info",
                    },
                    {
                      lb: "Tần số rung",
                      val: `${freq.toFixed(2)} Hz`,
                      sub: "Vibration frequency",
                      cl: "text-accent",
                    },
                  ].map(({ lb, val, sub, cl }) => (
                    <div key={lb} className="bg-card2/70 rounded-lg px-3 py-2 border border-border/50">
                      <div className="text-[8px] text-muted uppercase tracking-wide mb-1">
                        {lb}
                      </div>
                      <Mono className={`text-[13px] font-semibold ${cl}`}>
                        {val}
                      </Mono>
                      <div className="text-[8px] text-muted mt-0.5">{sub}</div>
                    </div>
                  ))}
                </div>

                {/* Percent fill gauge */}
                <div className="flex items-center gap-3 bg-card2/50 border border-border/50 rounded-lg px-3 py-2.5">
                  <RadialGauge
                    value={percent}
                    size={52}
                    stroke={5}
                    status={percent > 90 ? "danger" : percent > 75 ? "warning" : "safe"}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-muted uppercase tracking-wide mb-1">Mức chứa hồ</div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(percent, 100)}%`,
                          background:
                            percent > 90
                              ? "#fb4360"
                              : percent > 75
                                ? "#f59e0b"
                                : "#22c55e",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Events */}
              <Panel
                title={<span className="normal-case tracking-normal text-[12px] font-semibold text-tx">Cảnh Báo & Sự Kiện</span>}
                right={<Link href="/alerts" className="text-[10px] text-accent cursor-pointer font-semibold hover:underline no-underline">Xem tất cả</Link>}
                className="flex-1"
              >
                {alarms.length === 0 && (
                  <div className="text-center py-4 text-[10px] text-muted flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-safe shrink-0" />
                    <span>Không có cảnh báo nào — Hệ thống ổn định</span>
                  </div>
                )}
                {alarms.slice(0, 5).map((al, i) => {
                  const sevInfo = SEVERITY_MAP[al.severity] || SEVERITY_MAP.WARNING
                  const typeLb = SENSOR_TYPE_LABELS[al.sensorType] || al.sensorType
                  const bgCl = al.severity === 'CRITICAL' ? 'bg-danger/10' : al.severity === 'ALERT' ? 'bg-warning/10' : 'bg-info/10'
                  return (
                    <div key={al.id || i} className="flex gap-2.5 mb-3 last:mb-0">
                      <div className={`w-7 h-7 rounded-full ${bgCl} flex items-center justify-center shrink-0 mt-0.5 text-sm`}>
                        {sevInfo.icon && <sevInfo.icon className="w-4 h-4 text-current" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-semibold text-tx">
                            {typeLb}: {al.measuredVal} {SENSOR_TYPE_UNITS[al.sensorType] || ''}
                          </span>
                          <Mono className="text-[8px] text-muted">{timeAgo(al.triggeredAt)} TRƯỚC</Mono>
                        </div>
                        <p className="text-[9px] text-muted leading-relaxed">{al.notes}</p>
                      </div>
                    </div>
                  )
                })}
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* ── TAB 2: THIẾT BỊ & CẤU HÌNH PHẦN CỨNG (Chỉ hiển thị cho ADMIN & OPERATOR) ── */}
      {!isViewer && activeTab === 'devices' && (
        <StationDevicesTab
          stationId={st.stationId}
          damId={st.damId}
          stationName={st.name}
          onDataChange={() => refetch(true)}
        />
      )}

      {/* ── MODAL: EDIT STATION (SPLIT-VIEW) ── */}
      <Modal
        open={editingModalOpen}
        onClose={() => setEditingModalOpen(false)}
        title={`Chỉnh sửa thông tin Trạm ${st.stationId}`}
        icon={Radio}
        maxWidth="max-w-4xl"
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setEditingModalOpen(false)}>Hủy</Button>
            <Button variant="primary" loading={savingStation} onClick={handleSaveStation}>Lưu thay đổi</Button>
          </FormActions>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* CỘT TRÁI: Form nhập liệu */}
          <div className="md:col-span-6 space-y-2.5">
            <Field label="Tên Trạm quan trắc" required error={stationErrors.name} htmlFor="station-name">
              <TextInput
                id="station-name"
                required
                autoFocus
                error={stationErrors.name}
                value={stationForm.name}
                onChange={e => {
                  setStationForm(p => ({ ...p, name: e.target.value }))
                  if (stationErrors.name) setStationErrors(p => ({ ...p, name: null }))
                }}
                placeholder="vd: Trạm Tân Ấp 1"
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Tên Sông" htmlFor="station-river">
                <TextInput
                  id="station-river"
                  value={stationForm.river}
                  onChange={e => setStationForm(p => ({ ...p, river: e.target.value }))}
                  placeholder="vd: Sông Hồng"
                />
              </Field>
              <Field label="Vị trí Km / Lý trình" htmlFor="station-km">
                <TextInput
                  id="station-km"
                  value={stationForm.km}
                  onChange={e => setStationForm(p => ({ ...p, km: e.target.value }))}
                  placeholder="vd: K25+500"
                  className="font-mono"
                />
              </Field>
            </div>

            <Field label="Địa danh / Vị trí trạm" htmlFor="station-location">
              <TextInput
                id="station-location"
                value={stationForm.location}
                onChange={e => setStationForm(p => ({ ...p, location: e.target.value }))}
                placeholder="vd: Hoàn Kiếm, Hà Nội"
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Vĩ độ (Latitude °N)" required error={stationErrors.latitude} htmlFor="station-lat">
                <TextInput
                  id="station-lat"
                  type="number"
                  step="0.0001"
                  required
                  error={stationErrors.latitude}
                  value={stationForm.latitude}
                  onChange={e => {
                    setStationForm(p => ({ ...p, latitude: e.target.value }))
                    if (stationErrors.latitude) setStationErrors(p => ({ ...p, latitude: null }))
                  }}
                  placeholder="vd: 21.0381"
                  className="font-mono"
                />
              </Field>
              <Field label="Kinh độ (Longitude °E)" required error={stationErrors.longitude} htmlFor="station-lng">
                <TextInput
                  id="station-lng"
                  type="number"
                  step="0.0001"
                  required
                  error={stationErrors.longitude}
                  value={stationForm.longitude}
                  onChange={e => {
                    setStationForm(p => ({ ...p, longitude: e.target.value }))
                    if (stationErrors.longitude) setStationErrors(p => ({ ...p, longitude: null }))
                  }}
                  placeholder="vd: 105.8492"
                  className="font-mono"
                />
              </Field>
            </div>
          </div>

          {/* CỘT PHẢI: Bản đồ chọn tọa độ + Live Preview */}
          <div className="md:col-span-6 space-y-3 flex flex-col justify-between">
            <div>
              <label className="text-[11px] font-bold text-tx mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Bản đồ chọn tọa độ GIS (Click hoặc kéo ghim)</span>
              </label>
              <LocationPickerMap
                latitude={stationForm.latitude}
                longitude={stationForm.longitude}
                onChange={({ latitude, longitude }) => setStationForm(p => ({ ...p, latitude, longitude }))}
                defaultCenter={[st.latitude ?? 21.0381, st.longitude ?? 105.8492]}
                height="190px"
              />
            </div>

            {/* Live Preview Card */}
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Xem trước thẻ trạm (Live Preview):</span>
                <span className="text-accent text-[9px] font-mono">Tự động cập nhật</span>
              </div>
              <div className="bg-card2 border border-border border-t-2 border-t-sky-500 rounded-xl p-3 shadow-panel">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-sm font-bold text-tx truncate m-0">
                      {stationForm.name || st.name}
                    </h4>
                    <div className="text-[9px] text-muted flex items-center gap-1 mt-0.5 font-mono">
                      <MapPin className="w-3 h-3 text-muted shrink-0" />
                      <span className="truncate">
                        {stationForm.latitude && stationForm.longitude
                          ? `${Number(stationForm.latitude).toFixed(4)}°N, ${Number(stationForm.longitude).toFixed(4)}°E`
                          : (stationForm.location || 'Chưa có tọa độ')}
                      </span>
                    </div>
                  </div>
                  <Badge status={st.status} sm title={st.statusReason} />
                </div>
                <div className="text-[10px] text-muted mb-1.5 flex items-center justify-between">
                  <div><span>{stationForm.river || st.river || 'Tuyến sông'}</span> • <Mono className="text-tx">{stationForm.km || st.km || 'K0+000'}</Mono></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: DELETE CONFIRMATION ── */}
      <Modal
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        maxWidth="max-w-sm"
        footer={
          <FormActions className="justify-center">
            <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>Hủy</Button>
            <Button variant="danger" loading={deleting} onClick={handleConfirmDelete}>Xóa vĩnh viễn</Button>
          </FormActions>
        }
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 shrink-0" />
          </div>
          <h3 className="text-base font-bold text-tx mb-2">Xác nhận xóa Trạm?</h3>
          <p className="text-xs text-muted leading-relaxed">
            Bạn có chắc chắn muốn xóa <strong className="text-tx">{st.name}</strong>? Thao tác này không thể hoàn tác.
          </p>
        </div>
      </Modal>
      {/* ── MODAL: THRESHOLD CONFIG (RIÊNG CHO TỪNG TRẠM & ĐỒNG BỘ PHẦN CỨNG) ── */}
      <Modal
        open={thresholdModalOpen}
        onClose={() => setThresholdModalOpen(false)}
        title={`Cấu Hình Ngưỡng Cảnh Báo Riêng — ${st.name} (${st.stationId})`}
        icon={Sliders}
        maxWidth="max-w-2xl"
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setThresholdModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              loading={savingThresholds}
              onClick={handleSaveThresholds}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Lưu & Đồng Bộ Thiết Bị</span>
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-4">
          {/* Banner giải thích: ngưỡng riêng cho trạm & đồng bộ phần cứng */}
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 text-xs text-accent flex items-start gap-2.5">
            <Zap className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-tx mb-0.5">Cấu hình ngưỡng độc lập theo Trạm</div>
              <div className="text-[11px] text-muted leading-relaxed">
                Ngưỡng cài đặt tại đây áp dụng riêng cho <strong>{st.name}</strong>. Khi lưu, hệ thống sẽ tự động cập nhật cấu hình tới toàn bộ <strong>Sensor Node (ESP32)</strong> và phát bản tin MQTT đồng bộ xuống <strong>Gateway Jetson TX2</strong> trong trạm này.
              </div>
            </div>
          </div>

          {/* 1. Mực Nước Hồ (m) */}
          <div className="bg-card2/80 border border-info/30 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2 text-info font-bold text-xs">
                <Droplet className="w-4 h-4" />
                <span>1. Ngưỡng Mực Nước Hồ (Mét)</span>
              </div>
              <span className="text-[10px] font-mono text-muted">Báo động BĐ1 / BĐ2 / BĐ3</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Field label="Chú Ý (BĐ1)" required htmlFor="th-w-warn">
                <TextInput
                  id="th-w-warn"
                  type="number"
                  step="0.1"
                  value={threshForm.water_level.warnHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      water_level: { ...p.water_level, warnHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-yellow-400"
                />
              </Field>

              <Field label="Cảnh Báo (BĐ2)" required htmlFor="th-w-alert">
                <TextInput
                  id="th-w-alert"
                  type="number"
                  step="0.1"
                  value={threshForm.water_level.alertHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      water_level: { ...p.water_level, alertHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-orange-400"
                />
              </Field>

              <Field label="Nguy Cấp (BĐ3)" required htmlFor="th-w-crit">
                <TextInput
                  id="th-w-crit"
                  type="number"
                  step="0.1"
                  value={threshForm.water_level.criticalHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      water_level: { ...p.water_level, criticalHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-danger"
                />
              </Field>

              <Field label="Cao Trình Hồ (m)" hint="Tính % chứa" htmlFor="th-w-tank">
                <TextInput
                  id="th-w-tank"
                  type="number"
                  step="0.5"
                  value={threshForm.water_level.tankHeight}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      water_level: { ...p.water_level, tankHeight: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-tx"
                />
              </Field>
            </div>
          </div>

          {/* 2. Độ Rung Thân Đập (Vibration mm/s) */}
          <div className="bg-card2/80 border border-orange-500/30 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
                <Activity className="w-4 h-4" />
                <span>2. Ngưỡng Rung Thân Đập & Kích Hoạt AI Camera (mm/s)</span>
              </div>
              <span className="text-[10px] font-mono text-orange-400/80 bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/20">
                Đồng bộ ESP32 & Jetson TX2
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Field label="Mức Chú Ý" required htmlFor="th-v-warn">
                <TextInput
                  id="th-v-warn"
                  type="number"
                  step="0.1"
                  value={threshForm.vibration.warnHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      vibration: { ...p.vibration, warnHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-yellow-400"
                />
              </Field>

              <Field label="Mức Cảnh Báo" required htmlFor="th-v-alert">
                <TextInput
                  id="th-v-alert"
                  type="number"
                  step="0.5"
                  value={threshForm.vibration.alertHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      vibration: { ...p.vibration, alertHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-orange-400"
                />
              </Field>

              <Field label="Mức Nguy Cấp" required htmlFor="th-v-crit">
                <TextInput
                  id="th-v-crit"
                  type="number"
                  step="0.5"
                  value={threshForm.vibration.criticalHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      vibration: { ...p.vibration, criticalHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-danger"
                />
              </Field>

              <Field label="Duy Trì (Giây)" hint="Tránh nhiễu" htmlFor="th-v-sec">
                <TextInput
                  id="th-v-sec"
                  type="number"
                  step="1"
                  value={threshForm.vibration.sustainedSeconds}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      vibration: { ...p.vibration, sustainedSeconds: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-tx"
                />
              </Field>
            </div>
          </div>

          {/* 3. Độ Ẩm Rò Rỉ Móng (%) */}
          <div className="bg-card2/80 border border-emerald-500/30 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Droplet className="w-4 h-4" />
                <span>3. Ngưỡng Độ Ẩm Rò Rỉ Thấm Móng Đập (%)</span>
              </div>
              <span className="text-[10px] font-mono text-muted">Phát hiện thấm rỉ sớm</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Mức Chú Ý (%)" required htmlFor="th-h-warn">
                <TextInput
                  id="th-h-warn"
                  type="number"
                  step="1"
                  value={threshForm.humidity.warnHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      humidity: { ...p.humidity, warnHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-yellow-400"
                />
              </Field>

              <Field label="Mức Cảnh Báo (%)" required htmlFor="th-h-alert">
                <TextInput
                  id="th-h-alert"
                  type="number"
                  step="1"
                  value={threshForm.humidity.alertHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      humidity: { ...p.humidity, alertHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-orange-400"
                />
              </Field>

              <Field label="Mức Nguy Cấp (%)" required htmlFor="th-h-crit">
                <TextInput
                  id="th-h-crit"
                  type="number"
                  step="1"
                  value={threshForm.humidity.criticalHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      humidity: { ...p.humidity, criticalHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-danger"
                />
              </Field>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
````
