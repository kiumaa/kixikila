'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, Download, Eye, EyeOff } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function WalletPage() {
  const navigate = useNavigate()
  const [balanceVisible, setBalanceVisible] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-primary-hover px-6 pt-14 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-primary-foreground/20 backdrop-blur-sm rounded-xl hover:bg-primary-foreground/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Carteira Digital</h1>
        </div>

        <Card className="bg-primary-foreground/10 backdrop-blur-md border-0 text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-primary-foreground/80 text-sm mb-2">Saldo Disponível</div>
                <div className="text-4xl font-bold">
                  {balanceVisible ? formatCurrency(1250.50) : '••••••'}
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
                className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Upload className="w-4 h-4 mr-2" />
                Depositar
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
              >
                <Download className="w-4 h-4 mr-2" />
                Levantar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Ainda não tem transações</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}