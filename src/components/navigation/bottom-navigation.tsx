'use client'

import { Home, Wallet, Plus, Users, User } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { CreateGroupModal } from '@/components/modals/create-group-modal'

export function BottomNavigation() {
  const location = useLocation()
  const pathname = location.pathname
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  const navItems = [
    { key: 'dashboard', icon: Home, label: 'Início', path: '/dashboard' },
    { key: 'wallet', icon: Wallet, label: 'Carteira', path: '/wallet' },
    { key: 'create', icon: Plus, label: 'Criar', isAction: true },
    { key: 'invite', icon: Users, label: 'Convidar', path: '/invite' },
    { key: 'profile', icon: User, label: 'Perfil', path: '/profile' }
  ]

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border z-40">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const isActive = pathname === item.path
              const isCreateButton = item.isAction
              
              if (isCreateButton) {
                return (
                  <Button
                    key={item.key}
                    onClick={() => setShowCreateGroup(true)}
                    size="lg"
                    className="w-14 h-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 ios-button"
                    aria-label="Criar grupo"
                  >
                    <item.icon className="w-6 h-6" />
                  </Button>
                )
              }

              return (
                <Link
                  key={item.key}
                  to={item.path!}
                  className={`relative flex flex-col items-center gap-1 py-3 px-4 rounded-xl transition-all duration-200 ios-button ${
                    isActive 
                      ? 'text-primary bg-primary/10 scale-105' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  aria-label={item.label}
                >
                  <div className="relative">
                    <item.icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'scale-110' : ''}`} />
                  </div>
                  <span className={`text-xs font-medium font-system transition-all duration-200 ${
                    isActive ? 'font-semibold' : ''
                  }`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-bounce-in" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <CreateGroupModal 
        isOpen={showCreateGroup} 
        onClose={() => setShowCreateGroup(false)} 
      />
    </>
  )
}