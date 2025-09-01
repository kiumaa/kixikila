'use client'

import { useCallback } from 'react'

interface HapticFeedback {
  light(): void
  medium(): void
  heavy(): void
  success(): void
  warning(): void
  error(): void
  selection(): void
}

export function useHapticFeedback(): HapticFeedback {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }, [])

  const light = useCallback(() => vibrate(10), [vibrate])
  const medium = useCallback(() => vibrate(20), [vibrate])
  const heavy = useCallback(() => vibrate(50), [vibrate])
  const success = useCallback(() => vibrate([10, 50, 10]), [vibrate])
  const warning = useCallback(() => vibrate([20, 100, 20]), [vibrate])
  const error = useCallback(() => vibrate([50, 100, 50, 100, 50]), [vibrate])
  const selection = useCallback(() => vibrate(5), [vibrate])

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection
  }
}

// Helper hook for common actions
export function useActionFeedback() {
  const haptic = useHapticFeedback()

  return {
    buttonPress: haptic.light,
    cardTap: haptic.selection,
    formSubmit: haptic.medium,
    success: haptic.success,
    error: haptic.error,
    paymentComplete: haptic.success,
    groupCreated: haptic.success,
    drawResult: haptic.heavy,
    selection: haptic.selection
  }
}