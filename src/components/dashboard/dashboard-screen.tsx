'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  Wallet, 
  Eye, 
  EyeOff, 
  Upload, 
  Download, 
  Plus, 
  Users,
  TrendingUp,
  Crown
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

export function DashboardScreen() {
  const { user } = useAuth()
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [walletBalance] = useState(1250.50)
  const [totalSaved] = useState(5420.80)
  const [totalEarned] = useState(3200.00)
  const [activeGroups] = useState(3)
  const [trustScore] = useState(98)

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-hover px-6 pt-14 pb-32">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground mb-1">
              Olá, {user?.user_metadata?.full_name?.split(' ')[0] || 'Utilizador'} 👋
            </h1>
            <p className="text-primary-foreground/80">
              {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="relative p-2.5 bg-primary-foreground/20 backdrop-blur-sm rounded-xl hover:bg-primary-foreground/30 transition-colors">
              <Bell className="w-5 h-5 text-primary-foreground" />
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                2
              </span>
            </button>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <Card className="bg-primary-foreground/10 backdrop-blur-md border-0 text-primary-foreground -mx-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/80 font-medium">Saldo da Carteira</span>
              </div>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="text-4xl font-bold mb-6">
              {balanceVisible ? formatCurrency(walletBalance) : '••••••'}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
              >
                <Upload className="w-4 h-4 mr-2" />
                Depositar
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
              >
                <Download className="w-4 h-4 mr-2" />
                Levantar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center hover:shadow-lg transition-all">
            <div className="text-2xl font-bold text-foreground">{activeGroups}</div>
            <div className="text-xs text-muted-foreground mt-1">Grupos Ativos</div>
          </Card>
          <Card className="p-4 text-center hover:shadow-lg transition-all">
            <div className="text-2xl font-bold text-success">+24%</div>
            <div className="text-xs text-muted-foreground mt-1">Rentabilidade</div>
          </Card>
          <Card className="p-4 text-center hover:shadow-lg transition-all">
            <div className="text-2xl font-bold text-primary">{trustScore}%</div>
            <div className="text-xs text-muted-foreground mt-1">Trust Score</div>
          </Card>
        </div>

        {/* VIP Banner */}
        <Card className="bg-gradient-to-r from-warning-subtle to-warning-subtle border-warning p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-warning-foreground">Upgrade para VIP</h3>
                <p className="text-xs text-warning-foreground/80">Grupos ilimitados e benefícios exclusivos</p>
              </div>
            </div>
            <Button 
              variant="default" 
              size="sm"
            >
              Ver mais
            </Button>
          </div>
        </Card>

        {/* Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Os Meus Grupos</h2>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Procurar
              </Button>
              <Button 
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar
              </Button>
            </div>
          </div>

          {/* Empty State */}
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Ainda não tem grupos</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Crie o seu primeiro grupo ou junte-se a um existente
            </p>
            <div className="flex gap-2 justify-center">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Criar Grupo
              </Button>
              <Button variant="secondary" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Procurar
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}