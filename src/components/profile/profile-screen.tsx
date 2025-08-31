'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BottomNavigation } from '@/components/navigation/bottom-navigation'
import { useAuth } from '@/lib/auth-context'
import { 
  User, Shield, CreditCard, Bell, Lock, FileText, 
  HelpCircle, LogOut, ChevronRight, Crown, Check 
} from 'lucide-react'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  
  const userProfile = {
    name: "Ana Santos",
    email: user?.email || "ana.santos@email.pt",
    phone: "+351 912 345 678",
    isVIP: true,
    vipExpiry: "2025-12-15",
    trustScore: 98,
    activeGroups: 3,
    completedCycles: 12,
    totalSaved: 5420.80
  }
  
  const menuItems = [
    { icon: User, label: 'Dados Pessoais', href: '/profile/personal' },
    { icon: Shield, label: 'Verificação KYC', href: '/profile/kyc' },
    { icon: CreditCard, label: 'Métodos de Pagamento', href: '/profile/payments' },
    { icon: Bell, label: 'Notificações', href: '/profile/notifications' },
    { icon: Lock, label: 'Segurança', href: '/profile/security' },
    { icon: FileText, label: 'Termos e Privacidade', href: '/profile/legal' },
    { icon: HelpCircle, label: 'Ajuda e Suporte', href: '/profile/help' },
  ]
  
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-6 pt-14 pb-32">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-foreground/20 to-primary-foreground/10 rounded-full flex items-center justify-center text-primary-foreground font-bold text-2xl">
            AS
          </div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-1">{userProfile.name}</h2>
          <p className="text-primary-foreground/80 mb-4">{userProfile.email}</p>
          
          <div className="flex justify-center gap-2">
            {userProfile.isVIP && (
              <div className="bg-yellow-500/20 text-yellow-100 px-3 py-1 rounded-full text-sm font-medium">
                <Crown className="w-3 h-3 mr-1 inline" />
                VIP
              </div>
            )}
            <div className="bg-green-500/20 text-green-100 px-3 py-1 rounded-full text-sm font-medium">
              <Shield className="w-3 h-3 mr-1 inline" />
              Verificado
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-4">
        {/* Stats */}
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-4">Estatísticas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Trust Score</div>
              <div className="text-xl font-bold text-primary">{userProfile.trustScore}%</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Grupos Ativos</div>
              <div className="text-xl font-bold text-foreground">{userProfile.activeGroups}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Ciclos Completos</div>
              <div className="text-xl font-bold text-foreground">{userProfile.completedCycles}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Poupado</div>
              <div className="text-xl font-bold text-green-600">€{userProfile.totalSaved.toFixed(2)}</div>
            </div>
          </div>
        </Card>

        {/* VIP Status */}
        {userProfile.isVIP ? (
          <Card className="p-5 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-900">Plano VIP</h3>
                  <p className="text-xs text-yellow-700">Válido até {userProfile.vipExpiry}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                Gerir
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-yellow-700">
                <Check className="w-4 h-4" />
                <span>Grupos ilimitados</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-700">
                <Check className="w-4 h-4" />
                <span>Relatórios avançados</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-700">
                <Check className="w-4 h-4" />
                <span>Suporte prioritário</span>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-5 bg-gradient-to-r from-muted/50 to-muted/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Plano Gratuito</h3>
                <p className="text-xs text-muted-foreground">Limitado a 2 grupos</p>
              </div>
              <Button variant="default" size="sm">
                Upgrade VIP
              </Button>
            </div>
          </Card>
        )}

        {/* Menu Items */}
        <Card>
          <div className="divide-y">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
            
            {/* Logout */}
            <button
              onClick={signOut}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-500">Terminar Sessão</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  )
}