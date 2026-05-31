/**
 * Service Worker - LearnIQ PWA
 * Handles offline support, caching, and sync
 */

const CACHE_VERSION = 'v1.0.2';
const CACHE_NAME = `learniq-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/student/studentDashboard.html',
  '/student/studentModules.html',
  '/student/studentQuiz.html',
  '/student/studentHistory.html',
  '/student/studentSettings.html',
  '/student/studentViewModules.html',
  '/student/studentPractice.html',
  '/student/studentLeaderboard.html',
  '/assets/styles/style.css',
  '/assets/styles/studentStyles/studentDashboard.css',
  '/assets/styles/studentStyles/studentModules.css',
  '/assets/styles/studentStyles/studentQuiz.css',
  '/assets/styles/studentStyles/studentSidebar.css',
  '/assets/scripts/student-layout.js',
  '/assets/scripts/ApiService.js',
  '/assets/scripts/QuizResultsManager.js',
  '/assets/scripts/db-manager.js',
  '/assets/scripts/progress-tracker.js',
  '/assets/scripts/engagement.js',
  '/assets/scripts/offline-sync.js',
];

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch((error) => {
      console.error('[Service Worker] Install error:', error);
    })
  );
  self.skipWaiting();
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch Event - Network first, fallback to cache
 * Strategy: Network-first for API calls, Cache-first for static assets
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - Network first with timeout fallback
  if (url.pathname.includes('/api/')) {
    return event.respondWith(
      Promise.race([
        fetch(event.request),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000)
        ),
      ])
        .then((response) => {
          // Only cache static/reference data, not dynamic content that can be deleted
          // Dynamic endpoints: /quizzes, /modules, /questions, /subjects
          // Static endpoints: /categories
          const isDynamicContent = /\/(quizzes|modules|questions|subjects|students)[\/?]/.test(url.pathname);
          
          if (response.status === 200 && event.request.method === 'GET' && !isDynamicContent) {
            const responseClone = response.clone();
            caches.open(`${CACHE_NAME}-api`).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Only serve cached API response for non-dynamic endpoints
          const isDynamicContent = /\/(quizzes|modules|questions|subjects|students)[\/?]/.test(url.pathname);
          
          if (!isDynamicContent) {
            return caches.match(event.request).then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[Service Worker] Serving cached API response for:', url.pathname);
                return cachedResponse;
              }
              // Return offline placeholder for missing cache
              if (event.request.method === 'GET') {
                return new Response(
                  JSON.stringify({
                    offline: true,
                    message: 'You are offline. This data is from a previous session.',
                  }),
                  {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503,
                  }
                );
              }
              return fetch(event.request);
            });
          } else {
            // For dynamic endpoints, don't return stale cache - return offline error
            return new Response(
              JSON.stringify({
                offline: true,
                message: 'You are offline and this is dynamic content.',
              }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503,
              }
            );
          }
        })
    );
  }

  // Static assets - Cache first
  // BUT: Do NOT cache JavaScript files - always fetch fresh to avoid stale code
  if (url.pathname.endsWith('.js')) {
    return event.respondWith(
      fetch(event.request).catch(() => {
        // If offline and JS file is not available, fall back to cache
        return caches.match(event.request);
      })
    );
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Cache successful responses for GET requests
        if (response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    }).catch(() => {
      // Return offline page for failed navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
      return new Response('Offline - Resource not available', { status: 503 });
    })
  );
});

/**
 * Message Event - Handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[Service Worker] Cache cleared');
    });
  }

  if (event.data && event.data.type === 'CLEAR_API_CACHE') {
    caches.delete(`${CACHE_NAME}-api`).then(() => {
      console.log('[Service Worker] API cache cleared');
    });
  }

  if (event.data && event.data.type === 'SYNC_OFFLINE_DATA') {
    event.waitUntil(syncOfflineData());
  }
});

/**
 * Sync Event - Handle background sync for offline submissions
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);
  
  if (event.tag === 'sync-quiz-attempts') {
    event.waitUntil(syncOfflineData());
  }

  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgressData());
  }
});

/**
 * Sync offline quiz data
 */
async function syncOfflineData() {
  try {
    console.log('[Service Worker] Syncing offline data...');
    // Get pending submissions from IndexedDB
    // Send to server
    // Clear local queue on success
    // This will be implemented by the offline-sync.js module
    
    // Notify clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { synced: true },
      });
    });
  } catch (error) {
    console.error('[Service Worker] Sync error:', error);
  }
}

/**
 * Sync progress data
 */
async function syncProgressData() {
  try {
    console.log('[Service Worker] Syncing progress data...');
    // Sync progress stats with server
  } catch (error) {
    console.error('[Service Worker] Progress sync error:', error);
  }
}

/**
 * Handle periodic background sync (if supported)
 */
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'sync-quiz-data') {
      event.waitUntil(syncOfflineData());
    }
  });
}

console.log('[Service Worker] Loaded successfully');
