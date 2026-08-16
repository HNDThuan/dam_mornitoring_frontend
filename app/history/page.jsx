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
import { exportAlarmsToExcel } from '@/lib/exportHelpers'
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
              onClick={() => exportAlarmsToExcel(scopedAlarms, effectiveDamId || 'Dam')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-safe/40 rounded-lg bg-safe/10 text-safe text-[10px] font-bold cursor-pointer hover:bg-safe/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-safe shrink-0" />
              <span>Xuất Báo Cáo Excel</span>
            </button>
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
