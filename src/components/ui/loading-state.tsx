'use client'

import { Loader2, LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  className?: string
  variant?: 'spinner' | 'skeleton' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({
  icon,
  title = 'A carregar...',
  description,
  className = '',
  variant = 'spinner',
  size = 'md'
}: LoadingStateProps) {
  const sizeConfig = {
    sm: {
      container: 'p-4',
      icon: 'w-6 h-6',
      title: 'text-sm font-medium',
      description: 'text-xs'
    },
    md: {
      container: 'p-6',
      icon: 'w-8 h-8',
      title: 'text-base font-medium',
      description: 'text-sm'
    },
    lg: {
      container: 'p-8',
      icon: 'w-10 h-10',
      title: 'text-lg font-semibold',
      description: 'text-base'
    }
  }

  const config = sizeConfig[size]
  const IconComponent = icon || Loader2

  if (variant === 'skeleton') {
    return (
      <Card className={`${config.container} ${className}`}>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </Card>
    )
  }

  if (variant === 'pulse') {
    return (
      <Card className={`${config.container} text-center ${className}`}>
        <div className="space-y-4">
          <div className={`${config.icon} mx-auto bg-primary/10 rounded-full p-2 animate-pulse`}>
            <IconComponent className={`${config.icon} text-primary`} />
          </div>
          <div className="animate-pulse space-y-2">
            <div className={`${config.title} text-foreground`}>{title}</div>
            {description && (
              <div className={`${config.description} text-muted-foreground`}>
                {description}
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`${config.container} text-center ${className}`}>
      <div className="space-y-4">
        <div className={`${config.icon} mx-auto text-primary animate-spin`}>
          <IconComponent className={config.icon} />
        </div>
        <div>
          <div className={`${config.title} text-foreground`}>{title}</div>
          {description && (
            <div className={`${config.description} text-muted-foreground mt-1`}>
              {description}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}