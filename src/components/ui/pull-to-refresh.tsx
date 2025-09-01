'use client'

import { usePullToRefresh } from '@/hooks/use-gesture'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { feedbackForAction } from '@/lib/haptic-feedback'
import { useEffect } from 'react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
  threshold?: number
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  className,
  threshold = 80 
}: PullToRefreshProps) {
  const { ref, isRefreshing, pullDistance, isPulling } = usePullToRefresh(onRefresh)
  
  // Haptic feedback when threshold is reached
  useEffect(() => {
    if (pullDistance >= threshold && !isRefreshing) {
      feedbackForAction.success()
    }
  }, [pullDistance >= threshold, isRefreshing])

  return (
    <div ref={ref} className={cn("relative overflow-auto", className)}>
      {/* Pull indicator */}
      <div 
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center transition-all duration-300"
        style={{ 
          transform: `translateY(${Math.max(0, pullDistance - threshold)}px)`,
          opacity: isPulling ? Math.min(1, pullDistance / threshold) : 0,
          height: isPulling ? `${threshold}px` : '0px'
        }}
      >
        <div className={cn(
          "bg-card/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-border/50",
          "transition-all duration-300 scale-75",
          pullDistance >= threshold && "scale-100"
        )}>
          <RefreshCw 
            className={cn(
              "w-6 h-6 text-primary transition-all duration-300",
              isRefreshing && "animate-spin",
              pullDistance >= threshold && !isRefreshing && "rotate-180 text-success"
            )} 
          />
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: isPulling ? `translateY(${Math.min(pullDistance, threshold)}px)` : undefined 
        }}
      >
        {children}
      </div>
    </div>
  )
}