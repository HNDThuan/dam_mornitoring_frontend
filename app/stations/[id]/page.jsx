"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Field, TextInput, Modal, FormActions, Button, Toast } from "@/components/form";
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
import LocationPickerMap from "@/components/LocationPickerMap";
import StationDevicesTab from "@/components/StationDevicesTab";
import { useAlarmData } from "@/hooks/useAlarmData";
import { useAuth } from "@/context/AuthContext";
import { exportStationReportToPDF } from "@/lib/exportHelpers";
import { AlertTriangle, ChevronRight, Download, CheckCircle2, ChevronUp, ChevronDown, Minus, Camera, Maximize2, Pencil, Trash2, MapPin, Radio, Sliders, Droplet, Activity, Cpu, Server, Save, Zap } from "lucide-react";
import { updateThresholdConfig } from "@/lib/api";

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
function ConnectionBanner({ connected, error, hasNodes, latest }) {
  if (!hasNodes)
    return (
      <div className="flex items-center gap-2 px-3.5 py-2 bg-warning/10 border border-warning/30 rounded-lg mb-3">
        <span className="w-2 h-2 rounded-full bg-warning" />
        <span className="text-[10px] font-mono font-semibold tracking-wide text-warning">
          TRẠM CHƯA ĐƯỢC KẾT NỐI VỚI SENSOR NODE NÀO — KHÔNG CÓ DỮ LIỆU CẢM BIẾN
        </span>
      </div>
    );
  if (connected && latest)
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
      <div className="px-1 pt-1 flex items-center justify-center" style={{ height: 76 }}>
        {data && data.length > 0 ? (
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
        ) : (
          <div className="text-[10px] text-muted/50 font-mono italic">
            Chưa có chuỗi dữ liệu
          </div>
        )}
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
  // Fallback khi chưa tải xong / không tìm thấy: KHÔNG bịa số đo, để 0 + trạng thái 'unknown'.
  const defaultSt = { stationId: String(id), name: 'Trạm Quan Trắc', location: '', latitude: 21.0381, longitude: 105.8492, river: '', km: '', status: 'unknown', waterLevel: 0, humidity: 0, vibration: 0 };
  const st = stations.find((s) => s.stationId === String(id)) || defaultSt;
  const stStatus = getStatus(st.status);

  // Tab State: 'monitoring' (Giám sát) | 'devices' (Thiết bị phần cứng)
  const [activeTab, setActiveTab] = useState('monitoring');

  // Khi là viewer hoặc chưa đăng nhập, tự động khóa ở tab 'monitoring'
  useEffect(() => {
    if (isViewer && activeTab !== 'monitoring') {
      setActiveTab('monitoring');
    }
  }, [isViewer, activeTab]);

  // Toast State
  const [toast, setToast] = useState(null) // { message, type }
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Threshold Modal State & Form cho Trạm
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false)
  const [savingThresholds, setSavingThresholds] = useState(false)
  const [threshForm, setThreshForm] = useState({
    water_level: { warnHigh: 42.5, alertHigh: 50.0, criticalHigh: 55.0, tankHeight: 50.0 },
    vibration: { warnHigh: 2.5, alertHigh: 15.0, criticalHigh: 25.0, sustainedSeconds: 3 },
    humidity: { warnHigh: 75.0, alertHigh: 85.0, criticalHigh: 95.0 },
  })

  const openThresholdModal = () => {
    if (thresholds) {
      setThreshForm({
        water_level: {
          warnHigh: thresholds.water_level?.warnHigh ?? 42.5,
          alertHigh: thresholds.water_level?.alertHigh ?? 50.0,
          criticalHigh: thresholds.water_level?.criticalHigh ?? 55.0,
          tankHeight: thresholds.water_level?.tankHeight ?? 50.0,
        },
        vibration: {
          warnHigh: thresholds.vibration?.warnHigh ?? 2.5,
          alertHigh: thresholds.vibration?.alertHigh ?? 15.0,
          criticalHigh: thresholds.vibration?.criticalHigh ?? 25.0,
          sustainedSeconds: thresholds.vibration?.sustainedSeconds ?? 3,
        },
        humidity: {
          warnHigh: thresholds.humidity?.warnHigh ?? 75.0,
          alertHigh: thresholds.humidity?.alertHigh ?? 85.0,
          criticalHigh: thresholds.humidity?.criticalHigh ?? 95.0,
        },
      })
    }
    setThresholdModalOpen(true)
  }

  // Edit / Delete Modal State
  const [editingModalOpen, setEditingModalOpen] = useState(false)
  const [savingStation, setSavingStation] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [stationForm, setStationForm] = useState({
    name: '',
    location: '',
    latitude: 21.0381,
    longitude: 105.8492,
    river: '',
    km: '',
    status: 'safe',
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
    })
    setStationErrors({})
    setEditingModalOpen(true)
  }

  const [stationErrors, setStationErrors] = useState({})

  const validateStationForm = () => {
    const errs = {}
    if (!stationForm.name || !stationForm.name.trim()) {
      errs.name = 'Vui lòng nhập tên trạm quan trắc'
    } else if (stationForm.name.trim().length < 3) {
      errs.name = 'Tên trạm phải có ít nhất 3 ký tự'
    }

    const lat = Number(stationForm.latitude)
    if (stationForm.latitude === '' || isNaN(lat)) {
      errs.latitude = 'Vui lòng nhập vĩ độ hợp lệ'
    } else if (lat < -90 || lat > 90) {
      errs.latitude = 'Vĩ độ phải từ -90° đến 90°'
    }

    const lng = Number(stationForm.longitude)
    if (stationForm.longitude === '' || isNaN(lng)) {
      errs.longitude = 'Vui lòng nhập kinh độ hợp lệ'
    } else if (lng < -180 || lng > 180) {
      errs.longitude = 'Kinh độ phải từ -180° đến 180°'
    }

    setStationErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveStation = async () => {
    if (!validateStationForm()) return

    try {
      setSavingStation(true)
      await updateStation(st.stationId, {
        name: stationForm.name.trim(),
        location: stationForm.location.trim(),
        latitude: Number(stationForm.latitude),
        longitude: Number(stationForm.longitude),
        river: stationForm.river.trim(),
        km: stationForm.km.trim(),
        status: stationForm.status,
      })
      showToast('Cập nhật thông tin trạm quan trắc thành công!', 'success')
      setEditingModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingStation(false)
    }
  }

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true)
      await deleteStation(st.stationId)
      showToast(`Đã xóa trạm quan trắc ${st.name}!`, 'success')
      setDeleteConfirm(false)
      setTimeout(() => {
        router.push(st.damId ? `/dams/${st.damId}` : '/dams')
      }, 1000)
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error')
    } finally {
      setDeleting(false)
    }
  }

  // ── Real-time data từ backend (chỉ nhận dữ liệu đúng của Trạm này) ──
  const { latest, history, connected, error } = useSensorData(String(id));
  const { alarms, thresholds, refetch: refetchAlarmData } = useAlarmData(st.damId, String(id))

  const handleSaveThresholds = async () => {
    try {
      setSavingThresholds(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

      if (thresholds?.water_level?.id) {
        await updateThresholdConfig(thresholds.water_level.id, {
          warnHigh: Number(threshForm.water_level.warnHigh),
          alertHigh: Number(threshForm.water_level.alertHigh),
          criticalHigh: Number(threshForm.water_level.criticalHigh),
          tankHeight: Number(threshForm.water_level.tankHeight),
        }, token)
      }

      if (thresholds?.vibration?.id) {
        await updateThresholdConfig(thresholds.vibration.id, {
          warnHigh: Number(threshForm.vibration.warnHigh),
          alertHigh: Number(threshForm.vibration.alertHigh),
          criticalHigh: Number(threshForm.vibration.criticalHigh),
          sustainedSeconds: Number(threshForm.vibration.sustainedSeconds),
        }, token)
      }

      if (thresholds?.humidity?.id) {
        await updateThresholdConfig(thresholds.humidity.id, {
          warnHigh: Number(threshForm.humidity.warnHigh),
          alertHigh: Number(threshForm.humidity.alertHigh),
          criticalHigh: Number(threshForm.humidity.criticalHigh),
        }, token)
      }

      showToast(`Đã lưu cấu hình ngưỡng riêng của Trạm ${st.name} & tự động đồng bộ xuống tất cả Gateway/Node!`, 'success')
      setThresholdModalOpen(false)
      refetchAlarmData?.()
      refetch?.(true)
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu cấu hình ngưỡng', 'error')
    } finally {
      setSavingThresholds(false)
    }
  }

  // Ưu tiên số đo sống từ WebSocket, fallback về giá trị mới nhất backend đã ghi vào Station.
  // Không bịa số mặc định khi chưa có dữ liệu — để 0 và UI hiển thị theo trạng thái 'unknown'.
  const waterLevel = latest?.waterLevel ?? st.waterLevel ?? 0;
  const moisture = latest?.moisture ?? st.humidity ?? 0;
  const freq = latest?.freq ?? 0;
  const amp = latest?.amp ?? st.vibration ?? 0;
  const percent = latest?.percent ?? 0;

  const hasConnectedNodes = useMemo(() => {
    if (!st?.gateways) return false;
    return st.gateways.some(g => g.nodes && g.nodes.length > 0);
  }, [st]);

  // Build chart data từ history backend (chỉ dùng dữ liệu thật, không tạo fake mock lines)
  const waterChartData = useMemo(() => {
    if (history?.waterLevel?.length)
      return historyToChartData(history, "waterLevel");
    return [];
  }, [history]);

  const humidChartData = useMemo(() => {
    if (history?.moisture?.length)
      return historyToChartData(history, "moisture");
    return [];
  }, [history]);

  const vibChartData = useMemo(() => {
    if (history?.freq?.length) return historyToChartData(history, "freq");
    return [];
  }, [history]);

  const ampChartData = useMemo(() => {
    if (history?.amp?.length) return historyToChartData(history, "amp");
    return [];
  }, [history]);

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


  // Status — ngưỡng lấy từ ThresholdConfig của Đập (nguồn duy nhất, xem modal Ngưỡng Cảnh Báo).
  const waterSt = getWaterStatus(waterLevel, undefined, undefined, undefined, thresholds?.water_level)
  const humidSt = getMoistureStatus(moisture, thresholds?.humidity)
  const vibSt = getVibrationStatus(amp, thresholds?.vibration)
  // Threshold values từ backend cho MetricCard
  const waterThreshold = thresholds?.water_level?.alertHigh ?? null
  const humThreshold = thresholds?.humidity?.alertHigh ?? null
  const vibThreshold = thresholds?.vibration?.alertHigh ?? null
  // Hiển thị '—' khi đập chưa có cấu hình ngưỡng, thay vì nội suy chuỗi ra "nullm".
  const fmtThreshold = (v, unit) => (v == null ? '—' : `${v}${unit}`)

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
      <ConnectionBanner connected={connected} error={error} hasNodes={hasConnectedNodes} latest={latest} />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-xl font-bold text-tx tracking-wide m-0">
              {st.name} ({st.river} — {st.km})
            </h1>
            <Badge status={st.status} title={st.statusReason} />
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full animate-pulse-dot ${stStatus.dot}`}
            />
            <span className="text-[10px] text-muted">
              {st.stationId}
              {latest?.timestamp && (
                <>
                  {" "}
                  • {t('liveBar.updated')}:{" "}
                  {new Date(latest.timestamp).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                </>
              )}
            </span>
          </div>
          {st.statusReason && (
            <div className={`mt-2 text-[10px] flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
              st.status === 'safe'
                ? 'bg-safe/5 text-safe/90 border-safe/20'
                : st.status === 'unknown'
                  ? 'bg-card2 text-muted border-border/50'
                  : 'bg-danger/10 text-danger border-danger/30 font-semibold'
            }`}>
              <span className="shrink-0">ⓘ</span>
              <span><strong>Lý do an toàn:</strong> {st.statusReason}</span>
            </div>
          )}
        </div>

        {/* Action Buttons: Sửa, Xóa, Xuất báo cáo */}
        <div className="flex items-center gap-2">
          {!isViewer && (
            <>
              <button
                onClick={openThresholdModal}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-warning/40 rounded-lg text-warning text-[11px] font-bold bg-warning/10 hover:bg-warning/20 transition-colors cursor-pointer"
                title="Cấu hình Ngưỡng Cảnh Báo riêng cho Trạm này"
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span>Cấu hình Ngưỡng Trạm</span>
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
          <button
            onClick={() => exportStationReportToPDF(st, dam, latest, stationAlarms, user)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold border-none cursor-pointer bg-gradient-to-r from-info to-accent shadow-glow hover:brightness-110 transition-all"
            title="Xuất phiếu báo cáo hiện trạng an toàn trạm quan trắc ra file PDF"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>{t('stationDetail.exportReport')}</span>
          </button>
        </div>
      </div>

      {/* ── TAB SWITCHER: GIÁM SÁT VS THIẾT BỊ PHẦN CỨNG (Chỉ hiển thị cho Cán bộ / Quản trị viên) ── */}
      {!isViewer && (
        <div className="flex items-center gap-2 mb-4 border-b border-border/70 pb-3">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'monitoring'
                ? 'bg-accent text-white border-accent shadow-glow'
                : 'bg-card text-muted border-border hover:text-tx hover:bg-card2'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Giám Sát & Trực Quan Hóa (Live Telemetry & GIS)</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'devices'
                ? 'bg-accent text-white border-accent shadow-glow'
                : 'bg-card text-muted border-border hover:text-tx hover:bg-card2'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Thiết Bị & Cấu Hình Phần Cứng (Gateways, Nodes, Sensors)</span>
          </button>
        </div>
      )}

      {/* ── TAB 1: GIÁM SÁT & TRỰC QUAN HÓA (Hiển thị cho viewer/khách và khi activeTab === 'monitoring') ── */}
      {(isViewer || activeTab === 'monitoring') && (
        <>
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
            <DamMap dams={dams.filter(d => d.damId === st.damId)} stations={[st]} height="320px" />
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
                { lb: "BĐ3", val: fmtThreshold(waterThreshold, 'm'), cl: "text-danger" },
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
                { lb: t('stationDetail.threshold'), val: fmtThreshold(humThreshold, '%'), cl: "text-warning" },
              ]}
            />

            {/* Tần số rung (Hz) — ThresholdConfig chỉ có ngưỡng cho BIÊN ĐỘ (mm/s), không có ngưỡng
                cho tần số, nên card này không gắn ngưỡng thay vì mượn nhầm ngưỡng khác đơn vị. */}
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
              stats={[
                { lb: t('stationDetail.average'), val: `${vibStats.avg} Hz`, cl: "text-tx" },
                { lb: t('stationDetail.peak24h'), val: `${vibStats.max} Hz`, cl: "text-warning" },
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
                { lb: 'BĐ', val: fmtThreshold(vibThreshold, ' mm/s'), cl: 'text-danger' },
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
                      Biên độ rung & Mức chứa
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
        </>
      )}

      {/* ── TAB 2: THIẾT BỊ & CẤU HÌNH PHẦN CỨNG (Chỉ hiển thị cho ADMIN & OPERATOR) ── */}
      {!isViewer && activeTab === 'devices' && (
        <StationDevicesTab
          stationId={st.stationId}
          damId={st.damId}
          stationName={st.name}
          onDataChange={() => refetch(true)}
        />
      )}

      {/* ── MODAL: EDIT STATION (SPLIT-VIEW) ── */}
      <Modal
        open={editingModalOpen}
        onClose={() => setEditingModalOpen(false)}
        title={`Chỉnh sửa thông tin Trạm ${st.stationId}`}
        icon={Radio}
        maxWidth="max-w-4xl"
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setEditingModalOpen(false)}>Hủy</Button>
            <Button variant="primary" loading={savingStation} onClick={handleSaveStation}>Lưu thay đổi</Button>
          </FormActions>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* CỘT TRÁI: Form nhập liệu */}
          <div className="md:col-span-6 space-y-2.5">
            <Field label="Tên Trạm quan trắc" required error={stationErrors.name} htmlFor="station-name">
              <TextInput
                id="station-name"
                required
                autoFocus
                error={stationErrors.name}
                value={stationForm.name}
                onChange={e => {
                  setStationForm(p => ({ ...p, name: e.target.value }))
                  if (stationErrors.name) setStationErrors(p => ({ ...p, name: null }))
                }}
                placeholder="vd: Trạm Tân Ấp 1"
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Tên Sông" htmlFor="station-river">
                <TextInput
                  id="station-river"
                  value={stationForm.river}
                  onChange={e => setStationForm(p => ({ ...p, river: e.target.value }))}
                  placeholder="vd: Sông Hồng"
                />
              </Field>
              <Field label="Vị trí Km / Lý trình" htmlFor="station-km">
                <TextInput
                  id="station-km"
                  value={stationForm.km}
                  onChange={e => setStationForm(p => ({ ...p, km: e.target.value }))}
                  placeholder="vd: K25+500"
                  className="font-mono"
                />
              </Field>
            </div>

            <Field label="Địa danh / Vị trí trạm" htmlFor="station-location">
              <TextInput
                id="station-location"
                value={stationForm.location}
                onChange={e => setStationForm(p => ({ ...p, location: e.target.value }))}
                placeholder="vd: Hoàn Kiếm, Hà Nội"
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Vĩ độ (Latitude °N)" required error={stationErrors.latitude} htmlFor="station-lat">
                <TextInput
                  id="station-lat"
                  type="number"
                  step="0.0001"
                  required
                  error={stationErrors.latitude}
                  value={stationForm.latitude}
                  onChange={e => {
                    setStationForm(p => ({ ...p, latitude: e.target.value }))
                    if (stationErrors.latitude) setStationErrors(p => ({ ...p, latitude: null }))
                  }}
                  placeholder="vd: 21.0381"
                  className="font-mono"
                />
              </Field>
              <Field label="Kinh độ (Longitude °E)" required error={stationErrors.longitude} htmlFor="station-lng">
                <TextInput
                  id="station-lng"
                  type="number"
                  step="0.0001"
                  required
                  error={stationErrors.longitude}
                  value={stationForm.longitude}
                  onChange={e => {
                    setStationForm(p => ({ ...p, longitude: e.target.value }))
                    if (stationErrors.longitude) setStationErrors(p => ({ ...p, longitude: null }))
                  }}
                  placeholder="vd: 105.8492"
                  className="font-mono"
                />
              </Field>
            </div>
          </div>

          {/* CỘT PHẢI: Bản đồ chọn tọa độ + Live Preview */}
          <div className="md:col-span-6 space-y-3 flex flex-col justify-between">
            <div>
              <label className="text-[11px] font-bold text-tx mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Bản đồ chọn tọa độ GIS (Click hoặc kéo ghim)</span>
              </label>
              <LocationPickerMap
                latitude={stationForm.latitude}
                longitude={stationForm.longitude}
                onChange={({ latitude, longitude }) => setStationForm(p => ({ ...p, latitude, longitude }))}
                defaultCenter={[st.latitude ?? 21.0381, st.longitude ?? 105.8492]}
                height="190px"
              />
            </div>

            {/* Live Preview Card */}
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Xem trước thẻ trạm (Live Preview):</span>
                <span className="text-accent text-[9px] font-mono">Tự động cập nhật</span>
              </div>
              <div className="bg-card2 border border-border border-t-2 border-t-sky-500 rounded-xl p-3 shadow-panel">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-sm font-bold text-tx truncate m-0">
                      {stationForm.name || st.name}
                    </h4>
                    <div className="text-[9px] text-muted flex items-center gap-1 mt-0.5 font-mono">
                      <MapPin className="w-3 h-3 text-muted shrink-0" />
                      <span className="truncate">
                        {stationForm.latitude && stationForm.longitude
                          ? `${Number(stationForm.latitude).toFixed(4)}°N, ${Number(stationForm.longitude).toFixed(4)}°E`
                          : (stationForm.location || 'Chưa có tọa độ')}
                      </span>
                    </div>
                  </div>
                  <Badge status={st.status} sm title={st.statusReason} />
                </div>
                <div className="text-[10px] text-muted mb-1.5 flex items-center justify-between">
                  <div><span>{stationForm.river || st.river || 'Tuyến sông'}</span> • <Mono className="text-tx">{stationForm.km || st.km || 'K0+000'}</Mono></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: DELETE CONFIRMATION ── */}
      <Modal
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        maxWidth="max-w-sm"
        footer={
          <FormActions className="justify-center">
            <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>Hủy</Button>
            <Button variant="danger" loading={deleting} onClick={handleConfirmDelete}>Xóa vĩnh viễn</Button>
          </FormActions>
        }
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 shrink-0" />
          </div>
          <h3 className="text-base font-bold text-tx mb-2">Xác nhận xóa Trạm?</h3>
          <p className="text-xs text-muted leading-relaxed">
            Bạn có chắc chắn muốn xóa <strong className="text-tx">{st.name}</strong>? Thao tác này không thể hoàn tác.
          </p>
        </div>
      </Modal>
      {/* ── MODAL: THRESHOLD CONFIG (RIÊNG CHO TỪNG TRẠM & ĐỒNG BỘ PHẦN CỨNG) ── */}
      <Modal
        open={thresholdModalOpen}
        onClose={() => setThresholdModalOpen(false)}
        title={`Cấu Hình Ngưỡng Cảnh Báo Riêng — ${st.name} (${st.stationId})`}
        icon={Sliders}
        maxWidth="max-w-2xl"
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setThresholdModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              loading={savingThresholds}
              onClick={handleSaveThresholds}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Lưu & Đồng Bộ Thiết Bị</span>
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-4">
          {/* Banner giải thích: ngưỡng riêng cho trạm & đồng bộ phần cứng */}
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 text-xs text-accent flex items-start gap-2.5">
            <Zap className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-tx mb-0.5">Cấu hình ngưỡng độc lập theo Trạm</div>
              <div className="text-[11px] text-muted leading-relaxed">
                Ngưỡng cài đặt tại đây áp dụng riêng cho <strong>{st.name}</strong>. Khi lưu, hệ thống sẽ tự động cập nhật cấu hình tới toàn bộ <strong>Sensor Node (ESP32)</strong> và phát bản tin MQTT đồng bộ xuống <strong>Gateway Jetson TX2</strong> trong trạm này.
              </div>
            </div>
          </div>

          {/* 1. Mực Nước Hồ (m) */}
          <div className="bg-card2/80 border border-info/30 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2 text-info font-bold text-xs">
                <Droplet className="w-4 h-4" />
                <span>1. Ngưỡng Mực Nước Hồ (Mét)</span>
              </div>
              <span className="text-[10px] font-mono text-muted">Báo động BĐ1 / BĐ2 / BĐ3</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Field label="Chú Ý (BĐ1)" required htmlFor="th-w-warn">
                <TextInput
                  id="th-w-warn"
                  type="number"
                  step="0.1"
                  value={threshForm.water_level.warnHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      water_level: { ...p.water_level, warnHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-yellow-400"
                />
              </Field>

              <Field label="Cảnh Báo (BĐ2)" required htmlFor="th-w-alert">
                <TextInput
                  id="th-w-alert"
                  type="number"
                  step="0.1"
                  value={threshForm.water_level.alertHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      water_level: { ...p.water_level, alertHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-orange-400"
                />
              </Field>

              <Field label="Nguy Cấp (BĐ3)" required htmlFor="th-w-crit">
                <TextInput
                  id="th-w-crit"
                  type="number"
                  step="0.1"
                  value={threshForm.water_level.criticalHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      water_level: { ...p.water_level, criticalHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-danger"
                />
              </Field>

              <Field label="Cao Trình Hồ (m)" hint="Tính % chứa" htmlFor="th-w-tank">
                <TextInput
                  id="th-w-tank"
                  type="number"
                  step="0.5"
                  value={threshForm.water_level.tankHeight}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      water_level: { ...p.water_level, tankHeight: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-tx"
                />
              </Field>
            </div>
          </div>

          {/* 2. Độ Rung Thân Đập (Vibration mm/s) */}
          <div className="bg-card2/80 border border-orange-500/30 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
                <Activity className="w-4 h-4" />
                <span>2. Ngưỡng Rung Thân Đập & Kích Hoạt AI Camera (mm/s)</span>
              </div>
              <span className="text-[10px] font-mono text-orange-400/80 bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/20">
                Đồng bộ ESP32 & Jetson TX2
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Field label="Mức Chú Ý" required htmlFor="th-v-warn">
                <TextInput
                  id="th-v-warn"
                  type="number"
                  step="0.1"
                  value={threshForm.vibration.warnHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      vibration: { ...p.vibration, warnHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-yellow-400"
                />
              </Field>

              <Field label="Mức Cảnh Báo" required htmlFor="th-v-alert">
                <TextInput
                  id="th-v-alert"
                  type="number"
                  step="0.5"
                  value={threshForm.vibration.alertHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      vibration: { ...p.vibration, alertHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-orange-400"
                />
              </Field>

              <Field label="Mức Nguy Cấp" required htmlFor="th-v-crit">
                <TextInput
                  id="th-v-crit"
                  type="number"
                  step="0.5"
                  value={threshForm.vibration.criticalHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      vibration: { ...p.vibration, criticalHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-danger"
                />
              </Field>

              <Field label="Duy Trì (Giây)" hint="Tránh nhiễu" htmlFor="th-v-sec">
                <TextInput
                  id="th-v-sec"
                  type="number"
                  step="1"
                  value={threshForm.vibration.sustainedSeconds}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      vibration: { ...p.vibration, sustainedSeconds: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-tx"
                />
              </Field>
            </div>
          </div>

          {/* 3. Độ Ẩm Rò Rỉ Móng (%) */}
          <div className="bg-card2/80 border border-emerald-500/30 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Droplet className="w-4 h-4" />
                <span>3. Ngưỡng Độ Ẩm Rò Rỉ Thấm Móng Đập (%)</span>
              </div>
              <span className="text-[10px] font-mono text-muted">Phát hiện thấm rỉ sớm</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Mức Chú Ý (%)" required htmlFor="th-h-warn">
                <TextInput
                  id="th-h-warn"
                  type="number"
                  step="1"
                  value={threshForm.humidity.warnHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      humidity: { ...p.humidity, warnHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-yellow-400"
                />
              </Field>

              <Field label="Mức Cảnh Báo (%)" required htmlFor="th-h-alert">
                <TextInput
                  id="th-h-alert"
                  type="number"
                  step="1"
                  value={threshForm.humidity.alertHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      humidity: { ...p.humidity, alertHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-orange-400"
                />
              </Field>

              <Field label="Mức Nguy Cấp (%)" required htmlFor="th-h-crit">
                <TextInput
                  id="th-h-crit"
                  type="number"
                  step="1"
                  value={threshForm.humidity.criticalHigh}
                  onChange={(e) =>
                    setThreshForm((p) => ({
                      ...p,
                      humidity: { ...p.humidity, criticalHigh: e.target.value },
                    }))
                  }
                  className="font-mono text-center font-bold text-danger"
                />
              </Field>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
