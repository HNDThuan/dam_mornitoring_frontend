'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Fix default Leaflet icon paths in Next.js
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Create custom HTML markers for Dam and Station
const createDamIcon = (status) => {
  const colorMap = {
    safe: '#10b981',    // Emerald green
    warning: '#f59e0b', // Amber/orange
    danger: '#ef4444',  // Red
  }
  const color = colorMap[status] || '#10b981'

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
      <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: pulse 2s infinite ease-in-out;"></div>
      <div style="width: 26px; height: 26px; border-radius: 50%; background: #0f172a; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; shadow: 0 4px 12px rgba(0,0,0,0.5);">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
    </div>
  `

  return L.divIcon({
    html,
    className: 'custom-dam-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })
}

const createStationIcon = (status) => {
  const colorMap = {
    safe: '#3b82f6',    // Blue
    warning: '#f59e0b', // Amber
    danger: '#ef4444',  // Red
  }
  const color = colorMap[status] || '#3b82f6'

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px;">
      <div style="width: 20px; height: 20px; border-radius: 50%; background: #0f172a; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; shadow: 0 2px 8px rgba(0,0,0,0.4);">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="2"/>
          <path d="M16.2 7.8a6 6 0 0 1 0 8.4"/>
          <path d="M7.8 16.2a6 6 0 0 1 0-8.4"/>
        </svg>
      </div>
    </div>
  `

  return L.divIcon({
    html,
    className: 'custom-station-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  })
}

// Auto Recenter component — only repositions when exact lat/lng values change
function MapController({ center, zoom }) {
  const map = useMap()
  const prevKeyRef = useRef('')

  useEffect(() => {
    if (!center || !center[0] || !center[1]) return
    const key = `${center[0]}_${center[1]}_${zoom}`
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key
      map.setView(center, zoom || map.getZoom())
    }
  }, [center, zoom, map])

  return null
}

function damMapPropsAreEqual(prevProps, nextProps) {
  if (prevProps.selectedDamId !== nextProps.selectedDamId) return false
  if (prevProps.height !== nextProps.height) return false

  // Compare dams array
  const pDams = prevProps.dams || []
  const nDams = nextProps.dams || []
  if (pDams.length !== nDams.length) return false
  for (let i = 0; i < pDams.length; i++) {
    if (
      pDams[i].id !== nDams[i].id ||
      pDams[i].name !== nDams[i].name ||
      pDams[i].latitude !== nDams[i].latitude ||
      pDams[i].longitude !== nDams[i].longitude ||
      pDams[i].status !== nDams[i].status ||
      pDams[i].waterLevel !== nDams[i].waterLevel ||
      pDams[i].flow !== nDams[i].flow ||
      pDams[i].fillPct !== nDams[i].fillPct
    ) {
      return false
    }
  }

  // Compare stations array
  const pStations = prevProps.stations || []
  const nStations = nextProps.stations || []
  if (pStations.length !== nStations.length) return false
  for (let i = 0; i < pStations.length; i++) {
    if (
      pStations[i].id !== nStations[i].id ||
      pStations[i].name !== nStations[i].name ||
      pStations[i].latitude !== nStations[i].latitude ||
      pStations[i].longitude !== nStations[i].longitude ||
      pStations[i].status !== nStations[i].status ||
      pStations[i].damId !== nStations[i].damId ||
      pStations[i].waterLevel !== nStations[i].waterLevel ||
      pStations[i].humidity !== nStations[i].humidity
    ) {
      return false
    }
  }

  return true
}

const DamMapInner = memo(function DamMapInner({ dams = [], stations = [], selectedDamId = null, height = '450px' }) {
  const router = useRouter()
  const [activeLayer, setActiveLayer] = useState('terrain') // 'terrain' | 'satellite'

  // Filter dams & stations based on selectedDamId
  const displayDams = selectedDamId
    ? dams.filter(d => d.id === selectedDamId)
    : dams

  const displayStations = selectedDamId
    ? stations.filter(st => st.damId === selectedDamId)
    : stations

  // Calculate focused map center & zoom level
  const targetDam = displayDams.length === 1
    ? displayDams[0]
    : (selectedDamId ? dams.find(d => d.id === selectedDamId) : null)

  let mapCenter = [21.0381, 105.3265]
  let mapZoom = (selectedDamId || displayDams.length === 1) ? 12 : 8

  if (targetDam && targetDam.latitude != null && targetDam.longitude != null) {
    mapCenter = [targetDam.latitude, targetDam.longitude]
  } else if (displayStations.length === 1 && displayStations[0].latitude != null && displayStations[0].longitude != null) {
    mapCenter = [displayStations[0].latitude, displayStations[0].longitude]
    mapZoom = 13
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-2xl bg-card" style={{ height }}>
      {/* ── MAP LAYER SWITCHER TOGGLE ── */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg p-1 flex items-center gap-1 shadow-xl text-[11px] font-semibold">
        <button
          onClick={() => setActiveLayer('terrain')}
          className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer border-none ${activeLayer === 'terrain'
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
            : 'text-slate-400 hover:text-white bg-transparent'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <span>Địa hình</span>
        </button>
        <button
          onClick={() => setActiveLayer('satellite')}
          className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer border-none ${activeLayer === 'satellite'
            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
            : 'text-slate-400 hover:text-white bg-transparent'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
          <span>Vệ tinh</span>
        </button>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        {/* ── MAP TILES ── */}
        {activeLayer === 'terrain' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {/* ── DAM MARKERS ── */}
        {displayDams.map(dam => {
          const lat = dam.latitude ?? 20.8167
          const lng = dam.longitude ?? 105.3265
          const damStations = stations.filter(st => st.damId === dam.id)

          return (
            <Marker
              key={`dam-${dam.id}`}
              position={[lat, lng]}
              icon={createDamIcon(dam.status)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 min-w-[240px] max-w-[290px]">
                  {/* Header Badges */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2">
                    <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                      {dam.id}
                    </span>
                    <span className={`text-[10px] font- px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${dam.status === 'safe'
                        ? 'bg-emerald-500 text-white'
                        : dam.status === 'warning'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-rose-500 text-white'
                      }`}>
                      {dam.status === 'safe' ? 'An toàn' : dam.status === 'warning' ? 'Cảnh báo' : 'Nguy hiểm'}
                    </span>
                  </div>

                  {/* Dam Name & Coordinates */}
                  <h4 className="font-extrabold text-white text-base mb-1 tracking-tight">{dam.name}</h4>
                  <div className="text-[11px] text-slate-300 mb-2.5 font-medium flex items-center gap-1">
                    <span className="text-emerald-400">📍</span>
                    <span>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E ({dam.location || 'N/A'})</span>
                  </div>

                  {/* Dam Metrics Box */}
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-700/80 text-center mb-3 shadow-inner">
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Mực nước</div>
                      <div className="font-extrabold text-emerald-400 font-mono text-xs">{dam.waterLevel}m</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Lưu lượng</div>
                      <div className="font-extrabold text-sky-400 font-mono text-xs">{dam.flow ? dam.flow.toLocaleString() : 0}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Dung tích</div>
                      <div className="font-extrabold text-amber-400 font-mono text-xs">{dam.fillPct}%</div>
                    </div>
                  </div>

                  {/* List of Stations under this Dam */}
                  {damStations.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Trạm trực thuộc:</span>
                        <span className="text-emerald-400 font-mono">({damStations.length})</span>
                      </div>
                      <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1">
                        {damStations.map(st => (
                          <div
                            key={st.id}
                            onClick={() => router.push(`/stations/${st.id}`)}
                            className="flex items-center justify-between p-2 bg-slate-800/90 hover:bg-slate-700 rounded-lg border border-slate-700/70 cursor-pointer transition-all group"
                          >
                            <span className="text-[11px] text-slate-100 font-bold truncate max-w-[150px] group-hover:text-sky-300">
                              {st.name}
                            </span>
                            <span className="text-[10px] text-sky-400 font-extrabold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              <span>Xem</span> &rarr;
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dam Action Button */}
                  <button
                    onClick={() => router.push(`/dams/${dam.id}`)}
                    className="w-full py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[12px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-lg active:scale-[0.98]"
                  >
                    <span>Xem chi tiết Đập</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* ── STATION MARKERS ── */}
        {displayStations.map(st => {
          const lat = st.latitude ?? 21.0381
          const lng = st.longitude ?? 105.8492

          return (
            <Marker
              key={`station-${st.id}`}
              position={[lat, lng]}
              icon={createStationIcon(st.status)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 min-w-[220px] max-w-[260px]">
                  {/* Header Badges */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2">
                    <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded border border-sky-500/30">
                      Trạm #{st.id}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${st.status === 'safe'
                        ? 'bg-emerald-500 text-slate-950'
                        : st.status === 'warning'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-rose-500 text-white'
                      }`}>
                      {st.status === 'safe' ? 'An toàn' : st.status === 'warning' ? 'Cảnh báo' : 'Nguy hiểm'}
                    </span>
                  </div>

                  {/* Station Name & Coordinates */}
                  <h4 className="font-extrabold text-white text-base mb-1 tracking-tight">{st.name}</h4>
                  <div className="text-[11px] text-slate-300 mb-2.5 font-medium flex items-center gap-1">
                    <span className="text-sky-400">📍</span>
                    <span>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E ({st.river || 'Sông Hồng'})</span>
                  </div>

                  {/* Station Metrics Box */}
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-700/80 text-center mb-3 shadow-inner">
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Mực nước</div>
                      <div className="font-extrabold text-sky-400 font-mono text-xs">{st.waterLevel} m</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Độ ẩm đất</div>
                      <div className="font-extrabold text-emerald-400 font-mono text-xs">{st.humidity}%</div>
                    </div>
                  </div>

                  {/* Station Action Button */}
                  <button
                    onClick={() => router.push(`/stations/${st.id}`)}
                    className="w-full py-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-[12px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-lg active:scale-[0.98]"
                  >
                    <span>Xem chi tiết Trạm</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Global Style Inject for High-Contrast Leaflet Popups */}
      <style jsx global>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: #0f172a !important;
          color: #f8fafc !important;
          border: 1px solid #334155 !important;
          border-radius: 14px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75) !important;
          padding: 0 !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: #0f172a !important;
          border: 1px solid #334155 !important;
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 12px 14px !important;
          line-height: 1.4 !important;
        }
        .custom-leaflet-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
          padding: 6px !important;
          font-size: 16px !important;
        }
        .custom-leaflet-popup .leaflet-popup-close-button:hover {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  )
}, damMapPropsAreEqual)

export default DamMapInner
