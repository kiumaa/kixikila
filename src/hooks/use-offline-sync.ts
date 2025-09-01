'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface OfflineAction {
  id?: number
  type: 'create_group' | 'make_payment' | 'update_profile'
  data: any
  timestamp: number
  retries: number
}

// Extend ServiceWorkerRegistration to include sync
interface SyncServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>
  }
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([])
  const [isRegistered, setIsRegistered] = useState(false)

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Conexão restaurada! A sincronizar dados...')
      
      // Trigger background sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration: SyncServiceWorkerRegistration) => {
          return registration.sync?.register('kixikila-offline-actions')
        }).catch((error) => {
          console.error('Background sync registration failed:', error)
        })
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Sem conexão. As ações serão guardadas para sincronização posterior.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Register background sync
  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(() => {
        setIsRegistered(true)
      })
    }
  }, [])

  // Load pending actions from IndexedDB
  useEffect(() => {
    loadPendingActions()
  }, [])

  const openDB = useCallback(async () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kixikila-offline', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('actions')) {
          const store = db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }, [])

  const loadPendingActions = useCallback(async () => {
    try {
      const db = await openDB()
      const transaction = db.transaction(['actions'], 'readonly')
      const store = transaction.objectStore('actions')
      
      const request = store.getAll()
      request.onsuccess = () => {
        setPendingActions(request.result)
      }
    } catch (error) {
      console.error('Failed to load pending actions:', error)
    }
  }, [openDB])

  const addOfflineAction = useCallback(async (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) => {
    const offlineAction: OfflineAction = {
      ...action,
      timestamp: Date.now(),
      retries: 0
    }

    try {
      const db = await openDB()
      const transaction = db.transaction(['actions'], 'readwrite')
      const store = transaction.objectStore('actions')
      
      store.add(offlineAction)
      
      transaction.oncomplete = () => {
        setPendingActions(prev => [...prev, offlineAction])
        toast.info('Ação guardada. Será sincronizada quando a conexão for restaurada.')
        
        // Try to register for background sync
        if (isRegistered && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration: SyncServiceWorkerRegistration) => {
            return registration.sync?.register('kixikila-offline-actions')
          })
        }
      }
    } catch (error) {
      console.error('Failed to save offline action:', error)
      toast.error('Erro ao guardar ação offline')
    }
  }, [openDB, isRegistered])

  const clearPendingActions = useCallback(async () => {
    try {
      const db = await openDB()
      const transaction = db.transaction(['actions'], 'readwrite')
      const store = transaction.objectStore('actions')
      
      store.clear()
      
      transaction.oncomplete = () => {
        setPendingActions([])
      }
    } catch (error) {
      console.error('Failed to clear pending actions:', error)
    }
  }, [openDB])

  const retryAction = useCallback(async (actionId: number) => {
    try {
      const db = await openDB()
      const transaction = db.transaction(['actions'], 'readwrite')
      const store = transaction.objectStore('actions')
      
      const getRequest = store.get(actionId)
      getRequest.onsuccess = () => {
        const action = getRequest.result
        if (action) {
          action.retries += 1
          store.put(action)
          
          // Try background sync again
          if (isRegistered && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration: SyncServiceWorkerRegistration) => {
              return registration.sync?.register('kixikila-offline-actions')
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to retry action:', error)
    }
  }, [openDB, isRegistered])

  return {
    isOnline,
    pendingActions,
    isRegistered,
    addOfflineAction,
    clearPendingActions,
    retryAction,
    hasPendingActions: pendingActions.length > 0
  }
}