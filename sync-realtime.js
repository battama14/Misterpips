// Synchronisation temps réel PC/Mobile
console.log('🔄 Chargement synchronisation temps réel...');

class RealtimeSync {
    constructor() {
        this.currentUser = sessionStorage.getItem('firebaseUID');
        this.isPC = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
        this.listeners = [];
        this.init();
    }
    
    async init() {
        if (!this.currentUser || !window.firebaseDB) {
            console.log('❌ Sync impossible - pas d\'utilisateur ou Firebase');
            return;
        }
        
        await this.setupRealtimeListeners();
        console.log('✅ Synchronisation temps réel activée');
    }
    
    async setupRealtimeListeners() {
        try {
            const { ref, onValue } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            
            // Écouter les changements de trades
            const tradesRef = ref(window.firebaseDB, `dashboards/${this.currentUser}/trades`);
            const tradesListener = onValue(tradesRef, (snapshot) => {
                if (snapshot.exists()) {
                    const trades = snapshot.val();
                    this.syncTrades(trades);
                }
            });
            this.listeners.push(tradesListener);
            
            // Écouter les changements de settings
            const settingsRef = ref(window.firebaseDB, `dashboards/${this.currentUser}/settings`);
            const settingsListener = onValue(settingsRef, (snapshot) => {
                if (snapshot.exists()) {
                    const settings = snapshot.val();
                    this.syncSettings(settings);
                }
            });
            this.listeners.push(settingsListener);
            
            // Écouter les stats VIP pour le classement
            const vipStatsRef = ref(window.firebaseDB, `users/${this.currentUser}/stats`);
            const vipStatsListener = onValue(vipStatsRef, (snapshot) => {
                if (snapshot.exists()) {
                    const stats = snapshot.val();
                    this.syncVipStats(stats);
                }
            });
            this.listeners.push(vipStatsListener);
            
            console.log('🎯 Listeners temps réel configurés');
            
        } catch (error) {
            console.error('❌ Erreur setup listeners:', error);
        }
    }
    
    syncTrades(newTrades) {
        if (!newTrades) return;
        
        // Mettre à jour selon la plateforme
        if (this.isPC && window.dashboard) {
            if (JSON.stringify(window.dashboard.trades) !== JSON.stringify(newTrades)) {
                window.dashboard.trades = newTrades;
                window.dashboard.updateStats();
                window.dashboard.renderTradesTable();
                window.dashboard.renderCalendar();
                window.dashboard.initCharts();
                window.dashboard.initGauge();
                console.log('🖥️ PC - Trades synchronisés');
            }
        } else if (!this.isPC && window.mobileDashboard) {
            if (JSON.stringify(window.mobileDashboard.trades) !== JSON.stringify(newTrades)) {
                window.mobileDashboard.trades = newTrades;
                window.mobileDashboard.updateStats();
                window.mobileDashboard.renderTrades();
                window.mobileDashboard.renderCalendar();
                window.mobileDashboard.updateObjectives();
                window.mobileDashboard.initCharts();
                console.log('📱 Mobile - Trades synchronisés');
            }
        }
    }
    
    syncSettings(newSettings) {
        if (!newSettings) return;
        
        // Mettre à jour selon la plateforme
        if (this.isPC && window.dashboard) {
            if (JSON.stringify(window.dashboard.settings) !== JSON.stringify(newSettings)) {
                window.dashboard.settings = newSettings;
                window.dashboard.updateStats();
                window.dashboard.updateCalendarStats();
                console.log('🖥️ PC - Settings synchronisés');
            }
        } else if (!this.isPC && window.mobileDashboard) {
            if (JSON.stringify(window.mobileDashboard.settings) !== JSON.stringify(newSettings)) {
                window.mobileDashboard.settings = newSettings;
                window.mobileDashboard.updateStats();
                window.mobileDashboard.updateObjectives();
                console.log('📱 Mobile - Settings synchronisés');
            }
        }
    }
    
    syncVipStats(newStats) {
        if (!newStats) return;
        
        // Mettre à jour le classement VIP
        if (window.vipRanking) {
            window.vipRanking.loadRanking();
            console.log('🏆 Classement VIP synchronisé');
        }
        
        // Mettre à jour le classement mobile
        if (!this.isPC && window.mobileDashboard) {
            window.mobileDashboard.loadRanking();
            console.log('📱 Classement mobile synchronisé');
        }
    }
    
    destroy() {
        this.listeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners = [];
        console.log('🔄 Sync temps réel désactivée');
    }
}

// Initialiser la synchronisation
let realtimeSync;

function initRealtimeSync() {
    if (window.firebaseDB && sessionStorage.getItem('firebaseUID')) {
        realtimeSync = new RealtimeSync();
        window.realtimeSync = realtimeSync;
        console.log('🚀 Synchronisation temps réel initialisée');
    } else {
        console.log('⏳ En attente de Firebase et utilisateur...');
        setTimeout(initRealtimeSync, 2000);
    }
}

// Démarrer après le chargement
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initRealtimeSync, 3000);
});

// Nettoyer à la fermeture
window.addEventListener('beforeunload', () => {
    if (realtimeSync) {
        realtimeSync.destroy();
    }
});

console.log('🔄 Script synchronisation temps réel chargé');