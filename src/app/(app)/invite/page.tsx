'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Gift, Share2 } from 'lucide-react'

export default function InvitePage() {
  return (
    <div className="min-h-screen bg-background p-6 pt-20">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Convide Amigos</h1>
          <p className="text-muted-foreground">Ganhe 1 mês VIP grátis por cada amigo que se registar</p>
        </div>

        <Card className="bg-gradient-to-r from-primary-subtle to-accent p-6">
          <div className="text-center">
            <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Programa Refer-a-Friend</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Quando um amigo faz o primeiro pagamento, ganha 1 mês VIP grátis!
            </p>
            <Button size="lg" className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              Partilhar Convite
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Amigos Convidados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Ainda não convidou ninguém</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}