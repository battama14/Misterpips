// Chat VIP Mobile
function sendMobileMessage() {
    const input = document.getElementById('mobileChatInput');
    const message = input.value.trim();
    if (!message) return;
    
    const messagesContainer = document.getElementById('mobileChatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user-message';
    messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    input.value = '';
    
    // Sauvegarder dans Firebase
    saveChatMessage(message);
    
    // Réponse automatique
    setTimeout(() => {
        const botDiv = document.createElement('div');
        botDiv.className = 'chat-message bot-message';
        botDiv.innerHTML = `
            <div class="message-content">Message reçu ! 👍</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        messagesContainer.appendChild(botDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1000);
}

// Sauvegarder message dans Firebase
async function saveChatMessage(message) {
    try {
        const uid = sessionStorage.getItem('firebaseUID');
        const email = sessionStorage.getItem('userEmail');
        if (!uid || !window.firebaseDB) return;
        
        const chatRef = window.dbRef(window.firebaseDB, 'vipChat');
        await window.push(chatRef, {
            message: message,
            sender: email,
            uid: uid,
            timestamp: Date.now(),
            date: new Date().toISOString()
        });
        
        console.log('💬 Message sauvegardé');
    } catch (error) {
        console.error('Erreur sauvegarde message:', error);
    }
}

// Charger messages existants
async function loadChatMessages() {
    try {
        if (!window.firebaseDB) return;
        
        const chatRef = window.dbRef(window.firebaseDB, 'vipChat');
        const snapshot = await window.dbGet(chatRef);
        
        if (snapshot.exists()) {
            const messages = Object.values(snapshot.val());
            messages.sort((a, b) => a.timestamp - b.timestamp);
            
            const container = document.getElementById('mobileChatMessages');
            container.innerHTML = '';
            
            messages.slice(-20).forEach(msg => {
                const messageDiv = document.createElement('div');
                const isCurrentUser = msg.uid === sessionStorage.getItem('firebaseUID');
                messageDiv.className = `chat-message ${isCurrentUser ? 'user-message' : 'other-message'}`;
                messageDiv.innerHTML = `
                    <div class="message-sender">${msg.sender}</div>
                    <div class="message-content">${msg.message}</div>
                    <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
                `;
                container.appendChild(messageDiv);
            });
            
            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        console.error('Erreur chargement messages:', error);
    }
}

// Écouter nouveaux messages en temps réel
function listenToChatMessages() {
    if (!window.firebaseDB || !window.onValue) return;
    
    const chatRef = window.dbRef(window.firebaseDB, 'vipChat');
    window.onValue(chatRef, (snapshot) => {
        if (snapshot.exists()) {
            loadChatMessages();
        }
    });
}

// Initialiser le chat
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('mobileChatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMobileMessage();
            }
        });
        
        // Charger messages après 2 secondes
        setTimeout(() => {
            loadChatMessages();
            listenToChatMessages();
        }, 2000);
    }
});

// Exposer les fonctions
window.sendMobileMessage = sendMobileMessage;