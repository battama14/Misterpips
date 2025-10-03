// Navigation Mobile Optimisée
class MobileNavigation {
    constructor() {
        this.currentSection = 'dashboard';
        this.menuOpen = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showSection('dashboard');
        console.log('📱 Navigation mobile initialisée');
    }

    setupEventListeners() {
        // Menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const closeMenu = document.getElementById('closeMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleMenu());
        }

        if (closeMenu) {
            closeMenu.addEventListener('click', () => this.closeMenu());
        }

        if (menuOverlay) {
            menuOverlay.addEventListener('click', () => this.closeMenu());
        }

        // Navigation bottom
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Menu links
        const menuLinks = document.querySelectorAll('.menu-list a[data-section]');
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                    this.closeMenu();
                }
            });
        });

        // Swipe gestures
        this.setupSwipeGestures();

        // Prevent scroll on body when menu is open
        document.addEventListener('touchmove', (e) => {
            if (this.menuOpen) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    toggleMenu() {
        if (this.menuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        const menu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('menuOverlay');
        
        if (menu && overlay) {
            menu.classList.add('active');
            overlay.classList.add('active');
            this.menuOpen = true;
            document.body.style.overflow = 'hidden';
        }
    }

    closeMenu() {
        const menu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('menuOverlay');
        
        if (menu && overlay) {
            menu.classList.remove('active');
            overlay.classList.remove('active');
            this.menuOpen = false;
            document.body.style.overflow = '';
        }
    }

    showSection(sectionId) {
        // Masquer toutes les sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Afficher la section demandée
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
        }

        // Mettre à jour la navigation bottom
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-section') === sectionId) {
                btn.classList.add('active');
            }
        });

        // Scroll to top
        const mainContent = document.querySelector('.mobile-main');
        if (mainContent) {
            mainContent.scrollTop = 0;
        }

        console.log(`📱 Section active: ${sectionId}`);
    }

    setupSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        const mainContent = document.querySelector('.mobile-main');
        if (!mainContent) return;

        mainContent.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        mainContent.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            this.handleSwipe();
        }, { passive: true });
    }

    handleSwipe() {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const minSwipeDistance = 50;

        // Swipe horizontal plus important que vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                // Swipe right - ouvrir menu
                if (!this.menuOpen) {
                    this.openMenu();
                }
            } else {
                // Swipe left - fermer menu
                if (this.menuOpen) {
                    this.closeMenu();
                }
            }
        }
    }

    // Navigation par sections
    nextSection() {
        const sections = ['dashboard', 'trades', 'calendar', 'ranking'];
        const currentIndex = sections.indexOf(this.currentSection);
        const nextIndex = (currentIndex + 1) % sections.length;
        this.showSection(sections[nextIndex]);
    }

    prevSection() {
        const sections = ['dashboard', 'trades', 'calendar', 'ranking'];
        const currentIndex = sections.indexOf(this.currentSection);
        const prevIndex = currentIndex === 0 ? sections.length - 1 : currentIndex - 1;
        this.showSection(sections[prevIndex]);
    }
}

// Fonctions globales pour compatibilité
window.showSection = function(sectionId) {
    if (window.mobileNav) {
        window.mobileNav.showSection(sectionId);
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.mobileNav = new MobileNavigation();
});

// Support des gestes système
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.mobileNav) {
        window.mobileNav.closeMenu();
    }
});

// Gestion de l'orientation
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (window.mobileNav) {
            window.mobileNav.closeMenu();
        }
    }, 100);
});

console.log('📱 Navigation mobile chargée');