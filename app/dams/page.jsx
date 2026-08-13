'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { getStatus } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Label } from '@/components/ui'
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  ChevronRight,
  X,
  AlertTriangle,
  Database,
  Radio,
  MapPin,
} from 'lucide-react'
import DamPinMap from '@/components/DamMap'

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
  const { isAdmin } = useAuth()

  const [search, setSearch] = useState('')

  // Modals state
  const [damModalOpen, setDamModalOpen] = useState(false)
  const [editingDam, setEditingDam] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name }

  // Toast State
  const [toast, setToast] = useState(null) // { message: string, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Form states
  const [damForm, setDamForm] = useState({
    id: '',
    name: '',
    location: '',
    latitude: 20.8167,
    longitude: 105.3265,
    waterLevel: 0,
    flow: 0,
    fillPct: 50,
    status: 'safe',
    cameraUrl: '',
  })

  // Dam Form Handlers
  const openCreateDamModal = () => {
    setEditingDam(null)
    setDamForm({
      id: '',
      name: '',
      location: '',
      latitude: 20.8167,
      longitude: 105.3265,
      waterLevel: 100,
      flow: 1000,
      fillPct: 70,
      status: 'safe',
      cameraUrl: '',
    })
    setDamModalOpen(true)
  }

  const openEditDamModal = (dam, e) => {
    e?.stopPropagation()
    setEditingDam(dam)
    setDamForm({
      id: dam.id,
      name: dam.name || '',
      location: dam.location || '',
      latitude: dam.latitude ?? 20.8167,
      longitude: dam.longitude ?? 105.3265,
      waterLevel: dam.waterLevel || 0,
      flow: dam.flow || 0,
      fillPct: dam.fillPct || 0,
      status: dam.status || 'safe',
      cameraUrl: dam.cameraUrl || '',
    })
    setDamModalOpen(true)
  }

  const handleSaveDam = async (e) => {
    e.preventDefault()
    try {
      if (editingDam) {
        await updateDam(editingDam.id, {
          name: damForm.name,
          location: damForm.location,
          latitude: Number(damForm.latitude),
          longitude: Number(damForm.longitude),
          waterLevel: Number(damForm.waterLevel),
          flow: Number(damForm.flow),
          fillPct: Number(damForm.fillPct),
          status: damForm.status,
          cameraUrl: damForm.cameraUrl,
        })
        showToast('✅ Cập nhật đập thủy điện thành công!', 'success')
      } else {
        const payload = {
          name: damForm.name,
          location: damForm.location,
          latitude: Number(damForm.latitude),
          longitude: Number(damForm.longitude),
          waterLevel: Number(damForm.waterLevel),
          flow: Number(damForm.flow),
          fillPct: Number(damForm.fillPct),
          status: damForm.status,
          cameraUrl: damForm.cameraUrl,
        }
        const res = await createDam(payload)
        const newId = res?.dam?.id || ''
        showToast(`✅ Tạo đập thủy điện thành công! (Mã: ${newId})`, 'success')
      }
      setDamModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error')
    }
  }

  // Delete Confirm Handler
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteDam(deleteConfirm.id)
      showToast(`✅ Đã xóa đập ${deleteConfirm.name}!`, 'success')
      setDeleteConfirm(null)
      refetch(true)
    } catch (err) {
      showToast(`❌ Lỗi khi xóa: ${err.message}`, 'error')
    }
  }

  // Filter dams
  const filteredDams = dams.filter(d => {
    if (!search) return true
    const q = search.toLowerCase()
    return d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || (d.location && d.location.toLowerCase().includes(q))
  })

  return (
    <div className="p-4 min-h-[calc(100vh-48px)] space-y-4">
      {/* Top Bar / Header */}
      <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-tx tracking-wide m-0">{t('damsPage.title')}</h1>
          </div>
          <p className="text-[10px] text-muted m-0">{t('damsPage.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-1.5 bg-card2 border border-border rounded-lg px-3 py-1.5 w-60">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('damsPage.searchPlaceholder')}
              className="bg-transparent border-none outline-none text-tx text-[11px] w-full placeholder:text-muted"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-muted text-[11px] font-medium bg-card2 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('stationsPage.refresh')}</span>
          </button>

          {isAdmin && (
            <button
              onClick={openCreateDamModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg text-white text-[11px] font-bold cursor-pointer border-none shadow-lg shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{t('damsPage.addDam')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── INTERACTIVE LEAFLET GIS MAP ── */}
      <DamPinMap dams={dams} stations={stations} height="360px" />

      {/* Dams List */}
      <div className="grid grid-cols-2 gap-3">
        {filteredDams.map(dam => {
          const s = getStatus(dam.status)
          const damStations = stations.filter(st => st.damId === dam.id)

          return (
            <div
              key={dam.id}
              onClick={() => router.push(`/dams/${dam.id}`)}
              className={`bg-card border border-border border-l-4 ${s.leftBorder} rounded-xl p-4 cursor-pointer hover:border-accent/60 transition-all duration-150 shadow-lg group`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                      {dam.id}
                    </span>
                    <h2 className="text-base font-bold text-tx group-hover:text-accent transition-colors m-0">
                      {dam.name}
                    </h2>
                    <Badge status={dam.status} sm />
                  </div>
                  <div className="text-[10px] text-muted flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 text-muted shrink-0" />
                    <span>
                      {dam.latitude != null && dam.longitude != null
                        ? `${dam.latitude}°N, ${dam.longitude}°E`
                        : (dam.location || 'Chưa có tọa độ')}
                      {dam.location && dam.latitude != null ? ` (${dam.location})` : ''}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => openEditDamModal(dam, e)}
                      className="p-1.5 bg-card2 border border-border rounded-lg text-accent hover:border-accent transition-colors cursor-pointer"
                      title={t('damsPage.editDam')}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm({ id: dam.id, name: dam.name })
                      }}
                      className="p-1.5 bg-card2 border border-border rounded-lg text-danger hover:border-danger transition-colors cursor-pointer"
                      title="Xóa Đập"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-card2 p-2.5 rounded-lg text-[10px] my-3 border border-border/40">
                <div>
                  <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.waterLevel')}</div>
                  <Mono className={`text-[14px] font-bold ${s.text}`}>{dam.waterLevel} m</Mono>
                </div>

                <div>
                  <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.flow')}</div>
                  <Mono className="text-[13px] text-tx">{dam.flow ? dam.flow.toLocaleString() : 0} m³/s</Mono>
                </div>

                <div>
                  <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.fillCapacity')}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-12 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className={`h-full ${s.dot}`} style={{ width: `${Math.min(dam.fillPct, 100)}%` }} />
                    </div>
                    <Mono className="text-[10px] text-tx">{dam.fillPct}%</Mono>
                  </div>
                </div>
              </div>

              {/* Footer link to stations */}
              <div className="flex justify-between items-center pt-2 border-t border-border/40 text-[11px]">
                <div className="flex items-center gap-1.5 text-muted">
                  <Radio className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    Danh sách trạm: <strong className="text-info">{damStations.length} trạm</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-accent font-bold text-[10px] group-hover:translate-x-1 transition-transform">
                  <span>{t('damsPage.viewStations', { count: damStations.length })}</span>
                </div>
              </div>
            </div>
          )
        })}

        {filteredDams.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-card border border-border rounded-xl text-muted text-xs">
            Không tìm thấy đập thủy điện nào phù hợp.
          </div>
        )}
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div className={`fixed top-14 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 ${
          toast.type === 'error'
            ? 'bg-danger/20 border-danger/40 text-danger shadow-danger/10'
            : 'bg-safe/20 border-safe/40 text-safe shadow-safe/10'
        }`}>
          <span className="text-[12px]">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-muted hover:text-tx bg-transparent border-none cursor-pointer p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT DAM ── */}
      {damModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-card2">
              <h3 className="text-sm font-bold text-tx m-0 flex items-center gap-2">
                <Database className="w-4 h-4 text-accent" />
                <span>{editingDam ? t('damsPage.editDam') : t('damsPage.addDam')}</span>
              </h3>
              <button
                onClick={() => setDamModalOpen(false)}
                className="text-muted hover:text-tx bg-transparent border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDam} className="p-5 space-y-3 text-[11px]">
              <div>
                <Label className="mb-1">Mã Đập Thủy Điện (ID)</Label>
                <input
                  disabled
                  readOnly
                  value={editingDam ? damForm.id : '(Tự động sinh bởi Backend)'}
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-muted outline-none opacity-70 font-mono cursor-not-allowed select-none"
                />
                <span className="text-[9px] text-muted mt-1 block">
                  🔒 ID được Backend tự động tạo theo tên Đập để đảm bảo tính duy nhất.
                </span>
              </div>

              <div>
                <Label className="mb-1">{t('admin.form.damNameLabel')}</Label>
                <input
                  required
                  value={damForm.name}
                  onChange={e => setDamForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="vd: Đập Thủy điện Hòa Bình"
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1">Vĩ độ (Latitude °N)</Label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={damForm.latitude}
                    onChange={e => setDamForm(p => ({ ...p, latitude: e.target.value }))}
                    placeholder="vd: 20.8167"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
                <div>
                  <Label className="mb-1">Kinh độ (Longitude °E)</Label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={damForm.longitude}
                    onChange={e => setDamForm(p => ({ ...p, longitude: e.target.value }))}
                    placeholder="vd: 105.3265"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1">Địa danh / Vị trí hành chính</Label>
                <input
                  value={damForm.location}
                  onChange={e => setDamForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="vd: Hòa Bình"
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="mb-1">{t('admin.form.waterLevelLabel')}</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={damForm.waterLevel}
                    onChange={e => setDamForm(p => ({ ...p, waterLevel: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.flowLabel')}</Label>
                  <input
                    type="number"
                    value={damForm.flow}
                    onChange={e => setDamForm(p => ({ ...p, flow: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.fillPctLabel')}</Label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={damForm.fillPct}
                    onChange={e => setDamForm(p => ({ ...p, fillPct: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1">{t('admin.form.statusLabel')}</Label>
                <select
                  value={damForm.status}
                  onChange={e => setDamForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                >
                  <option value="safe">{t('status.safe')}</option>
                  <option value="warning">{t('status.warning')}</option>
                  <option value="danger">{t('status.danger')}</option>
                </select>
              </div>

              <div>
                <Label className="mb-1">{t('admin.form.cameraUrlLabel')}</Label>
                <input
                  type="text"
                  value={damForm.cameraUrl}
                  onChange={e => setDamForm(p => ({ ...p, cameraUrl: e.target.value }))}
                  placeholder="vd: http://192.168.1.50:8000"
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono text-[12px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setDamModalOpen(false)}
                  className="px-4 py-2 border border-border rounded text-muted bg-transparent text-[11px] font-semibold cursor-pointer hover:bg-white/5"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 rounded text-white text-[11px] font-bold cursor-pointer border-none"
                >
                  {editingDam ? t('admin.save') : t('admin.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 mb-3 text-danger">
              <div className="w-10 h-10 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-tx m-0">{t('admin.deleteConfirmTitle')}</h3>
                <p className="text-[10px] text-muted m-0">{t('admin.deleteWarning')}</p>
              </div>
            </div>

            <p className="text-[11px] text-tx leading-relaxed mb-4 bg-card2 p-3 rounded border border-border">
              Xóa Đập thủy điện <strong className="text-danger">{deleteConfirm.name}</strong> (ID: {deleteConfirm.id})?
              <span className="block text-[10px] text-warning mt-1">
                ⚠️ {t('admin.deleteDamNotice')}
              </span>
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-border rounded text-muted bg-transparent text-[11px] font-semibold cursor-pointer hover:bg-white/5"
              >
                {t('admin.cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-danger rounded text-white text-[11px] font-bold cursor-pointer border-none shadow-lg shadow-danger/20"
              >
                {t('admin.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
