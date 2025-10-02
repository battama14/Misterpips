// Fix urgent pour navigation mobile tactile
console.log('🔧 Fix urgent navigation tactile chargé');

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🔧 Application du fix tactile...');
        
        // Navigation bottom - fix tactile direct
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
                    console.log('👆 Touch nav:', nav.id);
                    window.showSection(nav.id);
                };
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Click nav:', nav.id);
                    window.showSection(nav.id);
                };
                console.log('✅ Fix appliqué à:', nav.id);
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
        
        // Menu close
        const closeMenu = document.getElementById('closeMenu');
        if (closeMenu) {
            closeMenu.ontouchend = (e) => {
                e.preventDefault();
                document.getElementById('mobileMenu').classList.remove('open');
            };
            closeMenu.onclick = (e) => {
                e.preventDefault();
                document.getElementById('mobileMenu').classList.remove('open');
            };
        }
        
        // Menu links
        const menuLinks = [
            { id: 'dashboard', selector: '.menu-list a[onclick*="dashboard"]' },
            { id: 'trades', selector: '.menu-list a[onclick*="trades"]' },
            { id: 'calendar', selector: '.menu-list a[onclick*="calendar"]' },
            { id: 'objectives', selector: '.menu-list a[onclick*="objectives"]' },
            { id: 'ranking', selector: '.menu-list a[onclick*="ranking"]' },
            { id: 'settings', selector: '.menu-list a[onclick*="settings"]' }
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
        
        console.log('✅ Fix tactile appliqué à tous les éléments');
    }, 1500);
});

// Fonction showSection globale
window.showSection = function(sectionId) {
    console.log('📱 Navigation vers:', sectionId);
    
    // Cacher toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section cible
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('✅ Section affichée:', sectionId);
    }
    
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[onclick*="showSection('${sectionId}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Fermer le menu
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.remove('open');
    }
};