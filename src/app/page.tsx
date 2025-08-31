'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen'
import { AuthScreen } from '@/components/auth/auth-screen'
import { KYCModal } from '@/components/modals/kyc-modal'

export default function HomePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [showAuth, setShowAuth] = useState(false)
  const [showKYC, setShowKYC] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      if (user.first_login) {
        setShowKYC(true)
      } else {
        navigate('/dashboard')
      }
    }
  }, [user, loading, navigate])

  const handleOnboardingComplete = () => {
    setShowAuth(true)
  }

  const handleAuthBack = () => {
    setShowAuth(false)
  }

  const handleKYCClose = () => {
    setShowKYC(false)
    navigate('/dashboard')
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (user && !user.first_login) {
    return <LoadingScreen />
  }

  if (showAuth) {
    return <AuthScreen onBack={handleAuthBack} />
  }

  return (
    <>
      <OnboardingScreen onComplete={handleOnboardingComplete} />
      <KYCModal isOpen={showKYC} onClose={handleKYCClose} />
    </>
  )
}