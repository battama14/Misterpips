// Script de diagnostic et correction des boutons
console.log('🔧 Script de correction des boutons chargé');

function fixButtons() {
    console.log('🔧 Correction des boutons en cours...');
    
    const buttons = [
        { id: 'newTradeBtn', action: () => window.dashboard?.startNewTrade() },
        { id: 'settingsBtn', action: () => window.dashboard?.showSettings() },
        { id: 'closeTradeBtn', action: () => window.dashboard?.showCloseTradeModal() },
        { id: 'exportBtn', action: () => window.dashboard?.exportToExcel() },
        { id: 'historyTradeBtn', action: () => window.dashboard?.showHistoryTradeModal() },
        { id: 'addAccountBtn', action: () => window.dashboard?.addNewAccount() },
        { id: 'deleteAccountBtn', action: () => window.dashboard?.deleteAccount() }
    ];
    
    buttons.forEach(({ id, action }) => {
        const button = document.getElementById(id);
        if (button) {
            // Supprimer tous les événements existants
            button.onclick = null;
            button.removeAttribute('onclick');
            
            // Ajouter le nouvel événement
            button.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`🔘 Bouton ${id} cliqué`);
                if (action) {
                    action();
                } else {
                    console.warn(`⚠️ Aucune action définie pour ${id}`);
                }
            });
            
            console.log(`✅ Bouton ${id} corrigé`);
        } else {
            console.warn(`⚠️ Bouton ${id} introuvable`);
        }
    });
    
    console.log('✅ Correction des boutons terminée');
}

// Attendre que le dashboard soit prêt
function waitForDashboard() {
    if (window.dashboard) {
        fixButtons();
    } else {
        console.log('⏳ Attente du dashboard...');
        setTimeout(waitForDashboard, 1000);
    }
}

// Lancer la correction après le chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(waitForDashboard, 2000);
    });
} else {
    setTimeout(waitForDashboard, 2000);
}

// Fonction globale pour forcer la correction
window.fixDashboardButtons = fixButtons;