// Debug mobile trades
async function debugMobileTrades() {
    const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    
    console.log('🔍 Debug trades mobile...');
    
    // Récupérer l'UID depuis mobileDashboard ou sessionStorage
    const uid = window.mobileDashboard?.currentUser || sessionStorage.getItem('firebaseUID') || 'mobile_demo';
    
    if (!uid) {
        console.log('❌ Pas d\'utilisateur connecté');
        return;
    }
    console.log('👤 UID utilisateur:', uid);
    
    // Vérifier dashboards
    try {
        const dashboardRef = ref(window.firebaseDB, `dashboards/${uid}`);
        const dashboardSnapshot = await get(dashboardRef);
        if (dashboardSnapshot.exists()) {
            const data = dashboardSnapshot.val();
            console.log('📊 Données dashboards:', data);
            if (data.trades) {
                console.log('📈 Trades dashboards:', data.trades);
                data.trades.forEach((trade, index) => {
                    console.log(`Trade ${index}:`, {
                        date: trade.date,
                        status: trade.status,
                        pnl: trade.pnl,
                        pair: trade.pair
                    });
                });
            }
        } else {
            console.log('❌ Pas de données dashboards');
        }
    } catch (error) {
        console.error('Erreur dashboards:', error);
    }
    
    // Vérifier users
    try {
        const userRef = ref(window.firebaseDB, `users/${uid}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            console.log('👤 Données users:', userData);
            
            // Vérifier accounts
            if (userData.accounts) {
                console.log('💼 Comptes:', userData.accounts);
                Object.keys(userData.accounts).forEach(accountKey => {
                    const account = userData.accounts[accountKey];
                    console.log(`Compte ${accountKey}:`, account);
                    if (account.trades) {
                        console.log(`Trades ${accountKey}:`, account.trades);
                        account.trades.forEach((trade, index) => {
                            console.log(`Trade ${accountKey}-${index}:`, {
                                date: trade.date,
                                status: trade.status,
                                pnl: trade.pnl,
                                pair: trade.pair
                            });
                        });
                    }
                });
            }
        } else {
            console.log('❌ Pas de données users');
        }
    } catch (error) {
        console.error('Erreur users:', error);
    }
    
    // Date d'aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Date aujourd\'hui:', today);
}

// Exposer la fonction
window.debugMobileTrades = debugMobileTrades;

console.log('🔍 Debug mobile chargé - tapez debugMobileTrades() dans la console');