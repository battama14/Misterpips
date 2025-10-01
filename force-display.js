// Force l'affichage visible immédiatement
(function() {
    'use strict';
    
    // Forcer l'affichage dès que possible
    const forceDisplay = () => {
        const html = document.documentElement;
        const body = document.body;
        
        if (html) {
            html.style.setProperty('opacity', '1', 'important');
            html.style.setProperty('visibility', 'visible', 'important');
        }
        
        if (body) {
            body.style.setProperty('opacity', '1', 'important');
            body.style.setProperty('visibility', 'visible', 'important');
            body.style.setProperty('display', 'block', 'important');
        }
        
        // Forcer tous les éléments principaux
        const container = document.querySelector('.container');
        if (container) {
            container.style.setProperty('opacity', '1', 'important');
            container.style.setProperty('visibility', 'visible', 'important');
        }
    };
    
    // Exécuter immédiatement
    forceDisplay();
    
    // Observer les changements du DOM
    const observer = new MutationObserver(forceDisplay);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    
    // Exécuter quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceDisplay);
    } else {
        forceDisplay();
    }
    
    // Exécuter quand la page est complètement chargée
    window.addEventListener('load', forceDisplay);
    
    // Forcer périodiquement pendant les 3 premières secondes
    const interval = setInterval(forceDisplay, 50);
    setTimeout(() => {
        clearInterval(interval);
        observer.disconnect();
    }, 3000);
    
    // Forcer au premier clic/touch
    const forceOnInteraction = () => {
        forceDisplay();
        document.removeEventListener('click', forceOnInteraction);
        document.removeEventListener('touchstart', forceOnInteraction);
    };
    
    document.addEventListener('click', forceOnInteraction);
    document.addEventListener('touchstart', forceOnInteraction);
})();