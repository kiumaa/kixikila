'use client'

import { AuthScreen } from '@/components/auth/auth-screen'

export default function LoginPage() {
  return <AuthScreen onBack={() => window.history.back()} />
}