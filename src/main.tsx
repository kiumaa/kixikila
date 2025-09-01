import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import { PWAManager } from '@/components/pwa/pwa-manager'
import { PerformanceDashboard } from '@/components/dev/performance-dashboard'
import AppRoutes from '@/components/app-routes'
import { performanceMonitor } from '@/lib/performance-monitor'
import '@/app/globals.css'

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/workbox-sw.js')
      .then((registration) => {
        console.log('PWA: Service worker registered successfully', registration)
      })
      .catch((error) => {
        console.error('PWA: Service worker registration failed', error)
      })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Providers>
        <AppRoutes />
        <PWAManager />
        <PerformanceDashboard />
        <Toaster />
      </Providers>
    </BrowserRouter>
  </React.StrictMode>,
)