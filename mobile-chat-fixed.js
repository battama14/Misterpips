class MobileChatFixed {
    constructor() {
        this.chatRef = null;
        this.currentUser = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        this.setupFirebase();
        this.createChatInterface();
        this.setupEventListeners();
    }

    setupFirebase() {
        if (window.firebaseDB) {
            this.chatRef = window.firebaseDB.ref('vip_chat');
            console.log('✅ Chat Firebase initialisé');
        } else {
            setTimeout(() => this.setupFirebase(), 500);
        }
    }

    createChatInterface() {
        const chatHTML = `
            <div id="mobileChatContainer" class="mobile-chat-container">
                <div class="mobile-chat-header">
                    <span>💬 Chat VIP</span>
                    <button id="closeMobileChat" class="chat-close-btn">✕</button>
                </div>
                <div id="mobileChatMessages" class="mobile-chat-messages"></div>
                <div class="mobile-chat-input">
                    <input type="text" id="mobileChatInput" placeholder="Tapez votre message..." maxlength="200">
                    <button id="sendMobileChatBtn" class="chat-send-btn">📤</button>
                </div>
                <div class="mobile-emoji-bar">
                    <button class="emoji-btn" data-emoji="👍">👍</button>
                    <button class="emoji-btn" data-emoji="🚀">🚀</button>
                    <button class="emoji-btn" data-emoji="💰">💰</button>
                    <button class="emoji-btn" data-emoji="📈">📈</button>
                    <button class="emoji-btn" data-emoji="🎯">🎯</button>
                </div>
            </div>
            <button id="mobileChatToggle" class="mobile-chat-toggle">💬</button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    setupEventListeners() {
        // Toggle chat
        const toggleBtn = document.getElementById('mobileChatToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleChat());
        }

        // Fermer chat
        const closeBtn = document.getElementById('closeMobileChat');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeChat());
        }

        // Envoyer message
        const sendBtn = document.getElementById('sendMobileChatBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Entrée pour envoyer
        const input = document.getElementById('mobileChatInput');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Emojis
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.dataset.emoji;
                const input = document.getElementById('mobileChatInput');
                if (input) {
                    input.value += emoji;
                    input.focus();
                }
            });
        });

        // Écouter les messages
        this.listenToMessages();
    }

    toggleChat() {
        const container = document.getElementById('mobileChatContainer');
        const toggle = document.getElementById('mobileChatToggle');
        
        if (this.isOpen) {
            container.style.display = 'none';
            toggle.style.display = 'flex';
            this.isOpen = false;
        } else {
            container.style.display = 'flex';
            toggle.style.display = 'none';
            this.isOpen = true;
            this.scrollToBottom();
        }
    }

    closeChat() {
        const container = document.getElementById('mobileChatContainer');
        const toggle = document.getElementById('mobileChatToggle');
        
        container.style.display = 'none';
        toggle.style.display = 'flex';
        this.isOpen = false;
    }

    sendMessage() {
        const input = document.getElementById('mobileChatInput');
        const message = input.value.trim();
        
        if (!message || !this.chatRef) return;

        const user = this.getCurrentUser();
        
        const messageData = {
            message: message,
            userId: user.uid,
            nickname: user.nickname,
            email: user.email,
            timestamp: Date.now(),
            platform: 'mobile'
        };

        this.chatRef.push(messageData).then(() => {
            console.log('✅ Message envoyé depuis mobile:', messageData);
            input.value = '';
        }).catch(error => {
            console.error('❌ Erreur envoi message:', error);
        });
    }

    getCurrentUser() {
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            const user = window.firebaseAuth.currentUser;
            return {
                uid: user.uid,
                nickname: user.email.split('@')[0],
                email: user.email
            };
        }
        
        return {
            uid: 'mobile_user_' + Date.now(),
            nickname: 'Mobile User',
            email: 'mobile@misterpips.com'
        };
    }

    listenToMessages() {
        if (!this.chatRef) {
            setTimeout(() => this.listenToMessages(), 500);
            return;
        }

        this.chatRef.limitToLast(50).on('value', (snapshot) => {
            const messages = snapshot.val() || {};
            this.displayMessages(messages);
        });
    }

    displayMessages(messages) {
        const container = document.getElementById('mobileChatMessages');
        if (!container) return;
        
        container.innerHTML = '';

        Object.entries(messages).forEach(([key, msg]) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'mobile-chat-message';
            
            const time = new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const platform = msg.platform === 'mobile' ? '📱' : '💻';
            
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-user">${platform} ${msg.nickname || 'Utilisateur'}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-content">${msg.message}</div>
            `;
            
            container.appendChild(messageDiv);
        });

        if (this.isOpen) {
            this.scrollToBottom();
        }
    }

    scrollToBottom() {
        const container = document.getElementById('mobileChatMessages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
}

// Initialiser le chat mobile
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.mobileChatFixed = new MobileChatFixed();
    }, 1000);
});