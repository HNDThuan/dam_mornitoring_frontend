'use client'

import dynamic from 'next/dynamic'

const LocationPickerMapInner = dynamic(() => import('./LocationPickerMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[230px] bg-card2 border border-border/80 rounded-xl flex flex-col items-center justify-center gap-2 text-muted shadow-inner">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <span className="text-[10px] font-semibold text-muted">Đang tải bản đồ chọn tọa độ...</span>
    </div>
  ),
})

export default function LocationPickerMap(props) {
  return <LocationPickerMapInner {...props} />
}
