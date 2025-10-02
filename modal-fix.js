// Correction des modales - Fermeture universelle
console.log('🔧 Script de correction des modales chargé');

function fixModalClose() {
    console.log('🔧 Correction de la fermeture des modales...');
    
    // Fonction universelle de fermeture
    function closeAnyModal() {
        const modals = ['tradeModal', 'fullscreenModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && modal.style.display === 'block') {
                modal.style.display = 'none';
                console.log(`✅ Modal ${modalId} fermée`);
            }
        });
    }
    
    // Écouter tous les clics sur les éléments de fermeture
    document.addEventListener('click', (e) => {
        // Boutons de fermeture
        if (e.target.classList.contains('close') || 
            e.target.textContent === '×' || 
            e.target.textContent === '✕' ||
            e.target.classList.contains('close-btn') ||
            e.target.classList.contains('close-fullscreen')) {
            e.preventDefault();
            e.stopPropagation();
            closeAnyModal();
            return;
        }
        
        // Clic sur l'arrière-plan des modales
        if (e.target.id === 'tradeModal' || e.target.id === 'fullscreenModal') {
            closeAnyModal();
            return;
        }
    });
    
    // Touche Échap pour fermer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAnyModal();
        }
    });
    
    // Fonction globale
    window.closeModal = closeAnyModal;
    window.closeFullscreen = closeAnyModal;
    
    console.log('✅ Correction des modales terminée');
}

// Lancer la correction
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixModalClose);
} else {
    fixModalClose();
}