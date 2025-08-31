'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CreditCard, CheckCircle, AlertCircle, Users } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentCycleModalProps {
  isOpen: boolean
  onClose: () => void
  groupName: string
  contributionAmount: number
  currentBalance: number
  onPayment: (amount: number, groupName: string) => void
}

export function PaymentCycleModal({ 
  isOpen, 
  onClose, 
  groupName, 
  contributionAmount, 
  currentBalance,
  onPayment 
}: PaymentCycleModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'insufficient_funds'>('confirm')

  const handlePayment = async () => {
    if (contributionAmount > currentBalance) {
      setStep('insufficient_funds')
      return
    }

    setIsLoading(true)
    setStep('processing')
    
    try {
      // Mock processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock successful payment
      onPayment(contributionAmount, groupName)
      setStep('success')
      
      setTimeout(() => {
        onClose()
        setStep('confirm')
      }, 3000)
      
      toast.success('Pagamento realizado com sucesso!')
    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error('Erro ao processar pagamento')
      setStep('confirm')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setStep('confirm')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              Pagamento de Ciclo
            </h2>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">A processar pagamento...</h3>
              <p className="text-muted-foreground text-sm">Debitando da sua carteira...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pagamento Concluído!</h3>
              <p className="text-muted-foreground text-sm">
                Contribuição para {groupName} realizada com sucesso
              </p>
            </div>
          )}

          {step === 'insufficient_funds' && (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Saldo Insuficiente</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Precisa de €{contributionAmount.toFixed(2)} mas só tem €{currentBalance.toFixed(2)}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={() => {
                  handleClose()
                  // This would typically navigate to deposit
                }} className="flex-1">
                  Depositar
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">{groupName}</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Contribuição mensal para o próximo ciclo
                </p>
              </Card>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Valor da contribuição</span>
                  <span className="font-semibold text-lg">€{contributionAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Saldo atual</span>
                  <span className={`font-semibold ${currentBalance >= contributionAmount ? 'text-emerald-600' : 'text-red-600'}`}>
                    €{currentBalance.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Saldo após pagamento</span>
                  <span className="font-semibold">
                    €{Math.max(0, currentBalance - contributionAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Pagamento automático</p>
                    <p>O valor será debitado diretamente da sua carteira digital.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={isLoading || contributionAmount > currentBalance}
                  className="flex-1"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagar €{contributionAmount.toFixed(2)}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}