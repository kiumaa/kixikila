// KIXIKILA PWA Service Worker
// Version: 1.0.0

const CACHE_NAME = 'kixikila-v1'
const OFFLINE_URL = '/offline.html'

// Resources to precache
const STATIC_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell')
      return cache.addAll(STATIC_RESOURCES)
    }).then(() => {
      self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      self.clients.claim()
    })
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return
  
  // Skip Supabase requests - always go to network
  if (event.request.url.includes('supabase.co')) {
    return
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        return response
      }
      
      // Try network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          
          // Clone response for cache
          const responseToCache = response.clone()
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          
          return response
        })
        .catch(() => {
          // Network failed, try to serve offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
        })
    })
  )
})

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push Received:', event)
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do KIXIKILA',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Detalhes',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/favicon.ico'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('KIXIKILA', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received.')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag)
  
  if (event.tag === 'kixikila-sync') {
    event.waitUntil(
      // Sync offline actions when connection returns
      syncOfflineActions()
    )
  }
})

async function syncOfflineActions() {
  // Get offline actions from IndexedDB and sync with Supabase
  console.log('[ServiceWorker] Syncing offline actions...')
  
  // This would be implemented to sync offline group creations,
  // payments, etc. when connection is restored
}