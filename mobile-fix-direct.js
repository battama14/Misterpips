// Fix direct pour navigation mobile
console.log('🔧 Fix direct chargé');

// Fonction showSection simple
window.showSection = function(sectionId) {
    console.log('📱 showSection appelée:', sectionId);
    
    // Cacher toutes les sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Afficher la section cible
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
        console.log('✅ Section affichée:', sectionId);
    } else {
        console.error('❌ Section non trouvée:', sectionId);
    }
    
    // Fermer le menu
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.remove('open');
    }
};

// Attacher directement aux boutons
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🔧 Attachement direct des événements');
        
        // Navigation bottom - par ID
        const navBtns = [
            { id: 'dashboard', selector: '.nav-btn[onclick*="dashboard"]' },
            { id: 'trades', selector: '.nav-btn[onclick*="trades"]' },
            { id: 'calendar', selector: '.nav-btn[onclick*="calendar"]' },
            { id: 'objectives', selector: '.nav-btn[onclick*="objectives"]' },
            { id: 'ranking', selector: '.nav-btn[onclick*="ranking"]' }
        ];
        
        navBtns.forEach(nav => {
            const btn = document.querySelector(nav.selector);
            if (btn) {
                btn.ontouchend = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('👆 Touch direct sur:', nav.id);
                    window.showSection(nav.id);
                };
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Click direct sur:', nav.id);
                    window.showSection(nav.id);
                };
                console.log('✅ Événements attachés à:', nav.id);
            }
        });
        
        // Menu hamburger
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.ontouchend = (e) => {
                e.preventDefault();
                console.log('🍔 Menu touch');
                document.getElementById('mobileMenu').classList.add('open');
            };
            menuToggle.onclick = (e) => {
                e.preventDefault();
                console.log('🍔 Menu click');
                document.getElementById('mobileMenu').classList.add('open');
            };
        }
        
        // Menu links
        const menuLinks = [
            { id: 'dashboard', selector: '.menu-list a[onclick*="dashboard"]' },
            { id: 'trades', selector: '.menu-list a[onclick*="trades"]' },
            { id: 'calendar', selector: '.menu-list a[onclick*="calendar"]' },
            { id: 'objectives', selector: '.menu-list a[onclick*="objectives"]' },
            { id: 'ranking', selector: '.menu-list a[onclick*="ranking"]' }
        ];
        
        menuLinks.forEach(link => {
            const element = document.querySelector(link.selector);
            if (element) {
                element.ontouchend = (e) => {
                    e.preventDefault();
                    console.log('📋 Menu link touch:', link.id);
                    window.showSection(link.id);
                };
                element.onclick = (e) => {
                    e.preventDefault();
                    console.log('📋 Menu link click:', link.id);
                    window.showSection(link.id);
                };
            }
        });
        
        console.log('✅ Tous les événements directs attachés');
    }, 1000);
});