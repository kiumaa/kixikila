'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Phone, Lock, Smartphone, KeyRound } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { PinSetupModal } from './pin-setup-modal'

interface AuthScreenProps {
  onBack: () => void
}

export function AuthScreen({ onBack }: AuthScreenProps) {
  const { signUp, signIn, verifyOTP, verifyPIN } = useAuth()
  const [mode, setMode] = useState<'choice' | 'register' | 'login'>('choice')
  const [step, setStep] = useState<'phone' | 'otp' | 'pin'>('phone')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [otp, setOtp] = useState('')
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.startsWith('351')) {
      return numbers.slice(3)
    }
    return numbers.slice(0, 9)
  }

  const handlePhoneSubmit = async () => {
    if (phone.length < 9) {
      toast.error('Número de telefone inválido')
      return
    }

    setIsLoading(true)
    
    try {
      if (mode === 'register') {
        if (!fullName.trim()) {
          toast.error('Nome completo é obrigatório')
          setIsLoading(false)
          return
        }
        
        const result = await signUp(phone, fullName.trim())
        if (result.success) {
          setStep('otp')
          toast.success('Código SMS enviado!')
        } else {
          toast.error('Este número já está registado')
        }
      } else {
        const result = await signIn(phone)
        if (result.success) {
          if (result.requiresOTP) {
            setStep('otp')
            toast.success('Código SMS enviado!')
          } else if (result.requiresPIN) {
            setStep('pin')
          }
        } else {
          toast.error('Número não encontrado')
        }
      }
    } catch (error) {
      toast.error('Erro de conexão')
    }
    
    setIsLoading(false)
  }

  const handleOTPSubmit = async () => {
    if (otp.length !== 6) {
      toast.error('Código deve ter 6 dígitos')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await verifyOTP(phone, otp)
      if (result.success) {
        if (result.requiresPIN) {
          setShowPinModal(true)
        } else {
          setStep('pin')
        }
      } else {
        toast.error('Código inválido')
      }
    } catch (error) {
      toast.error('Erro ao verificar código')
    }
    
    setIsLoading(false)
  }

  const handlePINSubmit = async () => {
    if (pin.length !== 4) {
      toast.error('PIN deve ter 4 dígitos')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await verifyPIN(pin)
      if (result.success) {
        toast.success('Login efetuado com sucesso!')
      } else {
        toast.error('PIN incorreto')
        setPin('')
      }
    } catch (error) {
      toast.error('Erro ao verificar PIN')
    }
    
    setIsLoading(false)
  }

  const resetForm = () => {
    setPhone('')
    setFullName('')
    setOtp('')
    setPin('')
    setStep('phone')
  }

  const handleModeChange = (newMode: 'register' | 'login') => {
    setMode(newMode)
    resetForm()
  }

  const handleBack = () => {
    if (step === 'phone' && mode !== 'choice') {
      setMode('choice')
      resetForm()
    } else if (step !== 'phone') {
      setStep('phone')
      setOtp('')
      setPin('')
    } else {
      onBack()
    }
  }

  if (mode === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Bem-vindo</h1>
            <p className="text-muted-foreground">Entre na sua conta KIXIKILA</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => handleModeChange('register')}
              size="lg"
              className="w-full"
            >
              Criar Conta Nova
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleModeChange('login')}
              size="lg"
              className="w-full"
            >
              Já tenho conta
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
            {step === 'phone' ? (
              <Phone className="w-10 h-10 text-white" />
            ) : step === 'otp' ? (
              <Smartphone className="w-10 h-10 text-white" />
            ) : (
              <KeyRound className="w-10 h-10 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {mode === 'register' ? 'Criar Conta' : 'Entrar'}
          </h1>
          <p className="text-muted-foreground">
            {step === 'phone' ? 'Introduza os seus dados' : 
             step === 'otp' ? `Código enviado para +351 ${phone}` :
             'Introduza o seu PIN de 4 dígitos'}
          </p>
        </div>

        <div className="space-y-6">
          {step === 'phone' && (
            <>
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome Completo
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ana Santos"
                    required
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Número de Telemóvel
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">
                    +351
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="w-full pl-16 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="912 345 678"
                    maxLength={9}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Vamos enviar um código SMS para este número
                </p>
              </div>

              <Button
                onClick={handlePhoneSubmit}
                disabled={phone.length < 9 || (mode === 'register' && !fullName.trim()) || isLoading}
                size="lg"
                className="w-full"
              >
                {isLoading ? 'Carregando...' : mode === 'register' ? 'Criar Conta' : 'Enviar Código SMS'}
              </Button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Código de Verificação
                </label>
                <div className="flex gap-2 justify-center">
                  {[...Array(6)].map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={otp[i] || ''}
                      onChange={(e) => {
                        const newOtp = otp.split('')
                        newOtp[i] = e.target.value
                        setOtp(newOtp.join(''))
                        if (e.target.value && i < 5) {
                          const nextInput = e.target.parentElement?.children[i + 1] as HTMLInputElement
                          if (nextInput) nextInput.focus()
                        }
                      }}
                      className="w-12 h-12 text-center text-xl font-bold border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Use qualquer código de 6 dígitos (mock)
                </p>
              </div>

              <Button
                onClick={handleOTPSubmit}
                disabled={otp.length !== 6 || isLoading}
                size="lg"
                className="w-full"
              >
                {isLoading ? 'Verificando...' : 'Verificar Código'}
              </Button>
            </>
          )}

          {step === 'pin' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  PIN de Segurança
                </label>
                <div className="flex gap-3 justify-center">
                  {[...Array(4)].map((_, i) => (
                    <input
                      key={i}
                      type="password"
                      maxLength={1}
                      value={pin[i] || ''}
                      onChange={(e) => {
                        const newPin = pin.split('')
                        newPin[i] = e.target.value
                        setPin(newPin.join(''))
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
                onClick={handlePINSubmit}
                disabled={pin.length !== 4 || isLoading}
                size="lg"
                className="w-full"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </>
          )}
        </div>
      </Card>

      <PinSetupModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
      />
    </div>
  )
}