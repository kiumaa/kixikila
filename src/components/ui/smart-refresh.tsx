'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { useEnhancedHaptics } from '@/hooks/use-enhanced-haptics'

interface SmartRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
  disabled?: boolean
  className?: string
}

export function SmartRefresh({ 
  onRefresh, 
  children, 
  threshold = 60,
  disabled = false,
  className = '' 
}: SmartRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)
  const [canPull, setCanPull] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { interactive } = useEnhancedHaptics()

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    if (scrollTop === 0) {
      setCanPull(true)
      setStartY(e.touches[0].clientY)
    }
  }, [disabled, isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!canPull || disabled || isRefreshing) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, (currentY - startY) * 0.5) // Damping effect
    
    if (distance > 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, threshold * 1.5))
      
      // Haptic feedback at threshold
      if (distance >= threshold && pullDistance < threshold) {
        interactive.refresh()
      }
    }
  }, [canPull, disabled, isRefreshing, startY, threshold, pullDistance, interactive])

  const handleTouchEnd = useCallback(async () => {
    if (!canPull || disabled || isRefreshing) return

    setCanPull(false)
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      interactive.buttonPress()
      
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
  }, [canPull, disabled, isRefreshing, pullDistance, threshold, onRefresh, interactive])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const refreshProgress = Math.min(pullDistance / threshold, 1)
  const showRefreshIndicator = pullDistance > 0 || isRefreshing

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull-to-refresh indicator */}
      {showRefreshIndicator && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          style={{
            height: `${Math.max(pullDistance, 60)}px`,
            transform: `translateY(${isRefreshing ? '0' : `-${60 - pullDistance}px`})`,
            transition: isRefreshing ? 'transform 0.3s ease' : 'none'
          }}
        >
          <div className="flex items-center gap-2 text-primary">
            <RefreshCw 
              className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{
                transform: `rotate(${refreshProgress * 360}deg)`,
                transition: isRefreshing ? 'none' : 'transform 0.1s ease'
              }}
            />
            <span className="text-sm font-medium">
              {isRefreshing 
                ? 'A atualizar...' 
                : pullDistance >= threshold 
                  ? 'Soltar para atualizar'
                  : 'Puxar para atualizar'
              }
            </span>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div 
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: canPull ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  )
}