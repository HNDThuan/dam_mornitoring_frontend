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
import { Mono, Badge, Label } from "@/components/ui";
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
import { AlertTriangle, ChevronRight, Download, CheckCircle2, ChevronUp, ChevronDown, Minus, Camera, Maximize2, Pencil, Trash2, MapPin, X, Radio } from "lucide-react";

const CHART_STYLE = {
  background: "#0d1520",
  border: "1px solid #1a2a3a",
  borderRadius: 4,
  fontSize: 10,
};
const STATUS_HEX = {
  danger: "#f43f5e",
  warning: "#fb923c",
  safe: "#34d399",
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
      <div className="flex items-center gap-2 px-3 py-1.5 bg-safe/10 border border-safe/30 rounded-lg mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse-dot" />
        <span className="text-[10px] text-safe font-semibold">
          WebSocket đã kết nối — Đang nhận dữ liệu thời gian thực
        </span>
      </div>
    );
  if (error)
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/30 rounded-lg mb-3">
        <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
        <span className="text-[10px] text-warning font-semibold">
          {error} — Hiển thị dữ liệu mẫu
        </span>
      </div>
    );
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-card2 border border-border rounded-lg mb-3">
      <div className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse-dot" />
      <span className="text-[10px] text-muted">Đang kết nối backend...</span>
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
      className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
      style={{ borderTop: `2px solid ${color}` }}
    >
      <div className="px-4 pt-3.5 pb-0 flex justify-between items-start">
        <div>
          <div className="text-[9px] font-semibold text-muted uppercase tracking-widest mb-1.5">
            {label}
          </div>
          <div className="flex items-baseline gap-1.5">
            <Mono
              className="text-[26px] font-bold leading-none"
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
          className={`text-[8px] font-bold tracking-wide px-2 py-0.5 rounded-full border mt-1 whitespace-nowrap ${statusCl}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Sparkline */}
      <div className="px-1 pt-1" style={{ height: 76 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: -38, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`g${label.replace(/\s/g, "")}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={CHART_STYLE}
              labelStyle={{ color: "#dde6f0", fontSize: 9 }}
              formatter={(v) => [`${v} ${unit}`, ""]}
            />
            {threshold != null && (
              <ReferenceLine
                y={threshold}
                stroke="#f43f5e"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            )}
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.8}
              fill={`url(#g${label.replace(/\s/g, "")})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 border-t border-border mt-auto">
        {stats.map(({ lb, val, cl }, i) => (
          <div
            key={lb}
            className={`px-3 py-2.5 ${i < 2 ? "border-r border-border" : ""}`}
          >
            <div className="text-[8px] text-muted uppercase tracking-wide mb-1">
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
      showToast('✅ Cập nhật thông tin trạm quan trắc thành công!', 'success')
      setEditingModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error')
    }
  }

  const handleConfirmDelete = async () => {
    try {
      await deleteStation(st.id)
      showToast(`✅ Đã xóa trạm quan trắc ${st.name}!`, 'success')
      setDeleteConfirm(false)
      setTimeout(() => {
        router.push(st.damId ? `/dams/${st.damId}` : '/dams')
      }, 1000)
    } catch (err) {
      showToast(`❌ Lỗi khi xóa: ${err.message}`, 'error')
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

  const mainColor = STATUS_HEX[waterSt.level] || "#fb923c";

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
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold border-none cursor-pointer bg-gradient-to-r from-sky-500 to-indigo-500">
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>{t('stationDetail.exportReport')}</span>
          </button>
        </div>
      </div>

      {/* ── GIS MAP BẢN ĐỒ TỌA ĐỘ TRẠM ── */}
      <div className="bg-card border border-border rounded-xl p-3 mb-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-tx">Vị trí địa lý & Tọa độ GIS Trạm quan trắc</span>
          </div>
          <span className="font-mono text-[10px] text-muted">
            📍 Tọa độ: {st.latitude != null && st.longitude != null ? `${st.latitude}°N, ${st.longitude}°E` : (st.location || 'Chưa cập nhật')}
          </span>
        </div>
        <DamMap dams={dams.filter(d => d.id === st.damId)} stations={[st]} height="320px" />
      </div>

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
          color="#fc893cff"
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
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[12px] font-semibold text-tx">
                  Biên độ rung & Lưu lượng
                </div>
                <div className="text-[9px] text-muted mt-0.5">
                  Dữ liệu cảm biến thời gian thực
                </div>
              </div>
              {latest && (
                <span className="font-mono text-[9px] text-safe bg-safe/10 border border-safe/30 px-2 py-0.5 rounded">
                  LIVE
                </span>
              )}
            </div>

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
                <div key={lb} className="bg-card2 rounded-lg px-3 py-2">
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

            {/* Percent fill bar */}
            <div>
              <div className="flex justify-between text-[9px] text-muted mb-1">
                <span>Mức chứa hồ</span>
                <Mono className="text-info">{percent}%</Mono>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(percent, 100)}%`,
                    background:
                      percent > 90
                        ? "#f43f5e"
                        : percent > 75
                          ? "#fb923c"
                          : "#34d399",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Events */}
          <div className="bg-card border border-border rounded-xl p-4 flex-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] font-semibold text-tx">
                Cảnh Báo & Sự Kiện
              </span>
              <Link href="/alerts" className="text-[10px] text-accent cursor-pointer font-semibold hover:underline no-underline">Xem tất cả</Link>
            </div>
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
          </div>
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
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg text-white text-xs font-bold border-none cursor-pointer shadow-lg"
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
    </div>
  );
}
