'use client'

import { useEffect, useState } from 'react'

interface ConfettiProps {
  active: boolean
  onComplete?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  gravity: number
  life: number
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!active) return

    const colors = [
      'rgb(59, 130, 246)', // blue
      'rgb(16, 185, 129)', // green
      'rgb(245, 158, 11)', // yellow
      'rgb(239, 68, 68)',  // red
      'rgb(168, 85, 247)', // purple
      'rgb(236, 72, 153)', // pink
    ]

    // Create initial particles
    const newParticles: Particle[] = []
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
        gravity: 0.2,
        life: 1
      })
    }
    setParticles(newParticles)

    const animate = () => {
      setParticles(prev => {
        const updated = prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + particle.gravity,
          life: particle.life - 0.01
        })).filter(particle => particle.life > 0 && particle.y < window.innerHeight + 50)

        if (updated.length === 0) {
          onComplete?.()
          return []
        }

        return updated
      })
    }

    const interval = setInterval(animate, 16) // ~60fps

    return () => clearInterval(interval)
  }, [active, onComplete])

  if (!active || particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life,
            transform: `rotate(${particle.x}deg)`
          }}
        />
      ))}
    </div>
  )
}