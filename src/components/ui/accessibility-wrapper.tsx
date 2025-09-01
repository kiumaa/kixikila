'use client'

import { useEffect } from 'react'
import { useAppState } from '@/contexts/app-state-context'

interface AccessibilityWrapperProps {
  children: React.ReactNode
}

export function AccessibilityWrapper({ children }: AccessibilityWrapperProps) {
  const { state, setUIState } = useAppState()

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setUIState({ reducedMotion: prefersReducedMotion })

    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent) => {
      setUIState({ reducedMotion: e.matches })
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [setUIState])

  // Apply accessibility classes
  const accessibilityClasses = [
    state.ui.reducedMotion && 'motion-reduce:transition-none motion-reduce:animate-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
  ].filter(Boolean).join(' ')

  return (
    <div className={accessibilityClasses}>
      {children}
    </div>
  )
}