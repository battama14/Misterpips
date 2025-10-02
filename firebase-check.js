// Vérification complète Firebase et utilisateurs
console.log('🔍 Vérification Firebase...');

class FirebaseChecker {
    constructor() {
        this.checkFirebaseStatus();
    }
    
    async checkFirebaseStatus() {
        console.log('=== VÉRIFICATION FIREBASE ===');
        
        // 1. Vérifier la connexion Firebase
        if (window.firebaseDB) {
            console.log('✅ Firebase Database connectée');
            await this.testFirebaseConnection();
        } else {
            console.log('❌ Firebase Database non connectée');
        }
        
        // 2. Vérifier l'authentification
        if (window.firebaseAuth) {
            console.log('✅ Firebase Auth disponible');
            await this.checkCurrentUser();
        } else {
            console.log('❌ Firebase Auth non disponible');
        }
        
        // 3. Vérifier les données utilisateur
        await this.checkUserData();
        
        // 4. Vérifier la synchronisation
        await this.checkSyncStatus();
        
        console.log('=== FIN VÉRIFICATION ===');
    }
    
    async testFirebaseConnection() {
        try {
            const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            const testRef = ref(window.firebaseDB, '.info/connected');
            const snapshot = await get(testRef);
            
            if (snapshot.exists()) {
                console.log('✅ Connexion Firebase active');
            } else {
                console.log('⚠️ Connexion Firebase incertaine');
            }
        } catch (error) {
            console.log('❌ Erreur test connexion:', error.message);
        }
    }
    
    async checkCurrentUser() {
        const uid = sessionStorage.getItem('firebaseUID');
        const email = sessionStorage.getItem('userEmail');
        const nickname = sessionStorage.getItem('userNickname');
        
        console.log('👤 Utilisateur actuel:');
        console.log('  - UID:', uid || 'Non défini');
        console.log('  - Email:', email || 'Non défini');
        console.log('  - Pseudo:', nickname || 'Non défini');
        
        if (uid && email) {
            await this.checkUserInFirebase(uid, email);
        }
    }
    
    async checkUserInFirebase(uid, email) {
        try {
            const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            
            // Vérifier dans users
            const userRef = ref(window.firebaseDB, `users/${uid}`);
            const userSnapshot = await get(userRef);
            
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                console.log('✅ Utilisateur trouvé dans Firebase users:', userData);
            } else {
                console.log('⚠️ Utilisateur non trouvé dans Firebase users');
            }
            
            // Vérifier dans dashboards
            const dashboardRef = ref(window.firebaseDB, `dashboards/${uid}`);
            const dashboardSnapshot = await get(dashboardRef);
            
            if (dashboardSnapshot.exists()) {
                const dashboardData = dashboardSnapshot.val();
                console.log('✅ Dashboard trouvé:', {
                    trades: dashboardData.trades?.length || 0,
                    settings: !!dashboardData.settings,
                    lastUpdated: dashboardData.lastUpdated
                });
            } else {
                console.log('⚠️ Dashboard non trouvé dans Firebase');
            }
            
        } catch (error) {
            console.log('❌ Erreur vérification utilisateur:', error.message);
        }
    }
    
    async checkUserData() {
        const uid = sessionStorage.getItem('firebaseUID');
        if (!uid) return;
        
        console.log('📊 Vérification données utilisateur:');
        
        // Vérifier localStorage
        const localData = localStorage.getItem(`dashboard_${uid}`);
        if (localData) {
            const data = JSON.parse(localData);
            console.log('  - LocalStorage: ✅', {
                trades: data.trades?.length || 0,
                settings: !!data.settings,
                lastUpdated: data.lastUpdated
            });
        } else {
            console.log('  - LocalStorage: ❌ Aucune donnée');
        }
        
        // Vérifier les instances dashboard
        if (window.dashboard) {
            console.log('  - Dashboard PC: ✅', {
                trades: window.dashboard.trades?.length || 0,
                currentUser: window.dashboard.currentUser
            });
        } else {
            console.log('  - Dashboard PC: ❌ Non initialisé');
        }
        
        if (window.mobileDashboard) {
            console.log('  - Dashboard Mobile: ✅', {
                trades: window.mobileDashboard.trades?.length || 0,
                currentUser: window.mobileDashboard.currentUser
            });
        } else {
            console.log('  - Dashboard Mobile: ❌ Non initialisé');
        }
    }
    
    async checkSyncStatus() {
        console.log('🔄 Statut synchronisation:');
        
        if (window.realtimeSync) {
            console.log('  - Sync temps réel: ✅ Actif');
            console.log('  - Listeners:', window.realtimeSync.listeners.length);
        } else {
            console.log('  - Sync temps réel: ❌ Inactif');
        }
        
        // Vérifier le chat
        if (window.iMessageChat) {
            console.log('  - Chat: ✅ Initialisé');
        } else {
            console.log('  - Chat: ❌ Non initialisé');
        }
        
        // Vérifier le classement VIP
        if (window.vipRanking) {
            console.log('  - Classement VIP: ✅ Disponible');
        } else {
            console.log('  - Classement VIP: ❌ Non disponible');
        }
    }
    
    // Test de synchronisation
    async testSync() {
        const uid = sessionStorage.getItem('firebaseUID');
        if (!uid || !window.firebaseDB) {
            console.log('❌ Impossible de tester la sync - pas d\'utilisateur ou Firebase');
            return;
        }
        
        console.log('🧪 Test de synchronisation...');
        
        try {
            const { ref, set, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            
            // Test d'écriture
            const testRef = ref(window.firebaseDB, `test_sync/${uid}`);
            const testData = {
                timestamp: Date.now(),
                message: 'Test de synchronisation'
            };
            
            await set(testRef, testData);
            console.log('✅ Écriture test réussie');
            
            // Test de lecture
            const snapshot = await get(testRef);
            if (snapshot.exists() && snapshot.val().timestamp === testData.timestamp) {
                console.log('✅ Lecture test réussie');
                
                // Nettoyer
                await set(testRef, null);
                console.log('✅ Test de synchronisation complet');
            } else {
                console.log('❌ Erreur lecture test');
            }
            
        } catch (error) {
            console.log('❌ Erreur test sync:', error.message);
        }
    }
}

// Fonction globale de vérification
window.checkFirebase = () => {
    new FirebaseChecker();
};

window.testFirebaseSync = () => {
    const checker = new FirebaseChecker();
    checker.testSync();
};

// Vérification automatique au chargement
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        new FirebaseChecker();
    }, 5000); // Attendre 5 secondes que tout soit chargé
});

console.log('🔍 Firebase Checker chargé - Tapez checkFirebase() pour vérifier');