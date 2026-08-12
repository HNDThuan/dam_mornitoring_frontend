'use client'

import dynamic from 'next/dynamic'

// Dynamically import Leaflet inner map component with SSR disabled
const DamMapInner = dynamic(() => import('./DamMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] bg-card border border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted shadow-lg">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-semibold">Đang tải Bản đồ GIS Leaflet...</span>
    </div>
  ),
})

export default function DamMap(props) {
  return <DamMapInner {...props} />
}
