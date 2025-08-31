'use client'

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Home, Wallet, Plus, UserPlus, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreateGroupModal } from '@/components/modals/create-group-modal'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/dashboard',
      isActive: location.pathname === '/dashboard'
    },
    {
      icon: Wallet,
      label: 'Carteira',
      path: '/wallet',
      isActive: location.pathname === '/wallet'
    },
    {
      icon: Plus,
      label: 'Criar',
      path: '',
      isActive: false,
      isAction: true,
      onClick: () => setShowCreateGroup(true)
    },
    {
      icon: UserPlus,
      label: 'Convidar',
      path: '/invite',
      isActive: location.pathname === '/invite'
    },
    {
      icon: User,
      label: 'Perfil',
      path: '/profile',
      isActive: location.pathname === '/profile'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Fixed Bottom TabBar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex justify-around items-center">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick || (() => window.location.href = item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200",
                  item.isAction 
                    ? "bg-primary text-primary-foreground shadow-lg scale-110 -mt-2 rounded-full p-3"
                    : item.isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className={cn(
                  "transition-all duration-200",
                  item.isAction ? "w-6 h-6" : "w-5 h-5"
                )} />
                <span className={cn(
                  "text-xs font-medium transition-all duration-200",
                  item.isAction ? "sr-only" : "block"
                )}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
    </div>
  )
}