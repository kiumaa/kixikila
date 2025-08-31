'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Users, Shield, Wallet, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function OnboardingScreen() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()

  const features = [
    {
      icon: <Users className="w-12 h-12 text-primary" />,
      title: "Poupança Colaborativa",
      description: "Junte-se a grupos de poupança e alcance seus objetivos financeiros mais rapidamente"
    },
    {
      icon: <Shield className="w-12 h-12 text-success" />,
      title: "100% Seguro",
      description: "Transações protegidas via Stripe e verificação KYC para máxima segurança"
    },
    {
      icon: <Wallet className="w-12 h-12 text-warning" />,
      title: "Carteira Digital",
      description: "Gerencie seus fundos facilmente com depósitos e levantamentos instantâneos"
    }
  ]

  if (step < 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Card className="p-8 text-center transition-all duration-300">
            <div className="mb-6">{features[step].icon}</div>
            <h2 className="text-2xl font-bold text-foreground mb-3">{features[step].title}</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">{features[step].description}</p>
            
            <div className="flex justify-center gap-2 mb-8">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step ? 'w-8 bg-primary' : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <Button
              size="lg"
              className="w-full"
              onClick={() => setStep(step + 1)}
            >
              Continuar
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Card className="p-8 text-center transition-all duration-300">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-primary-hover rounded-3xl flex items-center justify-center shadow-xl">
            <Sparkles className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent mb-3">
            KIXIKILA
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            A forma mais inteligente de poupar em grupo
          </p>
          
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate('/entrar?modo=registar')}
            >
              Criar Conta
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/entrar?modo=entrar')}
            >
              Já tenho conta
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}