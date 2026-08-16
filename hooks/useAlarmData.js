'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { getSocket } from '@/lib/socket'
import { fetchAlarmEvents, fetchThresholdConfigs, resolveAlarmEvent as apiResolve, getFormattedImageUrl } from '@/lib/api'
/**
 * Hook quản lý alarm events & threshold configs từ backend.
 * - Lấy danh sách alarm events ban đầu qua REST
 * - Lắng nghe event `alarm` từ WebSocket để nhận alarm mới real-time
 * - Lấy threshold configs từ backend
 */
export function useAlarmData(damId = 'all') {
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
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
            const targetDamForThresh = !damId || damId === 'all' ? 'DAM-001' : damId
            const [alarmsRes, threshRes] = await Promise.all([
                fetchAlarmEvents(damId, 50, undefined, undefined, token),
                fetchThresholdConfigs(targetDamForThresh),
            ])
            if (!mountedRef.current) return
            setAlarms(alarmsRes?.alarms || [])
            setThresholds(mapThresholds(threshRes?.configs))
            setError(null)
        } catch (err) {
            if (!mountedRef.current) return
            console.error('[useAlarmData] loadInitial error:', err)
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

            // Lọc theo đập: Nếu hook được gọi cho 1 đập cụ thể (không phải 'all'), bỏ qua cảnh báo của đập khác
            if (damId && damId !== 'all' && alarm?.damId && String(alarm.damId) !== String(damId)) {
                return
            }

            // Tải trước ảnh (Preload) vào Browser Cache ngay khi nhận tin từ WebSocket
            if (alarm?.imageUrl) {
                const imgUrl = getFormattedImageUrl(alarm.imageUrl)
                if (imgUrl) {
                    const img = new Image()
                    img.src = imgUrl
                }
            }
            setAlarms(prev => {
                // Nếu alarm đã tồn tại trong danh sách (theo id hoặc eventId), cập nhật thông tin mới
                const isMatch = (a) => a.id === alarm.id || (a.eventId && alarm.eventId && a.eventId === alarm.eventId)
                const exists = prev.some(isMatch)
                if (exists) {
                    return prev.map(a => isMatch(a) ? { ...a, ...alarm } : a)
                }
                // Ngược lại, thêm alarm mới vào đầu danh sách, giới hạn 100
                const next = [alarm, ...prev]
                if (next.length > 100) next.pop()
                return next
            })
        }
        const onAlarmResolved = ({ id, resolvedAt }) => {
            if (!mountedRef.current) return
            setAlarms(prev => prev.map(a => 
                a.id === id ? { ...a, resolvedAt } : a
            ))
        }

        socket.on('alarm', onAlarm)
        socket.on('alarm_resolved', onAlarmResolved)

        // Khởi tải dữ liệu
        loadInitial()
        // Đảm bảo socket đang kết nối
        if (!socket.connected) socket.connect()
        return () => {
            mountedRef.current = false
            socket.off('alarm', onAlarm)
            socket.off('alarm_resolved', onAlarmResolved)
        }
    }, [loadInitial, damId])
    // ── Derived: đếm chính xác số lượng alarm chưa xử lý ──
    const unresolvedCount = useMemo(() => {
        return alarms.filter(a => !a.resolvedAt || a.resolvedAt === null || a.resolvedAt === '').length
    }, [alarms])
    return { alarms, thresholds, loading, error, resolveAlarm, unresolvedCount, refetch: loadInitial }
}