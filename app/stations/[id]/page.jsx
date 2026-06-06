"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { STATIONS } from "@/lib/mockData";
import { getStatus, getStatusBySeverity } from "@/lib/statusConfig";
import { Mono, Badge } from "@/components/ui";
import { useSensorData } from "@/hooks/useSensorData";
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
import { useAlarmData } from "@/hooks/useAlarmData";

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
        <span className="text-[10px]">⚠️</span>
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
                className={`text-[10px] font-semibold ${deltaUp === true ? "text-danger" : deltaUp === false ? "text-safe" : "text-muted"}`}
              >
                {deltaUp === true ? "↑" : deltaUp === false ? "↓" : "—"} {delta}
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
  const st = STATIONS.find((s) => s.id === Number(id)) || STATIONS[0];
  const stStatus = getStatus(st.status);

  // ── Real-time data from backend ──
  const { latest, history, connected, error } = useSensorData();
  const { alarms, thresholds } = useAlarmData()

  // Dùng real data nếu có, fallback về mock data
  const waterLevel = latest?.waterLevel ?? st.waterLevel;
  const moisture = latest?.moisture ?? st.humidity;
  const freq = latest?.freq ?? 3.2;
  const amp = latest?.amp ?? 1.8;
  const percent = latest?.percent ?? st.fillPct;

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
  const humThreshold = thresholds?.humidity?.alertHigh ?? 85
  const vibThreshold = thresholds?.vibration?.alertHigh ?? 15

  const mainColor = STATUS_HEX[waterSt.level] || "#fb923c";

  return (
    <div className="p-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-3 text-[11px]">
        <Link href="/" className="text-muted no-underline hover:text-tx">
          Trang chủ
        </Link>
        <span className="text-muted">›</span>
        <Link
          href="/stations"
          className="text-muted no-underline hover:text-tx"
        >
          Danh sách trạm
        </Link>
        <span className="text-muted">›</span>
        <span className="text-tx">Giám sát chi tiết</span>
      </div>

      {/* Connection banner */}
      <ConnectionBanner connected={connected} error={error} />

      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-xl font-bold text-tx tracking-wide m-0">
              {st.river} — {st.km}
            </h1>
            <Badge status={waterSt.level} />
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full animate-pulse-dot ${stStatus.dot}`}
            />
            <span className="text-[10px] text-muted">
              {st.name}
              {latest?.timestamp && (
                <>
                  {" "}
                  • Cập nhật:{" "}
                  {new Date(latest.timestamp).toLocaleTimeString("vi-VN")}
                </>
              )}
            </span>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[11px] font-bold border-none cursor-pointer bg-gradient-to-r from-sky-500 to-indigo-500">
          ⬇ Xuất báo cáo
        </button>
      </div>

      {/* ── 3 Metric Cards ── */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        {/* Mực nước */}
        <MetricCard
          label="Mực nước"
          value={waterLevel.toFixed(2)}
          unit="m"
          delta={waterDelta.delta ? `${waterDelta.delta}m` : null}
          deltaUp={waterDelta.up}
          statusLabel={waterSt.label}
          statusCl={STATUS_CL[waterSt.level]}
          color={mainColor}
          data={waterChartData}
          threshold={st.bd3}
          stats={[
            { lb: "Trung bình", val: `${waterStats.avg}m`, cl: "text-tx" },
            {
              lb: "Đỉnh 24h",
              val: `${waterStats.max}m`,
              cl: `text-${waterSt.level === "danger" ? "danger" : "warning"}`,
            },
            { lb: "BĐ3", val: `${st.bd3}m`, cl: "text-danger" },
          ]}
        />

        {/* Độ ẩm */}
        <MetricCard
          label="Độ ẩm thân đê"
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
            { lb: "Trung bình", val: `${humidStats.avg}%`, cl: "text-tx" },
            { lb: "Cao nhất", val: `${humidStats.max}%`, cl: "text-info" },
            { lb: "Ngưỡng", val: `${humThreshold}%`, cl: "text-warning" },
          ]}
        />

        {/* Độ rung */}
        <MetricCard
          label="Độ rung (Freq)"
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
            { lb: "Trung bình", val: `${vibStats.avg} Hz`, cl: "text-tx" },
            { lb: "Đỉnh 24h", val: `${vibStats.max} Hz`, cl: "text-warning" },
            { lb: "Ngưỡng", val: `${vibThreshold} Hz`, cl: "text-muted" },
          ]}
        />

        <MetricCard
          label="Độ rung (Amplitude)"
          value={amp.toFixed(2)} unit="mm/s"
          delta={ampDelta.delta ? `${ampDelta.delta}mm/s` : null}
          deltaUp={ampDelta.up}
          statusLabel={vibSt.label}
          statusCl={STATUS_CL[vibSt.level]}
          color="#fc893cff"
          data={ampChartData}
          threshold={vibThreshold}
          stats={[
            { lb: 'Trung bình', val: `${ampStats.avg} mm/s`, cl: 'text-tx' },
            { lb: 'Đỉnh 24h', val: `${ampStats.max} mm/s`, cl: 'text-warning' },
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
              <div className="text-center py-4 text-[10px] text-muted">
                ✅ Không có cảnh báo nào — Hệ thống ổn định
              </div>
            )}
            {alarms.slice(0, 5).map((al, i) => {
              const sevInfo = SEVERITY_MAP[al.severity] || SEVERITY_MAP.WARNING
              const typeLb = SENSOR_TYPE_LABELS[al.sensorType] || al.sensorType
              const bgCl = al.severity === 'CRITICAL' ? 'bg-danger/10' : al.severity === 'ALERT' ? 'bg-warning/10' : 'bg-info/10'
              return (
                <div key={al.id || i} className="flex gap-2.5 mb-3 last:mb-0">
                  <div className={`w-7 h-7 rounded-full ${bgCl} flex items-center justify-center shrink-0 mt-0.5 text-sm`}>
                    {sevInfo.icon}
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
    </div>
  );
}
