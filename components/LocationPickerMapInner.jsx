'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, Layers } from 'lucide-react'

// Custom animated pulsing pin icon
function createPickerIcon() {
  return L.divIcon({
    className: 'custom-picker-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 32px; height: 32px; background: rgba(56, 189, 248, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 26px; height: 26px; background: #0284c7; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

// Map Click Handler component
function MapEvents({ onChange }) {
  useMapEvents({
    click(e) {
      if (onChange) {
        onChange({
          latitude: +e.latlng.lat.toFixed(6),
          longitude: +e.latlng.lng.toFixed(6),
        })
      }
    },
  })
  return null
}

// Controller to smoothly pan/recenter map when coordinates change externally
function MapRecenter({ lat, lng }) {
  const map = useMap()
  const prevRef = useRef(null)

  useEffect(() => {
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
      if (prevRef.current !== key) {
        prevRef.current = key
        map.panTo([lat, lng], { animate: true, duration: 0.5 })
      }
    }
  }, [lat, lng, map])

  return null
}

export default function LocationPickerMapInner({
  latitude,
  longitude,
  onChange,
  height = '230px',
  defaultCenter = [21.0381, 105.8492],
  zoom = 13,
}) {
  const [activeLayer, setActiveLayer] = useState('terrain')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState(null)

  const numLat = typeof latitude === 'number' ? latitude : parseFloat(latitude)
  const numLng = typeof longitude === 'number' ? longitude : parseFloat(longitude)

  const isValidPos = !isNaN(numLat) && !isNaN(numLng) && numLat !== 0 && numLng !== 0
  const markerPos = isValidPos ? [numLat, numLng] : defaultCenter

  const customIcon = useMemo(() => createPickerIcon(), [])

  // Draggable marker event handlers
  const eventHandlers = useMemo(
    () => ({
      dragend(e) {
        const marker = e.target
        const position = marker.getLatLng()
        if (onChange) {
          onChange({
            latitude: +position.lat.toFixed(6),
            longitude: +position.lng.toFixed(6),
          })
        }
      },
    }),
    [onChange],
  )

  // Get current device GPS location
  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ GPS')
      return
    }
    setGpsLoading(true)
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false)
        if (onChange) {
          onChange({
            latitude: +pos.coords.latitude.toFixed(6),
            longitude: +pos.coords.longitude.toFixed(6),
          })
        }
      },
      (err) => {
        setGpsLoading(false)
        setGpsError('Không lấy được GPS (' + (err.message || 'Lỗi quyền') + ')')
        setTimeout(() => setGpsError(null), 3000)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/80 shadow-inner group isolate">
      {/* Top Floating Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[400] flex justify-between items-center pointer-events-none">
        {/* Coordinates Badge */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5 text-[10px] font-mono text-slate-200">
          <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
          <span>
            {isValidPos ? `${numLat.toFixed(5)}°N, ${numLng.toFixed(5)}°E` : 'Click bản đồ để chọn tọa độ'}
          </span>
        </div>

        {/* GPS Button & Layer Switcher */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleGetGps}
            disabled={gpsLoading}
            className="flex items-center gap-1 bg-slate-900/90 hover:bg-sky-500 text-sky-300 hover:text-white backdrop-blur-md border border-slate-700/80 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer shadow-lg"
            title="Lấy tọa độ GPS từ thiết bị hiện tại"
          >
            <Navigation className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Đang lấy...' : 'Vị trí của tôi'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLayer(l => (l === 'terrain' ? 'satellite' : 'terrain'))}
            className="p-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 backdrop-blur-md border border-slate-700/80 rounded-lg text-[10px] transition-colors cursor-pointer shadow-lg"
            title={activeLayer === 'terrain' ? 'Chuyển sang Vệ tinh' : 'Chuyển sang Địa hình'}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {gpsError && (
        <div className="absolute bottom-2 left-2.5 z-[400] bg-danger/90 text-white text-[9px] px-2 py-0.5 rounded shadow">
          {gpsError}
        </div>
      )}

      <div className="absolute bottom-1 right-2 z-[400] text-[8px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded pointer-events-none">
        Click hoặc kéo ghim để chọn vị trí
      </div>

      <MapContainer
        center={markerPos}
        zoom={zoom}
        style={{ height, width: '100%' }}
        zoomControl={false}
      >
        {activeLayer === 'terrain' ? (
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        <MapEvents onChange={onChange} />
        {isValidPos && <MapRecenter lat={numLat} lng={numLng} />}

        {isValidPos && (
          <Marker
            position={markerPos}
            icon={customIcon}
            draggable={true}
            eventHandlers={eventHandlers}
          />
        )}
      </MapContainer>
    </div>
  )
}
