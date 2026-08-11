'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
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
  ExternalLink,
  ArrowLeft,
  Droplet,
  Activity
} from 'lucide-react'

export default function DamDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const {
    dams,
    stations,
    loading,
    error,
    refetch,
    createStation,
    updateStation,
    deleteStation,
  } = useDamData()
  const { t, locale } = useLanguage()

  const [search, setSearch] = useState('')

  // Modals state for Stations
  const [stationModalOpen, setStationModalOpen] = useState(false)
  const [editingStation, setEditingStation] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name }

  const damId = String(id)
  const dam = dams.find(d => d.id === damId) || {
    id: damId,
    name: `Đập ${damId}`,
    location: 'Hòa Bình',
    waterLevel: 105.2,
    flow: 1200,
    fillPct: 78,
    status: 'safe',
  }
  const damStatus = getStatus(dam.status)

  // Filter stations for this dam
  const damStations = stations.filter(st => {
    const isThisDam = st.damId === damId
    const matchesSearch = !search || st.name.toLowerCase().includes(search.toLowerCase()) || (st.location && st.location.toLowerCase().includes(search.toLowerCase()))
    return isThisDam && matchesSearch
  })

  // Form state
  const [stationForm, setStationForm] = useState({
    name: '',
    location: '',
    river: '',
    km: '',
    status: 'safe',
    waterLevel: 0,
    change: 0,
    pressure: 0,
    flow: 0,
    humidity: 50,
    bd1: 6.0,
    bd2: 8.0,
    bd3: 10.0,
    damId: damId,
  })

  const openCreateStationModal = () => {
    setEditingStation(null)
    setStationForm({
      name: '',
      location: dam.location || '',
      river: 'Sông Hồng',
      km: 'K10+000',
      status: 'safe',
      waterLevel: 5.0,
      change: 0,
      pressure: 150,
      flow: 1200,
      humidity: 50,
      bd1: 6.0,
      bd2: 8.0,
      bd3: 10.0,
      damId: damId,
    })
    setStationModalOpen(true)
  }

  const openEditStationModal = (st) => {
    setEditingStation(st)
    setStationForm({
      name: st.name || '',
      location: st.location || '',
      river: st.river || '',
      km: st.km || '',
      status: st.status || 'safe',
      waterLevel: st.waterLevel || 0,
      change: st.change || 0,
      pressure: st.pressure || 0,
      flow: st.flow || 0,
      humidity: st.humidity || 0,
      bd1: st.bd1 || 0,
      bd2: st.bd2 || 0,
      bd3: st.bd3 || 0,
      damId: st.damId || damId,
    })
    setStationModalOpen(true)
  }

  const handleSaveStation = async (e) => {
    e.preventDefault()
    try {
      if (editingStation) {
        await updateStation(editingStation.id, {
          name: stationForm.name,
          location: stationForm.location,
          river: stationForm.river,
          km: stationForm.km,
          status: stationForm.status,
          waterLevel: Number(stationForm.waterLevel),
          change: Number(stationForm.change),
          pressure: Number(stationForm.pressure),
          flow: Number(stationForm.flow),
          humidity: Number(stationForm.humidity),
          bd1: Number(stationForm.bd1),
          bd2: Number(stationForm.bd2),
          bd3: Number(stationForm.bd3),
          damId: damId,
        })
      } else {
        await createStation({
          ...stationForm,
          waterLevel: Number(stationForm.waterLevel),
          change: Number(stationForm.change),
          pressure: Number(stationForm.pressure),
          flow: Number(stationForm.flow),
          humidity: Number(stationForm.humidity),
          bd1: Number(stationForm.bd1),
          bd2: Number(stationForm.bd2),
          bd3: Number(stationForm.bd3),
          damId: damId,
        })
      }
      setStationModalOpen(false)
    } catch (err) {
      alert(`Lỗi khi lưu trạm: ${err.message}`)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteStation(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (err) {
      alert(`Lỗi khi xóa: ${err.message}`)
    }
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
      <div className={`bg-card border border-border border-l-4 ${damStatus.leftBorder} rounded-xl p-5 shadow-lg`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-accent bg-accent/10 px-2.5 py-0.5 rounded border border-accent/20">
                {dam.id}
              </span>
              <h1 className="text-xl font-bold text-tx tracking-wide m-0">{dam.name}</h1>
              <Badge status={dam.status} />
            </div>
            {dam.location && (
              <div className="text-[11px] text-muted flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>{dam.location}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 bg-card2 border border-border rounded-xl p-3">
            <div>
              <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.waterLevel')}</div>
              <Mono className={`text-base font-bold ${damStatus.text}`}>{dam.waterLevel} m</Mono>
            </div>
            <Divider vertical />
            <div>
              <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.flow')}</div>
              <Mono className="text-sm font-semibold text-tx">{dam.flow ? dam.flow.toLocaleString() : 0} m³/s</Mono>
            </div>
            <Divider vertical />
            <div>
              <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.fillCapacity')}</div>
              <Mono className="text-sm font-semibold text-tx">{dam.fillPct}%</Mono>
            </div>
          </div>
        </div>
      </div>

      {/* Top Header Actions for Stations */}
      <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-tx m-0 tracking-wide uppercase">
            {t('damDetail.title', { name: dam.name })} ({damStations.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-1.5 bg-card2 border border-border rounded-lg px-3 py-1.5 w-56">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('damDetail.searchStation')}
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

          <button
            onClick={openCreateStationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg text-white text-[11px] font-bold cursor-pointer border-none shadow-lg shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('damDetail.addStation')}</span>
          </button>
        </div>
      </div>

      {/* Stations Grid */}
      {damStations.length > 0 ? (
        <div className="grid grid-cols-3 gap-3.5">
          {damStations.map(st => {
            const stS = getStatus(st.status)
            return (
              <div
                key={st.id}
                className={`bg-card border border-border border-t-2 ${stS.topBorder} rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-lg hover:-translate-y-px transition-all`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[13px] font-bold text-tx">{st.name}</div>
                      {st.location && (
                        <div className="text-[9px] text-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-muted shrink-0" />
                          <span>{st.location}</span>
                        </div>
                      )}
                    </div>
                    <Badge status={st.status} sm />
                  </div>

                  <div className="text-[10px] text-muted mb-2">
                    <span>{st.river}</span> • <Mono className="text-tx">{st.km}</Mono>
                  </div>

                  <div className="grid grid-cols-3 gap-1 bg-card2 p-2.5 rounded-lg text-[10px] my-2 border border-border/40">
                    <div>
                      <div className="text-[7px] text-muted uppercase">{t('damsPage.waterLevel')}</div>
                      <Mono className={`font-bold ${stS.text}`}>{st.waterLevel} m</Mono>
                    </div>
                    <div>
                      <div className="text-[7px] text-muted uppercase">Áp lực</div>
                      <Mono className="text-tx">{st.pressure} atm</Mono>
                    </div>
                    <div>
                      <div className="text-[7px] text-muted uppercase">Độ ẩm</div>
                      <Mono className="text-tx">{st.humidity}%</Mono>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-border/40">
                  <Link
                    href={`/stations/${st.id}`}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-accent hover:underline no-underline"
                  >
                    <span>{t('damsPage.stationDetail')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditStationModal(st)}
                      className="p-1.5 bg-card2 border border-border rounded-lg text-accent hover:border-accent cursor-pointer transition-colors"
                      title={t('damsPage.editStation')}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: st.id, name: st.name })}
                      className="p-1.5 bg-card2 border border-border rounded-lg text-danger hover:border-danger cursor-pointer transition-colors"
                      title="Xóa Trạm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-xl text-muted text-xs shadow-md">
          {t('damDetail.noStations')}
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT STATION ── */}
      {stationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-card2">
              <h3 className="text-sm font-bold text-tx m-0 flex items-center gap-2">
                <Radio className="w-4 h-4 text-accent" />
                <span>{editingStation ? t('damsPage.editStation') : t('damDetail.addStation')}</span>
              </h3>
              <button
                onClick={() => setStationModalOpen(false)}
                className="text-muted hover:text-tx bg-transparent border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStation} className="p-5 space-y-3 text-[11px]">
              <div>
                <Label className="mb-1">{t('admin.form.belongToDam')}</Label>
                <input
                  disabled
                  value={`${dam.name} (${dam.id})`}
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none font-semibold opacity-70"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1">{t('admin.form.stationNameLabel')}</Label>
                  <input
                    required
                    value={stationForm.name}
                    onChange={e => setStationForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="vd: Trạm Tân Ấp 1"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.locationLabel')}</Label>
                  <input
                    value={stationForm.location}
                    onChange={e => setStationForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="vd: Hoàn Kiếm, Hà Nội"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1">{t('admin.form.riverLabel')}</Label>
                  <input
                    value={stationForm.river}
                    onChange={e => setStationForm(p => ({ ...p, river: e.target.value }))}
                    placeholder="vd: Sông Hồng"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.kmLabel')}</Label>
                  <input
                    value={stationForm.km}
                    onChange={e => setStationForm(p => ({ ...p, km: e.target.value }))}
                    placeholder="vd: K25+500"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="mb-1">{t('admin.form.waterLevelLabel')}</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={stationForm.waterLevel}
                    onChange={e => setStationForm(p => ({ ...p, waterLevel: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.changeLabel')}</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={stationForm.change}
                    onChange={e => setStationForm(p => ({ ...p, change: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.pressureLabel')}</Label>
                  <input
                    type="number"
                    step="1"
                    value={stationForm.pressure}
                    onChange={e => setStationForm(p => ({ ...p, pressure: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="mb-1">{t('admin.form.bd1Label')}</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={stationForm.bd1}
                    onChange={e => setStationForm(p => ({ ...p, bd1: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.bd2Label')}</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={stationForm.bd2}
                    onChange={e => setStationForm(p => ({ ...p, bd2: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.bd3Label')}</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={stationForm.bd3}
                    onChange={e => setStationForm(p => ({ ...p, bd3: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono text-danger font-bold"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1">{t('admin.form.statusLabel')}</Label>
                <select
                  value={stationForm.status}
                  onChange={e => setStationForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                >
                  <option value="safe">{t('status.safe')}</option>
                  <option value="warning">{t('status.warning')}</option>
                  <option value="danger">{t('status.danger')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setStationModalOpen(false)}
                  className="px-4 py-2 border border-border rounded text-muted bg-transparent text-[11px] font-semibold cursor-pointer hover:bg-white/5"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 rounded text-white text-[11px] font-bold cursor-pointer border-none"
                >
                  {editingStation ? t('admin.save') : t('admin.create')}
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
              Xóa Trạm quan trắc <strong className="text-danger">{deleteConfirm.name}</strong> (ID: {deleteConfirm.id})?
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
