// Corrections pour mobile dashboard
console.log('🔧 Chargement corrections mobile...');

// 1. Chat mobile
function sendMobileMessage() {
    const input = document.getElementById('mobileMessageInput');
    const message = input.value.trim();
    if (message) {
        console.log('📱 Envoi message:', message);
        input.value = '';
        const messagesContainer = document.getElementById('mobileMessages');
        messagesContainer.innerHTML += `
            <div class="message-item">
                <div class="message-author">Vous</div>
                <div class="message-text">${message}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function toggleEmojiPanel() {
    const panel = document.getElementById('mobileEmojiPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function insertEmoji(emoji) {
    const input = document.getElementById('mobileMessageInput');
    input.value += emoji;
    toggleEmojiPanel();
}

function toggleMobileChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.style.display = chatWindow.style.display === 'none' ? 'block' : 'none';
}

// 2. Trades mobile
function closeMobileModal() {
    document.getElementById('tradeModal').style.display = 'none';
}

function saveMobileTrade() {
    const pair = document.getElementById('tradePair').value;
    const type = document.getElementById('tradeType').value;
    const lots = document.getElementById('tradeLots').value;
    const entry = document.getElementById('tradeEntry').value;
    const sl = document.getElementById('tradeStopLoss').value;
    const tp = document.getElementById('tradeTakeProfit').value;
    
    if (!pair || !type || !lots || !entry || !sl || !tp) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    const trade = {
        pair, type, lots: parseFloat(lots),
        entry: parseFloat(entry), stopLoss: parseFloat(sl), takeProfit: parseFloat(tp),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        status: 'open'
    };
    
    console.log('💾 Sauvegarde trade mobile:', trade);
    closeMobileModal();
    alert('Trade sauvegardé!');
}

// 3. Classement VIP - forcer utilisation de showRankingNow
setTimeout(() => {
    if (window.showRankingNow) {
        console.log('🏆 Lancement classement mobile...');
        window.showRankingNow();
        setInterval(() => window.showRankingNow(), 30000);
    }
}, 3000);

// 4. Position chat toggle
document.addEventListener('DOMContentLoaded', () => {
    const chatToggle = document.getElementById('chatToggle');
    if (chatToggle) {
        chatToggle.style.bottom = '90px';
        chatToggle.addEventListener('click', toggleMobileChat);
        chatToggle.addEventListener('touchend', toggleMobileChat);
    }
    
    // Valeurs par défaut pour les champs trade
    const tradeEntry = document.getElementById('tradeEntry');
    const tradeSl = document.getElementById('tradeStopLoss');
    const tradeTp = document.getElementById('tradeTakeProfit');
    
    if (tradeEntry) tradeEntry.value = '1.0000';
    if (tradeSl) tradeSl.value = '0.9950';
    if (tradeTp) tradeTp.value = '1.0050';
    
    // Événements tactiles pour chat
    const sendBtn = document.querySelector('.send-btn');
    const emojiBtn = document.querySelector('.emoji-btn');
    const messageInput = document.getElementById('mobileMessageInput');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMobileMessage);
        sendBtn.addEventListener('touchend', sendMobileMessage);
    }
    
    if (emojiBtn) {
        emojiBtn.addEventListener('click', toggleEmojiPanel);
        emojiBtn.addEventListener('touchend', toggleEmojiPanel);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMobileMessage();
        });
    }
});

// Exposer les fonctions globalement
window.sendMobileMessage = sendMobileMessage;
window.toggleEmojiPanel = toggleEmojiPanel;
window.insertEmoji = insertEmoji;
window.toggleMobileChat = toggleMobileChat;
window.closeMobileModal = closeMobileModal;
window.saveMobileTrade = saveMobileTrade;

console.log('✅ Corrections mobile chargées');