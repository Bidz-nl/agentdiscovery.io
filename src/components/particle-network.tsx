"use client"

import { useEffect, useRef, useCallback } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  pulseSpeed: number
  pulsePhase: number
  color: string
}

const COLORS = [
  "59, 130, 246",   // blue
  "139, 92, 246",   // purple
  "6, 182, 212",    // cyan
  "34, 197, 94",    // green
]

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const particlesRef = useRef<Particle[]>([])
  const animRef = useRef<number>(0)
  const timeRef = useRef(0)

  const initParticles = useCallback((width: number, height: number) => {
    const count = Math.min(Math.floor((width * height) / 12000), 120)
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }
    particlesRef.current = particles
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      initParticles(rect.width, rect.height)
    }

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    resize()
    window.addEventListener("resize", resize)
    canvas.addEventListener("mousemove", handleMouse)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      timeRef.current += 1

      ctx.clearRect(0, 0, w, h)

      const particles = particlesRef.current
      const mouse = mouseRef.current
      const connectionDist = 150
      const mouseDist = 200

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Mouse attraction — gentle pull toward cursor
        const dxm = mouse.x - p.x
        const dym = mouse.y - p.y
        const distMouse = Math.sqrt(dxm * dxm + dym * dym)
        if (distMouse < mouseDist && distMouse > 0) {
          const force = (1 - distMouse / mouseDist) * 0.02
          p.vx += (dxm / distMouse) * force
          p.vy += (dym / distMouse) * force
        }

        // Damping
        p.vx *= 0.99
        p.vy *= 0.99

        // Move
        p.x += p.vx
        p.y += p.vy

        // Wrap around edges
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        // Pulse
        const pulse = Math.sin(timeRef.current * p.pulseSpeed + p.pulsePhase) * 0.3 + 0.7
        const currentOpacity = p.opacity * pulse

        // Draw glow
        const glowRadius = p.radius * 4
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius)
        gradient.addColorStop(0, `rgba(${p.color}, ${currentOpacity * 0.6})`)
        gradient.addColorStop(1, `rgba(${p.color}, 0)`)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2)
        ctx.fill()

        // Draw particle
        ctx.fillStyle = `rgba(${p.color}, ${currentOpacity})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionDist) {
            const lineOpacity = (1 - dist / connectionDist) * 0.15

            // Brighter lines near mouse
            let brightness = 1
            const midX = (p.x + p2.x) / 2
            const midY = (p.y + p2.y) / 2
            const distToMouse = Math.sqrt((midX - mouse.x) ** 2 + (midY - mouse.y) ** 2)
            if (distToMouse < mouseDist) {
              brightness = 1 + (1 - distToMouse / mouseDist) * 3
            }

            ctx.strokeStyle = `rgba(${p.color}, ${lineOpacity * brightness})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      // Draw mouse glow
      if (mouse.x > 0 && mouse.y > 0) {
        const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120)
        mouseGlow.addColorStop(0, "rgba(59, 130, 246, 0.08)")
        mouseGlow.addColorStop(0.5, "rgba(139, 92, 246, 0.04)")
        mouseGlow.addColorStop(1, "rgba(6, 182, 212, 0)")
        ctx.fillStyle = mouseGlow
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2)
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", resize)
      canvas.removeEventListener("mousemove", handleMouse)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [initParticles])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ opacity: 0.7 }}
    />
  )
}
