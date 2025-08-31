'use client'

import { Button, ButtonProps } from '@/components/ui/button'
import { feedbackForAction } from '@/lib/haptic-feedback'
import { transitionClasses } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface EnhancedButtonProps extends ButtonProps {
  hapticFeedback?: keyof typeof feedbackForAction
  animationType?: keyof typeof transitionClasses
  loading?: boolean
  success?: boolean
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    children, 
    onClick, 
    hapticFeedback = 'buttonPress',
    animationType = 'smooth',
    loading = false,
    success = false,
    className,
    disabled,
    ...props 
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        feedbackForAction[hapticFeedback]()
        onClick?.(e)
      }
    }

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(
          transitionClasses[animationType],
          "active:scale-95",
          success && "bg-green-600 hover:bg-green-700",
          className
        )}
        {...props}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        )}
        {success && !loading && (
          <div className="w-4 h-4 bg-current rounded-full mr-2 flex items-center justify-center">
            <div className="w-2 h-1 bg-background rounded-full transform rotate-45 translate-x-[-1px]" />
          </div>
        )}
        {children}
      </Button>
    )
  }
)

EnhancedButton.displayName = "EnhancedButton"