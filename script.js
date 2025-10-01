// Navigation mobile
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('mobile-open');
        });
        
        // Fermer le menu en cliquant sur un lien
        navLinks.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                navLinks.classList.remove('mobile-open');
            }
        });
        
        // Fermer le menu en cliquant à l'extérieur
        document.addEventListener('click', function(e) {
            if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('mobile-open');
            }
        });
    }
    
    // Smooth scroll pour les liens d'ancrage
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Animation d'apparition des sections
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observer toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
    
    // Effet parallax léger pour le hero
    const hero = document.getElementById('hero');
    if (hero) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        });
    }
    
    // Gestion des boutons CTA
    const ctaButtons = document.querySelectorAll('.cta-button, .telegram-button');
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Gestion des liens sociaux
    const socialLinks = document.querySelectorAll('.social-icon-link, .social-link');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.1)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Effet de typing pour le titre principal
    const mainTitle = document.querySelector('#hero h1');
    if (mainTitle) {
        const text = mainTitle.textContent;
        mainTitle.textContent = '';
        let i = 0;
        
        function typeWriter() {
            if (i < text.length) {
                mainTitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        }
        
        // Démarrer l'effet après un court délai
        setTimeout(typeWriter, 500);
    }
    
    // Gestion des formulaires avec validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const inputs = form.querySelectorAll('input[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#ff6b6b';
                    input.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.3)';
                } else {
                    input.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                    input.style.boxShadow = 'none';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                // Afficher un message d'erreur stylé
                showNotification('Veuillez remplir tous les champs requis', 'error');
            }
        });
    });
    
    // Système de notifications
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        switch(type) {
            case 'success':
                notification.style.background = 'linear-gradient(45deg, #4ecdc4, #44a08d)';
                break;
            case 'error':
                notification.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
                break;
            case 'warning':
                notification.style.background = 'linear-gradient(45deg, #ffc107, #ff8f00)';
                break;
            default:
                notification.style.background = 'linear-gradient(45deg, #00d4ff, #5b86e5)';
        }
        
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animation de sortie
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Exposer la fonction globalement
    window.showNotification = showNotification;
    
    // Gestion du mode sombre/clair (optionnel)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('light-theme');
            localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        });
        
        // Charger le thème sauvegardé
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }
    }
    
    // Gestion des tooltips
    const elementsWithTooltip = document.querySelectorAll('[data-tooltip]');
    elementsWithTooltip.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
            
            setTimeout(() => {
                tooltip.style.opacity = '1';
            }, 100);
            
            this.tooltipElement = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this.tooltipElement) {
                this.tooltipElement.style.opacity = '0';
                setTimeout(() => {
                    if (this.tooltipElement && this.tooltipElement.parentNode) {
                        document.body.removeChild(this.tooltipElement);
                    }
                }, 300);
            }
        });
    });
    
    // Gestion du loading
    function showLoading() {
        const loading = document.createElement('div');
        loading.id = 'loading';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Chargement...</div>
        `;
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid rgba(0, 212, 255, 0.3);
                border-top: 3px solid #00d4ff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            }
            
            .loading-text {
                color: #00d4ff;
                font-size: 18px;
                font-weight: 600;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(loading);
    }
    
    function hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(loading);
            }, 300);
        }
    }
    
    // Exposer les fonctions globalement
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;
    
    // Gestion des erreurs globales
    window.addEventListener('error', function(e) {
        console.error('Erreur JavaScript:', e.error);
        showNotification('Une erreur est survenue. Veuillez rafraîchir la page.', 'error');
    });
    
    // Gestion de la perte de connexion
    window.addEventListener('online', function() {
        showNotification('Connexion rétablie', 'success');
    });
    
    window.addEventListener('offline', function() {
        showNotification('Connexion perdue', 'warning');
    });
    
    console.log('🚀 Misterpips - Site initialisé avec succès');
});