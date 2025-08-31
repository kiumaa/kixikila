// Haptic feedback utilities for native-like experience

export interface HapticFeedback {
  light(): void
  medium(): void
  heavy(): void
  success(): void
  warning(): void
  error(): void
  selection(): void
}

class WebHapticFeedback implements HapticFeedback {
  private vibrate(pattern: number | number[]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  light() {
    this.vibrate(10)
  }

  medium() {
    this.vibrate(20)
  }

  heavy() {
    this.vibrate(50)
  }

  success() {
    this.vibrate([10, 50, 10])
  }

  warning() {
    this.vibrate([20, 100, 20])
  }

  error() {
    this.vibrate([50, 100, 50, 100, 50])
  }

  selection() {
    this.vibrate(5)
  }
}

export const haptic = new WebHapticFeedback()

// Helper functions for common actions
export const feedbackForAction = {
  buttonPress: () => haptic.light(),
  cardTap: () => haptic.selection(),
  formSubmit: () => haptic.medium(),
  success: () => haptic.success(),
  error: () => haptic.error(),
  paymentComplete: () => haptic.success(),
  groupCreated: () => haptic.success(),
  drawResult: () => haptic.heavy(),
  selection: () => haptic.selection()
}