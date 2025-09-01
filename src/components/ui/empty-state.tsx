'use client'

import { LucideIcon, Inbox, Users, Wallet, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  variant?: 'default' | 'groups' | 'wallet' | 'notifications'
}

const variantConfig = {
  default: {
    icon: Inbox,
    iconBg: 'bg-muted/50',
    iconColor: 'text-muted-foreground'
  },
  groups: {
    icon: Users,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary'
  },
  wallet: {
    icon: Wallet,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  },
  notifications: {
    icon: Bell,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600'
  }
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
  variant = 'default'
}: EmptyStateProps) {
  const config = variantConfig[variant]
  const IconComponent = icon || config.icon

  return (
    <Card className={`p-8 text-center max-w-md mx-auto ${className}`}>
      <div className="mb-6">
        <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>

      {action && (
        <Button onClick={action.onClick} className="w-full" variant="default">
          {action.label}
        </Button>
      )}
    </Card>
  )
}