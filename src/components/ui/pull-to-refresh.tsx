'use client'

import { usePullToRefresh } from '@/hooks/use-gesture'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const { ref, isRefreshing, pullDistance, isPulling } = usePullToRefresh(onRefresh)

  return (
    <div ref={ref} className={cn("relative overflow-auto", className)}>
      {/* Pull indicator */}
      <div 
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center transition-all duration-200"
        style={{ 
          transform: `translateY(${Math.max(0, pullDistance - 80)}px)`,
          opacity: isPulling ? 1 : 0,
          height: isPulling ? '80px' : '0px'
        }}
      >
        <div className="bg-background/90 backdrop-blur-sm rounded-full p-3 shadow-lg border">
          <RefreshCw 
            className={cn(
              "w-5 h-5 text-primary transition-transform duration-300",
              isRefreshing && "animate-spin",
              pullDistance >= 80 && !isRefreshing && "rotate-180"
            )} 
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ transform: isPulling ? `translateY(${Math.min(pullDistance, 80)}px)` : undefined }}>
        {children}
      </div>
    </div>
  )
}