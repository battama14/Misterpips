// Service Worker pour notifications push mobile
const CACHE_NAME = 'misterpips-mobile-v1';
const urlsToCache = [
    '/mobile-dashboard.html',
    '/mobile-complete.js',
    '/mobile-animations.css',
    '/user-manager.js',
    '/Misterpips.jpg'
];

// Installation du service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📱 Cache ouvert');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retourner le cache si disponible, sinon fetch
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
    console.log('📱 Notification push reçue:', event);
    
    let title = '💬 Misterpips Chat';
    let body = 'Nouveau message dans le chat VIP';
    let icon = '/Misterpips.jpg';
    
    if (event.data) {
        try {
            const data = event.data.json();
            title = data.title || title;
            body = data.body || body;
            icon = data.icon || icon;
        } catch (e) {
            body = event.data.text() || body;
        }
    }
    
    const options = {
        body: body,
        icon: icon,
        badge: icon,
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Voir le message',
                icon: icon
            },
            {
                action: 'close',
                title: 'Fermer',
                icon: icon
            }
        ],
        requireInteraction: true,
        silent: false
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Gestion des clics sur notifications
self.addEventListener('notificationclick', (event) => {
    console.log('📱 Clic sur notification:', event);
    
    event.notification.close();

    if (event.action === 'explore') {
        // Ouvrir l'application
        event.waitUntil(
            clients.openWindow('/mobile-dashboard.html')
        );
    } else if (event.action === 'close') {
        // Fermer la notification
        event.notification.close();
    } else {
        // Clic par défaut - ouvrir l'app
        event.waitUntil(
            clients.matchAll().then((clientList) => {
                for (const client of clientList) {
                    if (client.url === '/mobile-dashboard.html' && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/mobile-dashboard.html');
                }
            })
        );
    }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('🔄 Synchronisation en arrière-plan');
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Synchroniser les données avec Firebase
        console.log('🔄 Synchronisation des données...');
        // Ici on pourrait synchroniser les trades, messages, etc.
    } catch (error) {
        console.error('❌ Erreur synchronisation:', error);
    }
}

// Gestion des messages du client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('📱 Service Worker Misterpips Mobile chargé');