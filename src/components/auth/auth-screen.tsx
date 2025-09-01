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

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setError(null)
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

    setLoading(true)
    setError(null)

    try {
      const { error } = await signUp(email, password, { full_name: fullName })
      
      if (error) {
        setError(error.message || 'Erro ao criar conta')
      } else {
        setError(null)
        // User will be redirected automatically by auth state change
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email e palavra-passe são obrigatórios')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        setError(error.message || 'Erro ao fazer login')
      } else {
        setError(null)
        // User will be redirected automatically by auth state change
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
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

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            variant="default"
            size="lg"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
            onClick={mode === 'register' ? handleRegister : handleLogin}
            disabled={loading}
          >
            {mode === 'register' ? 'Criar Conta' : 'Entrar'}
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