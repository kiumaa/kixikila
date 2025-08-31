'use client'

import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen'

export default function HomePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  if (loading) {
    return <LoadingScreen />
  }

  if (user) {
    return <LoadingScreen />
  }

  return <OnboardingScreen />
}