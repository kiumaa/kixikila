import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/dom'
import { MobileDashboard } from '@/pages/mobile-dashboard'

// Mock hooks
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      full_name: 'Test User',
      email: 'test@example.com'
    }
  })
}))

vi.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({
    profile: {
      full_name: 'Test User',
      wallet_balance: 1000,
      active_groups: 2,
      total_earned: 150,
      total_saved: 2500,
      trust_score: 85,
      is_vip: false
    },
    loading: false
  })
}))

vi.mock('@/hooks/use-user-groups', () => ({
  useUserGroups: () => ({
    groups: [
      {
        id: 'group-1',
        name: 'Test Group',
        description: 'A test group',
        contribution_amount: 100,
        max_members: 10,
        current_members: 7,
        group_type: 'lottery',
        status: 'active',
        total_pool: 700,
        next_payout_date: '2025-09-15',
        current_cycle: 1
      }
    ],
    loading: false,
    refetch: vi.fn(),
    error: null
  })
}))

vi.mock('@/hooks/use-toast-system', () => ({
  useToastSystem: () => ({
    syncComplete: vi.fn(),
    syncError: vi.fn()
  })
}))

vi.mock('@/hooks/use-enhanced-haptics', () => ({
  useEnhancedHaptics: () => ({
    interactive: {
      refresh: vi.fn()
    },
    contextual: vi.fn()
  })
}))

vi.mock('@/contexts/app-state-context', () => ({
  useAppState: () => ({
    state: {
      tabs: {
        dashboard: {
          scrollPosition: 0,
          filters: {},
          searchQuery: '',
          selectedItems: []
        }
      }
    },
    setTabState: vi.fn()
  })
}))

vi.mock('@/hooks/use-tab-state', () => ({
  useTabState: () => ({
    scrollPosition: 0,
    filters: {},
    searchQuery: '',
    selectedItems: [],
    saveScrollPosition: vi.fn(),
    restoreScrollPosition: vi.fn(),
    setFilters: vi.fn(),
    updateFilter: vi.fn(),
    clearFilters: vi.fn(),
    setSearchQuery: vi.fn(),
    clearSearch: vi.fn(),
    setSelectedItems: vi.fn(),
    toggleSelectedItem: vi.fn(),
    clearSelection: vi.fn(),
    hasFilters: false,
    hasSearch: false,
    hasSelection: false
  })
}))

describe('MobileDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render user greeting', async () => {
    render(<MobileDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/olá, test/i)).toBeInTheDocument()
    })
  })

  it('should display wallet balance', async () => {
    render(<MobileDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('€1.000,00')).toBeInTheDocument()
    })
  })

  it('should show user statistics', async () => {
    render(<MobileDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // active groups
      expect(screen.getByText('85%')).toBeInTheDocument() // trust score
    })
  })

  it('should render group card', async () => {
    render(<MobileDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Group')).toBeInTheDocument()
      expect(screen.getByText('A test group')).toBeInTheDocument()
    })
  })

  it('should show VIP upgrade banner for non-VIP users', async () => {
    render(<MobileDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Upgrade para VIP')).toBeInTheDocument()
    })
  })

  it('should display quick action buttons', async () => {
    render(<MobileDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Criar Grupo')).toBeInTheDocument()
      expect(screen.getByText('Depositar')).toBeInTheDocument()
      expect(screen.getByText('Convidar')).toBeInTheDocument()
    })
  })

  it('should show notification badge', async () => {
    render(<MobileDashboard />)
    
    await waitFor(() => {
      // Check for notification button (Bell icon)
      const notificationButtons = screen.getAllByRole('button')
      expect(notificationButtons.length).toBeGreaterThan(0)
    })
  })

  it('should render wallet action buttons', async () => {
    render(<MobileDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Depositar')).toBeInTheDocument()
      expect(screen.getByText('Levantar')).toBeInTheDocument()
      expect(screen.getByText('Histórico')).toBeInTheDocument()
    })
  })
})