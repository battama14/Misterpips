// Chat unifié PC/Mobile
class UnifiedChat {
    constructor() {
        this.currentUser = sessionStorage.getItem('firebaseUID');
        this.nickname = sessionStorage.getItem('userNickname') || 'User';
        this.init();
    }
    
    async init() {
        if (!window.firebaseDB) {
            setTimeout(() => this.init(), 1000);
            return;
        }
        
        this.setupEventListeners();
        this.loadMessages();
    }
    
    setupEventListeners() {
        const sendBtn = document.getElementById('sendBtn');
        const chatInput = document.getElementById('chatInput');
        
        if (sendBtn) sendBtn.onclick = () => this.sendMessage();
        if (chatInput) {
            chatInput.onkeypress = (e) => {
                if (e.key === 'Enter') this.sendMessage();
            };
        }
    }
    
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;
        
        const messageData = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: this.currentUser,
            nickname: this.nickname,
            message: message,
            timestamp: Date.now(),
            type: 'text'
        };
        
        input.value = '';
        
        try {
            const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            const messagesRef = ref(window.firebaseDB, 'vip_chat');
            await push(messagesRef, messageData);
            console.log('✅ Message envoyé:', messageData);
        } catch (error) {
            console.error('❌ Erreur envoi:', error);
        }
    }
    
    async loadMessages() {
        try {
            const { ref, onValue } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            const messagesRef = ref(window.firebaseDB, 'vip_chat');
            
            onValue(messagesRef, (snapshot) => {
                const container = document.getElementById('chatMessages');
                if (!container) return;
                
                container.innerHTML = '';
                
                if (snapshot.exists()) {
                    const messages = Object.values(snapshot.val())
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .slice(-50);
                    
                    messages.forEach(msg => this.displayMessage(msg));
                    container.scrollTop = container.scrollHeight;
                }
            });
        } catch (error) {
            console.error('❌ Erreur chargement:', error);
        }
    }
    
    displayMessage(msg) {
        const container = document.getElementById('chatMessages');
        const isOwn = msg.userId === this.currentUser;
        
        const div = document.createElement('div');
        div.className = `message-bubble ${isOwn ? 'own' : 'other'}`;
        div.innerHTML = `
            <div class="message-author">${msg.nickname}</div>
            <div class="message-content">${msg.message}</div>
            <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
        `;
        
        container.appendChild(div);
    }
}

// Initialiser après Firebase
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (sessionStorage.getItem('firebaseUID')) {
            window.unifiedChat = new UnifiedChat();
        }
    }, 3000);
});