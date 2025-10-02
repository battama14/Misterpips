// Debug pour voir tous les utilisateurs VIP
async function debugVipUsers() {
    try {
        if (!window.firebaseDB) {
            console.log('❌ Firebase non initialisé');
            return;
        }

        const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
        const usersRef = ref(window.firebaseDB, 'users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) {
            console.log('❌ Aucun utilisateur trouvé');
            return;
        }

        const users = snapshot.val();
        console.log('👥 Tous les utilisateurs:', Object.keys(users).length);
        
        const vipUsers = Object.entries(users).filter(([uid, userData]) => 
            userData.isVIP || userData.plan === 'VIP'
        );
        
        console.log('🔑 Utilisateurs VIP trouvés:', vipUsers.length);
        
        for (const [uid, userData] of vipUsers) {
            console.log(`\n👤 ${uid}:`);
            console.log('  - Email:', userData.email);
            console.log('  - Pseudo:', userData.nickname || userData.displayName || 'N/A');
            console.log('  - Plan:', userData.plan);
            console.log('  - isVIP:', userData.isVIP);
            
            // Vérifier les trades
            try {
                const tradesRef = ref(window.firebaseDB, `users/${uid}/trades`);
                const tradesSnapshot = await get(tradesRef);
                if (tradesSnapshot.exists()) {
                    const trades = tradesSnapshot.val();
                    const tradesArray = Array.isArray(trades) ? trades : Object.values(trades);
                    console.log('  - Trades:', tradesArray.length);
                } else {
                    console.log('  - Trades: 0');
                }
            } catch (error) {
                console.log('  - Erreur trades:', error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur debug:', error);
    }
}

// Lancer le debug automatiquement
setTimeout(() => {
    debugVipUsers();
}, 5000);