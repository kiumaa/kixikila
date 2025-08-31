'use client'

import { useSwipeGesture } from '@/hooks/use-gesture'
import { transitionClasses } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

interface AnimatedPageProps {
  children: React.ReactNode
  className?: string
  title?: string
  onBack?: () => void
  enableSwipeBack?: boolean
  showBackButton?: boolean
}

export function AnimatedPage({ 
  children, 
  className, 
  title,
  onBack,
  enableSwipeBack = true,
  showBackButton = true
}: AnimatedPageProps) {
  const swipeRef = useSwipeGesture({
    onSwipeRight: enableSwipeBack && onBack ? onBack : undefined,
    threshold: 100
  })

  return (
    <div 
      ref={swipeRef}
      className={cn(
        "min-h-screen bg-background animate-fade-in",
        transitionClasses.smooth,
        className
      )}
    >
      {/* Header with back button */}
      {(title || showBackButton) && (
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 pt-14 pb-8">
          <div className="flex items-center gap-4">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className={cn(
                  "p-2 bg-card/20 backdrop-blur-sm rounded-xl hover:bg-card/30",
                  transitionClasses.fast
                )}
              >
                <ArrowLeft className="w-5 h-5 text-primary-foreground" />
              </button>
            )}
            {title && (
              <h1 className="text-xl font-bold text-primary-foreground">{title}</h1>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className={title || showBackButton ? "px-6 -mt-4" : "px-6"}>
        {children}
      </div>
    </div>
  )
}