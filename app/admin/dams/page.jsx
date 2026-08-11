'use client'

import { useState } from 'react'
import { useDamData } from '@/hooks/useDamData'
import { getStatus } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Label } from '@/components/ui'
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Check,
  X,
  AlertTriangle,
  Database,
  Radio,
  Sliders,
  Layers,
  MapPin
} from 'lucide-react'

export default function AdminDamsPage() {
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

  const [activeTab, setActiveTab] = useState('dams') // 'dams' | 'stations'
  const [search, setSearch] = useState('')
  const [damFilter, setDamFilter] = useState('all')

  // Modals state
  const [damModalOpen, setDamModalOpen] = useState(false)
  const [editingDam, setEditingDam] = useState(null) // null = create, object = edit

  const [stationModalOpen, setStationModalOpen] = useState(false)
  const [editingStation, setEditingStation] = useState(null)

  const [deleteConfirm, setDeleteConfirm] = useState(null) // { type: 'dam'|'station', id, name }

  // Form states
  const [damForm, setDamForm] = useState({
    id: '',
    name: '',
    location: '',
    waterLevel: 0,
    flow: 0,
    fillPct: 50,
    status: 'safe',
  })

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
    damId: '',
  })

  // Handlers for Dam Form
  const openCreateDamModal = () => {
    setEditingDam(null)
    setDamForm({
      id: `dam_${Date.now()}`,
      name: '',
      location: '',
      waterLevel: 100,
      flow: 1000,
      fillPct: 70,
      status: 'safe',
    })
    setDamModalOpen(true)
  }

  const openEditDamModal = (dam) => {
    setEditingDam(dam)
    setDamForm({
      id: dam.id,
      name: dam.name || '',
      location: dam.location || '',
      waterLevel: dam.waterLevel || 0,
      flow: dam.flow || 0,
      fillPct: dam.fillPct || 0,
      status: dam.status || 'safe',
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
          waterLevel: Number(damForm.waterLevel),
          flow: Number(damForm.flow),
          fillPct: Number(damForm.fillPct),
          status: damForm.status,
        })
      } else {
        await createDam({
          ...damForm,
          waterLevel: Number(damForm.waterLevel),
          flow: Number(damForm.flow),
          fillPct: Number(damForm.fillPct),
        })
      }
      setDamModalOpen(false)
    } catch (err) {
      alert(`Lỗi khi lưu đập: ${err.message}`)
    }
  }

  // Handlers for Station Form
  const openCreateStationModal = () => {
    setEditingStation(null)
    setStationForm({
      name: '',
      location: '',
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
      damId: dams[0]?.id || 'dam_1',
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
      damId: st.damId || dams[0]?.id || 'dam_1',
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
          damId: stationForm.damId,
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
        })
      }
      setStationModalOpen(false)
    } catch (err) {
      alert(`Lỗi khi lưu trạm: ${err.message}`)
    }
  }

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      if (deleteConfirm.type === 'dam') {
        await deleteDam(deleteConfirm.id)
      } else {
        await deleteStation(deleteConfirm.id)
      }
      setDeleteConfirm(null)
    } catch (err) {
      alert(`Lỗi khi xóa: ${err.message}`)
    }
  }

  // Filtered data
  const filteredDams = dams.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase())
  )

  const filteredStations = stations.filter(s => {
    const matchesDam = damFilter === 'all' || s.damId === damFilter
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.location && s.location.toLowerCase().includes(search.toLowerCase()))
    return matchesDam && matchesSearch
  })

  return (
    <div className="p-4 min-h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-tx tracking-wide m-0">QUẢN LÝ ĐẬP THỦY ĐIỆN & TRẠM QUAN TRẮC</h1>
          </div>
          <p className="text-[10px] text-muted m-0">Thao tác CRUD trực tiếp trên Database PostgreSQL / TimescaleDB</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-muted text-[11px] font-medium bg-card hover:bg-white/5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>

          {activeTab === 'dams' ? (
            <button
              onClick={openCreateDamModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded text-white text-[11px] font-bold cursor-pointer border-none shadow-lg shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Đập Mới</span>
            </button>
          ) : (
            <button
              onClick={openCreateStationModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded text-white text-[11px] font-bold cursor-pointer border-none shadow-lg shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Trạm Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-between items-center bg-card border border-border rounded-lg p-1.5 mb-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('dams')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-bold transition-all cursor-pointer border-none
              ${activeTab === 'dams' ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm' : 'bg-transparent text-muted hover:text-tx'}`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Danh sách Đập Thủy Điện ({dams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-bold transition-all cursor-pointer border-none
              ${activeTab === 'stations' ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm' : 'bg-transparent text-muted hover:text-tx'}`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Danh sách Trạm Quan Trắc ({stations.length})</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          {activeTab === 'stations' && (
            <select
              value={damFilter}
              onChange={e => setDamFilter(e.target.value)}
              className="bg-card2 border border-border rounded px-2.5 py-1.5 text-tx text-[11px] outline-none"
            >
              <option value="all">Tất cả các đập</option>
              {dams.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1.5 bg-card2 border border-border rounded px-2.5 py-1.5 w-52">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="bg-transparent border-none outline-none text-tx text-[11px] w-full placeholder:text-muted"
            />
          </div>
        </div>
      </div>

      {/* ── TAB 1: DAMS TABLE ── */}
      {activeTab === 'dams' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-card2 border-b border-border text-[9px] text-muted font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">MÃ ĐẬP (ID)</th>
                  <th className="px-4 py-3 text-left">TÊN ĐẬP THỦY ĐIỆN</th>
                  <th className="px-4 py-3 text-left">VỊ TRÍ</th>
                  <th className="px-4 py-3 text-left">MỰC NƯỚC (M)</th>
                  <th className="px-4 py-3 text-left">LƯU LƯỢNG (M³/S)</th>
                  <th className="px-4 py-3 text-left">MỨC CHỨA</th>
                  <th className="px-4 py-3 text-left">SỐ TRẠM</th>
                  <th className="px-4 py-3 text-left">TRẠNG THÁI</th>
                  <th className="px-4 py-3 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-[11px]">
                {filteredDams.map(d => {
                  const s = getStatus(d.status)
                  const stationCount = stations.filter(st => st.damId === d.id).length
                  return (
                    <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-accent font-semibold">{d.id}</td>
                      <td className="px-4 py-3 font-bold text-tx">{d.name}</td>
                      <td className="px-4 py-3 text-muted">{d.location || '--'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-tx">{d.waterLevel} m</td>
                      <td className="px-4 py-3 font-mono text-tx">{d.flow ? d.flow.toLocaleString() : 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className={`h-full ${s.dot}`} style={{ width: `${Math.min(d.fillPct, 100)}%` }} />
                          </div>
                          <Mono className="text-[10px] text-muted">{d.fillPct}%</Mono>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-card2 border border-border px-2 py-0.5 rounded text-[10px] font-mono text-info">
                          {stationCount} trạm
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={d.status} sm />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEditDamModal(d)}
                            className="p-1.5 bg-card2 border border-border rounded text-accent hover:border-accent transition-colors cursor-pointer"
                            title="Chỉnh sửa đập"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'dam', id: d.id, name: d.name })}
                            className="p-1.5 bg-card2 border border-border rounded text-danger hover:border-danger transition-colors cursor-pointer"
                            title="Xóa đập"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {filteredDams.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted text-[11px]">
                      Không tìm thấy đập thủy điện nào trong cơ sở dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: STATIONS TABLE ── */}
      {activeTab === 'stations' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-card2 border-b border-border text-[9px] text-muted font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">TÊN TRẠM</th>
                  <th className="px-4 py-3 text-left">THUỘC ĐẬP</th>
                  <th className="px-4 py-3 text-left">VỊ TRÍ / KHU VỰC</th>
                  <th className="px-4 py-3 text-left">SÔNG & KM</th>
                  <th className="px-4 py-3 text-left">MỰC NƯỚC</th>
                  <th className="px-4 py-3 text-left">ÁP LỰC</th>
                  <th className="px-4 py-3 text-left">ĐỘ ẨM</th>
                  <th className="px-4 py-3 text-left">BĐ1 / BĐ2 / BĐ3</th>
                  <th className="px-4 py-3 text-left">TRẠNG THÁI</th>
                  <th className="px-4 py-3 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-[11px]">
                {filteredStations.map(st => {
                  const parentDam = dams.find(d => d.id === st.damId)
                  return (
                    <tr key={st.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-muted">{st.id}</td>
                      <td className="px-4 py-3 font-bold text-tx">{st.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                          {parentDam ? parentDam.name : st.damId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{st.location || '--'}</td>
                      <td className="px-4 py-3">
                        <div className="text-[11px] text-tx">{st.river}</div>
                        <div className="text-[9px] text-muted font-mono">{st.km}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-tx">{st.waterLevel} m</td>
                      <td className="px-4 py-3 font-mono text-tx">{st.pressure} atm</td>
                      <td className="px-4 py-3 font-mono text-tx">{st.humidity}%</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted">
                        {st.bd1} / {st.bd2} / <span className="text-danger font-bold">{st.bd3}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={st.status} sm />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEditStationModal(st)}
                            className="p-1.5 bg-card2 border border-border rounded text-accent hover:border-accent transition-colors cursor-pointer"
                            title="Chỉnh sửa trạm"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'station', id: st.id, name: st.name })}
                            className="p-1.5 bg-card2 border border-border rounded text-danger hover:border-danger transition-colors cursor-pointer"
                            title="Xóa trạm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {filteredStations.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-muted text-[11px]">
                      Không tìm thấy trạm quan trắc nào trong cơ sở dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT DAM ── */}
      {damModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-card2">
              <h3 className="text-sm font-bold text-tx m-0 flex items-center gap-2">
                <Database className="w-4 h-4 text-accent" />
                <span>{editingDam ? 'Cập Nhật Thông Tin Đập' : 'Thêm Đập Thủy Điện Mới'}</span>
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
                <Label className="mb-1">Mã Đập (ID Slug)</Label>
                <input
                  disabled={Boolean(editingDam)}
                  required
                  value={damForm.id}
                  onChange={e => setDamForm(p => ({ ...p, id: e.target.value }))}
                  placeholder="vd: dam_hoa_binh"
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent disabled:opacity-50 font-mono"
                />
              </div>

              <div>
                <Label className="mb-1">Tên Đập Thủy Điện</Label>
                <input
                  required
                  value={damForm.name}
                  onChange={e => setDamForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="vd: Đập Thủy điện Hòa Bình"
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                />
              </div>

              <div>
                <Label className="mb-1">Vị trí / Tỉnh thành</Label>
                <input
                  value={damForm.location}
                  onChange={e => setDamForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="vd: Hòa Bình"
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="mb-1">Mực nước (m)</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={damForm.waterLevel}
                    onChange={e => setDamForm(p => ({ ...p, waterLevel: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">Lưu lượng (m³/s)</Label>
                  <input
                    type="number"
                    value={damForm.flow}
                    onChange={e => setDamForm(p => ({ ...p, flow: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">Mức chứa (%)</Label>
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
                <Label className="mb-1">Trạng thái vận hành</Label>
                <select
                  value={damForm.status}
                  onChange={e => setDamForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                >
                  <option value="safe">An Toàn (Safe)</option>
                  <option value="warning">Cảnh Báo (Warning)</option>
                  <option value="danger">Nguy Hiểm (Danger)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setDamModalOpen(false)}
                  className="px-4 py-2 border border-border rounded text-muted bg-transparent text-[11px] font-semibold cursor-pointer hover:bg-white/5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 rounded text-white text-[11px] font-bold cursor-pointer border-none"
                >
                  {editingDam ? 'Lưu Cập Nhật' : 'Tạo Đập Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT STATION ── */}
      {stationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-card2">
              <h3 className="text-sm font-bold text-tx m-0 flex items-center gap-2">
                <Radio className="w-4 h-4 text-accent" />
                <span>{editingStation ? 'Cập Nhật Trạm Quan Trắc' : 'Thêm Trạm Quan Trắc Mới'}</span>
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
                <Label className="mb-1">Thuộc Đập Thủy Điện</Label>
                <select
                  required
                  value={stationForm.damId}
                  onChange={e => setStationForm(p => ({ ...p, damId: e.target.value }))}
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-semibold"
                >
                  {dams.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1">Tên Trạm Quan Trắc</Label>
                  <input
                    required
                    value={stationForm.name}
                    onChange={e => setStationForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="vd: Trạm Tân Ấp 1"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <Label className="mb-1">Vị trí / Khu vực</Label>
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
                  <Label className="mb-1">Tuyến Sông</Label>
                  <input
                    value={stationForm.river}
                    onChange={e => setStationForm(p => ({ ...p, river: e.target.value }))}
                    placeholder="vd: Sông Hồng"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <Label className="mb-1">Vị trí Km</Label>
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
                  <Label className="mb-1">Mực nước (m)</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={stationForm.waterLevel}
                    onChange={e => setStationForm(p => ({ ...p, waterLevel: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">Biến động change (m)</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={stationForm.change}
                    onChange={e => setStationForm(p => ({ ...p, change: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">Áp lực (atm)</Label>
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
                  <Label className="mb-1">Ngưỡng BĐ1 (m)</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={stationForm.bd1}
                    onChange={e => setStationForm(p => ({ ...p, bd1: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">Ngưỡng BĐ2 (m)</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={stationForm.bd2}
                    onChange={e => setStationForm(p => ({ ...p, bd2: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">Ngưỡng BĐ3 (m)</Label>
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
                <Label className="mb-1">Trạng thái trạm</Label>
                <select
                  value={stationForm.status}
                  onChange={e => setStationForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                >
                  <option value="safe">An Toàn (Safe)</option>
                  <option value="warning">Cảnh Báo (Warning)</option>
                  <option value="danger">Nguy Hiểm (Danger)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setStationModalOpen(false)}
                  className="px-4 py-2 border border-border rounded text-muted bg-transparent text-[11px] font-semibold cursor-pointer hover:bg-white/5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 rounded text-white text-[11px] font-bold cursor-pointer border-none"
                >
                  {editingStation ? 'Lưu Cập Nhật' : 'Tạo Trạm Mới'}
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
                <h3 className="text-sm font-bold text-tx m-0">Xác nhận xóa dữ liệu</h3>
                <p className="text-[10px] text-muted m-0">Hành động này không thể hoàn tác!</p>
              </div>
            </div>

            <p className="text-[11px] text-tx leading-relaxed mb-4 bg-card2 p-3 rounded border border-border">
              Bạn có chắc chắn muốn xóa {deleteConfirm.type === 'dam' ? 'Đập thủy điện' : 'Trạm quan trắc'}{' '}
              <strong className="text-danger">{deleteConfirm.name}</strong> (ID: {deleteConfirm.id})?
              {deleteConfirm.type === 'dam' && (
                <span className="block text-[10px] text-warning mt-1">
                  ⚠️ Lưu ý: Tất cả các trạm quan trắc thuộc đập này cũng sẽ bị xóa khỏi cơ sở dữ liệu.
                </span>
              )}
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-border rounded text-muted bg-transparent text-[11px] font-semibold cursor-pointer hover:bg-white/5"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-danger rounded text-white text-[11px] font-bold cursor-pointer border-none shadow-lg shadow-danger/20"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
