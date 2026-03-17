const CACHE_NAME = 'geminiqtube-music-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

// Store media session state
let mediaSessionState = {
  currentTrackId: null,
  isPlaying: false,
  trackTitle: '',
  channelName: '',
  thumbnailUrl: ''
};

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch resources
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (type === 'UPDATE_MEDIA_SESSION') {
    // Update media session state when app sends new track info
    mediaSessionState = {
      currentTrackId: data.trackId || null,
      isPlaying: data.isPlaying || false,
      trackTitle: data.title || '',
      channelName: data.channelName || '',
      thumbnailUrl: data.thumbnailUrl || ''
    };
    console.log('Media session state updated:', mediaSessionState);
  } else if (type === 'MEDIA_ACTION') {
    // Handle media actions from lock screen/headset
    // Broadcast the action to all active clients
    const action = data.action; // 'play', 'pause', 'next', 'previous'
    console.log('Handling media action:', action);

    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'MEDIA_ACTION',
          action: action,
          timestamp: Date.now()
        });
      });
    });
  }
});
