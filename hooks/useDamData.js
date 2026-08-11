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

export function useDamData() {
  const [dams, setDams] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
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
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadData()
    return () => {
      mountedRef.current = false
    }
  }, [loadData])

  const createDam = async (data) => {
    const res = await apiCreateDam(data)
    await loadData()
    return res
  }

  const updateDam = async (id, data) => {
    const res = await apiUpdateDam(id, data)
    await loadData()
    return res
  }

  const deleteDam = async (id) => {
    const res = await apiDeleteDam(id)
    await loadData()
    return res
  }

  const createStation = async (data) => {
    const res = await apiCreateStation(data)
    await loadData()
    return res
  }

  const updateStation = async (id, data) => {
    const res = await apiUpdateStation(id, data)
    await loadData()
    return res
  }

  const deleteStation = async (id) => {
    const res = await apiDeleteStation(id)
    await loadData()
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
