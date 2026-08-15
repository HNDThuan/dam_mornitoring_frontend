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

export function useDamData() {
  const [dams, setDams] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

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
        setStations(prev => prev.map(s => s.id === evt.stationId ? { ...s, status: evt.status } : s))
      } else if (evt.level === 'dam' && evt.damId) {
        setDams(prev => prev.map(d => d.id === evt.damId ? { ...d, status: evt.status } : d))
      }
    }
    // Dam.waterLevel = MAX(waterLevel) trong các Station thuộc Dam — backend tự tính, đẩy real-time.
    const onDamMetricsChanged = (evt) => {
      if (!mountedRef.current || !evt?.damId) return
      setDams(prev => prev.map(d => d.id === evt.damId ? { ...d, waterLevel: evt.waterLevel } : d))
    }
    socket.on('station_status_changed', onStatusChanged)
    socket.on('dam_metrics_changed', onDamMetricsChanged)
    if (!socket.connected) socket.connect()
    return () => {
      socket.off('station_status_changed', onStatusChanged)
      socket.off('dam_metrics_changed', onDamMetricsChanged)
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
