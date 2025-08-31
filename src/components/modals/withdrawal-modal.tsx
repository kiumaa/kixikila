'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowUpRight, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface WithdrawalModalProps {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onWithdrawal: (amount: number) => void
}

export function WithdrawalModal({ isOpen, onClose, currentBalance, onWithdrawal }: WithdrawalModalProps) {
  const [amount, setAmount] = useState('')
  const [iban, setIban] = useState('')
  const [accountName, setAccountName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form')

  const quickAmounts = [50, 100, 250, Math.floor(currentBalance)]

  const handleWithdrawal = async () => {
    const withdrawalAmount = parseFloat(amount)
    
    if (!amount || withdrawalAmount < 10) {
      toast.error('Valor mínimo: €10')
      return
    }

    if (withdrawalAmount > currentBalance) {
      toast.error('Saldo insuficiente')
      return
    }

    if (!iban || !accountName) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setIsLoading(true)
    setStep('processing')
    
    try {
      // Mock processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock successful withdrawal
      onWithdrawal(withdrawalAmount)
      setStep('success')
      
      setTimeout(() => {
        onClose()
        resetForm()
      }, 3000)
      
      toast.success('Levantamento solicitado com sucesso!')
    } catch (error: any) {
      console.error('Withdrawal error:', error)
      toast.error('Erro ao processar levantamento')
      setStep('form')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStep('form')
    setAmount('')
    setIban('')
    setAccountName('')
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-red-500" />
              Levantamento
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
              <h3 className="text-lg font-semibold mb-2">A processar levantamento...</h3>
              <p className="text-muted-foreground text-sm">Validando dados bancários...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Levantamento Solicitado!</h3>
              <p className="text-muted-foreground text-sm">
                O valor será transferido em 1-2 dias úteis
              </p>
            </div>
          )}

          {step === 'form' && (
            <div className="space-y-6">
              <Card className="p-4 bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">Saldo disponível</div>
                <div className="text-2xl font-bold text-foreground">
                  €{currentBalance.toFixed(2)}
                </div>
              </Card>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Valor a levantar
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
                    max={currentBalance}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Mínimo: €10 • Máximo: €{currentBalance.toFixed(2)}
                </p>
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
                      disabled={value > currentBalance}
                    >
                      €{value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome do titular da conta *
                  </label>
                  <Input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Nome completo como no banco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    IBAN *
                  </label>
                  <Input
                    value={iban}
                    onChange={(e) => setIban(e.target.value.toUpperCase())}
                    placeholder="PT50 0000 0000 0000 0000 0000 0"
                    maxLength={29}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato: PT50 seguido de 23 dígitos
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Importante:</p>
                    <p>O levantamento será processado em 1-2 dias úteis. Verifique se os dados bancários estão corretos.</p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleWithdrawal}
                disabled={isLoading || !amount || !iban || !accountName || parseFloat(amount) < 10 || parseFloat(amount) > currentBalance}
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Solicitar Levantamento €{amount || '0.00'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}