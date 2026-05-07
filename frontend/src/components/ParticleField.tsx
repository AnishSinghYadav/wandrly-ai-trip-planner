import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'

interface Bokeh {
  x: number; y: number
  vx: number; vy: number
  r: number
  opacity: number
  targetOpacity: number
  phase: number
  phaseSpeed: number
  color: string
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = useAppStore((s) => s.theme)
  const rafRef = useRef<number>(0)
  const bokehs = useRef<Bokeh[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const isDark = theme === 'dark'

    // Gold / purple / rose tones for dark; gold/amber tones for light
    const palette = isDark
      ? [
          'rgba(196,154,73,',   // gold
          'rgba(160,100,220,',  // purple
          'rgba(196,80,100,',   // rose
          'rgba(80,120,220,',   // midnight blue
          'rgba(232,200,120,',  // bright gold
        ]
      : [
          'rgba(168,120,30,',
          'rgba(200,160,60,',
          'rgba(140,80,20,',
          'rgba(220,180,80,',
          'rgba(180,140,40,',
        ]

    const COUNT = window.innerWidth < 768 ? 18 : 32

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Spawn bokeh circles
    bokehs.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 120 + 40,        // large blurry circles
      opacity: Math.random() * 0.08 + 0.01,
      targetOpacity: Math.random() * 0.1 + 0.02,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: Math.random() * 0.005 + 0.003,
      color: palette[Math.floor(Math.random() * palette.length)],
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const b of bokehs.current) {
        b.phase += b.phaseSpeed
        // Breathe opacity
        b.opacity = b.targetOpacity * (0.5 + 0.5 * Math.sin(b.phase))
        // Drift
        b.x += b.vx
        b.y += b.vy
        // Wrap
        if (b.x < -b.r * 2) b.x = canvas.width + b.r * 2
        if (b.x > canvas.width + b.r * 2) b.x = -b.r * 2
        if (b.y < -b.r * 2) b.y = canvas.height + b.r * 2
        if (b.y > canvas.height + b.r * 2) b.y = -b.r * 2

        // Draw large soft bokeh circle
        const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        grd.addColorStop(0,   `${b.color}${b.opacity})`)
        grd.addColorStop(0.4, `${b.color}${b.opacity * 0.6})`)
        grd.addColorStop(1,   `${b.color}0)`)

        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 1 }}
    />
  )
}
