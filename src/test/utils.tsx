import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/lib/auth-context'
import { AppStateProvider } from '@/contexts/app-state-context'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="test-theme">
          <AppStateProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </AppStateProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock authenticated user for tests
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  phone: '+351912345678'
}

// Mock profile data
export const mockProfile = {
  id: 'test-user-id',
  full_name: 'Test User',
  email: 'test@example.com',
  phone: '+351912345678',
  wallet_balance: 1000,
  is_vip: false,
  kyc_status: 'verified',
  trust_score: 85,
  active_groups: 2,
  total_saved: 2500,
  total_earned: 150,
  completed_cycles: 5
}

// Mock groups data
export const mockGroups = [
  {
    id: 'group-1',
    name: 'Test Group 1',
    description: 'Test group description',
    contribution_amount: 100,
    max_members: 10,
    current_members: 7,
    group_type: 'lottery',
    status: 'active',
    total_pool: 700,
    next_payout_date: '2025-09-15',
    current_cycle: 1,
    admin_id: 'test-user-id'
  },
  {
    id: 'group-2', 
    name: 'Test Group 2',
    description: 'Another test group',
    contribution_amount: 50,
    max_members: 5,
    current_members: 5,
    group_type: 'order',
    status: 'ready_for_draw',
    total_pool: 250,
    next_payout_date: '2025-09-20',
    current_cycle: 2,
    admin_id: 'other-user-id'
  }
]

// Mock transactions
export const mockTransactions = [
  {
    id: 'tx-1',
    type: 'deposit',
    amount: 500,
    status: 'completed',
    created_at: '2025-09-01T10:00:00Z',
    description: 'Test deposit'
  },
  {
    id: 'tx-2',
    type: 'payment',
    amount: -100,
    status: 'completed',
    created_at: '2025-08-15T12:00:00Z',
    description: 'Group payment'
  }
]