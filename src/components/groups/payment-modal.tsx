'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, CreditCard, Wallet, Calendar, Euro, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  contributionAmount: number
  userBalance: number
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  groupId, 
  groupName, 
  contributionAmount, 
  userBalance 
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'stripe'>('wallet')
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<'method' | 'processing' | 'success'>('method')

  if (!isOpen) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const canPayFromWallet = userBalance >= contributionAmount

  const handlePayment = async () => {
    try {
      setIsProcessing(true)
      setStep('processing')

      if (paymentMethod === 'wallet') {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) throw new Error('User not authenticated')

        // Pay from wallet
        const { data, error } = await (supabase as any)
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'group_payment',
            amount: -contributionAmount,
            status: 'completed',
            description: `Pagamento para grupo ${groupName}`,
            group_id: groupId,
            payment_method: 'wallet'
          })

        if (error) throw error

        // Update user wallet balance
        const { error: updateError } = await (supabase as any)
          .from('users')
          .update({ 
            wallet_balance: (supabase as any).raw(`wallet_balance - ${contributionAmount}`)
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('Error updating wallet:', updateError)
        }

      } else {
        // Pay with Stripe
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            amount: contributionAmount,
            purpose: 'group_contribution',
            groupId: groupId,
            description: `Contribuição para ${groupName}`
          }
        })

        if (error) throw error

        // Redirect to Stripe checkout
        if (data.url) {
          window.open(data.url, '_blank')
        }
      }

      setStep('success')
      
      setTimeout(() => {
        onClose()
        setStep('method')
      }, 2000)

    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error('Erro no pagamento: ' + (error.message || 'Erro desconhecido'))
      setStep('method')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderContent = () => {
    switch (step) {
      case 'processing':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-foreground mb-2">A processar pagamento...</h3>
            <p className="text-muted-foreground text-sm">
              {paymentMethod === 'wallet' ? 'Debitando da carteira' : 'Redirecionando para Stripe'}
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Pagamento Confirmado!</h3>
            <p className="text-muted-foreground text-sm">
              Sua contribuição foi registrada com sucesso
            </p>
          </div>
        )

      default:
        return (
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card className="p-4 bg-muted/50">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Grupo:</span>
                  <span className="font-medium text-foreground">{groupName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(contributionAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Data:</span>
                  <span className="font-medium text-foreground">
                    {new Date().toLocaleDateString('pt-PT')}
                  </span>
                </div>
              </div>
            </Card>

            {/* Payment Methods */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Método de Pagamento</h3>
              <div className="space-y-3">
                {/* Wallet Payment */}
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  disabled={!canPayFromWallet}
                  className={`w-full p-4 border rounded-lg text-left transition-all ${
                    paymentMethod === 'wallet' && canPayFromWallet
                      ? 'border-primary bg-primary/10' 
                      : canPayFromWallet
                      ? 'border-border hover:bg-muted/50'
                      : 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">Carteira KIXIKILA</div>
                      <div className="text-sm text-muted-foreground">
                        Saldo: {formatCurrency(userBalance)}
                        {!canPayFromWallet && (
                          <span className="text-red-500 ml-2">
                            (Saldo insuficiente)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Stripe Payment */}
                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className={`w-full p-4 border rounded-lg text-left transition-all ${
                    paymentMethod === 'stripe' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">Cartão de Crédito/Débito</div>
                      <div className="text-sm text-muted-foreground">
                        Pagamento seguro via Stripe
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Low Balance Warning */}
            {!canPayFromWallet && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">Saldo Insuficiente</h4>
                    <p className="text-sm text-amber-700">
                      Precisa de adicionar {formatCurrency(contributionAmount - userBalance)} 
                      à sua carteira ou pagar com cartão.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isProcessing || (paymentMethod === 'wallet' && !canPayFromWallet)}
                className="flex-1"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Euro className="w-4 h-4 mr-2" />
                )}
                Pagar {formatCurrency(contributionAmount)}
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Pagar Contribuição</h2>
              <p className="text-sm text-muted-foreground">Pagamento mensal do grupo</p>
            </div>
            {step === 'method' && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </Card>
    </div>
  )
}