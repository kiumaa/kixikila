'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2, Gift, Users, Star, Copy, Check, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const mockInvitedFriends = [
  { id: '1', name: 'Pedro Costa', status: 'completed', vipEarned: true, date: '2024-01-10' },
  { id: '2', name: 'Maria Silva', status: 'pending', vipEarned: false, date: '2024-01-12' },
  { id: '3', name: 'João Santos', status: 'completed', vipEarned: true, date: '2024-01-08' }
]

export default function InviteScreen() {
  const referralCode = "KIXANA2025"
  const referralLink = `https://kixikila.app/join?ref=${referralCode}`
  const invitedFriends = mockInvitedFriends.filter(f => f.status === 'completed').length
  const vipMonthsEarned = mockInvitedFriends.filter(f => f.vipEarned).length
  const [copied, setCopied] = useState(false)
  
  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`${type === 'code' ? 'Código' : 'Link'} copiado!`)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Erro ao copiar')
    }
  }

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Junte-se ao KIXIKILA',
          text: `Use o meu código ${referralCode} e ganhe benefícios especiais!`,
          url: referralLink
        })
      } catch (err) {
        copyToClipboard(referralLink, 'link')
      }
    } else {
      copyToClipboard(referralLink, 'link')
    }
  }
  
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-6 pt-14 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => window.history.back()}
            className="p-2 bg-card/20 backdrop-blur-sm rounded-xl hover:bg-card/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Convidar Amigos</h1>
        </div>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-card/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
            <Gift className="w-10 h-10 text-primary-foreground" />
          </div>
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
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button
              variant="secondary"
              onClick={() => copyToClipboard(referralCode, 'code')}
              className="flex-1"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copiar Código
            </Button>
            <Button
              onClick={shareInvite}
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Partilhar
            </Button>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">Link de convite:</p>
            <div className="bg-muted rounded-lg p-2 text-xs text-muted-foreground font-mono break-all">
              {referralLink}
            </div>
          </div>
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

        {/* Invited Friends List */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Amigos Convidados</h3>
          {mockInvitedFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p>Ainda não convidou ninguém</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockInvitedFriends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{friend.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(friend.date).toLocaleDateString('pt-PT')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {friend.status === 'completed' ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-green-600">Ativo</div>
                        {friend.vipEarned && (
                          <div className="text-xs text-yellow-600 flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            VIP ganho
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Pendente</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}