// Service Worker for Greater Works Attendance App
// Provides offline support and background sync

const CACHE_NAME = 'greater-works-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip Firebase requests (we'll handle those separately)
  if (url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          // Update cache in background
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, response);
              });
            }
          }).catch(() => {
            // Network failed, but we have cache
          });
          return cachedResponse;
        }

        // No cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched response
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // Network failed and no cache
            // Return offline page if it's a navigation request
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            throw new Error('Network request failed and no cache available');
          });
      })
  );
});

// Background Sync - sync attendance data when online
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendanceData());
  }
});

// Sync attendance data with server
async function syncAttendanceData() {
  try {
    console.log('[SW] Syncing attendance data...');
    
    // Get pending attendance records from IndexedDB
    const db = await openDatabase();
    const pendingRecords = await getPendingRecords(db);
    
    if (pendingRecords.length === 0) {
      console.log('[SW] No pending records to sync');
      return;
    }

    console.log(`[SW] Found ${pendingRecords.length} pending records`);

    // Notify all clients about sync start
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_START',
        count: pendingRecords.length
      });
    });

    // Sync each record
    let successCount = 0;
    let failCount = 0;

    for (const record of pendingRecords) {
      try {
        // Send to main thread for Firebase sync
        const syncResult = await notifyClientToSync(record);
        
        if (syncResult) {
          // Remove from IndexedDB after successful sync
          await deleteRecord(db, record.id);
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('[SW] Failed to sync record:', error);
        failCount++;
      }
    }

    // Notify clients about sync completion
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        success: successCount,
        failed: failCount
      });
    });

    console.log(`[SW] Sync complete: ${successCount} success, ${failCount} failed`);
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

// Helper function to notify client to sync a record
async function notifyClientToSync(record) {
  const clients = await self.clients.matchAll();
  if (clients.length === 0) {
    return false;
  }

  // Send to first available client
  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data.success);
    };

    clients[0].postMessage({
      type: 'SYNC_RECORD',
      record: record
    }, [messageChannel.port2]);

    // Timeout after 10 seconds
    setTimeout(() => resolve(false), 10000);
  });
}

// IndexedDB helpers
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GreaterWorksOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingAttendance')) {
        db.createObjectStore('pendingAttendance', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingRecords(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingAttendance'], 'readonly');
    const store = transaction.objectStore('pendingAttendance');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteRecord(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingAttendance'], 'readwrite');
    const store = transaction.objectStore('pendingAttendance');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
