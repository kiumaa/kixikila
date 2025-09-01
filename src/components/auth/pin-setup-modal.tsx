'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { KeyRound, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

interface PinSetupModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PinSetupModal({ isOpen, onClose }: PinSetupModalProps) {
  // PIN setup functionality can be implemented later if needed
  const [step, setStep] = useState<'setup' | 'confirm' | 'success'>('setup')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handlePinInput = (value: string, index: number, isConfirm = false) => {
    const currentPin = isConfirm ? confirmPin : pin
    const newPin = currentPin.split('')
    newPin[index] = value
    const updatedPin = newPin.join('')
    
    if (isConfirm) {
      setConfirmPin(updatedPin)
    } else {
      setPin(updatedPin)
    }
  }

  const handleSetupSubmit = () => {
    if (pin.length !== 4) {
      toast.error('PIN deve ter 4 dígitos')
      return
    }
    setStep('confirm')
  }

  const handleConfirmSubmit = async () => {
    if (confirmPin !== pin) {
      toast.error('PINs não coincidem')
      setConfirmPin('')
      return
    }

    setIsLoading(true)
    
    try {
      // PIN setup functionality to be implemented
      setStep('success')
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false)
    }
    
    setIsLoading(false)
  }

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('setup')
      setConfirmPin('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-8 animate-scale-in">
        {step === 'setup' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Configurar PIN
              </h2>
              <p className="text-muted-foreground text-sm">
                Crie um PIN de 4 dígitos para proteger a sua conta
              </p>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-foreground mb-4 text-center">
                Novo PIN de Segurança
              </label>
              <div className="flex gap-3 justify-center">
                {[...Array(4)].map((_, i) => (
                  <input
                    key={i}
                    type="password"
                    maxLength={1}
                    value={pin[i] || ''}
                    onChange={(e) => {
                      handlePinInput(e.target.value, i)
                      if (e.target.value && i < 3) {
                        const nextInput = e.target.parentElement?.children[i + 1] as HTMLInputElement
                        if (nextInput) nextInput.focus()
                      }
                    }}
                    className="w-14 h-14 text-center text-2xl font-bold border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleSetupSubmit}
              disabled={pin.length !== 4}
              size="lg"
              className="w-full"
            >
              Continuar
            </Button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Confirmar PIN
              </h2>
              <p className="text-muted-foreground text-sm">
                Introduza novamente o seu PIN para confirmar
              </p>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-foreground mb-4 text-center">
                Confirme o seu PIN
              </label>
              <div className="flex gap-3 justify-center">
                {[...Array(4)].map((_, i) => (
                  <input
                    key={i}
                    type="password"
                    maxLength={1}
                    value={confirmPin[i] || ''}
                    onChange={(e) => {
                      handlePinInput(e.target.value, i, true)
                      if (e.target.value && i < 3) {
                        const nextInput = e.target.parentElement?.children[i + 1] as HTMLInputElement
                        if (nextInput) nextInput.focus()
                      }
                    }}
                    className="w-14 h-14 text-center text-2xl font-bold border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleBack}
                size="lg"
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleConfirmSubmit}
                disabled={confirmPin.length !== 4 || isLoading}
                size="lg"
                className="flex-1"
              >
                {isLoading ? 'Confirmando...' : 'Confirmar'}
              </Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              PIN Configurado!
            </h2>
            <p className="text-muted-foreground">
              A sua conta foi criada com sucesso
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}