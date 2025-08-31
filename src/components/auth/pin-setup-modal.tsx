'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { X } from 'lucide-react'

interface PinSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mode?: 'setup' | 'verify' | 'change'
  title?: string
}

export function PinSetupModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  mode = 'setup',
  title 
}: PinSetupModalProps) {
  const [pin, setPin] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (mode === 'setup' && pin.length !== 6) {
      toast.error('PIN deve ter exatamente 6 dígitos')
      return
    }

    if (mode === 'verify' && pin.length !== 6) {
      toast.error('PIN deve ter exatamente 6 dígitos')
      return
    }

    if (mode === 'change' && (currentPin.length !== 6 || newPin.length !== 6)) {
      toast.error('PINs devem ter exatamente 6 dígitos')
      return
    }

    setIsLoading(true)
    
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.access_token) {
        toast.error('Sessão expirada')
        return
      }

      let requestData
      if (mode === 'setup') {
        requestData = { action: 'set', pin }
      } else if (mode === 'verify') {
        requestData = { action: 'verify', pin }
      } else {
        requestData = { action: 'change', pin: currentPin, newPin }
      }

      const { data, error } = await supabase.functions.invoke('pin-management', {
        body: requestData,
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      })

      if (error) {
        console.error('PIN function error:', error)
        toast.error('Erro ao processar PIN')
        return
      }

      if (mode === 'verify' && !data.valid) {
        toast.error('PIN incorreto')
        return
      }

      if (data.success) {
        toast.success(
          mode === 'setup' ? 'PIN definido com sucesso!' :
          mode === 'verify' ? 'PIN correto!' :
          'PIN alterado com sucesso!'
        )
        onSuccess()
        onClose()
      } else {
        toast.error(data.message || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('PIN error:', error)
      toast.error('Erro ao processar PIN')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setPin('')
    setCurrentPin('')
    setNewPin('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {title || 
             (mode === 'setup' ? 'Definir PIN de Segurança' :
              mode === 'verify' ? 'Verificar PIN' :
              'Alterar PIN')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {mode === 'setup' && (
            <>
              <p className="text-sm text-muted-foreground">
                Defina um PIN de 6 dígitos para proteger sua conta
              </p>
              <Input
                type="password"
                placeholder="Digite seu PIN (6 dígitos)"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </>
          )}

          {mode === 'verify' && (
            <>
              <p className="text-sm text-muted-foreground">
                Digite seu PIN para continuar
              </p>
              <Input
                type="password"
                placeholder="Digite seu PIN (6 dígitos)"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </>
          )}

          {mode === 'change' && (
            <>
              <p className="text-sm text-muted-foreground">
                Digite seu PIN atual e o novo PIN
              </p>
              <Input
                type="password"
                placeholder="PIN atual (6 dígitos)"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              <Input
                type="password"
                placeholder="Novo PIN (6 dígitos)"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={
                isLoading || 
                (mode === 'setup' && pin.length !== 6) ||
                (mode === 'verify' && pin.length !== 6) ||
                (mode === 'change' && (currentPin.length !== 6 || newPin.length !== 6))
              }
            >
              {isLoading ? 'Processando...' : 
               mode === 'setup' ? 'Definir PIN' :
               mode === 'verify' ? 'Verificar' :
               'Alterar PIN'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}