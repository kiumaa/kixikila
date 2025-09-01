import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useToastSystem } from '@/hooks/use-toast-system'
import { toast } from 'sonner'

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  }
}))

// Mock haptic feedback
vi.mock('@/hooks/use-haptic-feedback', () => ({
  useActionFeedback: () => ({
    success: vi.fn(),
    error: vi.fn(),
    buttonPress: vi.fn()
  })
}))

describe('useToastSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call success toast with haptic feedback', () => {
    const { result } = renderHook(() => useToastSystem())
    
    result.current.loginSuccess()
    
    expect(toast.success).toHaveBeenCalledWith(
      'Sessão iniciada com sucesso!',
      expect.any(Object)
    )
  })

  it('should call error toast for login error', () => {
    const { result } = renderHook(() => useToastSystem())
    
    result.current.loginError('Invalid credentials')
    
    expect(toast.error).toHaveBeenCalledWith(
      'Invalid credentials',
      expect.any(Object)
    )
  })

  it('should handle payment success with amount', () => {
    const { result } = renderHook(() => useToastSystem())
    
    result.current.paymentSuccess('€100.00')
    
    expect(toast.success).toHaveBeenCalledWith(
      'Pagamento de €100.00 realizado com sucesso!',
      expect.any(Object)
    )
  })

  it('should show network connection restored toast', () => {
    const { result } = renderHook(() => useToastSystem())
    
    result.current.connectionRestored()
    
    expect(toast.success).toHaveBeenCalledWith(
      'Conexão restaurada! A sincronizar dados...',
      expect.any(Object)
    )
  })

  it('should create toast with action callback', () => {
    const { result } = renderHook(() => useToastSystem())
    const mockCallback = vi.fn()
    
    result.current.withAction('Test message', 'Retry', mockCallback)
    
    expect(toast.info).toHaveBeenCalledWith(
      'Test message',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Retry',
          onClick: expect.any(Function)
        })
      })
    )
  })
})