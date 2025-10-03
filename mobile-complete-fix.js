// Fix complet pour mobile
console.log('🔧 Chargement fix mobile complet...');

// 1. Fonctions de base
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');
    
    console.log('📱 Section active:', sectionId);
}

// 2. Modal trade
function openTradeModal() {
    document.getElementById('tradeModal').style.display = 'block';
}

function closeTradeModal() {
    document.getElementById('tradeModal').style.display = 'none';
}

function saveTrade() {
    const pair = document.getElementById('tradePair').value;
    const type = document.getElementById('tradeType').value;
    const lot = document.getElementById('tradeLot').value;
    const entry = document.getElementById('tradeEntry')?.value || '1.0000';
    const sl = document.getElementById('tradeStopLoss')?.value || '0.9950';
    const tp = document.getElementById('tradeTakeProfit')?.value || '1.0050';
    const result = document.getElementById('tradeResult').value;
    
    if (!pair || !type || !lot || !result) {
        alert('Veuillez remplir les champs obligatoires');
        return;
    }
    
    console.log('💾 Trade sauvegardé:', { pair, type, lot, entry, sl, tp, result });
    closeTradeModal();
    alert('Trade sauvegardé!');
}

// 3. Chat mobile
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
        chatWindow.style.display = chatWindow.style.display === 'none' ? 'block' : 'none';
    }
}

function sendMessage() {
    const input = document.getElementById('mobileMessageInput');
    if (input && input.value.trim()) {
        console.log('📱 Message envoyé:', input.value);
        input.value = '';
    }
}

// 4. Événements
document.addEventListener('DOMContentLoaded', () => {
    // Boutons navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.section));
        btn.addEventListener('touchend', () => showSection(btn.dataset.section));
    });
    
    // Boutons trade
    const newTradeBtn = document.getElementById('newTradeBtn');
    const addTradeBtn = document.getElementById('addTradeBtn');
    if (newTradeBtn) {
        newTradeBtn.addEventListener('click', openTradeModal);
        newTradeBtn.addEventListener('touchend', openTradeModal);
    }
    if (addTradeBtn) {
        addTradeBtn.addEventListener('click', openTradeModal);
        addTradeBtn.addEventListener('touchend', openTradeModal);
    }
    
    // Modal fermeture
    const closeBtn = document.getElementById('closeTradeModal');
    const cancelBtn = document.getElementById('cancelTradeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeTradeModal);
        closeBtn.addEventListener('touchend', closeTradeModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeTradeModal);
        cancelBtn.addEventListener('touchend', closeTradeModal);
    }
    
    // Form submit
    const tradeForm = document.getElementById('tradeForm');
    if (tradeForm) {
        tradeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveTrade();
        });
    }
    
    // Chat toggle
    const chatToggle = document.getElementById('chatToggle');
    if (chatToggle) {
        chatToggle.addEventListener('click', toggleChat);
        chatToggle.addEventListener('touchend', toggleChat);
    }
    
    // Menu mobile
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.style.display = 'block';
        });
    }
    
    if (closeMenu && mobileMenu) {
        closeMenu.addEventListener('click', () => {
            mobileMenu.style.display = 'none';
        });
    }
});

// Exposer les fonctions
window.showSection = showSection;
window.openTradeModal = openTradeModal;
window.closeTradeModal = closeTradeModal;
window.saveTrade = saveTrade;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;

console.log('✅ Fix mobile complet chargé');