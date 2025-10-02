// Mobile Real-time Synchronization System
class MobileRealtimeSync {
    constructor() {
        this.isInitialized = false;
        this.syncInterval = null;
        this.lastSyncTime = 0;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        console.log('🔄 Initialisation synchronisation mobile...');
        
        // Attendre que mobileDashboard soit disponible
        const waitForMobile = () => {
            if (window.mobileDashboard) {
                this.setupMobileSync();
                this.isInitialized = true;
                console.log('✅ Synchronisation mobile initialisée');
            } else {
                setTimeout(waitForMobile, 100);
            }
        };
        waitForMobile();
    }

    setupMobileSync() {
        // Intercepter les méthodes de mobileDashboard
        const originalMethods = {
            saveTrade: window.mobileDashboard.saveTrade?.bind(window.mobileDashboard),
            closeTrade: window.mobileDashboard.closeTrade?.bind(window.mobileDashboard),
            saveEditedTrade: window.mobileDashboard.saveEditedTrade?.bind(window.mobileDashboard),
            deleteTrade: window.mobileDashboard.deleteTrade?.bind(window.mobileDashboard)
        };

        // Wrapper pour saveTrade
        if (originalMethods.saveTrade) {
            window.mobileDashboard.saveTrade = async (...args) => {
                const result = await originalMethods.saveTrade(...args);
                await this.triggerSync('saveTrade');
                return result;
            };
        }

        // Wrapper pour closeTrade
        if (originalMethods.closeTrade) {
            window.mobileDashboard.closeTrade = async (...args) => {
                const result = await originalMethods.closeTrade(...args);
                await this.triggerSync('closeTrade');
                return result;
            };
        }

        // Wrapper pour saveEditedTrade
        if (originalMethods.saveEditedTrade) {
            window.mobileDashboard.saveEditedTrade = async (...args) => {
                const result = await originalMethods.saveEditedTrade(...args);
                await this.triggerSync('saveEditedTrade');
                return result;
            };
        }

        // Wrapper pour deleteTrade
        if (originalMethods.deleteTrade) {
            window.mobileDashboard.deleteTrade = async (...args) => {
                const result = await originalMethods.deleteTrade(...args);
                await this.triggerSync('deleteTrade');
                return result;
            };
        }

        // Synchronisation automatique périodique
        this.setupAutoSync();
    }

    async triggerSync(action) {
        try {
            console.log(`🔄 Sync déclenché par: ${action}`);
            
            // Sauvegarder les données
            if (window.mobileDashboard?.saveData) {
                await window.mobileDashboard.saveData();
            }
            
            // Mettre à jour le classement
            if (window.mobileDashboard?.loadVIPRanking) {
                await window.mobileDashboard.loadVIPRanking();
            }
            
            this.lastSyncTime = Date.now();
            console.log('✅ Synchronisation mobile terminée');
            
        } catch (error) {
            console.error('❌ Erreur sync mobile:', error);
        }
    }

    setupAutoSync() {
        // Synchronisation toutes les 30 secondes
        this.syncInterval = setInterval(async () => {
            if (Date.now() - this.lastSyncTime > 25000) {
                await this.triggerSync('auto');
            }
        }, 30000);

        // Écouter les changements Firebase
        if (window.firebaseDB && window.currentUser?.uid) {
            const { ref, onValue } = window.firebaseModules || {};
            if (ref && onValue) {
                const usersRef = ref(window.firebaseDB, 'users');
                onValue(usersRef, () => {
                    if (window.mobileDashboard?.loadVIPRanking) {
                        window.mobileDashboard.loadVIPRanking();
                    }
                });
            }
        }
    }

    destroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.isInitialized = false;
    }
}

// Initialiser la synchronisation mobile
window.mobileRealtimeSync = new MobileRealtimeSync();
console.log('🔄 Module synchronisation mobile chargé');