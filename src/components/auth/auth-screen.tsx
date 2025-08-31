'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Phone, Lock, User, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function AuthScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const mode = searchParams.get('modo') || 'entrar'
  
  const [currentStep, setCurrentStep] = useState<'phone' | 'otp' | 'register'>('phone')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [userData, setUserData] = useState({
    fullName: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  useEffect(() => {
    if (mode === 'registar') {
      setCurrentStep('register')
    }
  }, [mode])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleSendOTP = async () => {
    if (!phone || phone.length < 9) {
      toast.error('Introduza um número de telemóvel válido')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.functions.invoke('send-otp-sms', {
        body: { phone: `+351${phone}`, type: 'login' }
      })
      
      if (error) throw error
      
      setCurrentStep('otp')
      setResendTimer(60)
      toast.success('Código enviado via SMS')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar código')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error('Introduza o código de 6 dígitos')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { phone: `+351${phone}`, code: otpCode, type: 'login' }
      })
      
      if (error) throw error
      
      if (data.isNewUser) {
        setCurrentStep('register')
      } else {
        navigate('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.message || 'Código inválido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!userData.fullName || !userData.email) {
      toast.error('Preencha todos os campos')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        phone: `+351${phone}`,
        password: otpCode, // Using OTP as temporary password
        options: {
          data: {
            full_name: userData.fullName,
            email: userData.email,
            phone: `+351${phone}`
          }
        }
      })
      
      if (error) throw error
      
      navigate('/dashboard')
      toast.success('Conta criada com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
      <Card className="w-full max-w-md transition-all duration-300">
        <CardHeader>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-primary-hover rounded-3xl flex items-center justify-center shadow-xl">
              <Lock className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {mode === 'registar' ? 'Criar Conta' : 'Bem-vindo'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'registar' ? 'Junte-se à comunidade KIXIKILA' : 'Entre na sua conta KIXIKILA'}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {currentStep === 'register' && (
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Nome completo"
                  value={userData.fullName}
                  onChange={(e) => setUserData({...userData, fullName: e.target.value})}
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={userData.email}
                  onChange={(e) => setUserData({...userData, email: e.target.value})}
                  className="pl-10"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleRegister}
                disabled={isLoading || !userData.fullName || !userData.email}
              >
                {isLoading ? 'A criar conta...' : 'Criar Conta'}
              </Button>
            </div>
          )}

          {currentStep === 'phone' && (
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="tel"
                  placeholder="912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="pl-10"
                  maxLength={9}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSendOTP}
                disabled={isLoading || phone.length < 9}
              >
                {isLoading ? 'A enviar...' : 'Enviar Código SMS'}
              </Button>
            </div>
          )}

          {currentStep === 'otp' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-muted-foreground mb-2">Código enviado para</p>
                <p className="font-semibold text-foreground">+351 {phone}</p>
              </div>

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
                      value={otpCode[i] || ''}
                      onChange={(e) => {
                        const newOtp = otpCode.split('')
                        newOtp[i] = e.target.value
                        setOtpCode(newOtp.join(''))
                        if (e.target.value && i < 5) {
                          const nextInput = e.target.parentElement?.children[i + 1] as HTMLInputElement
                          if (nextInput) nextInput.focus()
                        }
                      }}
                      className="w-12 h-12 text-center text-xl font-bold border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleVerifyOTP}
                disabled={isLoading || otpCode.length !== 6}
              >
                {isLoading ? 'A verificar...' : 'Verificar e Entrar'}
              </Button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Reenviar código em {resendTimer}s
                  </p>
                ) : (
                  <button
                    onClick={handleSendOTP}
                    className="text-sm text-primary font-semibold hover:text-primary-hover transition-colors"
                  >
                    Reenviar código
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}