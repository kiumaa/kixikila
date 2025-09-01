'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { feedbackForAction } from "@/lib/haptic-feedback"

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  pressable?: boolean
  hapticFeedback?: keyof typeof feedbackForAction
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
}

const MobileCard = React.forwardRef<HTMLDivElement, MobileCardProps>(
  ({ 
    className, 
    pressable = false, 
    hapticFeedback = 'cardTap',
    variant = 'default',
    onClick,
    children,
    ...props 
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (pressable && onClick) {
        feedbackForAction[hapticFeedback]()
        onClick(e)
      }
    }

    const baseClasses = "rounded-2xl transition-all duration-200"
    
    const variantClasses = {
      default: "bg-card border border-border/50 shadow-sm",
      elevated: "bg-card shadow-md hover:shadow-lg",
      outlined: "bg-card border-2 border-border",
      glass: "bg-card/80 backdrop-blur-xl border border-border/20"
    }
    
    const pressableClasses = pressable 
      ? "cursor-pointer active:scale-98 hover:shadow-md hover:-translate-y-0.5 native-tap" 
      : ""

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          pressableClasses,
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    )
  }
)
MobileCard.displayName = "MobileCard"

const MobileCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 pb-2", className)}
    {...props}
  />
))
MobileCardHeader.displayName = "MobileCardHeader"

const MobileCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-lg", className)}
    {...props}
  />
))
MobileCardTitle.displayName = "MobileCardTitle"

const MobileCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
MobileCardDescription.displayName = "MobileCardDescription"

const MobileCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-2", className)} {...props} />
))
MobileCardContent.displayName = "MobileCardContent"

const MobileCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-2", className)}
    {...props}
  />
))
MobileCardFooter.displayName = "MobileCardFooter"

export {
  MobileCard,
  MobileCardHeader,
  MobileCardFooter,
  MobileCardTitle,
  MobileCardDescription,
  MobileCardContent,
}