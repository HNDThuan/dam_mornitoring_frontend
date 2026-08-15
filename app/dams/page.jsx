'use client'

import { useState } from 'react'
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
  ChevronRight,
  AlertTriangle,
  Database,
  Radio,
  MapPin,
  Lock,
  Map,
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
  const { isAdmin, isOperator, assignedDamId } = useAuth()

  const [search, setSearch] = useState('')

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
      setSavingDam(true)
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
        showToast('Cập nhật đập thủy điện thành công!', 'success')
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
  const visibleDams = isOperator && assignedDamId ? dams.filter(d => d.id === assignedDamId) : dams
  const visibleStations = isOperator && assignedDamId ? stations.filter(s => s.damId === assignedDamId) : stations

  // Filter dams
  const filteredDams = visibleDams.filter(d => {
    if (!search) return true
    const q = search.toLowerCase()
    return d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || (d.location && d.location.toLowerCase().includes(q))
  })

  return (
    <div className="p-4 min-h-[calc(100vh-48px)] space-y-4">
      {/* Top Bar / Header */}
      <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-accent-soft text-accent border border-accent-soft flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-tx tracking-wide m-0">{t('damsPage.title')}</h1>
          </div>
          <p className="text-[10px] text-muted m-0">{t('damsPage.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Search */}
          <div className="h-9 flex items-center gap-2 bg-card2 border border-border rounded-lg px-3 w-60 shrink-0 focus-within:border-accent transition-colors">
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
            className="h-9 flex items-center gap-1.5 px-3.5 border border-border rounded-lg text-tx text-[11px] font-semibold bg-card2 hover:bg-white/5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 text-accent" />
            <span>{t('stationsPage.refresh')}</span>
          </button>

          {isAdmin && (
            <button
              onClick={openCreateDamModal}
              className="h-9 flex items-center gap-1.5 px-4 bg-accent hover:bg-accent/90 rounded-md text-white text-[11px] font-bold cursor-pointer border-none shrink-0 whitespace-nowrap transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('damsPage.addDam')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── INTERACTIVE LEAFLET GIS MAP ── */}
      <Panel
        title={
          <span className="flex items-center gap-1.5">
            <Map className="w-3 h-3" /> Bản đồ giám sát
          </span>
        }
        right={<span className="flex items-center gap-1.5"><LiveDot active /><span className="text-[10px] font-mono text-safe font-bold">LIVE</span></span>}
        bodyClassName="p-0"
        className="[&_.leaflet-container]:rounded-b-xl"
      >
        <DamPinMap dams={visibleDams} stations={visibleStations} height="360px" />
      </Panel>

      {/* Dams List */}
      <div className="grid grid-cols-2 gap-3">
        {filteredDams.map(dam => {
          const s = getStatus(dam.status)
          const damStations = visibleStations.filter(st => st.damId === dam.id)

          return (
            <div
              key={dam.id}
              onClick={() => router.push(`/dams/${dam.id}`)}
              className={`bg-card border border-border border-l-4 ${s.leftBorder} rounded-xl p-4 cursor-pointer hover:border-accent/60 hover:-translate-y-0.5 transition-all duration-150 shadow-panel group`}
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
              <div className="flex items-center gap-3 bg-card2 p-2.5 rounded-lg my-3 border border-border/40">
                <RadialGauge value={dam.fillPct} size={65} stroke={5} status={dam.status} sublabel={t('damsPage.fillCapacity')} />
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.waterLevel')}</div>
                    <Mono className={`text-[14px] font-bold ${s.text}`}>{dam.waterLevel} m</Mono>
                  </div>

                  <div>
                    <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.flow')}</div>
                    <Mono className="text-[13px] text-tx">{dam.flow ? dam.flow.toLocaleString() : 0} m³/s</Mono>
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
          <div className="col-span-2 text-center py-12 bg-card border border-border rounded-xl text-muted text-xs shadow-panel">
            Không tìm thấy đập thủy điện nào phù hợp.
          </div>
        )}
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── MODAL: CREATE / EDIT DAM ── */}
      <Modal
        open={damModalOpen}
        onClose={() => setDamModalOpen(false)}
        title={editingDam ? t('damsPage.editDam') : t('damsPage.addDam')}
        icon={Database}
        maxWidth="max-w-3xl"
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
        <form id="dam-form" onSubmit={handleSaveDam} className="space-y-2.5">
          <div className="grid grid-cols-3 gap-2.5">
            <Field label="Mã Đập Thủy Điện (ID)" hint="Tự động sinh bởi Backend">
              <TextInput
                icon={Lock}
                disabled
                readOnly
                value={editingDam ? damForm.id : '(Tự động sinh bởi Backend)'}
                className="font-mono cursor-not-allowed select-none"
              />
            </Field>

            <Field label={t('admin.form.damNameLabel')} required htmlFor="dam-name">
              <TextInput
                id="dam-name"
                required
                value={damForm.name}
                onChange={e => setDamForm(p => ({ ...p, name: e.target.value }))}
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
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Vĩ độ (Latitude °N)" required htmlFor="dam-lat">
              <TextInput
                id="dam-lat"
                type="number"
                step="0.0001"
                required
                value={damForm.latitude}
                onChange={e => setDamForm(p => ({ ...p, latitude: e.target.value }))}
                placeholder="vd: 20.8167"
                className="font-mono"
              />
            </Field>
            <Field label="Kinh độ (Longitude °E)" required htmlFor="dam-lng">
              <TextInput
                id="dam-lng"
                type="number"
                step="0.0001"
                required
                value={damForm.longitude}
                onChange={e => setDamForm(p => ({ ...p, longitude: e.target.value }))}
                placeholder="vd: 105.3265"
                className="font-mono"
              />
            </Field>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            <Field label={t('admin.form.waterLevelLabel')} htmlFor="dam-waterlevel">
              <TextInput
                id="dam-waterlevel"
                type="number"
                step="0.1"
                value={damForm.waterLevel}
                onChange={e => setDamForm(p => ({ ...p, waterLevel: e.target.value }))}
                className="font-mono"
              />
            </Field>

            <Field label={t('admin.form.flowLabel')} htmlFor="dam-flow">
              <TextInput
                id="dam-flow"
                type="number"
                value={damForm.flow}
                onChange={e => setDamForm(p => ({ ...p, flow: e.target.value }))}
                className="font-mono"
              />
            </Field>

            <Field label={t('admin.form.fillPctLabel')} htmlFor="dam-fillpct">
              <TextInput
                id="dam-fillpct"
                type="number"
                step="1"
                min="0"
                max="100"
                value={damForm.fillPct}
                onChange={e => setDamForm(p => ({ ...p, fillPct: e.target.value }))}
                className="font-mono"
              />
            </Field>

            <Field label={t('admin.form.statusLabel')} htmlFor="dam-status">
              <Select
                id="dam-status"
                value={damForm.status}
                onChange={e => setDamForm(p => ({ ...p, status: e.target.value }))}
              >
                <option value="safe">{t('status.safe')}</option>
                <option value="warning">{t('status.warning')}</option>
                <option value="danger">{t('status.danger')}</option>
              </Select>
            </Field>
          </div>
        </form>
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
