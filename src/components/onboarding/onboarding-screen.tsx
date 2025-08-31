'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Users, Shield, Wallet, Sparkles, ArrowRight } from 'lucide-react'

interface OnboardingScreenProps {
  onComplete: () => void
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: <Users className="w-16 h-16 text-primary" />,
      title: "Poupança Colaborativa",
      description: "Junte-se a grupos de poupança e alcance os seus objetivos financeiros mais rapidamente com amigos e família."
    },
    {
      icon: <Shield className="w-16 h-16 text-emerald-500" />,
      title: "100% Seguro",
      description: "Transações protegidas com tecnologia bancária e verificação por SMS para máxima segurança dos seus fundos."
    },
    {
      icon: <Wallet className="w-16 h-16 text-purple-500" />,
      title: "Carteira Digital",
      description: "Gerencie os seus fundos facilmente com depósitos e levantamentos instantâneos através da sua carteira digital."
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    setCurrentStep(steps.length - 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {currentStep < steps.length ? (
          <Card className="p-8 text-center transition-all duration-500 animate-fade-in">
            <div className="mb-8">{steps[currentStep].icon}</div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {steps[currentStep].title}
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {steps[currentStep].description}
            </p>
            
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? 'w-8 bg-primary' 
                      : index < currentStep 
                        ? 'w-2 bg-primary/60'
                        : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleNext}
                className="w-full"
                size="lg"
              >
                {currentStep === steps.length - 1 ? 'Começar' : 'Continuar'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              {currentStep < steps.length - 1 && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="w-full"
                >
                  Saltar introdução
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center transition-all duration-500 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-3">
              KIXIKILA
            </h1>
            <p className="text-muted-foreground mb-8 text-lg">
              A forma mais inteligente de poupar em grupo
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={onComplete}
                size="lg"
                className="w-full"
              >
                Começar Agora
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}