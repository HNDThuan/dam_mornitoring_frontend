'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import { fetchLatest } from '@/lib/api'

export function useSensorData() {
  const [latest, setLatest]       = useState(null)
  const [history, setHistory]     = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError]         = useState(null)
  const mountedRef = useRef(true)

  // Lấy initial data qua REST khi mount
  const loadInitial = useCallback(async () => {
    try {
      const res = await fetchLatest()
      if (!mountedRef.current) return
      if (res.data)    setLatest(res.data)
      if (res.history) setHistory(res.history)
      setError(null)
    } catch (err) {
      if (!mountedRef.current) return
      setError('Không thể kết nối backend. Kiểm tra backend đang chạy tại ' +
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'))
    }
  }, [])

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

    // Backend gửi `update` event mỗi khi có sensor data mới
    const onUpdate = (snapshot) => {
      if (!mountedRef.current) return
      setLatest(snapshot)
      setError(null)

      // Append vào history local (mirror logic của backend)
      setHistory(prev => {
        if (!prev) return prev
        const MAX = 60
        const next = {
          timestamps: [...prev.timestamps, snapshot.timestamp].slice(-MAX),
          freq:       [...prev.freq,       snapshot.freq].slice(-MAX),
          amp:        [...prev.amp,        snapshot.amp].slice(-MAX),
          waterLevel: [...prev.waterLevel, snapshot.waterLevel].slice(-MAX),
          moisture:   [...prev.moisture,   snapshot.moisture].slice(-MAX),
          percent:    [...prev.percent,    snapshot.percent].slice(-MAX),
        }
        return next
      })
    }

    // Backend gửi `history` ngay khi client kết nối lần đầu
    const onHistory = (h) => {
      if (mountedRef.current) setHistory(h)
    }

    socket.on('connect',       onConnect)
    socket.on('disconnect',    onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('update',        onUpdate)
    socket.on('history',       onHistory)

    // Khởi động
    loadInitial()
    socket.connect()

    return () => {
      mountedRef.current = false
      socket.off('connect',       onConnect)
      socket.off('disconnect',    onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('update',        onUpdate)
      socket.off('history',       onHistory)
      socket.disconnect()
    }
  }, [loadInitial])

  return { latest, history, connected, error }
}
