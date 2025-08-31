import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import AppRoutes from '@/components/app-routes'
import './app/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Providers>
        <AppRoutes />
        <Toaster />
      </Providers>
    </BrowserRouter>
  </React.StrictMode>,
)