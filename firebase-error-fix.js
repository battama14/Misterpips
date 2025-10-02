// Fix pour les erreurs Firebase WebSocket
console.log('🔧 Chargement du fix Firebase...');

// Intercepter les erreurs WebSocket
const originalPostMessage = window.postMessage;
window.postMessage = function(message, targetOrigin, transfer) {
    try {
        if (typeof message === 'string' && message.includes('firebase')) {
            // Valider le message avant de l'envoyer
            if (message.length > 0 && message.trim() !== '') {
                return originalPostMessage.call(this, message, targetOrigin, transfer);
            }
        } else {
            return originalPostMessage.call(this, message, targetOrigin, transfer);
        }
    } catch (error) {
        console.warn('Message WebSocket ignoré:', error.message);
    }
};

// Gérer les erreurs de connexion Firebase
window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('invalid or illegal string')) {
        console.warn('Erreur Firebase WebSocket interceptée et ignorée');
        event.preventDefault();
        return false;
    }
});

// Améliorer la gestion des erreurs Firebase
if (window.firebaseDB) {
    const originalRef = window.firebaseDB.ref;
    if (originalRef) {
        window.firebaseDB.ref = function(...args) {
            try {
                return originalRef.apply(this, args);
            } catch (error) {
                console.warn('Erreur Firebase ref:', error.message);
                return null;
            }
        };
    }
}

console.log('✅ Fix Firebase appliqué');