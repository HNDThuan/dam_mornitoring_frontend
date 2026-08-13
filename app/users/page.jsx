'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { fetchUsers, approveUser as apiApproveUser, updateUser as apiUpdateUser, deleteUser as apiDeleteUser, fetchDams } from '@/lib/api'
import { Mono, Badge } from '@/components/ui'
import { Users, CheckCircle, XCircle, Shield, Building2, Trash2, Edit2, RefreshCw, AlertTriangle, UserCheck } from 'lucide-react'

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

  const handleApproveQuick = async (user) => {
    try {
      await apiApproveUser(user.id, { role: user.role || 'OPERATOR', assignedDamId: user.assignedDamId || dams[0]?.id, status: 'ACTIVE' }, token)
      setActionSuccess(`Đã phê duyệt tài khoản "${user.username}" thành công!`)
      await loadData()
    } catch (err) {
      setError(err.message || 'Phê duyệt thất bại')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    try {
      await apiUpdateUser(editingUser.id, editForm, token)
      setActionSuccess(`Đã cập nhật thông tin người dùng "${editingUser.username}"!`)
      setEditingUser(null)
      await loadData()
    } catch (err) {
      setError(err.message || 'Cập nhật thất bại')
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

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" />
            <h1 className="text-xl font-black text-tx tracking-tight">QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN</h1>
          </div>
          <p className="text-xs text-muted mt-1">Phê duyệt tài khoản cán bộ, gán vai trò (ADMIN, OPERATOR, VIEWER) và đập phụ trách</p>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-2 bg-card2 border border-border rounded-xl text-xs font-bold text-tx hover:border-accent flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tải lại</span>
        </button>
      </div>

      {/* Action Messages */}
      {actionSuccess && (
        <div className="p-3 bg-safe/10 border border-safe/30 rounded-xl text-safe text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-xs font-bold flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted">Đang tải danh sách tài khoản...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">Chưa có tài khoản nào trên hệ thống</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-card2 border-b border-border text-[10px] uppercase text-muted font-bold tracking-wider">
                  <th className="py-3 px-4">Họ và tên / Username</th>
                  <th className="py-3 px-4">Email & SĐT</th>
                  <th className="py-3 px-4">Vai trò (Role)</th>
                  <th className="py-3 px-4">Đập phụ trách</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((u) => {
                  const damObj = dams.find((d) => d.id === u.assignedDamId)
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
                          <span className="px-2 py-0.5 bg-warning/10 border border-warning/30 text-warning rounded text-[10px] font-bold animate-pulse">
                            ⏳ CHỜ PHÊ DUYỆT
                          </span>
                        ) : u.status === 'ACTIVE' ? (
                          <span className="px-2 py-0.5 bg-safe/10 border border-safe/30 text-safe rounded text-[10px] font-bold">
                            🟢 HOẠT ĐỘNG
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-danger/10 border border-danger/30 text-danger rounded text-[10px] font-bold">
                            🔴 BỊ KHÓA
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
                            className="p-1.5 bg-card2 border border-border rounded-lg text-accent hover:border-accent cursor-pointer"
                            title="Chỉnh sửa phân quyền"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(u.id, u.username)}
                            className="p-1.5 bg-card2 border border-border rounded-lg text-danger hover:border-danger cursor-pointer"
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
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-tx">Chỉnh sửa phân quyền: {editingUser.fullName}</h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-muted uppercase font-bold">Vai trò (Role)</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-card2 border border-border rounded-xl p-2.5 text-tx focus:outline-none focus:border-accent"
                >
                  <option value="ADMIN">ADMIN (Quản trị viên toàn hệ thống)</option>
                  <option value="OPERATOR">OPERATOR (Cán bộ trực đập)</option>
                  <option value="VIEWER">VIEWER (Khách xem read-only)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-muted uppercase font-bold">Đập phụ trách (Assigned Dam)</label>
                <select
                  value={editForm.assignedDamId}
                  onChange={(e) => setEditForm({ ...editForm, assignedDamId: e.target.value })}
                  className="w-full bg-card2 border border-border rounded-xl p-2.5 text-tx focus:outline-none focus:border-accent"
                >
                  <option value="">-- Tất cả các đập (Dành cho Admin/Viewer) --</option>
                  {dams.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-muted uppercase font-bold">Trạng thái tài khoản</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-card2 border border-border rounded-xl p-2.5 text-tx focus:outline-none focus:border-accent"
                >
                  <option value="ACTIVE">ACTIVE (🟢 Hoạt động)</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL (🟡 Chờ duyệt)</option>
                  <option value="SUSPENDED">SUSPENDED (🔴 Bị khóa)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-card2 border border-border rounded-xl text-xs font-bold text-muted hover:text-tx cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 cursor-pointer shadow"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
