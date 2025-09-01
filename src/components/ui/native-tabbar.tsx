'use client'

import { useLocation, useNavigate } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { feedbackForAction } from '@/lib/haptic-feedback'

interface TabItem {
  icon: LucideIcon
  label: string
  path?: string
  isAction?: boolean
  onClick?: () => void
}

interface NativeTabBarProps {
  items: TabItem[]
  className?: string
}

export function NativeTabBar({ items, className }: NativeTabBarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleTabPress = (item: TabItem) => {
    // Haptic feedback for native feel
    feedbackForAction.selection()
    
    if (item.isAction && item.onClick) {
      item.onClick()
    } else if (item.path && item.path !== location.pathname) {
      navigate(item.path)
    }
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-card/95 backdrop-blur-xl border-t border-border/50",
      "safe-area-pb", // Add safe area padding for devices with home indicator
      className
    )}>
      <div className="mobile-container py-2">
        <div className="flex justify-around items-center">
          {items.map((item, index) => {
            const isActive = item.path === location.pathname
            const IconComponent = item.icon
            
            return (
              <button
                key={`${item.label}-${index}`}
                onClick={() => handleTabPress(item)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-3 rounded-xl",
                  "transition-all duration-200 native-tap",
                  "min-h-[44px] min-w-[44px]", // iOS touch target
                  item.isAction 
                    ? "bg-primary text-primary-foreground shadow-lg scale-110 -mt-2 rounded-2xl p-3"
                    : isActive 
                      ? "text-primary bg-primary/10 scale-105" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <IconComponent className={cn(
                  "transition-all duration-200",
                  item.isAction ? "w-6 h-6" : "w-5 h-5"
                )} />
                
                {!item.isAction && (
                  <span className={cn(
                    "text-xs font-medium transition-all duration-200",
                    "leading-none"
                  )}>
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}