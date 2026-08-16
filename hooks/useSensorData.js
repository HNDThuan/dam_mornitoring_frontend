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

  // Lấy initial data qua REST khi mount hoặc khi stationId/clusterId đổi
  const loadInitial = useCallback(async () => {
    try {
      const res = await fetchLatest(stationId, clusterId)
      if (!mountedRef.current) return
      setLatest(res?.data || null)
      setHistory(res?.history || null)
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      setError('Không thể kết nối backend. Kiểm tra backend đang chạy tại ' +
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'))
    }
  }, [stationId, clusterId])

  useEffect(() => {
    mountedRef.current = true
    setLatest(null)
    setHistory(null)
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
        if (!prev) return {
          timestamps: [snap.timestamp],
          freq:       [snap.freq],
          amp:        [snap.amp],
          waterLevel: [snap.waterLevel],
          moisture:   [snap.moisture],
          percent:    [snap.percent],
        }
        const MAX = 60
        return {
          timestamps: [...(prev.timestamps || []), snap.timestamp].slice(-MAX),
          freq:       [...(prev.freq || []),       snap.freq].slice(-MAX),
          amp:        [...(prev.amp || []),        snap.amp].slice(-MAX),
          waterLevel: [...(prev.waterLevel || []), snap.waterLevel].slice(-MAX),
          moisture:   [...(prev.moisture || []),   snap.moisture].slice(-MAX),
          percent:    [...(prev.percent || []),    snap.percent].slice(-MAX),
        }
      })
    }

    // Backend gửi `update` event mỗi khi có sensor data mới
    const onUpdate = (snapshot) => {
      if (!mountedRef.current || !snapshot) return

      // Lọc dữ liệu: Nếu có stationId thì bắt buộc snapshot phải có stationId khớp
      // stationId nay là mã trạm dạng chuỗi (STA-001-01) — so sánh trực tiếp, không ép số.
      if (stationId != null) {
        if (!snapshot.stationId || snapshot.stationId !== stationId) {
          return
        }
      }
      if (clusterId != null) {
        if (!snapshot.clusterId || snapshot.clusterId !== clusterId) {
          return
        }
      }

      latestRef.current = snapshot
      if (!frameId) {
        frameId = requestAnimationFrame(processBatchUpdate)
      }
    }

    // Backend gửi `history` ngay khi client kết nối lần đầu (chỉ dùng nếu không lọc theo trạm cụ thể)
    const onHistory = (h) => {
      if (!mountedRef.current) return
      if (stationId == null && clusterId == null) {
        setHistory(h)
      }
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
