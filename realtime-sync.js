// Synchronisation temps réel Firebase
class RealtimeSync {
    constructor() {
        this.isEnabled = true;
        this.saveQueue = [];
        this.isSaving = false;
        this.init();
    }

    init() {
        console.log('🔄 Initialisation synchronisation temps réel...');
        this.setupAutoSave();
        this.interceptDashboardMethods();
        this.setupRankingAutoUpdate();
    }

    // Intercepter toutes les méthodes de sauvegarde du dashboard
    interceptDashboardMethods() {
        const originalMethods = [
            'saveTrade',
            'closeTrade', 
            'saveEditedTrade',
            'saveEditedClosedTrade',
            'deleteTrade',
            'saveSettings',
            'saveData'
        ];

        originalMethods.forEach(methodName => {
            if (window.dashboard && typeof window.dashboard[methodName] === 'function') {
                const originalMethod = window.dashboard[methodName];
                
                window.dashboard[methodName] = async (...args) => {
                    console.log(`🔄 ${methodName} intercepté`);
                    
                    // Exécuter la méthode originale
                    const result = await originalMethod.apply(window.dashboard, args);
                    
                    // Déclencher la synchronisation
                    await this.triggerSync(methodName);
                    
                    return result;
                };
            }
        });
    }

    // Déclencher la synchronisation
    async triggerSync(action) {
        if (!this.isEnabled) return;

        console.log(`🚀 Sync déclenchée par: ${action}`);
        
        // Sauvegarder immédiatement
        await this.forceSave();
        
        // Mettre à jour le classement
        this.updateRanking();
        
        // Notifier les autres utilisateurs
        this.broadcastUpdate(action);
    }

    // Sauvegarde forcée
    async forceSave() {
        if (!window.dashboard) return;
        
        try {
            await window.dashboard.saveData();
            console.log('✅ Sauvegarde forcée terminée');
        } catch (error) {
            console.error('❌ Erreur sauvegarde forcée:', error);
        }
    }

    // Mettre à jour le classement
    updateRanking() {
        setTimeout(() => {
            if (window.showRankingNow) {
                window.showRankingNow();
                console.log('🏆 Classement mis à jour');
            }
        }, 2000);
    }

    // Diffuser la mise à jour aux autres utilisateurs
    async broadcastUpdate(action) {
        try {
            const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            
            const updateRef = ref(window.firebaseDB, 'updates/ranking');
            await set(updateRef, {
                timestamp: Date.now(),
                action: action,
                user: sessionStorage.getItem('firebaseUID'),
                trigger: 'ranking_update'
            });
            
            console.log('📡 Mise à jour diffusée');
        } catch (error) {
            console.error('❌ Erreur diffusion:', error);
        }
    }

    // Écouter les mises à jour des autres utilisateurs
    setupRankingAutoUpdate() {
        if (!window.firebaseDB) return;

        import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js')
            .then(({ ref, onValue }) => {
                const updatesRef = ref(window.firebaseDB, 'updates/ranking');
                
                onValue(updatesRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const update = snapshot.val();
                        const currentUser = sessionStorage.getItem('firebaseUID');
                        
                        // Ne pas réagir à ses propres mises à jour
                        if (update.user !== currentUser) {
                            console.log('📥 Mise à jour reçue d\'un autre utilisateur');
                            this.updateRanking();
                        }
                    }
                });
                
                console.log('👂 Écoute des mises à jour activée');
            });
    }

    // Sauvegarde automatique périodique
    setupAutoSave() {
        // Sauvegarde toutes les 10 secondes si des changements
        setInterval(() => {
            if (window.dashboard && this.hasChanges()) {
                this.forceSave();
            }
        }, 10000);

        // Surveillance des changements dans les formulaires
        document.addEventListener('change', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.scheduleSync('form_change');
            }
        });

        // Surveillance des clics sur les boutons importants
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-submit, .btn-primary, .btn-success, .btn-danger')) {
                setTimeout(() => this.scheduleSync('button_click'), 1000);
            }
        });
    }

    // Programmer une synchronisation
    scheduleSync(reason) {
        clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => {
            this.triggerSync(reason);
        }, 2000);
    }

    // Vérifier s'il y a des changements
    hasChanges() {
        if (!window.dashboard) return false;
        
        const currentData = JSON.stringify({
            trades: window.dashboard.trades,
            settings: window.dashboard.settings
        });
        
        if (this.lastSavedData !== currentData) {
            this.lastSavedData = currentData;
            return true;
        }
        
        return false;
    }

    // Activer/désactiver la synchronisation
    toggle(enabled) {
        this.isEnabled = enabled;
        console.log(`🔄 Synchronisation ${enabled ? 'activée' : 'désactivée'}`);
    }

    // Forcer une synchronisation complète
    async forceFullSync() {
        console.log('🔄 Synchronisation complète forcée...');
        await this.forceSave();
        this.updateRanking();
        this.broadcastUpdate('force_sync');
        console.log('✅ Synchronisation complète terminée');
    }
}

// Initialiser la synchronisation temps réel
let realtimeSync;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        realtimeSync = new RealtimeSync();
        window.realtimeSync = realtimeSync;
        console.log('✅ Synchronisation temps réel initialisée');
    }, 3000);
});

// Exposer les fonctions utiles
window.toggleSync = (enabled) => {
    if (window.realtimeSync) {
        window.realtimeSync.toggle(enabled);
    }
};

window.forceSync = () => {
    if (window.realtimeSync) {
        window.realtimeSync.forceFullSync();
    }
};

console.log('🔄 Module synchronisation temps réel chargé');