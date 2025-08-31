'use client'

import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { BottomNavigation } from '@/components/navigation/bottom-navigation'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/')
    }
  }, [user, loading, navigate])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        {children}
      </main>
      <BottomNavigation />
    </div>
  )
}