import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'

type Particle = {
  x: number; y: number
  vx: number; vy: number
  size: number
  color: string
  life: number
  maxLife: number
}

export type ParticleCanvasHandle = {
  emit: (x: number, y: number, color: string, count: number, intensity?: number) => void
}

const ParticleCanvas = forwardRef<ParticleCanvasHandle, { width: number; height: number }>(
  ({ width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const animFrameRef = useRef<number>(0)

    const emit = useCallback((x: number, y: number, color: string, count: number, intensity = 1) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = (2 + Math.random() * 4) * intensity
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (3 + Math.random() * 5) * intensity,
          color,
          life: 1,
          maxLife: (0.3 + Math.random() * 0.3) * intensity,
        })
      }
    }, [])

    useImperativeHandle(ref, () => ({ emit }), [emit])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      let lastTime = performance.now()

      const animate = (time: number) => {
        const dt = (time - lastTime) / 1000
        lastTime = time

        ctx.clearRect(0, 0, width, height)

        const particles = particlesRef.current
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]
          p.x += p.vx
          p.y += p.vy
          p.vy += 8 * dt
          p.life -= dt / p.maxLife

          if (p.life <= 0) {
            particles.splice(i, 1)
            continue
          }

          ctx.globalAlpha = p.life
          ctx.fillStyle = p.color
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
        }

        ctx.globalAlpha = 1
        animFrameRef.current = requestAnimationFrame(animate)
      }

      animFrameRef.current = requestAnimationFrame(animate)
      return () => cancelAnimationFrame(animFrameRef.current)
    }, [width, height])

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
    )
  }
)

export default ParticleCanvas
