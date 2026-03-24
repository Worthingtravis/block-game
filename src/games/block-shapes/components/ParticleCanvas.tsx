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

const MAX_PARTICLES = 500

const ParticleCanvas = forwardRef<ParticleCanvasHandle, { width: number; height: number }>(
  ({ width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const animFrameRef = useRef<number>(0)
    const runningRef = useRef(false)

    const startLoop = useCallback(() => {
      if (runningRef.current) return
      runningRef.current = true
      let lastTime = performance.now()

      const animate = (time: number) => {
        const dt = (time - lastTime) / 1000
        lastTime = time

        const canvas = canvasRef.current
        if (!canvas) { runningRef.current = false; return }
        const ctx = canvas.getContext('2d')
        if (!ctx) { runningRef.current = false; return }

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const particles = particlesRef.current
        let i = 0
        while (i < particles.length) {
          const p = particles[i]
          p.x += p.vx
          p.y += p.vy
          p.vy += 8 * dt
          p.life -= dt / p.maxLife

          if (p.life <= 0) {
            particles[i] = particles[particles.length - 1]
            particles.pop()
            continue
          }

          ctx.globalAlpha = p.life
          ctx.fillStyle = p.color
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
          i++
        }

        ctx.globalAlpha = 1

        if (particles.length > 0) {
          animFrameRef.current = requestAnimationFrame(animate)
        } else {
          runningRef.current = false
        }
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }, [])

    const emit = useCallback((x: number, y: number, color: string, count: number, intensity = 1) => {
      const particles = particlesRef.current
      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) break
        const angle = Math.random() * Math.PI * 2
        const speed = (2 + Math.random() * 4) * intensity
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (3 + Math.random() * 5) * intensity,
          color,
          life: 1,
          maxLife: (0.3 + Math.random() * 0.3) * intensity,
        })
      }
      startLoop()
    }, [startLoop])

    useImperativeHandle(ref, () => ({ emit }), [emit])

    useEffect(() => {
      return () => cancelAnimationFrame(animFrameRef.current)
    }, [])

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

ParticleCanvas.displayName = 'ParticleCanvas'

export default ParticleCanvas
