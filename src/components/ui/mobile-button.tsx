'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { feedbackForAction } from "@/lib/haptic-feedback"

const mobileButtonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 native-tap [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-md hover:shadow-lg",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        success: "bg-success text-success-foreground hover:opacity-90 shadow-md",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90 shadow-md",
      },
      size: {
        sm: "h-10 px-4 text-sm gap-2 [&_svg]:size-4",
        default: "h-12 px-6 text-base min-h-[44px]", // Mobile First - 44px minimum touch target
        lg: "h-14 px-8 text-lg gap-4 [&_svg]:size-6",
      },
      fullWidth: {
        true: "w-full",
        false: ""
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      fullWidth: true
    },
  }
)

export interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof mobileButtonVariants> {
  asChild?: boolean
  loading?: boolean
  hapticFeedback?: keyof typeof feedbackForAction
}

const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    asChild = false, 
    loading = false,
    hapticFeedback = 'buttonPress',
    onClick,
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        // Haptic feedback for native feel
        feedbackForAction[hapticFeedback]()
        onClick?.(e)
      }
    }
    
    return (
      <Comp
        className={cn(mobileButtonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        onClick={handleClick}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </Comp>
    )
  }
)
MobileButton.displayName = "MobileButton"

export { MobileButton, mobileButtonVariants }