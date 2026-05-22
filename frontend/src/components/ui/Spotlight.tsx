import React, { useRef, useEffect, useState } from 'react'
import '../../styles/design-tokens.css'

interface SpotlightProps {
  children: React.ReactNode
  enabled?: boolean
}

export const Spotlight: React.FC<SpotlightProps> = ({ children, enabled = true }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [active, setActive] = useState<boolean>(enabled)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const check = () => setActive(enabled && !media.matches && window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    media.addEventListener('change', check)
    return () => {
      window.removeEventListener('resize', check)
      media.removeEventListener('change', check)
    }
  }, [enabled])

  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return

    function onMove(e: MouseEvent) {
      if (!el) return
      const rect = el.getBoundingClientRect()
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    function onLeave() {
      setPos(null)
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [enabled])

  const spotlightStyle: React.CSSProperties = pos && active
    ? {
        position: 'absolute',
        left: pos.x - 150,
        top: pos.y - 150,
        width: 300,
        height: 300,
        pointerEvents: 'none',
        borderRadius: '50%',
        background: 'radial-gradient(circle at center, rgba(94,106,210,0.15) 0%, rgba(94,106,210,0.06) 40%, transparent 70%)',
        transition: 'opacity 180ms ease, transform 180ms ease',
        opacity: 1,
        mixBlendMode: 'screen',
      }
    : { opacity: 0 }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }} ref={ref}>
      {children}
      <div style={spotlightStyle} aria-hidden />
    </div>
  )
}

export default Spotlight
