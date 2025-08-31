'use client'

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen'
import { AuthScreen } from '@/components/auth/auth-screen'
import { DashboardScreen } from '@/components/dashboard/dashboard-screen'
import WalletScreen from '@/components/wallet/wallet-screen'
import InviteScreen from '@/components/invite/invite-screen'
import ProfileScreen from '@/components/profile/profile-screen'

export default function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <OnboardingScreen />} />
      <Route path="/entrar" element={user ? <Navigate to="/dashboard" replace /> : <AuthScreen />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={user ? <DashboardScreen /> : <Navigate to="/" replace />} />
      <Route path="/wallet" element={user ? <WalletScreen /> : <Navigate to="/" replace />} />
      <Route path="/invite" element={user ? <InviteScreen /> : <Navigate to="/" replace />} />
      <Route path="/profile" element={user ? <ProfileScreen /> : <Navigate to="/" replace />} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  )
}