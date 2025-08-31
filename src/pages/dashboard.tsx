'use client'

import { AppLayout } from '@/layouts/app-layout'
import { DashboardPage } from '@/pages/dashboard-content'

export default function Dashboard() {
  return (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  )
}