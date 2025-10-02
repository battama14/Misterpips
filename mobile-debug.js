// Script de débogage mobile
console.log('🔧 Script de débogage mobile chargé');

// Test de la fonction showSection
window.testNavigation = function() {
    console.log('🧪 Test de navigation...');
    
    const sections = ['dashboard', 'trades', 'calendar', 'objectives', 'ranking'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        console.log(`Section ${section}:`, element ? '✅ Trouvée' : '❌ Manquante');
    });
    
    const navButtons = document.querySelectorAll('.nav-btn');
    console.log(`Boutons de navigation: ${navButtons.length}`);
    
    const menuLinks = document.querySelectorAll('.menu-list a');
    console.log(`Liens de menu: ${menuLinks.length}`);
    
    // Test de showSection
    if (typeof window.showSection === 'function') {
        console.log('✅ Fonction showSection disponible');
        window.showSection('dashboard');
    } else {
        console.error('❌ Fonction showSection manquante');
    }
};

// Test des événements
window.testEvents = function() {
    console.log('🧪 Test des événements...');
    
    const menuToggle = document.getElementById('menuToggle');
    const chatToggle = document.getElementById('mobileChatToggle');
    const newTradeBtn = document.getElementById('newTradeBtn');
    
    console.log('Menu toggle:', menuToggle ? '✅' : '❌');
    console.log('Chat toggle:', chatToggle ? '✅' : '❌');
    console.log('New trade button:', newTradeBtn ? '✅' : '❌');
    
    // Test des clics
    if (menuToggle) {
        menuToggle.click();
        console.log('✅ Test clic menu toggle');
    }
};

// Auto-test au chargement
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🚀 Auto-test de débogage mobile');
        window.testNavigation();
        window.testEvents();
    }, 2000);
});

// Fonction pour forcer la navigation
window.forceShowSection = function(sectionId) {
    console.log('🔧 Force navigation vers:', sectionId);
    
    // Cacher toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    // Afficher la section cible
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
        console.log('✅ Section forcée:', sectionId);
    }
    
    // Fermer le menu
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.remove('open');
    }
};

// Ajout d'événements de débogage
document.addEventListener('click', (e) => {
    console.log('👆 Clic détecté sur:', e.target.tagName, e.target.id, e.target.className);
});

document.addEventListener('touchend', (e) => {
    console.log('👆 Touch détecté sur:', e.target.tagName, e.target.id, e.target.className);
});

console.log('🔧 Fonctions de débogage disponibles: testNavigation(), testEvents(), forceShowSection(id)');