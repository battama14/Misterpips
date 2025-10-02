// Debug des trades pour le classement
async function debugAllTrades() {
    if (!window.firebaseDB) return;
    
    const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    
    // Récupérer tous les utilisateurs
    const usersRef = ref(window.firebaseDB, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (!usersSnapshot.exists()) {
        console.log('Aucun utilisateur trouvé');
        return;
    }
    
    const users = usersSnapshot.val();
    console.log('🔍 Debug de tous les utilisateurs:');
    
    for (const [uid, userData] of Object.entries(users)) {
        console.log(`\n👤 User: ${uid}`);
        console.log(`Email: ${userData.email || 'N/A'}`);
        console.log(`VIP: ${userData.isVIP || userData.plan === 'VIP'}`);
        
        // Vérifier structure 1: accounts/compte1/trades
        const accountRef = ref(window.firebaseDB, `users/${uid}/accounts/compte1/trades`);
        const accountSnapshot = await get(accountRef);
        if (accountSnapshot.exists()) {
            const trades = accountSnapshot.val();
            console.log(`📊 Structure 1 - Trades: ${Array.isArray(trades) ? trades.length : 'Non array'}`);
        } else {
            console.log('📊 Structure 1 - Aucun trade');
        }
        
        // Vérifier structure 2: trades direct
        const tradesRef = ref(window.firebaseDB, `users/${uid}/trades`);
        const tradesSnapshot = await get(tradesRef);
        if (tradesSnapshot.exists()) {
            const trades = tradesSnapshot.val();
            console.log(`📈 Structure 2 - Trades: ${Array.isArray(trades) ? trades.length : 'Non array'}`);
        } else {
            console.log('📈 Structure 2 - Aucun trade');
        }
    }
    
    // Vérifier aussi dashboards
    const dashboardsRef = ref(window.firebaseDB, 'dashboards');
    const dashboardsSnapshot = await get(dashboardsRef);
    
    if (dashboardsSnapshot.exists()) {
        const dashboards = dashboardsSnapshot.val();
        console.log('\n🖥️ Debug dashboards:');
        
        for (const [uid, dashboardData] of Object.entries(dashboards)) {
            console.log(`\n💻 Dashboard: ${uid}`);
            if (dashboardData.trades) {
                console.log(`📊 Trades: ${Array.isArray(dashboardData.trades) ? dashboardData.trades.length : 'Non array'}`);
            } else {
                console.log('📊 Aucun trade');
            }
        }
    }
}

window.debugAllTrades = debugAllTrades;
console.log('🔍 Debug script chargé. Tapez debugAllTrades() pour analyser.');