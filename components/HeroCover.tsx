'use client'

import { useEffect, useRef } from 'react'

interface Props {
  src: string
  alt: string
  className?: string
}

// 3D parallax: cover follows the cursor with subtle perspective tilt.
// Disabled on touch devices and when prefers-reduced-motion is set.
export default function HeroCover({ src, alt, className }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (reduce || coarse) return
    const stage = stageRef.current
    const img = imgRef.current
    if (!stage || !img) return

    const restY = -15
    const restX = 2
    const rangeY = 18
    const rangeX = 10
    let raf = 0

    function onMove(e: MouseEvent) {
      if (!stage || !img) return
      const rect = stage.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width - 0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5
      const ry = restY + nx * rangeY
      const rx = restX - ny * rangeX
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        img.style.transform = `rotateY(${ry}deg) rotateX(${rx}deg)`
      })
    }
    function onLeave() {
      if (!img) return
      if (raf) cancelAnimationFrame(raf)
      img.style.transform = ''
    }

    stage.addEventListener('mousemove', onMove)
    stage.addEventListener('mouseleave', onLeave)
    return () => {
      stage.removeEventListener('mousemove', onMove)
      stage.removeEventListener('mouseleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={stageRef} className={className}>
      <img ref={imgRef} src={src} alt={alt} loading="eager" width={420} height={672} />
    </div>
  )
}
