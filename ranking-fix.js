// Fix classement VIP simple
async function showRankingNow() {
    const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    
    const rankingContainer = document.getElementById('rankingList') || document.getElementById('mobileRankingList');
    if (!rankingContainer) {
        console.log('Container ranking non trouvé');
        return;
    }
    
    try {
        // Récupérer tous les utilisateurs VIP
        const usersRef = ref(window.firebaseDB, 'users');
        const usersSnapshot = await get(usersRef);
        
        if (!usersSnapshot.exists()) {
            rankingContainer.innerHTML = '<div>Aucun utilisateur trouvé</div>';
            return;
        }
        
        const users = usersSnapshot.val();
        const vipUsers = Object.entries(users).filter(([uid, userData]) => 
            userData.isVIP || userData.plan === 'VIP'
        );
        
        console.log(`${vipUsers.length} utilisateurs VIP trouvés`);
        
        // Même méthode que la version PC
        const today = new Date().toISOString().split('T')[0];
        const rankings = [];
        
        for (const [uid, userData] of vipUsers) {
            let userTrades = []; // Toujours initialiser comme array
            
            // PRIORITÉ: Chercher d'abord dans users/accounts (source principale)
            try {
                const userAccountsRef = ref(window.firebaseDB, `users/${uid}/accounts`);
                const accountsSnapshot = await get(userAccountsRef);
                if (accountsSnapshot.exists()) {
                    const accounts = accountsSnapshot.val();
                    Object.values(accounts).forEach(account => {
                        if (account.trades && Array.isArray(account.trades)) {
                            userTrades = account.trades; // Prendre seulement le premier compte
                            return; // Sortir de la boucle
                        }
                    });
                }
            } catch (error) {}
            
            // FALLBACK: Si pas de trades dans users/accounts, chercher dans dashboards
            if (userTrades.length === 0) {
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
            }
            
            // S'assurer que userTrades est toujours un array
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
            
            console.log(`${nickname}: ${todayTrades.length} trades aujourd'hui, $${dailyPnL}`);
        }
        
        // Trier par P&L
        rankings.sort((a, b) => b.dailyPnL - a.dailyPnL);
        
        console.log('Classement final:', rankings.map(r => `${r.name}: $${r.dailyPnL}`));
        
        // Afficher
        let html = '<div class="ranking-header"><h4>🏆 Classement VIP</h4></div>';
        
        rankings.forEach((user, index) => {
            const position = index + 1;
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
            
            html += `
                <div class="ranking-item">
                    <div class="ranking-position">${medal}</div>
                    <div class="ranking-info">
                        <div class="trader-name">${user.name}</div>
                        <div class="trader-stats">${user.todayTrades} trades aujourd'hui</div>
                    </div>
                    <div class="ranking-pnl ${user.dailyPnL >= 0 ? 'positive' : 'negative'}">
                        $${user.dailyPnL.toFixed(2)}
                    </div>
                </div>
            `;
        });
        
        rankingContainer.innerHTML = html;
        console.log('✅ Classement affiché');
        
    } catch (error) {
        console.error('Erreur classement:', error);
        rankingContainer.innerHTML = '<div>Erreur de chargement</div>';
    }
}

// Lancer automatiquement désactivé pour mobile
// setTimeout(showRankingNow, 2000);

// Exposer la fonction
window.showRankingNow = showRankingNow;

console.log('🏆 Fix classement chargé');