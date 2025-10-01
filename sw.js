// Service Worker pour Misterpips PWA
const CACHE_NAME = 'misterpips-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/mobile-dashboard.html',
  '/styles.css',
  '/dashboard.css',
  '/mobile.css',
  '/script.js',
  '/dashboard.js',
  '/mobile.js',
  '/chat.js',
  '/manifest.json',
  '/Misterpips.jpg',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Installation du Service Worker
self.addEventListener('install', function(event) {
  console.log('🔧 Service Worker: Installation en cours...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('✅ Tous les fichiers ont été mis en cache');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.error('❌ Erreur lors de la mise en cache:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', function(event) {
  console.log('🚀 Service Worker: Activation en cours...');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('✅ Service Worker activé');
      return self.clients.claim();
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', function(event) {
  // Ignorer les requêtes Firebase et autres APIs externes
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic') ||
      event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Retourner la réponse du cache si elle existe
        if (response) {
          console.log('📦 Servi depuis le cache:', event.request.url);
          return response;
        }
        
        // Sinon, faire la requête réseau
        return fetch(event.request)
          .then(function(response) {
            // Vérifier si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cloner la réponse
            const responseToCache = response.clone();
            
            // Ajouter au cache
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            console.log('🌐 Servi depuis le réseau:', event.request.url);
            return response;
          })
          .catch(function(error) {
            console.log('❌ Erreur réseau:', error);
            
            // Retourner une page hors ligne pour les pages HTML
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // Pour les autres ressources, retourner une réponse d'erreur
            return new Response('Contenu non disponible hors ligne', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Gestion des messages du client
self.addEventListener('message', function(event) {
  console.log('📨 Message reçu:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION',
      version: CACHE_NAME
    });
  }
});

// Notifications push (pour les futures fonctionnalités)
self.addEventListener('push', function(event) {
  console.log('🔔 Notification push reçue');
  
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification Misterpips',
    icon: '/Misterpips.jpg',
    badge: '/Misterpips.jpg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ouvrir l\'app',
        icon: '/Misterpips.jpg'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/Misterpips.jpg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Misterpips', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Clic sur notification:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Ne rien faire, la notification est déjà fermée
  } else {
    // Clic par défaut sur la notification
    event.waitUntil(
      clients.matchAll().then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', function(event) {
  console.log('🔄 Synchronisation en arrière-plan:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  return new Promise(function(resolve) {
    console.log('🔄 Exécution de la synchronisation...');
    
    // Ici, on pourrait synchroniser les données de trading
    // avec Firebase quand la connexion est rétablie
    
    setTimeout(function() {
      console.log('✅ Synchronisation terminée');
      resolve();
    }, 1000);
  });
}

// Gestion des erreurs
self.addEventListener('error', function(event) {
  console.error('❌ Erreur Service Worker:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
  console.error('❌ Promise rejetée:', event.reason);
});

console.log('🚀 Service Worker Misterpips chargé - Version:', CACHE_NAME);