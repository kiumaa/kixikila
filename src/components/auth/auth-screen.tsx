'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

interface AuthScreenProps {
  onBack: () => void
}

export function AuthScreen({ onBack }: AuthScreenProps) {
  const { signUp, signIn } = useAuth()
  const [mode, setMode] = useState<'choice' | 'register' | 'login'>('choice')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setError(null)
    setSuccess(null)
  }

  const getErrorMessage = (error: any): string => {
    if (!error?.message) return 'Erro desconhecido'
    
    const message = error.message.toLowerCase()
    
    // Signup specific errors
    if (message.includes('user already registered')) {
      return 'Este email já está registado. Tente fazer login ou use outro email.'
    }
    if (message.includes('invalid email')) {
      return 'Email inválido. Verifique o formato do email.'
    }
    if (message.includes('password')) {
      if (message.includes('short')) {
        return 'A palavra-passe deve ter pelo menos 6 caracteres.'
      }
      return 'Palavra-passe inválida. Verifique os critérios de segurança.'
    }
    
    // Login specific errors
    if (message.includes('invalid login credentials')) {
      return 'Email ou palavra-passe incorretos. Verifique os seus dados.'
    }
    if (message.includes('email not confirmed')) {
      return 'Por favor, confirme o seu email antes de fazer login. Verifique a sua caixa de entrada.'
    }
    if (message.includes('too many requests')) {
      return 'Demasiadas tentativas. Aguarde alguns minutos antes de tentar novamente.'
    }
    
    // Network errors
    if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
      return 'Erro de ligação. Verifique a sua internet e tente novamente.'
    }
    
    return error.message
  }

  const handleBack = () => {
    if (mode === 'choice') {
      onBack()
    } else {
      setMode('choice')
      resetForm()
    }
  }

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      setError('Todos os campos são obrigatórios')
      return
    }

    if (!email.includes('@')) {
      setError('Por favor, introduza um email válido')
      return
    }

    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    console.log('[AuthScreen] Starting registration process for:', email)

    try {
      const { error } = await signUp(email, password, { full_name: fullName })
      
      if (error) {
        console.error('[AuthScreen] Registration error:', error)
        setError(getErrorMessage(error))
      } else {
        console.log('[AuthScreen] Registration successful, user should receive confirmation email')
        setSuccess('Conta criada com sucesso! Verifique o seu email para confirmar a conta.')
        // Reset form after successful registration
        setTimeout(() => {
          resetForm()
        }, 2000)
      }
    } catch (err) {
      console.error('[AuthScreen] Unexpected registration error:', err)
      setError('Erro inesperado. Verifique a sua ligação à internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email e palavra-passe são obrigatórios')
      return
    }

    if (!email.includes('@')) {
      setError('Por favor, introduza um email válido')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    console.log('[AuthScreen] Starting login process for:', email)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        console.error('[AuthScreen] Login error:', error)
        setError(getErrorMessage(error))
      } else {
        console.log('[AuthScreen] Login successful, redirecting to dashboard')
        setSuccess('Login realizado com sucesso! A redirecionar...')
        // User will be redirected automatically by auth state change
      }
    } catch (err) {
      console.error('[AuthScreen] Unexpected login error:', err)
      setError('Erro inesperado. Verifique a sua ligação à internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo ao KIXIKILA</h1>
            <p className="text-gray-600">Escolha uma opção para continuar</p>
          </div>

          <div className="space-y-3">
            <Button
              variant="default"
              size="lg"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              onClick={() => setMode('register')}
            >
              Criar Conta
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => setMode('login')}
            >
              Já tenho conta
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'register' ? 'Criar Conta' : 'Entrar'}
          </h1>
          <p className="text-gray-600">
            {mode === 'register' 
              ? 'Junte-se à comunidade KIXIKILA' 
              : 'Entre na sua conta KIXIKILA'}
          </p>
        </div>

        <div className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ana Santos"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana.santos@email.pt"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Palavra-passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            variant="default"
            size="lg"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white disabled:opacity-50"
            onClick={mode === 'register' ? handleRegister : handleLogin}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {mode === 'register' ? 'A criar conta...' : 'A entrar...'}
              </div>
            ) : (
              mode === 'register' ? 'Criar Conta' : 'Entrar'
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {mode === 'register' ? 'Já tem conta?' : 'Não tem conta?'}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'register' ? 'login' : 'register')
                  resetForm()
                }}
                className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                disabled={loading}
              >
                {mode === 'register' ? 'Fazer login' : 'Criar conta'}
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}