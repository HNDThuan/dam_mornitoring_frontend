"use client";

import { useState, useMemo } from "react";
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
import { useAlarmData } from "@/hooks/useAlarmData";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, ChevronRight, Download, CheckCircle2, ChevronUp, ChevronDown, Minus, Camera, Maximize2, Pencil, Trash2, MapPin, X, Radio, Sliders, Droplet, Activity, Zap } from "lucide-react";
import { fetchThresholdConfigs, updateThresholdConfig, updateStation, fetchSensorClusters, updateSensorCluster } from "@/lib/api";

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
function ConnectionBanner({ connected, error }) {
  if (connected)
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
      <div className="px-1 pt-1" style={{ height: 76 }}>
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
  const defaultSt = { id: Number(id), name: 'Trạm Quan Trắc', location: 'Hà Nội', latitude: 21.0381, longitude: 105.8492, river: 'Sông Hồng', km: 'K25+500', status: 'safe', waterLevel: 6.12, flow: 1800, fillPct: 78, bd1: 6.0, bd2: 7.0, bd3: 8.5, humidity: 50 };
  const st = stations.find((s) => s.id === Number(id)) || defaultSt;
  const stStatus = getStatus(st.status);

  // Toast State
  const [toast, setToast] = useState(null) // { message, type }
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Threshold Modal State
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false)
  const [thresholdConfigs, setThresholdConfigs] = useState([])
  const [thresholdForm, setThresholdForm] = useState({
    bd1: 6.0,
    bd2: 8.0,
    bd3: 10.0,
    vibWarn: 2.5,
    vibAlert: 15.0,
    vibCritical: 25.0,
    mstWarn: 75.0,
    mstAlert: 85.0,
    mstCritical: 95.0,
  })

  const openThresholdModal = async () => {
    setThresholdForm({
      bd1: st.bd1 ?? 6.0,
      bd2: st.bd2 ?? 8.0,
      bd3: st.bd3 ?? 10.0,
      vibWarn: thresholds?.warnHigh ?? 2.5,
      vibAlert: thresholds?.alertHigh ?? 15.0,
      vibCritical: thresholds?.criticalHigh ?? 25.0,
      mstWarn: 75.0,
      mstAlert: 85.0,
      mstCritical: 95.0,
    })

    if (st.damId) {
      try {
        const res = await fetchThresholdConfigs(st.damId)
        const configs = res?.configs || []
        setThresholdConfigs(configs)
        const vibCfg = configs.find(c => c.sensorType === 'vibration')
        const mstCfg = configs.find(c => c.sensorType === 'moisture')
        if (vibCfg) {
          setThresholdForm(p => ({
            ...p,
            vibWarn: vibCfg.warnHigh ?? 2.5,
            vibAlert: vibCfg.alertHigh ?? 15.0,
            vibCritical: vibCfg.criticalHigh ?? 25.0,
          }))
        }
        if (mstCfg) {
          setThresholdForm(p => ({
            ...p,
            mstWarn: mstCfg.warnHigh ?? 75.0,
            mstAlert: mstCfg.alertHigh ?? 85.0,
            mstCritical: mstCfg.criticalHigh ?? 95.0,
          }))
        }
      } catch (err) {
        console.warn('[StationDetail] Không thể nạp ngưỡng:', err)
      }
    }
    setThresholdModalOpen(true)
  }

  const handleSaveThresholds = async (e) => {
    e.preventDefault()
    try {
      await updateStation(st.id, {
        bd1: Number(thresholdForm.bd1),
        bd2: Number(thresholdForm.bd2),
        bd3: Number(thresholdForm.bd3),
      })

      if (st.damId && thresholdConfigs.length > 0) {
        const waterCfg = thresholdConfigs.find(c => c.sensorType === 'water_level')
        const vibCfg = thresholdConfigs.find(c => c.sensorType === 'vibration')
        const mstCfg = thresholdConfigs.find(c => c.sensorType === 'moisture')

        const promises = []
        if (waterCfg) {
          promises.push(updateThresholdConfig(waterCfg.id, {
            warnHigh: Number(thresholdForm.bd1),
            alertHigh: Number(thresholdForm.bd2),
            criticalHigh: Number(thresholdForm.bd3),
          }))
        }
        if (vibCfg) {
          promises.push(updateThresholdConfig(vibCfg.id, {
            warnHigh: Number(thresholdForm.vibWarn),
            alertHigh: Number(thresholdForm.vibAlert),
            criticalHigh: Number(thresholdForm.vibCritical),
          }))
        }
        if (mstCfg) {
          promises.push(updateThresholdConfig(mstCfg.id, {
            warnHigh: Number(thresholdForm.mstWarn),
            alertHigh: Number(thresholdForm.mstAlert),
            criticalHigh: Number(thresholdForm.mstCritical),
          }))
        }
        await Promise.all(promises)
      }

      showToast('Cập nhật ngưỡng cảnh báo cho Trạm & tự động đồng bộ xuống Jetson TX2 thành công!')
      setThresholdModalOpen(false)
      refetch()

      // Tự động đồng bộ ngưỡng độ rung sang các Node thuộc Trạm này để phát tin nhắn MQTT xuống Jetson TX2
      try {
        const clusterRes = await fetchSensorClusters(st.damId, st.id)
        const nodeList = clusterRes?.clusters || clusterRes?.nodes || clusterRes || []
        if (Array.isArray(nodeList) && nodeList.length > 0) {
          const nodePromises = nodeList.map(node =>
            updateSensorCluster(node.id, {
              warnHigh: Number(thresholdForm.vibWarn),
              vibrationThreshold: Number(thresholdForm.vibAlert),
              criticalHigh: Number(thresholdForm.vibCritical),
            }).catch(e => console.warn('[StationDetail] Không thể đồng bộ node:', node.id, e))
          )
          await Promise.all(nodePromises)
          console.log(`[StationDetail] Đã đồng bộ ngưỡng độ rung sang ${nodeList.length} Node(s) Jetson TX2 thuộc Trạm ${st.name}`)
        }
      } catch (err) {
        console.warn('[StationDetail] Lỗi đồng bộ Node Jetson TX2:', err)
      }
    } catch (err) {
      console.error('[StationDetail] Lỗi lưu ngưỡng:', err)
      showToast('Không thể cập nhật ngưỡng cảnh báo!', 'error')
    }
  }

  // Edit / Delete Modal State
  const [editingModalOpen, setEditingModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [stationForm, setStationForm] = useState({
    name: '',
    location: '',
    latitude: 21.0381,
    longitude: 105.8492,
    river: '',
    km: '',
    status: 'safe',
    bd1: 6.0,
    bd2: 8.0,
    bd3: 10.0,
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
      bd1: st.bd1 || 6.0,
      bd2: st.bd2 || 8.0,
      bd3: st.bd3 || 10.0,
    })
    setEditingModalOpen(true)
  }

  const handleSaveStation = async (e) => {
    e.preventDefault()
    try {
      await updateStation(st.id, {
        name: stationForm.name,
        location: stationForm.location,
        latitude: Number(stationForm.latitude),
        longitude: Number(stationForm.longitude),
        river: stationForm.river,
        km: stationForm.km,
        status: stationForm.status,
        bd1: Number(stationForm.bd1),
        bd2: Number(stationForm.bd2),
        bd3: Number(stationForm.bd3),
      })
      showToast('Cập nhật thông tin trạm quan trắc thành công!', 'success')
      setEditingModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleConfirmDelete = async () => {
    try {
      await deleteStation(st.id)
      showToast(`Đã xóa trạm quan trắc ${st.name}!`, 'success')
      setDeleteConfirm(false)
      setTimeout(() => {
        router.push(st.damId ? `/dams/${st.damId}` : '/dams')
      }, 1000)
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error')
    }
  }

  // ── Real-time data từ backend (chỉ nhận dữ liệu đúng của Trạm này) ──
  const { latest, history, connected, error } = useSensorData(Number(id));
  const { alarms, thresholds } = useAlarmData()

  // Dùng real data nếu có, fallback về station data
  const waterLevel = latest?.waterLevel ?? st.waterLevel;
  const moisture = latest?.moisture ?? st.humidity;
  const freq = latest?.freq ?? 3.2;
  const amp = latest?.amp ?? 1.8;
  const percent = latest?.percent ?? (st.fillPct || 78);

  // Build chart data từ history backend hoặc fallback mock
  const waterChartData = useMemo(() => {
    if (history?.waterLevel?.length)
      return historyToChartData(history, "waterLevel");
    // fallback: flat mock line
    return Array.from({ length: 20 }, (_, i) => ({
      t: `${i}:00`,
      v: +(waterLevel - 1 + i * 0.08).toFixed(2),
    }));
  }, [history, waterLevel]);

  const humidChartData = useMemo(() => {
    if (history?.moisture?.length)
      return historyToChartData(history, "moisture");
    return Array.from({ length: 20 }, (_, i) => ({
      t: `${i}:00`,
      v: +(moisture - 5 + i * 0.3).toFixed(1),
    }));
  }, [history, moisture]);

  const vibChartData = useMemo(() => {
    if (history?.freq?.length) return historyToChartData(history, "freq");
    return Array.from({ length: 20 }, (_, i) => ({
      t: `${i}:00`,
      v: +(2 + Math.sin(i / 3) * 1.5).toFixed(2),
    }));
  }, [history, freq]);

  const ampChartData = useMemo(() => {
    if (history?.amp?.length) return historyToChartData(history, "amp");
    return Array.from({ length: 20 }, (_, i) => ({
      t: `${i}:00`,
      v: +(2 + Math.sin(i / 3) * 1.5).toFixed(2),
    }));
  }, [history, amp]);

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


  // Status — dùng thresholds từ backend nếu có, giữ bd1/bd2/bd3 cho hiển thị
  const waterSt = getWaterStatus(waterLevel, st.bd3, st.bd2, st.bd1, thresholds?.water_level)
  const humidSt = getMoistureStatus(moisture, thresholds?.humidity)
  const vibSt = getVibrationStatus(amp, thresholds?.vibration)
  // Threshold values từ backend cho MetricCard
  const waterThreshold = thresholds?.water_level?.alertHigh ?? st.bd3
  const humThreshold = thresholds?.humidity?.alertHigh ?? 85
  const vibThreshold = thresholds?.vibration?.alertHigh ?? 15

  console.log("water threshold: ", waterThreshold)

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
      <ConnectionBanner connected={connected} error={error} />

      {/* Toast Notification */}
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

      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-xl font-bold text-tx tracking-wide m-0">
              {st.name} ({st.river} — {st.km})
            </h1>
            <Badge status={waterSt.level} />
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full animate-pulse-dot ${stStatus.dot}`}
            />
            <span className="text-[10px] text-muted">
              Mã Trạm #{st.id}
              {latest?.timestamp && (
                <>
                  {" "}
                  • {t('liveBar.updated')}:{" "}
                  {new Date(latest.timestamp).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons: Sửa, Xóa, Xuất báo cáo */}
        <div className="flex items-center gap-2">
          {!isViewer && (
            <>
              <button
                onClick={openThresholdModal}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-warning/40 rounded-lg text-warning text-[11px] font-bold bg-warning/10 hover:bg-warning/20 transition-colors cursor-pointer"
                title="Cấu hình Ngưỡng Cảnh Báo cho Trạm"
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span>Cấu hình Ngưỡng Cảnh Báo</span>
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
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold border-none cursor-pointer bg-gradient-to-r from-info to-accent shadow-glow hover:brightness-110 transition-all">
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>{t('stationDetail.exportReport')}</span>
          </button>
        </div>
      </div>

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
        <DamMap dams={dams.filter(d => d.id === st.damId)} stations={[st]} height="320px" />
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
            { lb: "BĐ3", val: `${waterThreshold}m`, cl: "text-danger" },
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
            { lb: t('stationDetail.threshold'), val: `${humThreshold}%`, cl: "text-warning" },
          ]}
        />

        {/* Độ rung */}
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
          threshold={vibThreshold}
          stats={[
            { lb: t('stationDetail.average'), val: `${vibStats.avg} Hz`, cl: "text-tx" },
            { lb: t('stationDetail.peak24h'), val: `${vibStats.max} Hz`, cl: "text-warning" },
            { lb: t('stationDetail.threshold'), val: `${vibThreshold} Hz`, cl: "text-muted" },
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
            { lb: `BĐ (${vibThreshold} mm/s)`, val: `${vibThreshold} mm/s`, cl: 'text-danger' },
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
                  Biên độ rung & Lưu lượng
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
                {
                  lb: "Lưu lượng TK",
                  val: `${st.flow.toLocaleString()} m³/s`,
                  sub: "Mock — chưa có sensor",
                  cl: "text-muted",
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

      {/* ── MODAL: EDIT STATION ── */}
      {editingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-card2">
              <h3 className="text-sm font-bold text-tx m-0 flex items-center gap-2">
                <Radio className="w-4 h-4 text-accent" />
                <span>Chỉnh sửa thông tin Trạm #{st.id}</span>
              </h3>
              <button
                onClick={() => setEditingModalOpen(false)}
                className="text-muted hover:text-tx bg-transparent border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStation} className="p-5 space-y-3 text-[11px]">
              <div>
                <Label className="mb-1">Tên Trạm quan trắc</Label>
                <input
                  required
                  value={stationForm.name}
                  onChange={e => setStationForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="vd: Trạm Tân Ấp 1"
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
                    value={stationForm.latitude}
                    onChange={e => setStationForm(p => ({ ...p, latitude: e.target.value }))}
                    placeholder="vd: 21.0381"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
                <div>
                  <Label className="mb-1">Kinh độ (Longitude °E)</Label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={stationForm.longitude}
                    onChange={e => setStationForm(p => ({ ...p, longitude: e.target.value }))}
                    placeholder="vd: 105.8492"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1">Địa danh / Vị trí</Label>
                <input
                  value={stationForm.location}
                  onChange={e => setStationForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="vd: Hoàn Kiếm, Hà Nội"
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1">Tên Sông</Label>
                  <input
                    value={stationForm.river}
                    onChange={e => setStationForm(p => ({ ...p, river: e.target.value }))}
                    placeholder="vd: Sông Hồng"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <Label className="mb-1">Vị trí Km / Lý trình</Label>
                  <input
                    value={stationForm.km}
                    onChange={e => setStationForm(p => ({ ...p, km: e.target.value }))}
                    placeholder="vd: K25+500"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
                <div>
                  <Label className="mb-1">Báo động 1 (m)</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={stationForm.bd1}
                    onChange={e => setStationForm(p => ({ ...p, bd1: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
                <div>
                  <Label className="mb-1">Báo động 2 (m)</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={stationForm.bd2}
                    onChange={e => setStationForm(p => ({ ...p, bd2: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono text-warning"
                  />
                </div>
                <div>
                  <Label className="mb-1">Báo động 3 (m)</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={stationForm.bd3}
                    onChange={e => setStationForm(p => ({ ...p, bd3: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono text-danger font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-muted hover:text-tx text-xs font-semibold bg-transparent cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-info to-accent rounded-lg text-white text-xs font-bold border-none cursor-pointer shadow-lg"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CONFIRMATION ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-5 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
            </div>
            <h3 className="text-base font-bold text-tx mb-2">Xác nhận xóa Trạm?</h3>
            <p className="text-xs text-muted mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa <strong className="text-tx">{st.name}</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 border border-border rounded-lg text-muted hover:text-tx text-xs font-semibold bg-card2 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-danger hover:bg-danger/80 text-white rounded-lg text-xs font-bold border-none cursor-pointer shadow-lg shadow-danger/20"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── MODAL: THRESHOLD CONFIG FOR STATION ── */}
      {thresholdModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-card2">
              <h3 className="text-sm font-bold text-tx m-0 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-warning" />
                <span>Cấu Hình Ngưỡng Cảnh Báo ({st.name})</span>
              </h3>
              <button
                onClick={() => setThresholdModalOpen(false)}
                className="text-muted hover:text-tx bg-transparent border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveThresholds} className="p-5 space-y-4 text-[11px] max-h-[80vh] overflow-y-auto">
              
              {/* Banner Đồng bộ Realtime MQTT Jetson TX2 */}
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-2.5 text-[10px] text-warning flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning shrink-0" />
                  <span>Ngưỡng độ rung sẽ <b>tự động đồng bộ Realtime qua MQTT</b> tới Edge Gateway Jetson TX2.</span>
                </div>
                <span className="text-[9px] text-safe font-semibold bg-safe/10 border border-safe/30 px-1.5 py-0.5 rounded shrink-0">
                  🟢 MQTT Sync
                </span>
              </div>

              {/* 1. Ngưỡng Mực Nước Báo Động (m) */}
              <div className="bg-card2 border border-info/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-info font-bold text-[12px] mb-1">
                  <Droplet className="w-4 h-4" />
                  <span>1. Ngưỡng Mực Nước Mức Báo Động (m)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="mb-1 text-warning">Báo Động 1 (BĐ1)</Label>
                    <input
                      type="number" step="0.1" required
                      value={thresholdForm.bd1}
                      onChange={e => setThresholdForm(p => ({ ...p, bd1: e.target.value }))}
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx font-mono outline-none focus:border-warning"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 text-danger">Báo Động 2 (BĐ2)</Label>
                    <input
                      type="number" step="0.1" required
                      value={thresholdForm.bd2}
                      onChange={e => setThresholdForm(p => ({ ...p, bd2: e.target.value }))}
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx font-mono outline-none focus:border-warning"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 text-danger">Báo Động 3 (BĐ3)</Label>
                    <input
                      type="number" step="0.1" required
                      value={thresholdForm.bd3}
                      onChange={e => setThresholdForm(p => ({ ...p, bd3: e.target.value }))}
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx font-mono outline-none focus:border-warning"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Ngưỡng Độ Rung Cảnh Báo (mm/s) */}
              <div className="bg-card2 border border-orange-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-orange-400 font-bold text-[12px] mb-1">
                  <Activity className="w-4 h-4" />
                  <span>2. Ngưỡng Độ Rung Báo Động (Vibration mm/s)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="mb-1 text-warning">Chú Ý (mm/s)</Label>
                    <input
                      type="number" step="0.1" required
                      value={thresholdForm.vibWarn}
                      onChange={e => setThresholdForm(p => ({ ...p, vibWarn: e.target.value }))}
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx font-mono outline-none focus:border-warning"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 text-danger">Cảnh Báo (mm/s)</Label>
                    <input
                      type="number" step="0.1" required
                      value={thresholdForm.vibAlert}
                      onChange={e => setThresholdForm(p => ({ ...p, vibAlert: e.target.value }))}
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx font-mono outline-none focus:border-warning"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 text-danger">Nguy Cấp (mm/s)</Label>
                    <input
                      type="number" step="0.1" required
                      value={thresholdForm.vibCritical}
                      onChange={e => setThresholdForm(p => ({ ...p, vibCritical: e.target.value }))}
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx font-mono outline-none focus:border-warning"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Ngưỡng Độ Ẩm Móng (%) */}
              <div className="bg-card2 border border-emerald-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[12px] mb-1">
                  <Droplet className="w-4 h-4" />
                  <span>3. Ngưỡng Độ Ẩm Rò Rỉ Móng (%)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="mb-1 text-warning">Chú Ý (%)</Label>
                    <input
                      type="number" step="1" required
                      value={thresholdForm.mstWarn}
                      onChange={e => setThresholdForm(p => ({ ...p, mstWarn: e.target.value }))}
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx font-mono outline-none focus:border-warning"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 text-danger">Cảnh Báo (%)</Label>
                    <input
                      type="number" step="1" required
                      value={thresholdForm.mstAlert}
                      onChange={e => setThresholdForm(p => ({ ...p, mstAlert: e.target.value }))}
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx font-mono outline-none focus:border-warning"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 text-danger">Nguy Cấp (%)</Label>
                    <input
                      type="number" step="1" required
                      value={thresholdForm.mstCritical}
                      onChange={e => setThresholdForm(p => ({ ...p, mstCritical: e.target.value }))}
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx font-mono outline-none focus:border-warning"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setThresholdModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-muted hover:text-tx text-xs font-semibold bg-card2 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white text-xs font-bold border-none cursor-pointer shadow-lg"
                >
                  Lưu Cấu Hình Ngưỡng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
