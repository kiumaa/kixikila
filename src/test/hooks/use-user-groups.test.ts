import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUserGroups } from '@/hooks/use-user-groups'
import { supabase } from '@/integrations/supabase/client'
import { mockGroups } from '../utils'
import React from 'react'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    }))
  }
}))

// Mock auth context  
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useUserGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch user groups successfully', async () => {
    const mockSupabaseResponse = {
      data: mockGroups,
      error: null
    }

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(mockSupabaseResponse)
    })
    
    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect
    } as any)

    const { result } = renderHook(() => useUserGroups(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.groups).toHaveLength(2)
  })
})