'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchDams,
  fetchStations,
  createDam as apiCreateDam,
  updateDam as apiUpdateDam,
  deleteDam as apiDeleteDam,
  createStation as apiCreateStation,
  updateStation as apiUpdateStation,
  deleteStation as apiDeleteStation,
} from '@/lib/api'
import { getSocket } from '@/lib/socket'

// Hạ nhịp cập nhật số đo sống của mỗi Trạm xuống tối đa 1 lần/giây (nguồn phát ~20 lần/giây).
const STATION_PATCH_THROTTLE_MS = 1000

export function useDamData() {
  const [dams, setDams] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)
  const lastStationPatchRef = useRef(new Map())

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const [damsRes, stationsRes] = await Promise.all([fetchDams(), fetchStations()])
      if (!mountedRef.current) return
      setDams(damsRes.dams || [])
      setStations(stationsRes.stations || [])
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      setError('Không thể tải dữ liệu đập và trạm từ backend.')
      console.error('[useDamData]', err)
    } finally {
      if (!silent && mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadData(false)
    return () => {
      mountedRef.current = false
    }
  }, [loadData])

  // Trạng thái an toàn Station/Dam do backend tự tính (worst-case từ cảm biến + cảnh báo)
  // được đẩy real-time qua WebSocket — cập nhật ngay state local, không cần chờ refetch.
  useEffect(() => {
    const socket = getSocket()
    const onStatusChanged = (evt) => {
      if (!mountedRef.current || !evt) return
      if (evt.level === 'station' && evt.stationId != null) {
        setStations(prev => prev.map(s => s.id === evt.stationId ? { ...s, status: evt.status, statusReason: evt.statusReason ?? s.statusReason } : s))
      } else if (evt.level === 'dam' && evt.damId) {
        setDams(prev => prev.map(d => d.id === evt.damId ? { ...d, status: evt.status, statusReason: evt.statusReason ?? d.statusReason } : d))
      }
    }
    // Dam.waterLevel = MAX(waterLevel) trong các Station thuộc Dam, fillPct suy ra từ đó
    // — backend tự tính, đẩy real-time.
    const onDamMetricsChanged = (evt) => {
      if (!mountedRef.current || !evt?.damId) return
      setDams(prev => prev.map(d =>
        d.id === evt.damId ? { ...d, waterLevel: evt.waterLevel, fillPct: evt.fillPct ?? d.fillPct } : d
      ))
    }
    // Số đo sống của từng Trạm (mực nước / độ ẩm / biên độ rung) để thẻ trạm ở mọi trang
    // tự cập nhật mà không cần tải lại. Sự kiện `update` phát tới ~20 lần/giây nên phải
    // hạ nhịp, nếu không cả danh sách trạm sẽ re-render liên tục.
    const onSensorUpdate = (snapshot) => {
      if (!mountedRef.current || !snapshot?.stationId) return
      const stId = snapshot.stationId
      const now = Date.now()
      if (now - (lastStationPatchRef.current.get(stId) || 0) < STATION_PATCH_THROTTLE_MS) return
      lastStationPatchRef.current.set(stId, now)

      setStations(prev => prev.map(s => {
        if (s.id !== stId) return s
        const next = {
          waterLevel: snapshot.waterLevel,
          humidity: snapshot.moisture,
          vibration: snapshot.amp,
        }
        // Bỏ qua nếu không có gì thực sự đổi — tránh tạo object mới gây re-render thừa.
        if (s.waterLevel === next.waterLevel && s.humidity === next.humidity && s.vibration === next.vibration) {
          return s
        }
        return { ...s, ...next }
      }))
    }
    socket.on('station_status_changed', onStatusChanged)
    socket.on('dam_metrics_changed', onDamMetricsChanged)
    socket.on('update', onSensorUpdate)
    if (!socket.connected) socket.connect()
    return () => {
      socket.off('station_status_changed', onStatusChanged)
      socket.off('dam_metrics_changed', onDamMetricsChanged)
      socket.off('update', onSensorUpdate)
    }
  }, [])

  const createDam = async (data) => {
    const res = await apiCreateDam(data)
    await loadData(true)
    return res
  }

  const updateDam = async (id, data) => {
    const res = await apiUpdateDam(id, data)
    await loadData(true)
    return res
  }

  const deleteDam = async (id) => {
    const res = await apiDeleteDam(id)
    await loadData(true)
    return res
  }

  const createStation = async (data) => {
    const res = await apiCreateStation(data)
    await loadData(true)
    return res
  }

  const updateStation = async (id, data) => {
    const res = await apiUpdateStation(id, data)
    await loadData(true)
    return res
  }

  const deleteStation = async (id) => {
    const res = await apiDeleteStation(id)
    await loadData(true)
    return res
  }

  return {
    dams,
    stations,
    loading,
    error,
    refetch: loadData,
    createDam,
    updateDam,
    deleteDam,
    createStation,
    updateStation,
    deleteStation,
  }
}
