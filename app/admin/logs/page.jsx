'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { fetchAuditLogs } from '@/lib/api'
import { Mono } from '@/components/ui'
import {
  FileText,
  KeyRound,
  Building2,
  Sliders,
  RefreshCw,
  Search,
  Shield,
  Clock,
  User,
  Activity,
  Filter,
} from 'lucide-react'

const CATEGORY_MAP = {
  ALL: { label: 'Tất cả nhật ký', icon: FileText, color: 'text-accent border-accent bg-accent/10' },
  AUTH: { label: 'Đăng nhập / Đăng ký', icon: KeyRound, color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10' },
  DAM: { label: 'Hạ tầng Đập', icon: Building2, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  STATION: { label: 'Trạm quan trắc', icon: Activity, color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
  THRESHOLD: { label: 'Ngưỡng báo động', icon: Sliders, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
}

export default function AuditLogsPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [search, setSearch] = useState('')

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
      const res = await fetchAuditLogs(selectedCategory, 200, currentToken)
      setLogs(res.logs || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách nhật ký hệ thống')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, token])

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        router.push('/dams')
      } else {
        loadLogs()
      }
    }
  }, [authLoading, isAdmin, loadLogs, router])

  // Lọc theo từ khóa tìm kiếm
  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs
    const q = search.toLowerCase().trim()
    return logs.filter(log =>
      log.description?.toLowerCase().includes(q) ||
      log.username?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.category?.toLowerCase().includes(q)
    )
  }, [logs, search])

  // Thống kê counts
  const stats = useMemo(() => {
    const total = logs.length
    const authCount = logs.filter(l => l.category === 'AUTH').length
    const damCount = logs.filter(l => l.category === 'DAM' || l.category === 'STATION').length
    const thresholdCount = logs.filter(l => l.category === 'THRESHOLD').length
    return { total, authCount, damCount, thresholdCount }
  }, [logs])

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
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md text-center space-y-4 shadow-xl">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card border border-border rounded-2xl p-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
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
          <div className="flex items-center gap-1.5 bg-card2 border border-border rounded-xl px-3 py-1.5 flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm người dùng, thao tác..."
              className="bg-transparent border-none outline-none text-tx text-[11px] w-full placeholder:text-muted"
            />
          </div>

          <button
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-xl text-tx text-[11px] font-semibold bg-card2 hover:bg-white/5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Tổng Thao Tác</div>
            <Mono className="text-lg font-bold text-tx">{stats.total}</Mono>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Xác Thực (Auth)</div>
            <Mono className="text-lg font-bold text-indigo-400">{stats.authCount}</Mono>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Hạ Tầng Đập / Trạm</div>
            <Mono className="text-lg font-bold text-emerald-400">{stats.damCount}</Mono>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Cấu Hình Ngưỡng</div>
            <Mono className="text-lg font-bold text-amber-400">{stats.thresholdCount}</Mono>
          </div>
        </div>
      </div>

      {/* Tabs Phân Loại */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/40">
        {Object.entries(CATEGORY_MAP).map(([catKey, catMeta]) => {
          const active = selectedCategory === catKey
          const IconComp = catMeta.icon
          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
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
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-muted space-y-2">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs">Đang tải nhật ký hệ thống...</div>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-danger text-xs font-bold">{error}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-muted space-y-2">
            <FileText className="w-10 h-10 mx-auto text-muted/40" />
            <div className="text-xs">Chưa có nhật ký nào phù hợp trong danh sách.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-card2 border-b border-border/60 text-[10px] text-muted uppercase font-bold tracking-wider">
                  <th className="py-3 px-4 w-44">Thời Gian</th>
                  <th className="py-3 px-4 w-36">Người Thực Hiện</th>
                  <th className="py-3 px-4 w-36">Loại Thao Tác</th>
                  <th className="py-3 px-4">Chi Tiết Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredLogs.map(log => {
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
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
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
      </div>
    </div>
  )
}
