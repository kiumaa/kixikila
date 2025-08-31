'use client'

import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { AppLayout } from '@/layouts/app-layout'

export default function AppLayoutWrapper({
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
    <AppLayout>
      {children}
    </AppLayout>
  )
}