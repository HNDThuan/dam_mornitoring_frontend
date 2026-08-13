'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ForecastPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dams')
  }, [router])

  return null
}
