'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import { fetchLatest } from '@/lib/api'

export function useSensorData(stationId, clusterId) {
  const [latest, setLatest]       = useState(null)
  const [history, setHistory]     = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError]         = useState(null)
  const mountedRef = useRef(true)

  // Lấy initial data qua REST khi mount
  const loadInitial = useCallback(async () => {
    try {
      const res = await fetchLatest(stationId, clusterId)
      if (!mountedRef.current) return
      if (res.data)    setLatest(res.data)
      if (res.history) setHistory(res.history)
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      setError('Không thể kết nối backend. Kiểm tra backend đang chạy tại ' +
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'))
    }
  }, [stationId, clusterId])

  useEffect(() => {
    mountedRef.current = true
    const socket = getSocket()

    // ── Socket events ──────────────────────────────────────────────
    const onConnect = () => {
      if (mountedRef.current) setConnected(true)
    }

    const onDisconnect = () => {
      if (mountedRef.current) setConnected(false)
    }

    const onConnectError = () => {
      if (mountedRef.current) {
        setConnected(false)
        setError('WebSocket không thể kết nối.')
      }
    }

    let frameId = null
    const latestRef = { current: null }

    const processBatchUpdate = () => {
      frameId = null
      const snap = latestRef.current
      if (!snap || !mountedRef.current) return

      setLatest(snap)
      setError(null)

      setHistory(prev => {
        if (!prev) return prev
        const MAX = 60
        return {
          timestamps: [...prev.timestamps, snap.timestamp].slice(-MAX),
          freq:       [...prev.freq,       snap.freq].slice(-MAX),
          amp:        [...prev.amp,        snap.amp].slice(-MAX),
          waterLevel: [...prev.waterLevel, snap.waterLevel].slice(-MAX),
          moisture:   [...prev.moisture,   snap.moisture].slice(-MAX),
          percent:    [...prev.percent,    snap.percent].slice(-MAX),
        }
      })
    }

    // Backend gửi `update` event mỗi khi có sensor data mới
    const onUpdate = (snapshot) => {
      if (!mountedRef.current) return

      // Lọc dữ liệu: Chỉ lọc nếu stationId hoặc clusterId không trùng khớp
      if (stationId && snapshot.stationId && Number(snapshot.stationId) !== Number(stationId)) {
        return
      }
      if (!stationId && clusterId && snapshot.clusterId && snapshot.clusterId !== clusterId) {
        return
      }

      latestRef.current = snapshot
      if (!frameId) {
        frameId = requestAnimationFrame(processBatchUpdate)
      }
    }

    // Backend gửi `history` ngay khi client kết nối lần đầu
    const onHistory = (h) => {
      if (!mountedRef.current) return
      setHistory(h)
    }

    socket.on('connect',       onConnect)
    socket.on('disconnect',    onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('update',        onUpdate)
    socket.on('history',       onHistory)

    // Khởi động
    loadInitial()
    if (!socket.connected) {
      socket.connect()
    } else {
      setConnected(true)
    }

    return () => {
      mountedRef.current = false
      if (frameId) cancelAnimationFrame(frameId)
      socket.off('connect',       onConnect)
      socket.off('disconnect',    onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('update',        onUpdate)
      socket.off('history',       onHistory)
    }
  }, [loadInitial, stationId, clusterId])

  return { latest, history, connected, error }
}
