'use client'

import { useState } from 'react'
import { Home, Wallet, Plus, UserPlus, User } from 'lucide-react'
import { CreateGroupModal } from '@/components/modals/create-group-modal'
import { NativeTabBar } from '@/components/ui/native-tabbar'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useSwipeGesture } from '@/hooks/use-gesture'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  enablePullToRefresh?: boolean
  onRefresh?: () => Promise<void>
  enableSwipeBack?: boolean
  onSwipeBack?: () => void
}

export function AppLayout({ 
  children, 
  enablePullToRefresh = false,
  onRefresh,
  enableSwipeBack = false,
  onSwipeBack
}: AppLayoutProps) {
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  // Native TabBar items
  const tabItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/dashboard'
    },
    {
      icon: Wallet,
      label: 'Carteira',
      path: '/wallet'
    },
    {
      icon: Plus,
      label: 'Criar',
      isAction: true,
      onClick: () => setShowCreateGroup(true)
    },
    {
      icon: UserPlus,
      label: 'Convidar',
      path: '/invite'
    },
    {
      icon: User,
      label: 'Perfil',
      path: '/profile'
    }
  ]

  // Swipe gesture for back navigation
  const swipeRef = useSwipeGesture({
    onSwipeRight: enableSwipeBack && onSwipeBack ? onSwipeBack : undefined,
    threshold: 100
  })

  const defaultRefresh = async () => {
    // Default refresh behavior - can be overridden
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const content = (
    <div 
      ref={swipeRef}
      className={cn(
        "min-h-screen bg-background mobile-container",
        "pb-20" // Space for TabBar
      )}
    >
      {/* Main Content with Mobile First approach */}
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  )

  return (
    <>
      {/* Content with optional Pull-to-Refresh */}
      {enablePullToRefresh ? (
        <PullToRefresh onRefresh={onRefresh || defaultRefresh}>
          {content}
        </PullToRefresh>
      ) : (
        content
      )}

      {/* Native TabBar */}
      <NativeTabBar items={tabItems} />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
    </>
  )
}