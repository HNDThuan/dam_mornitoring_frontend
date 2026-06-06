'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import { fetchAlarmEvents, fetchThresholdConfigs, resolveAlarmEvent as apiResolve } from '@/lib/api'
/**
 * Hook quản lý alarm events & threshold configs từ backend.
 * - Lấy danh sách alarm events ban đầu qua REST
 * - Lắng nghe event `alarm` từ WebSocket để nhận alarm mới real-time
 * - Lấy threshold configs từ backend
 */
export function useAlarmData(damId = 'dam_1') {
    const [alarms, setAlarms] = useState([])
    const [thresholds, setThresholds] = useState(null)   // { vibration, water_level, humidity }
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const mountedRef = useRef(true)
    // ── Map thresholds array sang object theo sensorType ──
    const mapThresholds = (configs) => {
        if (!configs?.length) return null
        const map = {}
        configs.forEach(c => { map[c.sensorType] = c })
        return map
    }
    // ── Fetch initial data ──
    const loadInitial = useCallback(async () => {
        try {
            setLoading(true)
            const [alarmsRes, threshRes] = await Promise.all([
                fetchAlarmEvents(damId, 50),
                fetchThresholdConfigs(damId),
            ])
            if (!mountedRef.current) return
            setAlarms(alarmsRes.alarms || [])
            setThresholds(mapThresholds(threshRes.configs))
            setError(null)
        } catch (err) {
            if (!mountedRef.current) return
            setError('Không thể tải dữ liệu cảnh báo từ backend.')
            console.error('[useAlarmData]', err)
        } finally {
            if (mountedRef.current) setLoading(false)
        }
    }, [damId])
    // ── Resolve alarm ──
    const resolveAlarm = useCallback(async (id) => {
        try {
            const res = await apiResolve(id)
            if (!mountedRef.current) return
            // Cập nhật alarm đã resolve trong state local
            setAlarms(prev => prev.map(a =>
                a.id === id ? { ...a, resolvedAt: res.data?.resolvedAt || new Date().toISOString() } : a
            ))
        } catch (err) {
            console.error('[useAlarmData] resolve failed:', err)
        }
    }, [])
    useEffect(() => {
        mountedRef.current = true
        const socket = getSocket()
        // Lắng nghe alarm event mới từ WebSocket
        const onAlarm = (alarm) => {
            if (!mountedRef.current) return
            setAlarms(prev => {
                // Thêm alarm mới vào đầu danh sách, giới hạn 100
                const next = [alarm, ...prev]
                if (next.length > 100) next.pop()
                return next
            })
        }
        socket.on('alarm', onAlarm)
        // Khởi tải dữ liệu
        loadInitial()
        // Đảm bảo socket đang kết nối
        if (!socket.connected) socket.connect()
        return () => {
            mountedRef.current = false
            socket.off('alarm', onAlarm)
        }
    }, [loadInitial])
    // ── Derived: đếm số alarm chưa xử lý ──
    const unresolvedCount = alarms.filter(a => !a.resolvedAt).length
    return { alarms, thresholds, loading, error, resolveAlarm, unresolvedCount, refetch: loadInitial }
}