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
import { BottomNavigation } from '@/components/navigation/bottom-navigation'

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
      {user ? (
        <>
          <Route path="/dashboard" element={
            <div className="min-h-screen bg-background">
              <main className="pb-20">
                <DashboardScreen />
              </main>
              <BottomNavigation />
            </div>
          } />
          <Route path="/wallet" element={
            <div className="min-h-screen bg-background">
              <main className="pb-20">
                <WalletScreen />
              </main>
              <BottomNavigation />
            </div>
          } />
          <Route path="/invite" element={
            <div className="min-h-screen bg-background">
              <main className="pb-20">
                <InviteScreen />
              </main>
              <BottomNavigation />
            </div>
          } />
          <Route path="/profile" element={
            <div className="min-h-screen bg-background">
              <main className="pb-20">
                <ProfileScreen />
              </main>
              <BottomNavigation />
            </div>
          } />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  )
}