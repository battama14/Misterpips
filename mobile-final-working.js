// Script final fonctionnel pour mobile
console.log('🔧 Chargement mobile final...');

// Navigation sections
function showSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    
    // Mettre à jour navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');
    
    console.log('📱 Section affichée:', sectionId);
}

// Modal trade
function openModal() {
    document.getElementById('tradeModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('tradeModal').style.display = 'none';
}

// Chat
function toggleChat() {
    const chat = document.getElementById('chatWindow');
    chat.style.display = chat.style.display === 'none' ? 'block' : 'none';
}

// Événements au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Navigation bottom
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const section = btn.getAttribute('data-section');
        btn.addEventListener('click', () => showSection(section));
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            showSection(section);
        });
    });
    
    // Boutons trade
    document.getElementById('newTradeBtn')?.addEventListener('click', openModal);
    document.getElementById('addTradeBtn')?.addEventListener('click', openModal);
    
    // Chat toggle
    document.getElementById('chatToggle')?.addEventListener('click', toggleChat);
    
    // Afficher dashboard par défaut
    showSection('dashboard');
});

// Exposer globalement
window.showSection = showSection;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleChat = toggleChat;

console.log('✅ Mobile final chargé');