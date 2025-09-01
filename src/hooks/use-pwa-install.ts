'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://')
    
    setIsInStandaloneMode(isStandalone)
    setIsInstalled(isStandalone)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installPWA = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true)
      }
      
      setDeferredPrompt(null)
      setIsInstallable(false)
      
      return choiceResult.outcome
    }
    return null
  }

  const getInstallInstructions = () => {
    if (isIOS) {
      return {
        title: 'Instalar KIXIKILA',
        steps: [
          'Toque no ícone de partilha',
          'Selecione "Adicionar ao Ecrã Principal"',
          'Toque em "Adicionar" para confirmar'
        ],
        icon: '⬆️'
      }
    }
    
    return {
      title: 'Instalar KIXIKILA',
      steps: [
        'Toque em "Instalar" quando aparecer a opção',
        'Ou use o menu do navegador',
        'Selecione "Instalar aplicação"'
      ],
      icon: '📱'
    }
  }

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    isIOS,
    isInStandaloneMode,
    canInstall: isInstallable || (isIOS && !isInstalled && !isInStandaloneMode),
    installPWA,
    getInstallInstructions
  }
}