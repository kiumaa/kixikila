'use client'

import { useCallback } from 'react'
import { useActionFeedback } from '@/hooks/use-haptic-feedback'

export function useEnhancedHaptics() {
  const haptics = useActionFeedback()

  // Navigation haptics
  const navigationHaptics = {
    tabSwitch: haptics.selection,
    pageTransition: haptics.buttonPress,
    modalOpen: haptics.buttonPress,
    modalClose: haptics.selection,
    drawerOpen: haptics.buttonPress,
    drawerClose: haptics.selection
  }

  // Form haptics
  const formHaptics = {
    fieldFocus: haptics.selection,
    fieldError: haptics.error,
    fieldSuccess: haptics.buttonPress,
    formSubmit: haptics.formSubmit,
    formComplete: haptics.success
  }

  // Transaction haptics
  const transactionHaptics = {
    paymentStart: haptics.buttonPress,
    paymentProcessing: haptics.buttonPress,
    paymentSuccess: haptics.paymentComplete,
    paymentError: haptics.error,
    depositSuccess: haptics.success,
    withdrawalSuccess: haptics.success,
    balanceUpdate: haptics.buttonPress
  }

  // Group haptics
  const groupHaptics = {
    groupCreated: haptics.groupCreated,
    memberJoined: haptics.success,
    memberLeft: haptics.buttonPress,
    drawStarted: haptics.buttonPress,
    drawResult: haptics.drawResult,
    cycleComplete: haptics.success
  }

  // Interactive haptics
  const interactiveHaptics = {
    cardTap: haptics.cardTap,
    buttonPress: haptics.buttonPress,
    longPress: haptics.buttonPress,
    swipeAction: haptics.selection,
    refresh: haptics.buttonPress,
    toggle: haptics.selection
  }

  // Notification haptics
  const notificationHaptics = {
    newNotification: haptics.buttonPress,
    importantAlert: haptics.error,
    reminder: haptics.selection,
    achievement: haptics.success
  }

  // Combined actions with context-aware feedback
  const contextualHaptics = useCallback((action: string, context?: string) => {
    const key = context ? `${context}.${action}` : action
    
    switch (key) {
      // Authentication
      case 'auth.login':
      case 'auth.register':
        return haptics.success()
      case 'auth.logout':
        return haptics.buttonPress()
      case 'auth.error':
        return haptics.error()
      
      // Groups
      case 'group.create':
        return groupHaptics.groupCreated()
      case 'group.join':
        return groupHaptics.memberJoined()
      case 'group.leave':
        return groupHaptics.memberLeft()
      case 'group.draw':
        return groupHaptics.drawResult()
      
      // Payments
      case 'payment.success':
        return transactionHaptics.paymentSuccess()
      case 'payment.error':
        return transactionHaptics.paymentError()
      
      // UI interactions
      case 'ui.tap':
        return interactiveHaptics.cardTap()
      case 'ui.press':
        return interactiveHaptics.buttonPress()
      case 'ui.toggle':
        return interactiveHaptics.toggle()
      
      // Navigation
      case 'nav.tab':
        return navigationHaptics.tabSwitch()
      case 'nav.page':
        return navigationHaptics.pageTransition()
      
      // Forms
      case 'form.submit':
        return formHaptics.formSubmit()
      case 'form.error':
        return formHaptics.fieldError()
      case 'form.success':
        return formHaptics.formComplete()
      
      default:
        return haptics.buttonPress()
    }
  }, [haptics])

  // Sequence haptics for complex interactions
  const sequenceHaptics = useCallback((sequence: string[]) => {
    sequence.forEach((haptic, index) => {
      setTimeout(() => {
        contextualHaptics(haptic)
      }, index * 100)
    })
  }, [contextualHaptics])

  return {
    // Individual categories
    navigation: navigationHaptics,
    form: formHaptics,
    transaction: transactionHaptics,
    group: groupHaptics,
    interactive: interactiveHaptics,
    notification: notificationHaptics,
    
    // Smart functions
    contextual: contextualHaptics,
    sequence: sequenceHaptics,
    
    // Direct access to base haptics
    ...haptics
  }
}