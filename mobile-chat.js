// Chat Mobile VIP - Firebase
console.log('💬 Chat mobile initialisé');

// Envoyer message mobile
function sendMobileMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    console.log('📤 Envoi message mobile:', message);
    
    const uid = sessionStorage.getItem('firebaseUID');
    const email = sessionStorage.getItem('userEmail');
    
    if (!uid || !window.firebaseDB) {
        console.error('❌ Firebase non disponible');
        return;
    }
    
    const messageData = {
        text: message,
        sender: email || 'Mobile User',
        timestamp: Date.now(),
        uid: uid,
        platform: 'mobile'
    };
    
    // Sauvegarder dans Firebase
    saveChatMessage(messageData);
    
    // Vider l'input
    input.value = '';
    
    // Réponse automatique
    setTimeout(() => {
        const autoResponse = {
            text: `Message reçu: "${message}" 👍`,
            sender: 'Bot Misterpips',
            timestamp: Date.now(),
            uid: 'bot',
            platform: 'bot'
        };
        saveChatMessage(autoResponse);
    }, 1000);
}

// Sauvegarder message dans Firebase
function saveChatMessage(messageData) {
    if (!window.firebaseDB || !window.push || !window.dbRef) {
        console.error('❌ Firebase non disponible pour chat');
        return;
    }
    
    try {
        const chatRef = window.dbRef(window.firebaseDB, 'chat');
        window.push(chatRef, messageData);
        console.log('✅ Message sauvé:', messageData.text);
    } catch (error) {
        console.error('❌ Erreur sauvegarde chat:', error);
    }
}

// Charger messages du chat
function loadChatMessages() {
    if (!window.firebaseDB || !window.onValue || !window.dbRef) {
        console.error('❌ Firebase non disponible pour charger chat');
        return;
    }
    
    try {
        const chatRef = window.dbRef(window.firebaseDB, 'chat');
        window.onValue(chatRef, (snapshot) => {
            const messages = snapshot.val();
            displayChatMessages(messages);
        });
        console.log('✅ Écoute chat activée');
    } catch (error) {
        console.error('❌ Erreur chargement chat:', error);
    }
}

// Afficher messages dans l'interface
function displayChatMessages(messages) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!messages) {
        container.innerHTML = '<div class="no-messages">Aucun message</div>';
        return;
    }
    
    // Convertir en array et trier par timestamp
    const messageArray = Object.values(messages).sort((a, b) => a.timestamp - b.timestamp);
    
    messageArray.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.platform === 'mobile' ? 'sent' : 'received'}`;
        
        const time = new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${msg.text}</div>
                <div class="message-info">
                    <span class="message-sender">${msg.sender}</span>
                    <span class="message-time">${time}</span>
                </div>
            </div>
        `;
        
        container.appendChild(messageDiv);
    });
    
    // Scroll vers le bas
    container.scrollTop = container.scrollHeight;
}

// Initialiser chat mobile
function initMobileChat() {
    console.log('🚀 Initialisation chat mobile...');
    
    // Charger messages existants
    setTimeout(() => {
        loadChatMessages();
    }, 2000);
    
    // Événement Enter sur input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMobileMessage();
            }
        });
    }
    
    console.log('✅ Chat mobile prêt');
}

// Démarrer quand DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initMobileChat, 3000);
});