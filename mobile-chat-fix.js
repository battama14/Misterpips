// Fix Chat Mobile - Solution Unifiée
console.log('🔧 Correction Chat Mobile...');

// Nettoyer les anciens listeners
if (window.chatListeners) {
    window.chatListeners.forEach(listener => {
        if (listener && typeof listener === 'function') {
            try { listener(); } catch(e) {}
        }
    });
}
window.chatListeners = [];

// Chat Mobile Unifié
class MobileChatFix {
    constructor() {
        this.currentUser = sessionStorage.getItem('firebaseUID') || 'mobile_user_' + Date.now();
        this.nickname = sessionStorage.getItem('userNickname') || 'Mobile User';
        this.isInitialized = false;
        this.messageContainer = null;
        this.init();
    }

    init() {
        console.log('📱 Initialisation Chat Mobile Fix...');
        
        // Attendre que Firebase soit prêt
        this.waitForFirebase().then(() => {
            this.setupChatUI();
            this.setupEventListeners();
            this.loadMessages();
            this.setupRealtimeListener();
            this.isInitialized = true;
            console.log('✅ Chat Mobile Fix prêt');
        });
    }

    async waitForFirebase() {
        let attempts = 0;
        while (!window.firebaseDB && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        if (!window.firebaseDB) {
            throw new Error('Firebase non disponible');
        }
    }

    setupChatUI() {
        // Vérifier que les éléments existent
        this.messageContainer = document.getElementById('chatMessages');
        
        if (!this.messageContainer) {
            console.error('❌ Container de messages non trouvé');
            return;
        }

        // Nettoyer le container
        this.messageContainer.innerHTML = '';
        
        // Ajouter message de bienvenue
        this.addWelcomeMessage();
        
        console.log('✅ Interface chat configurée');
    }

    addWelcomeMessage() {
        if (!this.messageContainer) return;
        
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'message received';
        welcomeDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">💬 Bienvenue dans le chat VIP mobile !</div>
                <div class="message-info">
                    <span class="message-sender">Misterpips Bot</span>
                    <span class="message-time">Maintenant</span>
                </div>
            </div>
        `;
        this.messageContainer.appendChild(welcomeDiv);
    }

    setupEventListeners() {
        // Input chat principal
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (chatInput && sendBtn) {
            // Nettoyer anciens listeners
            chatInput.replaceWith(chatInput.cloneNode(true));
            sendBtn.replaceWith(sendBtn.cloneNode(true));
            
            // Nouveaux éléments
            const newChatInput = document.getElementById('chatInput');
            const newSendBtn = document.getElementById('sendBtn');
            
            newSendBtn.addEventListener('click', () => this.sendMessage());
            newChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            console.log('✅ Listeners chat configurés');
        }

        // Widget chat
        const widgetInput = document.getElementById('widgetInput');
        const widgetSend = document.getElementById('widgetSend');
        
        if (widgetInput && widgetSend) {
            widgetSend.replaceWith(widgetSend.cloneNode(true));
            const newWidgetSend = document.getElementById('widgetSend');
            
            newWidgetSend.addEventListener('click', () => this.sendWidgetMessage());
            widgetInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendWidgetMessage();
                }
            });
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        console.log('📤 Envoi message:', message);
        
        const messageData = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: this.currentUser,
            nickname: this.nickname,
            message: message,
            timestamp: Date.now(),
            type: 'text',
            platform: 'mobile'
        };
        
        // Afficher immédiatement
        this.displayMessage(messageData, true);
        
        // Vider l'input
        input.value = '';
        
        // Sauvegarder dans Firebase
        try {
            if (window.firebaseDB && window.push && window.dbRef) {
                const messagesRef = window.dbRef(window.firebaseDB, 'vip_chat');
                await window.push(messagesRef, messageData);
                console.log('✅ Message sauvé dans Firebase');
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            this.showError('Erreur d\'envoi');
        }
    }

    async sendWidgetMessage() {
        const input = document.getElementById('widgetInput');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        const messageData = {
            id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: this.currentUser,
            nickname: this.nickname,
            message: message,
            timestamp: Date.now(),
            type: 'text',
            platform: 'widget'
        };
        
        input.value = '';
        
        try {
            if (window.firebaseDB && window.push && window.dbRef) {
                const messagesRef = window.dbRef(window.firebaseDB, 'vip_chat');
                await window.push(messagesRef, messageData);
            }
        } catch (error) {
            console.error('❌ Erreur widget:', error);
        }
    }

    displayMessage(messageData, isOwn = false) {
        if (!this.messageContainer) {
            console.error('❌ Pas de container pour afficher le message');
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'sent' : 'received'}`;
        messageDiv.dataset.messageId = messageData.id;
        
        const timeStr = this.formatTime(messageData.timestamp);
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(messageData.message)}</div>
                <div class="message-info">
                    <span class="message-sender">${this.escapeHtml(messageData.nickname)}</span>
                    <span class="message-time">${timeStr}</span>
                </div>
            </div>
        `;
        
        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        console.log('✅ Message affiché:', messageData.message);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(timestamp) {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffMinutes = Math.floor((now - messageTime) / 60000);
        
        if (diffMinutes < 1) return 'Maintenant';
        if (diffMinutes < 60) return `${diffMinutes}min`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
        
        return messageTime.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    scrollToBottom() {
        if (this.messageContainer) {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }
    }

    async loadMessages() {
        if (!window.firebaseDB) return;
        
        try {
            console.log('📥 Chargement messages...');
            
            const messagesRef = window.dbRef(window.firebaseDB, 'vip_chat');
            const snapshot = await window.dbGet(messagesRef);
            
            if (snapshot.exists()) {
                const messages = Object.values(snapshot.val())
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .slice(-20); // Derniers 20 messages
                
                // Nettoyer sauf message de bienvenue
                const welcomeMsg = this.messageContainer.querySelector('.message.received');
                this.messageContainer.innerHTML = '';
                if (welcomeMsg) this.messageContainer.appendChild(welcomeMsg);
                
                messages.forEach(msg => {
                    const isOwn = msg.userId === this.currentUser;
                    this.displayMessage(msg, isOwn);
                });
                
                console.log(`✅ ${messages.length} messages chargés`);
            } else {
                console.log('📭 Aucun message existant');
            }
        } catch (error) {
            console.error('❌ Erreur chargement messages:', error);
        }
    }

    setupRealtimeListener() {
        if (!window.firebaseDB || !window.onValue) return;
        
        try {
            const messagesRef = window.dbRef(window.firebaseDB, 'vip_chat');
            
            const unsubscribe = window.onValue(messagesRef, (snapshot) => {
                if (!snapshot.exists()) return;
                
                const messages = Object.values(snapshot.val())
                    .sort((a, b) => a.timestamp - b.timestamp);
                
                // Vérifier nouveaux messages
                const lastMessage = messages[messages.length - 1];
                if (lastMessage && 
                    lastMessage.userId !== this.currentUser && 
                    !document.querySelector(`[data-message-id="${lastMessage.id}"]`)) {
                    
                    this.displayMessage(lastMessage, false);
                    console.log('📨 Nouveau message reçu:', lastMessage.message);
                }
            });
            
            // Stocker pour nettoyage
            window.chatListeners.push(unsubscribe);
            
            console.log('✅ Listener temps réel activé');
        } catch (error) {
            console.error('❌ Erreur listener:', error);
        }
    }

    showError(message) {
        if (!this.messageContainer) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message received';
        errorDiv.style.background = 'rgba(220, 53, 69, 0.2)';
        errorDiv.style.border = '1px solid rgba(220, 53, 69, 0.4)';
        errorDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">❌ ${message}</div>
                <div class="message-info">
                    <span class="message-sender">Système</span>
                    <span class="message-time">Maintenant</span>
                </div>
            </div>
        `;
        
        this.messageContainer.appendChild(errorDiv);
        this.scrollToBottom();
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    }
}

// Initialiser quand le DOM est prêt
function initMobileChatFix() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.mobileChatFix = new MobileChatFix();
            }, 2000);
        });
    } else {
        setTimeout(() => {
            window.mobileChatFix = new MobileChatFix();
        }, 2000);
    }
}

// Démarrer
initMobileChatFix();

console.log('🚀 Mobile Chat Fix chargé');