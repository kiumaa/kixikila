'use client'

import { useState, useEffect } from 'react'
import { Workbox } from 'workbox-window'

export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [workbox, setWorkbox] = useState<Workbox | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const wb = new Workbox('/workbox-sw.js')
      setWorkbox(wb)

      // Listen for update available
      wb.addEventListener('waiting', () => {
        console.log('[PWA] New version available')
        setUpdateAvailable(true)
      })

      // Listen for controlling (update applied)
      wb.addEventListener('controlling', () => {
        console.log('[PWA] New version activated')
        setIsUpdating(false)
        window.location.reload()
      })

      // Register service worker
      wb.register().then((registration) => {
        console.log('[PWA] Service worker registered successfully')
        
        // Check for updates every 30 minutes
        setInterval(() => {
          if (registration?.update) {
            registration.update()
          }
        }, 30 * 60 * 1000)
      }).catch((error) => {
        console.error('[PWA] Service worker registration failed:', error)
      })

      return () => {
        // Cleanup if needed
      }
    }
  }, [])

  const updateApp = async () => {
    if (!workbox) return

    setIsUpdating(true)
    
    try {
      // Tell the waiting service worker to skip waiting and become active
      workbox.messageSkipWaiting()
      
      // The 'controlling' event listener will handle the reload
    } catch (error) {
      console.error('[PWA] Failed to update app:', error)
      setIsUpdating(false)
    }
  }

  const dismissUpdate = () => {
    setUpdateAvailable(false)
  }

  return {
    updateAvailable,
    isUpdating,
    updateApp,
    dismissUpdate
  }
}