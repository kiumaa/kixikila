import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../utils'
import { ErrorState } from '@/components/ui/error-state'
import { AlertCircle } from 'lucide-react'

describe('ErrorState', () => {
  it('should render default error state', () => {
    render(<ErrorState />)
    
    expect(screen.getByText('Algo correu mal')).toBeInTheDocument()
    expect(screen.getByText('Ocorreu um erro inesperado. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /voltar ao início/i })).toBeInTheDocument()
  })

  it('should render custom title and message', () => {
    render(
      <ErrorState 
        title="Custom Error"
        message="This is a custom error message"
      />
    )
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.getByText('This is a custom error message')).toBeInTheDocument()
  })

  it('should render custom action button', () => {
    const mockAction = vi.fn()
    
    render(
      <ErrorState 
        action={{
          label: 'Retry Action',
          onClick: mockAction
        }}
      />
    )
    
    const actionButton = screen.getByRole('button', { name: /retry action/i })
    expect(actionButton).toBeInTheDocument()
    
    fireEvent.click(actionButton)
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('should render custom icon', () => {
    const CustomIcon = () => <AlertCircle data-testid="custom-icon" />
    
    render(
      <ErrorState 
        icon={<CustomIcon />}
      />
    )
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('should hide home button when showHomeButton is false', () => {
    render(<ErrorState showHomeButton={false} />)
    
    expect(screen.queryByRole('button', { name: /voltar ao início/i })).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<ErrorState className="custom-class" />)
    
    const container = screen.getByText('Algo correu mal').closest('.custom-class')
    expect(container).toBeInTheDocument()
  })

  it('should navigate to home when home button is clicked', () => {
    // Mock window.location.href
    delete (window as any).location
    window.location = { href: '' } as any
    
    render(<ErrorState />)
    
    const homeButton = screen.getByRole('button', { name: /voltar ao início/i })
    fireEvent.click(homeButton)
    
    expect(window.location.href).toBe('/')
  })
})