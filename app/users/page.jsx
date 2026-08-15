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
              <option key={d.id} value={d.id}>
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
