// Chat Ultra-Performant Style iMessage
class iMessageChat {
    constructor() {
        this.currentUser = sessionStorage.getItem('firebaseUID') || 'user_' + Date.now();
        this.nickname = null;
        this.messages = [];
        this.typingUsers = new Set();
        this.lastMessageTime = 0;
        this.messageCache = new Map();
        this.isTyping = false;
        this.typingTimeout = null;
        this.virtualScrollOffset = 0;
        this.visibleMessages = 50;
        this.settings = {
            soundEnabled: localStorage.getItem('chatSound') !== 'false',
            notificationsEnabled: localStorage.getItem('chatNotifications') !== 'false',
            darkMode: localStorage.getItem('chatDarkMode') === 'true'
        };
        this.notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        
        this.init();
    }
    
    async init() {
        this.nickname = await this.getNickname();
        this.createChatUI();
        this.setupEventListeners();
        this.loadMessages();
        this.setupRealtimeListener();
        this.startPerformanceOptimizations();
    }
    
    createChatUI() {
        // Remplacer l'ancien chat par le nouveau
        const oldChat = document.getElementById('chatWindow');
        const oldToggle = document.getElementById('chatToggle');
        
        if (oldChat) oldChat.remove();
        if (oldToggle) oldToggle.remove();
        
        // Créer le nouveau chat
        const chatHTML = `
            <div id="chatToggle" class="chat-toggle">
                💬
                <div id="chatBadge" class="chat-badge" style="display: none;">0</div>
            </div>
            
            <div id="chatWindow" class="chat-window">
                <div class="chat-header">
                    <h4>💬 Chat VIP</h4>
                    <div class="chat-controls">
                        <button class="chat-control-btn" id="chatSettingsBtn" title="Paramètres">⚙️</button>
                        <button class="chat-control-btn" id="closeChatBtn" title="Fermer">✕</button>
                    </div>

                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="welcome-message">
                        <div class="message-bubble other">
                            <div class="message-author">Misterpips Bot</div>
                            Bienvenue dans le chat VIP ! 🚀
                            <div class="message-time">Maintenant</div>
                        </div>
                    </div>
                </div>
                
                <div id="typingIndicator" class="typing-indicator" style="display: none;">
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                    <span id="typingText">Quelqu'un écrit...</span>
                </div>
                
                <div class="chat-input-area">
                    <div class="input-container">
                        <div class="input-actions">
                            <button class="input-action-btn" id="emojiBtn" title="Emojis">😀</button>
                            <button class="input-action-btn" id="attachBtn" title="Fichier">📎</button>
                        </div>
                        <textarea 
                            id="chatInput" 
                            class="chat-input" 
                            placeholder="Tapez votre message..."
                            rows="1"
                            maxlength="500"
                        ></textarea>
                        <button id="sendBtn" class="send-btn input-action-btn" title="Envoyer">
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatHTML);
        
        // Ajouter la fenêtre modale des paramètres
        const settingsModal = `
            <div id="chatSettings" class="chat-settings">
                <div class="chat-settings-modal">
                    <div class="settings-header">
                        <h3 class="settings-title">⚙️ Paramètres du Chat</h3>
                        <button class="settings-close" id="closeSettingsBtn">✕</button>
                    </div>
                    <div class="setting-item nickname-setting">
                        <span class="setting-label">👤 Pseudo</span>
                        <input type="text" id="nicknameInput" class="nickname-input" placeholder="Votre pseudo" maxlength="20">
                        <button id="saveNicknameBtn" class="save-nickname-btn">✓</button>
                    </div>
                    <div class="setting-item">
                        <span class="setting-label">🔊 Sons</span>
                        <div id="soundToggle" class="setting-toggle active"></div>
                    </div>
                    <div class="setting-item">
                        <span class="setting-label">🔔 Notifications</span>
                        <div id="notificationToggle" class="setting-toggle active"></div>
                    </div>
                    <div class="setting-item">
                        <span class="setting-label">🌙 Mode sombre</span>
                        <div id="darkModeToggle" class="setting-toggle"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', settingsModal);
    }
    
    setupEventListeners() {
        const chatToggle = document.getElementById('chatToggle');
        const chatWindow = document.getElementById('chatWindow');
        const closeChatBtn = document.getElementById('closeChatBtn');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        const emojiBtn = document.getElementById('emojiBtn');
        const attachBtn = document.getElementById('attachBtn');
        // Toggle chat
        chatToggle.addEventListener('click', () => this.toggleChat());
        closeChatBtn.addEventListener('click', () => this.closeChat());
        
        // Input handling avec debouncing
        chatInput.addEventListener('input', this.debounce(() => {
            this.handleInputChange();
        }, 100));
        
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        emojiBtn.addEventListener('click', () => this.toggleEmojiPanel());
        attachBtn.addEventListener('click', () => this.handleFileAttachment());
        chatInput.addEventListener('input', () => this.autoResizeTextarea());
        this.setupMessageReactions();
        
        // Paramètres - délai pour s'assurer que les éléments existent
        setTimeout(() => {
            const chatSettingsBtn = document.getElementById('chatSettingsBtn');
            if (chatSettingsBtn) {
                chatSettingsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleSettings();
                });
            }
            this.setupSettingsListeners();
            
            // Fermer la modale des paramètres
            const closeSettingsBtn = document.getElementById('closeSettingsBtn');
            const settingsModal = document.getElementById('chatSettings');
            
            if (closeSettingsBtn) {
                closeSettingsBtn.addEventListener('click', () => {
                    settingsModal.classList.remove('show');
                });
            }
            
            if (settingsModal) {
                settingsModal.addEventListener('click', (e) => {
                    if (e.target === settingsModal) {
                        settingsModal.classList.remove('show');
                    }
                });
            }
            
            // Sauvegarder le pseudo
            const saveNicknameBtn = document.getElementById('saveNicknameBtn');
            const nicknameInput = document.getElementById('nicknameInput');
            
            if (saveNicknameBtn && nicknameInput) {
                saveNicknameBtn.addEventListener('click', async () => {
                    const newNickname = nicknameInput.value.trim();
                    if (newNickname && newNickname.length > 0) {
                        await this.saveNickname(newNickname.substring(0, 20));
                        saveNicknameBtn.textContent = '✓';
                        setTimeout(() => {
                            saveNicknameBtn.textContent = '✓';
                        }, 1000);
                    }
                });
                
                nicknameInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        saveNicknameBtn.click();
                    }
                });
                
                // Pré-remplir avec le pseudo actuel
                nicknameInput.value = this.nickname;
            }
        }, 100);
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    handleInputChange() {
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (input.value.trim()) {
            sendBtn.classList.add('active');
        } else {
            sendBtn.classList.remove('active');
        }
        
        this.sendTypingIndicator();
    }
    
    autoResizeTextarea() {
        const textarea = document.getElementById('chatInput');
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 100);
        textarea.style.height = newHeight + 'px';
    }
    
    sendTypingIndicator() {
        if (!this.isTyping) {
            this.isTyping = true;
            this.broadcastTyping(true);
        }
        
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            this.broadcastTyping(false);
        }, 2000);
    }
    
    async broadcastTyping(isTyping) {
        try {
            if (window.firebaseDB) {
                const { ref, set, remove } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const typingRef = ref(window.firebaseDB, `chat_typing/${this.currentUser}`);
                
                if (isTyping) {
                    await set(typingRef, {
                        nickname: this.nickname,
                        timestamp: Date.now()
                    });
                } else {
                    await remove(typingRef);
                }
            }
        } catch (error) {
            console.error('Erreur indicateur frappe:', error);
        }
    }
    
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.style.transform = 'scale(0.8)';
        setTimeout(() => {
            sendBtn.style.transform = 'scale(1)';
        }, 150);
        
        input.value = '';
        sendBtn.classList.remove('active');
        this.autoResizeTextarea();
        
        this.isTyping = false;
        this.broadcastTyping(false);
        
        const messageData = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: this.currentUser,
            nickname: this.nickname,
            message: message,
            timestamp: Date.now(),
            type: 'text'
        };
        
        this.addMessageToUI(messageData, true);
        
        try {
            if (window.firebaseDB) {
                const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const messagesRef = ref(window.firebaseDB, 'vip_chat');
                await push(messagesRef, messageData);
            }
        } catch (error) {
            console.error('Erreur envoi message:', error);
            this.showErrorMessage('Erreur d\'envoi. Vérifiez votre connexion.');
        }
    }
    
    addMessageToUI(messageData, isOptimistic = false) {
        const messagesContainer = document.getElementById('chatMessages');
        const isOwn = messageData.userId === this.currentUser;
        
        const lastMessageGroup = messagesContainer.lastElementChild;
        const shouldGroup = lastMessageGroup && 
            lastMessageGroup.dataset.userId === messageData.userId &&
            (messageData.timestamp - parseInt(lastMessageGroup.dataset.timestamp)) < 60000;
        
        let messageElement;
        
        if (shouldGroup && !lastMessageGroup.classList.contains('welcome-message')) {
            messageElement = this.createMessageBubble(messageData, isOwn, false);
            lastMessageGroup.appendChild(messageElement);
        } else {
            const messageGroup = document.createElement('div');
            messageGroup.className = 'message-group';
            messageGroup.dataset.userId = messageData.userId;
            messageGroup.dataset.timestamp = messageData.timestamp;
            
            messageElement = this.createMessageBubble(messageData, isOwn, true);
            messageGroup.appendChild(messageElement);
            messagesContainer.appendChild(messageGroup);
        }
        
        if (isOptimistic) {
            messageElement.style.opacity = '0.7';
            messageElement.style.transform = 'scale(0.95)';
        }
        
        this.scrollToBottom();
        
        if ('vibrate' in navigator && isOwn) {
            navigator.vibrate(50);
        }
    }
    
    createMessageBubble(messageData, isOwn, showAuthor) {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${isOwn ? 'own' : 'other'}`;
        bubble.dataset.messageId = messageData.id;
        
        const timeStr = this.formatTime(messageData.timestamp);
        
        let content = '';
        if (showAuthor && !isOwn) {
            content += `<div class="message-author">${messageData.nickname}</div>`;
        }
        
        content += `
            <div class="message-content">${this.formatMessage(messageData.message)}</div>
            <div class="message-time">${timeStr}</div>
        `;
        
        bubble.innerHTML = content;
        this.setupBubbleReactions(bubble);
        
        return bubble;
    }
    
    formatMessage(message) {
        return message
            .replace(/https?:\/\/[^\s]+/g, '<a href="$&" target="_blank" rel="noopener">$&</a>')
            .replace(/\n/g, '<br>');
    }
    
    formatTime(timestamp) {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffMinutes = Math.floor((now - messageTime) / 60000);
        
        if (diffMinutes < 1) return 'Maintenant';
        if (diffMinutes < 60) return `${diffMinutes}min`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
        
        return messageTime.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    setupBubbleReactions(bubble) {
        let longPressTimer;
        
        bubble.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                this.showReactionsPanel(bubble, e.touches[0]);
            }, 500);
        });
        
        bubble.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });
        
        bubble.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showReactionsPanel(bubble, e);
        });
    }
    
    showReactionsPanel(bubble, event) {
        const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];
        
        const panel = document.createElement('div');
        panel.className = 'reactions-panel show';
        
        reactions.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'reaction-btn';
            btn.textContent = emoji;
            btn.onclick = () => {
                this.addReaction(bubble.dataset.messageId, emoji);
                panel.remove();
            };
            panel.appendChild(btn);
        });
        
        bubble.appendChild(panel);
        
        setTimeout(() => {
            if (panel.parentNode) panel.remove();
        }, 3000);
    }
    
    async addReaction(messageId, emoji) {
        try {
            if (window.firebaseDB) {
                const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const reactionsRef = ref(window.firebaseDB, `message_reactions/${messageId}`);
                await push(reactionsRef, {
                    userId: this.currentUser,
                    emoji: emoji,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('Erreur ajout réaction:', error);
        }
    }
    
    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    toggleChat() {
        const chatWindow = document.getElementById('chatWindow');
        const isOpen = chatWindow.classList.contains('show');
        
        if (isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }
    
    openChat() {
        const chatWindow = document.getElementById('chatWindow');
        const chatToggle = document.getElementById('chatToggle');
        
        chatWindow.classList.add('show');
        chatToggle.style.display = 'none';
        
        setTimeout(() => {
            document.getElementById('chatInput').focus();
        }, 400);
        
        this.markAsRead();
    }
    
    closeChat() {
        const chatWindow = document.getElementById('chatWindow');
        const chatToggle = document.getElementById('chatToggle');
        
        chatWindow.classList.remove('show');
        chatToggle.style.display = 'flex';
    }
    
    markAsRead() {
        const badge = document.getElementById('chatBadge');
        badge.style.display = 'none';
        badge.textContent = '0';
        this.lastMessageTime = Date.now();
    }
    
    updateBadge(count) {
        const badge = document.getElementById('chatBadge');
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    async getNickname() {
        try {
            if (window.firebaseDB) {
                const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const nicknameRef = ref(window.firebaseDB, `users/${this.currentUser}/nickname`);
                const snapshot = await get(nicknameRef);
                
                if (snapshot.exists()) {
                    return snapshot.val();
                } else {
                    // Première connexion - demander un pseudo
                    return await this.promptForNickname();
                }
            }
        } catch (error) {
            console.error('Erreur récupération pseudo:', error);
        }
        
        return 'Membre VIP';
    }
    
    async promptForNickname() {
        const nickname = prompt('Choisissez votre pseudo pour le chat VIP:', 'Membre VIP');
        if (nickname && nickname.trim()) {
            const finalNickname = nickname.trim().substring(0, 20);
            await this.saveNickname(finalNickname);
            return finalNickname;
        }
        return 'Membre VIP';
    }
    
    async saveNickname(nickname) {
        try {
            if (window.firebaseDB) {
                const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const nicknameRef = ref(window.firebaseDB, `users/${this.currentUser}/nickname`);
                await set(nicknameRef, nickname);
                this.nickname = nickname;
                console.log('Pseudo sauvegardé:', nickname);
                
                // Mettre à jour le classement VIP
                if (window.vipRanking) {
                    setTimeout(() => {
                        window.vipRanking.loadRanking();
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Erreur sauvegarde pseudo:', error);
        }
    }
    
    async loadMessages() {
        try {
            if (window.firebaseDB) {
                const { ref, query, orderByKey, limitToLast, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const messagesRef = ref(window.firebaseDB, 'vip_chat');
                const recentMessagesQuery = query(messagesRef, orderByKey(), limitToLast(this.visibleMessages));
                const snapshot = await get(recentMessagesQuery);
                
                if (snapshot.exists()) {
                    const messages = Object.values(snapshot.val());
                    this.renderMessages(messages);
                }
            }
        } catch (error) {
            console.error('Erreur chargement messages:', error);
        }
    }
    
    renderMessages(messages) {
        const messagesContainer = document.getElementById('chatMessages');
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        messagesContainer.innerHTML = '';
        if (welcomeMessage) messagesContainer.appendChild(welcomeMessage);
        
        messages.forEach(message => {
            this.addMessageToUI(message, false);
        });
    }
    
    async setupRealtimeListener() {
        try {
            if (window.firebaseDB) {
                const { ref, onValue, query, orderByKey, limitToLast } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                
                const messagesRef = ref(window.firebaseDB, 'vip_chat');
                
                onValue(messagesRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const messages = Object.values(snapshot.val());
                        const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
                        
                        // Recharger tous les messages pour éviter les problèmes de sync
                        this.renderMessages(sortedMessages.slice(-50));
                        
                        // Nouveaux messages pour notifications
                        const newMessages = sortedMessages.filter(msg => 
                            msg.timestamp > this.lastMessageTime && msg.userId !== this.currentUser
                        );
                        
                        newMessages.forEach(message => {
                            this.showNotification(message);
                        });
                        
                        if (sortedMessages.length > 0) {
                            this.lastMessageTime = Math.max(...sortedMessages.map(m => m.timestamp));
                        }
                    }
                });
                
                const typingRef = ref(window.firebaseDB, 'chat_typing');
                onValue(typingRef, (snapshot) => {
                    this.updateTypingIndicator(snapshot.val());
                });
            }
        } catch (error) {
            console.error('Erreur listener temps réel:', error);
        }
    }
    
    updateTypingIndicator(typingData) {
        const indicator = document.getElementById('typingIndicator');
        const typingText = document.getElementById('typingText');
        
        if (!typingData) {
            indicator.style.display = 'none';
            return;
        }
        
        const typingUsers = Object.entries(typingData)
            .filter(([userId, data]) => userId !== this.currentUser && (Date.now() - data.timestamp) < 3000)
            .map(([userId, data]) => data.nickname);
        
        if (typingUsers.length > 0) {
            const text = typingUsers.length === 1 
                ? `${typingUsers[0]} écrit...`
                : `${typingUsers.length} personnes écrivent...`;
            typingText.textContent = text;
            indicator.style.display = 'flex';
        } else {
            indicator.style.display = 'none';
        }
    }
    
    showNotification(message) {
        const chatWindow = document.getElementById('chatWindow');
        const isOpen = chatWindow.classList.contains('show');
        
        if (!isOpen) {
            this.updateBadge(1);
            
            if (this.settings.soundEnabled) {
                this.playNotificationSound();
            }
            
            if (this.settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(`💬 ${message.nickname}`, {
                    body: message.message.substring(0, 50),
                    icon: '/Misterpips.jpg',
                    tag: 'vip-chat'
                });
            }
        } else if (this.settings.soundEnabled) {
            this.playNotificationSound();
        }
    }
    
    startPerformanceOptimizations() {
        setInterval(() => {
            if (this.messageCache.size > 1000) {
                const entries = Array.from(this.messageCache.entries());
                entries.slice(0, 500).forEach(([key]) => {
                    this.messageCache.delete(key);
                });
            }
        }, 300000);
        
        const messagesContainer = document.getElementById('chatMessages');
        let scrollTimeout;
        messagesContainer.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleVirtualScroll();
            }, 100);
        });
    }
    
    handleVirtualScroll() {
        const messagesContainer = document.getElementById('chatMessages');
        const messages = messagesContainer.querySelectorAll('.message-group');
        
        if (messages.length > this.visibleMessages) {
            const scrollTop = messagesContainer.scrollTop;
            const containerHeight = messagesContainer.clientHeight;
            
            messages.forEach((message, index) => {
                const messageTop = message.offsetTop;
                const messageHeight = message.offsetHeight;
                
                if (messageTop + messageHeight < scrollTop - containerHeight ||
                    messageTop > scrollTop + containerHeight * 2) {
                    message.style.display = 'none';
                } else {
                    message.style.display = 'block';
                }
            });
        }
    }
    
    toggleEmojiPanel() {
        const emojis = ['😀', '😂', '❤️', '👍', '🔥', '💯', '🚀', '💰', '📈', '🎯'];
        const input = document.getElementById('chatInput');
        
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        input.value += randomEmoji;
        this.handleInputChange();
        input.focus();
    }
    
    handleFileAttachment() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file && file.size < 5 * 1024 * 1024) {
                this.sendFileMessage(file);
            } else {
                alert('Fichier trop volumineux (max 5MB)');
            }
        };
        input.click();
    }
    
    async sendFileMessage(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const messageData = {
                id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: this.currentUser,
                nickname: this.nickname,
                message: `📎 ${file.name}`,
                timestamp: Date.now(),
                type: 'file',
                fileData: e.target.result,
                fileName: file.name,
                fileType: file.type
            };
            
            this.addMessageToUI(messageData, true);
            
            try {
                if (window.firebaseDB) {
                    const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                    const messagesRef = ref(window.firebaseDB, 'vip_chat');
                    await push(messagesRef, messageData);
                }
            } catch (error) {
                console.error('Erreur envoi fichier:', error);
            }
        };
        reader.readAsDataURL(file);
    }
    
    setupSettingsListeners() {
        const soundToggle = document.getElementById('soundToggle');
        const notificationToggle = document.getElementById('notificationToggle');
        const darkModeToggle = document.getElementById('darkModeToggle');
        
        if (soundToggle) {
            soundToggle.addEventListener('click', () => this.toggleSetting('soundEnabled', soundToggle));
        }
        if (notificationToggle) {
            notificationToggle.addEventListener('click', () => this.toggleSetting('notificationsEnabled', notificationToggle));
        }
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => this.toggleSetting('darkMode', darkModeToggle));
        }
        
        this.updateSettingsUI();
    }
    
    toggleSettings() {
        const settings = document.getElementById('chatSettings');
        if (settings) {
            settings.classList.toggle('show');
        }
    }
    
    toggleSetting(setting, toggle) {
        this.settings[setting] = !this.settings[setting];
        localStorage.setItem('chat' + setting.charAt(0).toUpperCase() + setting.slice(1), this.settings[setting]);
        toggle.classList.toggle('active', this.settings[setting]);
        
        if (setting === 'darkMode') {
            this.applyDarkMode();
        }
        
        if (this.settings.soundEnabled) {
            this.playNotificationSound();
        }
    }
    
    updateSettingsUI() {
        const soundToggle = document.getElementById('soundToggle');
        const notificationToggle = document.getElementById('notificationToggle');
        const darkModeToggle = document.getElementById('darkModeToggle');
        
        if (soundToggle) {
            soundToggle.classList.toggle('active', this.settings.soundEnabled);
        }
        if (notificationToggle) {
            notificationToggle.classList.toggle('active', this.settings.notificationsEnabled);
        }
        if (darkModeToggle) {
            darkModeToggle.classList.toggle('active', this.settings.darkMode);
        }
        
        this.applyDarkMode();
    }
    
    applyDarkMode() {
        const chatWindow = document.getElementById('chatWindow');
        chatWindow.classList.toggle('dark-mode', this.settings.darkMode);
    }
    
    playNotificationSound() {
        if (this.settings.soundEnabled && this.notificationSound) {
            this.notificationSound.currentTime = 0;
            this.notificationSound.play().catch(() => {});
        }
    }
    
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff3b30;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
    
    setupMessageReactions() {
        // Placeholder pour les réactions
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            if (sessionStorage.getItem('firebaseUID')) {
                console.log('🚀 Initialisation Chat...');
                window.iMessageChat = new iMessageChat();
                console.log('✅ Chat créé');
            }
        } catch (error) {
            console.error('Erreur initialisation chat:', error);
        }
    }, 3000);
});