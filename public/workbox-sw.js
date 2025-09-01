// KIXIKILA PWA Service Worker with Workbox
// Version: 2.0.0

importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js')

const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching
const { registerRoute, NavigationRoute } = workbox.routing
const { 
  StaleWhileRevalidate, 
  CacheFirst, 
  NetworkFirst,
  NetworkOnly 
} = workbox.strategies
const { ExpirationPlugin } = workbox.expiration
const { BackgroundSyncPlugin } = workbox.backgroundSync

// Enable Workbox logging in development
if (process.env.NODE_ENV === 'development') {
  workbox.setConfig({ debug: true })
}

// Clean up outdated caches
cleanupOutdatedCaches()

// Precache and route static assets
// This will be populated by Workbox build process
precacheAndRoute(self.__WB_MANIFEST || [])

// Cache strategies for different resource types

// 1. Static Assets (Images, Fonts, CSS, JS) - Cache First
registerRoute(
  ({ request, url }) => 
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js'),
  new CacheFirst({
    cacheName: 'kixikila-static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true
      })
    ]
  })
)

// 2. API calls to Supabase - Network First with offline fallback
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'kixikila-api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
        purgeOnQuotaError: true
      }),
      new BackgroundSyncPlugin('kixikila-api-sync', {
        maxRetentionTime: 24 * 60 // 24 hours
      })
    ]
  })
)

// 3. App Shell (HTML pages) - Stale While Revalidate
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'kixikila-app-shell',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
        purgeOnQuotaError: true
      })
    ]
  })
)

// 4. External resources (CDNs, Google Fonts, etc.) - Stale While Revalidate
registerRoute(
  ({ url }) => 
    url.origin !== self.location.origin &&
    !url.hostname.includes('supabase.co'),
  new StaleWhileRevalidate({
    cacheName: 'kixikila-external-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true
      })
    ]
  })
)

// Offline fallback for navigation requests
const OFFLINE_URL = '/offline.html'

registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'kixikila-navigation',
      plugins: [
        {
          cacheKeyWillBeUsed: async ({ request }) => {
            return `${request.url}?utm_source=pwa`
          },
          handlerDidError: async () => {
            return await caches.match(OFFLINE_URL)
          }
        }
      ]
    })
  )
)

// Background Sync for offline actions
const OFFLINE_SYNC_QUEUE = 'kixikila-offline-actions'

// Queue offline actions for background sync
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync triggered:', event.tag)
  
  if (event.tag === OFFLINE_SYNC_QUEUE) {
    event.waitUntil(syncOfflineActions())
  }
})

async function syncOfflineActions() {
  console.log('[ServiceWorker] Syncing offline actions...')
  
  try {
    // Get offline actions from IndexedDB
    const db = await openOfflineDB()
    const actions = await getOfflineActions(db)
    
    for (const action of actions) {
      try {
        await processOfflineAction(action)
        await removeOfflineAction(db, action.id)
        console.log('[ServiceWorker] Synced offline action:', action.type)
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync action:', action.type, error)
        // Keep action in queue for next sync attempt
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error)
  }
}

// IndexedDB helpers for offline storage
async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kixikila-offline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('actions')) {
        const store = db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

async function getOfflineActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['actions'], 'readonly')
    const store = transaction.objectStore('actions')
    const request = store.getAll()
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function removeOfflineAction(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['actions'], 'readwrite')
    const store = transaction.objectStore('actions')
    const request = store.delete(id)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function processOfflineAction(action) {
  switch (action.type) {
    case 'create_group':
      return await syncCreateGroup(action.data)
    case 'make_payment':
      return await syncPayment(action.data)
    case 'update_profile':
      return await syncProfileUpdate(action.data)
    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}

// Sync functions for different action types
async function syncCreateGroup(data) {
  // Make API call to create group
  const response = await fetch('/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error(`Failed to sync group creation: ${response.status}`)
  }
  
  return response.json()
}

async function syncPayment(data) {
  // Make API call to process payment
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error(`Failed to sync payment: ${response.status}`)
  }
  
  return response.json()
}

async function syncProfileUpdate(data) {
  // Make API call to update profile
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error(`Failed to sync profile update: ${response.status}`)
  }
  
  return response.json()
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received:', event)
  
  let notificationData = {
    title: 'KIXIKILA',
    body: 'Nova notificação',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'kixikila-notification'
  }
  
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
    } catch (error) {
      notificationData.body = event.data.text()
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    vibrate: [200, 100, 200],
    data: {
      url: notificationData.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ],
    requireInteraction: true
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event)
  
  event.notification.close()
  
  if (event.action === 'close') {
    return
  }
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[ServiceWorker] Skipping waiting for app update')
    self.skipWaiting()
  }
})

// Broadcast update available message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '2.0.0' })
  }
})

console.log('[ServiceWorker] Workbox service worker loaded successfully')
