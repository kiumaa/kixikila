'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowDownLeft, CreditCard, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onDeposit?: (amount: number) => void
}

export function DepositModal({ isOpen, onClose, currentBalance, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'amount' | 'processing' | 'success'>('amount')

  const quickAmounts = [50, 100, 250, 500]

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) < 10) {
      toast.error('Valor mínimo: €10')
      return
    }

    setIsLoading(true)
    setStep('processing')
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          amount: parseFloat(amount) * 100, // Convert to cents
          currency: 'eur',
          purpose: 'wallet_deposit'
        }
      })

      if (error) throw error

      // Open Stripe checkout in new tab
      if (data.url) {
        window.open(data.url, '_blank')
        setStep('success')
        
        // Mock successful deposit for local state
        if (onDeposit) {
          onDeposit(parseFloat(amount))
        }
        
        setTimeout(() => {
          onClose()
          setStep('amount')
          setAmount('')
        }, 3000)
      }
    } catch (error: any) {
      console.error('Deposit error:', error)
      toast.error(error.message || 'Erro ao processar depósito')
      setStep('amount')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
              Depositar Fundos
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">A processar depósito...</h3>
              <p className="text-muted-foreground text-sm">Redirecionando para o Stripe...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Depósito Iniciado!</h3>
              <p className="text-muted-foreground text-sm">Complete o pagamento no Stripe</p>
            </div>
          )}

          {step === 'amount' && (
            <div className="space-y-6">
              <Card className="p-4 bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">Saldo atual</div>
                <div className="text-2xl font-bold text-foreground">
                  €{currentBalance.toFixed(2)}
                </div>
              </Card>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Valor a depositar
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground font-semibold">
                    €
                  </span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 text-lg"
                    placeholder="0.00"
                    min="10"
                    max="5000"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Mínimo: €10 • Máximo: €5.000</p>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-3">Valores rápidos</p>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map(value => (
                    <button
                      key={value}
                      onClick={() => setAmount(value.toString())}
                      className={`p-3 border rounded-lg font-semibold text-sm transition-all ${
                        amount === value.toString()
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      €{value}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleDeposit}
                disabled={isLoading || !amount || parseFloat(amount) < 10}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Depositar €{amount || '0.00'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}