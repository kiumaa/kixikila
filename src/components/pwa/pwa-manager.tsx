'use client'

import { useState, useEffect } from 'react'
import { InstallPrompt } from './install-prompt'
import { UpdatePrompt } from './update-prompt'
import { OfflineIndicator } from './offline-indicator'
import { usePWAInstall } from '@/hooks/use-pwa-install'

export function PWAManager() {
  const { canInstall, isInstalled } = usePWAInstall()
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    // Show install prompt after 30 seconds if app is not installed and can be installed
    if (canInstall && !isInstalled) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true)
      }, 30000) // 30 seconds

      return () => clearTimeout(timer)
    }
  }, [canInstall, isInstalled])

  return (
    <>
      <UpdatePrompt />
      <OfflineIndicator />
      
      {showInstallPrompt && canInstall && !isInstalled && (
        <InstallPrompt onClose={() => setShowInstallPrompt(false)} />
      )}
    </>
  )
}