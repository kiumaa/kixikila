'use client'

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen'
import { AuthScreen } from '@/components/auth/auth-screen'
import Dashboard from '@/pages/dashboard'
import WalletScreen from '@/components/wallet/wallet-screen'
import InviteScreen from '@/components/invite/invite-screen'
import ProfileScreen from '@/components/profile/profile-screen'
import { NotificationsScreen } from '@/components/notifications/notifications-screen'

export default function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <OnboardingScreen onComplete={() => {}} />} />
      <Route path="/entrar" element={user ? <Navigate to="/dashboard" replace /> : <AuthScreen onBack={() => window.history.back()} />} />
      
      {/* Protected routes */}
      {user ? (
        <>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wallet" element={<WalletScreen />} />
          <Route path="/invite" element={<InviteScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  )
}