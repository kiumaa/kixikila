import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { screen, fireEvent } from '@testing-library/dom'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'

describe('EmptyState', () => {
  it('should render with title and description', () => {
    render(
      <EmptyState 
        title="No Groups Found"
        description="You haven't created any groups yet"
      />
    )
    
    expect(screen.getByText('No Groups Found')).toBeInTheDocument()
    expect(screen.getByText("You haven't created any groups yet")).toBeInTheDocument()
  })

  it('should render with custom icon', () => {
    render(
      <EmptyState 
        icon={Users}
        title="No Groups"
        description="Create your first group"
      />
    )
    
    // Check if the Users icon is rendered (we can't directly test the icon, but we can test the container)
    expect(screen.getByText('No Groups')).toBeInTheDocument()
  })

  it('should render action button and handle click', () => {
    const mockAction = vi.fn()
    
    render(
      <EmptyState 
        title="No Groups"
        description="Create your first group"
        action={{
          label: 'Create Group',
          onClick: mockAction
        }}
      />
    )
    
    const actionButton = screen.getByRole('button', { name: /create group/i })
    expect(actionButton).toBeInTheDocument()
    
    fireEvent.click(actionButton)
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('should apply variant styling for groups', () => {
    render(
      <EmptyState 
        variant="groups"
        title="No Groups"
        description="Create your first group"
      />
    )
    
    expect(screen.getByText('No Groups')).toBeInTheDocument()
  })

  it('should apply variant styling for wallet', () => {
    render(
      <EmptyState 
        variant="wallet"
        title="No Transactions"
        description="Your wallet is empty"
      />
    )
    
    expect(screen.getByText('No Transactions')).toBeInTheDocument()
  })

  it('should apply variant styling for notifications', () => {
    render(
      <EmptyState 
        variant="notifications"
        title="No Notifications"
        description="You're all caught up"
      />
    )
    
    expect(screen.getByText('No Notifications')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <EmptyState 
        title="Test Title"
        description="Test Description"
        className="custom-empty-state"
      />
    )
    
    const container = screen.getByText('Test Title').closest('.custom-empty-state')
    expect(container).toBeInTheDocument()
  })

  it('should not render action button when action is not provided', () => {
    render(
      <EmptyState 
        title="No Content"
        description="Nothing to show here"
      />
    )
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})