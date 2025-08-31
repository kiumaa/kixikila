'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2, Gift, Users, Star } from 'lucide-react'

export default function InviteScreen() {
  const referralCode = "KIXANA2025"
  const invitedFriends = 3
  const vipMonthsEarned = 2
  
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-6 pt-14 pb-24">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-card/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
            <Gift className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">Convidar Amigos</h1>
          <p className="text-primary-foreground/80">Por cada amigo que convidares, ganhas 1 mês VIP grátis!</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{invitedFriends}</div>
            <div className="text-xs text-muted-foreground mt-1">Amigos Convidados</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{vipMonthsEarned}</div>
            <div className="text-xs text-muted-foreground mt-1">Meses VIP Ganhos</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">€150</div>
            <div className="text-xs text-muted-foreground mt-1">Poupado</div>
          </Card>
        </div>

        {/* Referral Code */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4 text-center">O Teu Código de Convite</h3>
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 text-center mb-4">
            <div className="text-3xl font-bold text-primary tracking-wider">{referralCode}</div>
          </div>
          <Button className="w-full" size="lg">
            <Share2 className="w-5 h-5 mr-2" />
            Partilhar Código
          </Button>
        </Card>

        {/* How It Works */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Como Funciona</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Share2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">1. Partilha o teu código</div>
                <div className="text-sm text-muted-foreground">Envia o código aos teus amigos</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">2. Amigo regista-se</div>
                <div className="text-sm text-muted-foreground">Usando o teu código de convite</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <div className="font-medium text-foreground">3. Ganhas 1 mês VIP</div>
                <div className="text-sm text-muted-foreground">Quando o amigo fizer o primeiro pagamento</div>
              </div>
            </div>
          </div>
        </Card>

        {/* VIP Benefits */}
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-3">Benefícios VIP</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-yellow-700">
              <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
              <span>Grupos ilimitados</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-700">
              <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
              <span>Relatórios avançados</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-700">
              <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
              <span>Suporte prioritário</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}