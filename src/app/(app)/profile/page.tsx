'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Shield, Settings, LogOut, Crown, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function ProfilePage() {
  const { user, signOut } = useAuth()

  const menuItems = [
    { icon: User, label: 'Dados Pessoais', href: '/profile/personal' },
    { icon: Shield, label: 'Verificação KYC', href: '/profile/kyc' },
    { icon: Crown, label: 'Plano VIP', href: '/profile/vip' },
    { icon: Settings, label: 'Definições', href: '/profile/settings' },
  ]

  return (
    <div className="min-h-screen bg-background p-6 pt-20">
      <div className="max-w-md mx-auto space-y-6">
        {/* Profile Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{user?.full_name || 'Utilizador'}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        {/* Menu */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Terminar Sessão
        </Button>
      </div>
    </div>
  )
}