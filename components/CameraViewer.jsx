'use client'

import { useState } from 'react'
import { Mono } from '@/components/ui'
import { Video, VideoOff, Camera, Maximize2, ChevronLeft, ChevronRight, X } from 'lucide-react'

const CAMERAS = [
  { id: 1, label: 'Thân đê — Thượng lưu', code: 'CAM-01', status: 'safe'    },
  { id: 2, label: 'Mặt đê — Km 45',       code: 'CAM-02', status: 'safe'    },
  { id: 3, label: 'Chân đê — Hạ lưu',     code: 'CAM-03', status: 'warning' },
  { id: 4, label: 'Cửa xả — Trạm bơm',    code: 'CAM-04', status: 'offline' },
]

const CAM_DOT = { safe: '#34d399', warning: '#fb923c', offline: '#4a6070' }

export default function CameraViewer() {
  const [active, setActive]     = useState(0)
  const [expanded, setExpanded] = useState(false)

  const cam = CAMERAS[active]
  const cl  = CAM_DOT[cam.status]

  const prev = () => setActive(i => (i - 1 + CAMERAS.length) % CAMERAS.length)
  const next = () => setActive(i => (i + 1) % CAMERAS.length)

  const CamFeed = ({ large = false }) => (
    <div className={`relative bg-[#070e1a] overflow-hidden ${large ? '' : 'rounded-lg'}`}
      style={{ aspectRatio: '16/7' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        {cam.status === 'offline'
          ? <VideoOff className={`${large ? 'w-16 h-16' : 'w-10 h-10'} text-tx opacity-15`} />
          : <Video className={`${large ? 'w-20 h-20' : 'w-12 h-12'} text-tx opacity-5`} />}
      </div>

      {/* Top-left info */}
      <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: cl }} />
        <Mono className="text-[9px]" style={{ color: cl }}>{cam.code}</Mono>
        {cam.status === 'warning' && (
          <span className="font-mono text-[8px] text-warning bg-black/50 border border-warning/40 px-1.5 py-0.5 rounded">
            TRÀN NƯỚC (98%)
          </span>
        )}
      </div>
      <Mono className="absolute bottom-2 left-3 text-[8px] text-white/30">
        {new Date().toLocaleTimeString('vi-VN')} | FPS: 30
      </Mono>

      {/* Expand btn */}
      {!large && (
        <button onClick={() => setExpanded(true)}
          className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 border border-white/20 rounded flex items-center justify-center cursor-pointer transition-all"
          title="Phóng to">
          <Maximize2 className="w-3.5 h-3.5 text-white/70" />
        </button>
      )}

      {/* Nav arrows */}
      <button onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/75 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white cursor-pointer transition-all select-none">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button onClick={next}
        className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/75 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white cursor-pointer transition-all select-none ${large ? 'right-3' : 'right-11'}`}>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )

  const Thumbnails = ({ gap = 'gap-1.5' }) => (
    <div className={`grid grid-cols-4 ${gap}`}>
      {CAMERAS.map((c, i) => {
        const tcl = CAM_DOT[c.status]
        return (
          <button key={c.id} onClick={() => setActive(i)}
            className="relative rounded overflow-hidden cursor-pointer transition-all p-0 border-none"
            style={{
              aspectRatio: '16/9', background: '#0a1220',
              outline: i === active ? '2px solid #818cf8' : '1px solid #1a2a3a',
            }}>
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Video className="w-4 h-4 text-tx" />
            </div>
            {c.status === 'offline' && (
              <div className="absolute inset-0 flex items-center justify-center opacity-25">
                <VideoOff className="w-4 h-4 text-tx" />
              </div>
            )}
            <div className="absolute top-1 left-1">
              <div className="w-1 h-1 rounded-full" style={{ background: tcl }} />
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center py-0.5">
              <Mono className="text-[6px]" style={{ color: tcl }}>{c.code}</Mono>
            </div>
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-accent shrink-0" />
            <span className="text-[12px] font-semibold text-tx">Camera AI — Giám Sát</span>
          </div>
          <Mono className="text-[8px] text-safe">● TRỰC TIẾP</Mono>
        </div>

        <CamFeed />

        {/* Label + dot indicator */}
        <div className="flex justify-between items-center mt-2.5 mb-2.5">
          <span className="text-[11px] font-semibold text-tx">{cam.label}</span>
          <div className="flex gap-1.5 items-center">
            {CAMERAS.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className="rounded-full cursor-pointer border-none p-0 transition-all"
                style={{
                  width: i === active ? 16 : 6, height: 6,
                  background: i === active ? '#818cf8' : '#1a2a3a',
                  borderRadius: i === active ? 3 : '50%',
                }} />
            ))}
          </div>
        </div>

        <Thumbnails />

        {/* AI stats */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {[['Người', '0', 'text-safe'], ['Phương tiện', '2', 'text-tx'], ['Vết nứt', 'Không', 'text-safe'], ['Độ tin cậy', '98.5%', 'text-info']].map(([lb, val, cl]) => (
            <div key={lb} className="bg-card2 rounded px-2 py-1.5 text-center">
              <div className="text-[7px] text-muted uppercase tracking-wide mb-1">{lb}</div>
              <Mono className={`text-[11px] font-bold ${cl}`}>{val}</Mono>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded modal */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ background: 'rgba(0,0,0,.88)' }}
          onClick={() => setExpanded(false)}>
          <div className="w-full max-w-3xl bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: cl }} />
                <Mono className="text-[11px]" style={{ color: cl }}>{cam.code}</Mono>
                <span className="text-[11px] font-semibold text-tx">{cam.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mono className="text-[9px] text-safe">● TRỰC TIẾP</Mono>
                <button onClick={() => setExpanded(false)}
                  className="text-muted hover:text-tx cursor-pointer bg-transparent border-none flex items-center justify-center p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <CamFeed large />
            <div className="p-3 bg-[#0a111c] border-t border-border">
              <Thumbnails gap="gap-2" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
