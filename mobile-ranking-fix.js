// Fix classement mobile - utilise la même logique que PC
async function showMobileRanking() {
    const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    
    const rankingContainer = document.getElementById('mobileRankingList');
    if (!rankingContainer) {
        console.log('Container ranking mobile non trouvé');
        return;
    }
    
    try {
        // Récupérer tous les utilisateurs VIP
        const usersRef = ref(window.firebaseDB, 'users');
        const usersSnapshot = await get(usersRef);
        
        if (!usersSnapshot.exists()) {
            rankingContainer.innerHTML = '<div class="no-data">Aucun utilisateur trouvé</div>';
            return;
        }
        
        const users = usersSnapshot.val();
        const vipUsers = Object.entries(users).filter(([uid, userData]) => 
            userData.isVIP || userData.plan === 'VIP'
        );
        
        console.log(`📱 ${vipUsers.length} utilisateurs VIP trouvés`);
        
        const today = new Date().toISOString().split('T')[0];
        const rankings = [];
        
        for (const [uid, userData] of vipUsers) {
            let userTrades = [];
            
            // Chercher dans dashboards
            try {
                const dashboardRef = ref(window.firebaseDB, `dashboards/${uid}/trades`);
                const dashboardSnapshot = await get(dashboardRef);
                if (dashboardSnapshot.exists()) {
                    const trades = dashboardSnapshot.val();
                    if (Array.isArray(trades)) {
                        userTrades = trades;
                    }
                }
            } catch (error) {}
            
            // Chercher aussi dans users/accounts
            try {
                const userAccountsRef = ref(window.firebaseDB, `users/${uid}/accounts`);
                const accountsSnapshot = await get(userAccountsRef);
                if (accountsSnapshot.exists()) {
                    const accounts = accountsSnapshot.val();
                    Object.values(accounts).forEach(account => {
                        if (account.trades && Array.isArray(account.trades)) {
                            userTrades = userTrades.concat(account.trades);
                        }
                    });
                }
            } catch (error) {}
            
            if (!Array.isArray(userTrades)) {
                userTrades = [];
            }
            
            // Calculer P&L du jour
            const todayTrades = userTrades.filter(trade => 
                trade && trade.date === today && trade.status === 'closed'
            );
            const dailyPnL = todayTrades.reduce((sum, trade) => 
                sum + (parseFloat(trade.pnl) || 0), 0
            );
            
            // Récupérer le pseudo
            let nickname = userData.displayName || userData.email?.split('@')[0] || 'Trader VIP';
            try {
                const nicknameRef = ref(window.firebaseDB, `users/${uid}/nickname`);
                const nicknameSnapshot = await get(nicknameRef);
                if (nicknameSnapshot.exists()) {
                    nickname = nicknameSnapshot.val();
                }
            } catch (error) {}
            
            rankings.push({
                uid,
                name: nickname,
                dailyPnL,
                todayTrades: todayTrades.length,
                totalTrades: userTrades.length
            });
        }
        
        // Trier par P&L
        rankings.sort((a, b) => b.dailyPnL - a.dailyPnL);
        
        // Afficher avec style mobile
        let html = '';
        
        rankings.forEach((user, index) => {
            const position = index + 1;
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
            
            html += `
                <div class="mobile-ranking-item">
                    <div class="ranking-position">${medal}</div>
                    <div class="ranking-info">
                        <div class="trader-name">${user.name}</div>
                        <div class="trader-stats">${user.todayTrades} trades</div>
                    </div>
                    <div class="ranking-pnl ${user.dailyPnL >= 0 ? 'positive' : 'negative'}">
                        $${user.dailyPnL.toFixed(2)}
                    </div>
                </div>
            `;
        });
        
        if (html === '') {
            html = '<div class="no-data">Aucun trade aujourd\'hui</div>';
        }
        
        rankingContainer.innerHTML = html;
        console.log('✅ Classement mobile affiché');
        
    } catch (error) {
        console.error('❌ Erreur classement mobile:', error);
        rankingContainer.innerHTML = '<div class="error">Erreur de chargement</div>';
    }
}

// Nettoyer les utilisateurs mobiles en double
async function cleanDuplicateMobileUsers() {
    if (!window.firebaseDB) return;
    
    const { ref, get, remove } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    
    try {
        const usersRef = ref(window.firebaseDB, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            let cleaned = 0;
            
            for (const [uid, userData] of Object.entries(users)) {
                // Supprimer tous les anciens utilisateurs mobiles sauf le fixe
                if (uid.startsWith('mobile_demo_') || 
                    (uid !== 'mobile_user_fixed' && userData.email && userData.email.includes('mobile@'))) {
                    console.log(`🗑️ Suppression: ${uid}`);
                    await remove(ref(window.firebaseDB, `users/${uid}`));
                    await remove(ref(window.firebaseDB, `dashboards/${uid}`));
                    cleaned++;
                }
            }
            
            if (cleaned > 0) {
                console.log(`✅ ${cleaned} utilisateurs mobiles supprimés`);
            }
        }
    } catch (error) {
        console.error('❌ Erreur nettoyage:', error);
    }
}

// Lancer automatiquement
setTimeout(() => {
    cleanDuplicateMobileUsers();
    setTimeout(showMobileRanking, 1000);
    
    // Relancer toutes les 30 secondes
    setInterval(showMobileRanking, 30000);
}, 3000);

// Exposer les fonctions
window.showMobileRanking = showMobileRanking;
window.cleanDuplicateMobileUsers = cleanDuplicateMobileUsers;

console.log('📱 Fix classement mobile chargé');