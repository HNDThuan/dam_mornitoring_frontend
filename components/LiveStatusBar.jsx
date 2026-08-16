'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSensorData } from '@/hooks/useSensorData'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
import { Mono, LiveDot, Divider } from '@/components/ui'
import { 
  Droplet, 
  CloudRain, 
  Activity, 
  TrendingUp, 
  MapPin, 
  ChevronDown, 
  Check, 
  Cpu, 
  ExternalLink,
  Layers,
  AlertCircle
} from 'lucide-react'

function Reading({ icon: Icon, iconClass, label, value, dim = false }) {
  return (
    <div className={`flex items-center gap-1.5 shrink-0 ${dim ? 'text-muted/60' : 'text-muted'}`}>
      <Icon className={`w-3.5 h-3.5 shrink-0 ${dim ? 'opacity-40' : iconClass}`} />
      <span className="text-[11px] font-semibold hidden sm:inline">{label}</span>
      <Mono className={`font-bold text-[12px] ${dim ? 'text-muted/50' : 'text-tx'}`}>{value}</Mono>
    </div>
  )
}

export default function LiveStatusBar() {
  const pathname = usePathname()
  const { t, locale } = useLanguage()
  const { stations, dams, loading: damsLoading } = useDamData()
  
  const [selectedStationId, setSelectedStationId] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // 1. Tự động đồng bộ với URL nếu đang ở trang chi tiết trạm /stations/[id]
  useEffect(() => {
    const match = pathname.match(/^\/stations\/(\d+)$/)
    if (match && match[1]) {
      const routeStationId = Number(match[1])
      setSelectedStationId(routeStationId)
      if (typeof window !== 'undefined') {
        localStorage.setItem('livebar_station_id', String(routeStationId))
      }
    }
  }, [pathname])

  // 2. Khởi tạo trạm được chọn từ localStorage hoặc mặc định trạm đầu tiên khi nạp danh sách
  useEffect(() => {
    if (stations.length > 0 && selectedStationId == null) {
      const match = pathname.match(/^\/stations\/(\d+)$/)
      if (match && match[1]) {
        setSelectedStationId(Number(match[1]))
      } else {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('livebar_station_id') : null
        if (saved && stations.some(s => s.id === Number(saved))) {
          setSelectedStationId(Number(saved))
        } else {
          setSelectedStationId(stations[0].id)
        }
      }
    }
  }, [stations, pathname, selectedStationId])

  // 3. Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  // Trạm hiện tại đang được chọn
  const currentStation = useMemo(() => {
    if (!stations || stations.length === 0) return null
    return stations.find(s => s.id === Number(selectedStationId)) || stations[0]
  }, [stations, selectedStationId])

  // Tính số lượng Node cảm biến gắn vào trạm
  const nodeCount = useMemo(() => {
    if (!currentStation?.gateways) return 0
    return currentStation.gateways.reduce((acc, g) => acc + (g.nodes?.length || 0), 0)
  }, [currentStation])

  const hasNodes = nodeCount > 0

  // 4. Lấy dữ liệu cảm biến thời gian thực đúng cho trạm đã chọn
  const { latest, connected, error } = useSensorData(currentStation?.id)

  const handleSelectStation = (stId) => {
    setSelectedStationId(stId)
    setDropdownOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('livebar_station_id', String(stId))
    }
  }

  // Ẩn LiveStatusBar ở trang Login và Register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  // Phân nhóm trạm theo Đập để hiển thị trong menu chọn
  const stationsByDam = dams.map(dam => ({
    dam,
    stationList: stations.filter(st => st.damId === dam.id)
  })).filter(g => g.stationList.length > 0)

  // Trường hợp có trạm không thuộc đập nào trong dams
  const orphanedStations = stations.filter(st => !dams.some(d => d.id === st.damId))
  if (orphanedStations.length > 0) {
    stationsByDam.push({
      dam: { id: 'other', name: 'Trạm độc lập / Khác' },
      stationList: orphanedStations
    })
  }

  const hasLiveData = connected && latest != null && hasNodes

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border/70 bg-card/60 backdrop-blur-md text-[12px] overflow-x-auto select-none font-sans relative z-40">
      
      {/* ── BỘ CHỌN VỊ TRÍ TRẠM (STATION SELECTOR & LOCATION) ── */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(prev => !prev)}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
            dropdownOpen
              ? 'bg-accent/15 border-accent text-accent shadow-glow-sm'
              : 'bg-card2/80 hover:bg-card2 border-border/80 text-tx hover:border-accent/40'
          }`}
          title={t('liveBar.changeStation')}
        >
          <div className="flex items-center gap-1.5 text-accent font-bold">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-accent animate-pulse" />
            <span className="text-[11px] uppercase tracking-wide hidden md:inline">
              {t('liveBar.station')}:
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 max-w-[200px] sm:max-w-[260px] truncate text-left">
            <span className="font-bold text-[12px] text-tx truncate">
              {currentStation ? currentStation.name : (damsLoading ? 'Đang tải...' : 'Chưa có trạm')}
            </span>
            {currentStation?.location && (
              <span className="text-[10px] text-muted truncate hidden sm:inline">
                ({currentStation.location})
              </span>
            )}
            {!currentStation?.location && currentStation?.river && (
              <span className="text-[10px] text-muted truncate hidden sm:inline">
                ({currentStation.river} {currentStation.km ? `- ${currentStation.km}` : ''})
              </span>
            )}
          </div>

          <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-accent' : ''}`} />
        </button>

        {/* Dropdown Menu chọn trạm */}
        {dropdownOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-80 max-h-96 overflow-y-auto rounded-xl glass-panel shadow-2xl border border-border/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted flex items-center justify-between border-b border-border/50 mb-1">
              <span>{t('liveBar.selectStation')}</span>
              <span className="font-mono text-accent">{stations.length} trạm</span>
            </div>

            {stationsByDam.length === 0 ? (
              <div className="p-3 text-center text-muted text-[11px]">
                Không có dữ liệu trạm quan trắc
              </div>
            ) : (
              stationsByDam.map(({ dam, stationList }) => (
                <div key={dam.id} className="mb-2 last:mb-0">
                  <div className="px-2 py-1 text-[10px] font-bold text-accent2 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    <span className="truncate">{dam.name}</span>
                  </div>

                  <div className="space-y-1 mt-0.5">
                    {stationList.map(st => {
                      const isSelected = currentStation?.id === st.id
                      const stNodeCount = st.gateways?.reduce((acc, g) => acc + (g.nodes?.length || 0), 0) ?? 0
                      const stHasNodes = stNodeCount > 0

                      return (
                        <div
                          key={st.id}
                          onClick={() => handleSelectStation(st.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-accent/15 text-accent font-bold border border-accent/30'
                              : 'text-tx hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{st.name}</span>
                              {isSelected && <Check className="w-3 h-3 text-accent shrink-0" />}
                            </div>
                            <span className="text-[9.5px] text-muted truncate">
                              {st.location || (st.river ? `${st.river} ${st.km ? `- ${st.km}` : ''}` : `Mã: #${st.id}`)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {stHasNodes ? (
                              <span className="px-1.5 py-0.5 text-[8.5px] font-mono font-semibold rounded bg-safe/10 text-safe border border-safe/25 flex items-center gap-1">
                                <Cpu className="w-2.5 h-2.5" />
                                {stNodeCount} Node
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[8.5px] font-mono rounded bg-warning/10 text-warning border border-warning/25">
                                {t('liveBar.noNode')}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Quick link đến trang chi tiết trạm */}
            {currentStation && (
              <div className="pt-2 mt-1 border-t border-border/50">
                <Link
                  href={`/stations/${currentStation.id}`}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg bg-card2/80 hover:bg-card2 text-[11px] font-bold text-accent no-underline transition-colors border border-border/60"
                >
                  <span>Xem chi tiết trạm này</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <Divider vertical className="h-4 shrink-0" />

      {/* ── CONNECTION STATUS BADGE ── */}
      <div className="flex items-center gap-2 shrink-0">
        {!hasNodes ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-warning/10 border border-warning/30 text-warning text-[10.5px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
            <span>{t('liveBar.noNode')}</span>
          </div>
        ) : !connected ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10.5px] font-mono font-bold">
            <LiveDot active={false} />
            <span>OFFLINE</span>
          </div>
        ) : latest == null ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10.5px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
            <span>NO DATA</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-safe/10 border border-safe/30 text-safe text-[10.5px] font-mono font-bold">
            <LiveDot active={true} />
            <span>LIVE</span>
          </div>
        )}
      </div>

      <Divider vertical className="h-4 shrink-0" />

      {/* ── READINGS SECTION ── */}
      {hasLiveData ? (
        <>
          <Reading icon={Droplet} iconClass="text-sky-400" label={t('liveBar.waterLevel')} value={`${(latest.waterLevel ?? 0).toFixed(2)} m`} />
          <Reading icon={CloudRain} iconClass="text-blue-400" label={t('liveBar.moisture')} value={`${(latest.moisture ?? 0).toFixed(1)}%`} />
          <Reading icon={Activity} iconClass="text-indigo-400" label={t('liveBar.freq')} value={`${(latest.freq ?? 0).toFixed(2)} Hz`} />
          <Reading icon={TrendingUp} iconClass="text-orange-400" label={t('liveBar.amp')} value={`${(latest.amp ?? 0).toFixed(2)} mm`} />

          <div className="ml-auto text-faint text-[10px] shrink-0 whitespace-nowrap pl-2">
            {t('liveBar.updated')}:{' '}
            <Mono className="text-muted font-bold">
              {latest.timestamp
                ? new Date(latest.timestamp).toLocaleTimeString(
                    locale === 'vi' ? 'vi-VN' : 'en-US',
                  )
                : '--:--:--'}
            </Mono>
          </div>
        </>
      ) : (
        /* Khi trạm không có Node hoặc chưa có Data: Hiển thị rõ trạng thái không có dữ liệu */
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-3">
            <Reading icon={Droplet} dim label={t('liveBar.waterLevel')} value="-- m" />
            <Reading icon={CloudRain} dim label={t('liveBar.moisture')} value="-- %" />
            <Reading icon={Activity} dim label={t('liveBar.freq')} value="-- Hz" />
            <Reading icon={TrendingUp} dim label={t('liveBar.amp')} value="-- mm" />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted/80 bg-card2/50 px-2.5 py-0.5 rounded border border-border/50 font-medium">
            <AlertCircle className="w-3 h-3 text-warning shrink-0" />
            <span>
              {!hasNodes
                ? t('liveBar.noNodeConnected')
                : (error || t('liveBar.noData'))}
            </span>
          </div>

          <div className="ml-auto text-faint text-[10px] shrink-0 whitespace-nowrap pl-2">
            {t('liveBar.updated')}:{' '}
            <Mono className="text-muted/60 font-bold">--:--:--</Mono>
          </div>
        </div>
      )}
    </div>
  )
}
