'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BottomNavigation } from '@/components/navigation/bottom-navigation'
import { ArrowLeft, Eye, EyeOff, Upload, Download, History } from 'lucide-react'

export default function WalletScreen() {
  const [balanceVisible, setBalanceVisible] = useState(true)
  
  const balance = 1250.50
  const transactions = [
    { id: 1, type: 'deposit', amount: 500, date: '2025-01-15', description: 'Depósito Stripe' },
    { id: 2, type: 'payment', amount: -100, date: '2025-01-10', description: 'Pagamento Grupo Família' },
    { id: 3, type: 'reward', amount: 800, date: '2025-01-05', description: 'Prémio Recebido' },
  ]
  
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-6 pt-14 pb-32">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-xl font-bold text-primary-foreground">Carteira Digital</h1>
        </div>

        {/* Balance Card */}
        <Card className="bg-card/10 backdrop-blur-md border-0 text-primary-foreground">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-primary-foreground/80 text-sm mb-2">Saldo Disponível</div>
                <div className="text-4xl font-bold">
                  {balanceVisible ? `€${balance.toFixed(2)}` : '••••••'}
                </div>
              </div>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                {balanceVisible ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-card text-card-foreground hover:bg-card/90"
              >
                <Upload className="w-4 h-4 mr-2" />
                Depositar
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-card/20 hover:bg-card/30 text-primary-foreground border-0"
              >
                <Download className="w-4 h-4 mr-2" />
                Levantar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions */}
      <div className="px-6 -mt-16">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Transações</h3>
            <Button variant="ghost" size="sm">
              <History className="w-4 h-4 mr-2" />
              Ver Todas
            </Button>
          </div>
          
          <div className="space-y-3">
            {transactions.map(transaction => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground text-sm">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">{transaction.date}</p>
                </div>
                <div className={`font-bold ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-foreground'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}€{Math.abs(transaction.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  )
}