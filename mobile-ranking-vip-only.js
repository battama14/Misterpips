class MobileRankingVIPOnly {
    constructor() {
        this.rankingContainer = null;
        this.currentUser = null;
        this.init();
    }

    init() {
        this.rankingContainer = document.getElementById('mobileRankingList');
        this.waitForSync();
    }

    waitForSync() {
        if (window.mobileUnifiedSync && window.mobileUnifiedSync.isRealVIP) {
            this.currentUser = window.mobileUnifiedSync.currentUser;
            this.loadVIPRanking();
        } else {
            setTimeout(() => this.waitForSync(), 500);
        }
    }

    async loadVIPRanking() {
        if (!window.firebaseDB) return;

        try {
            const usersRef = window.firebaseDB.ref('users');
            const snapshot = await usersRef.once('value');
            const users = snapshot.val() || {};
            
            // Filtrer uniquement les vrais VIP
            const vipUsers = Object.entries(users)
                .filter(([uid, userData]) => userData.isVIP === true)
                .map(([uid, userData]) => ({ uid, ...userData }));

            // Calculer les stats pour chaque VIP
            const rankingData = await Promise.all(
                vipUsers.map(async (user) => {
                    const stats = await this.calculateUserStats(user.uid);
                    return {
                        uid: user.uid,
                        email: user.email,
                        nickname: user.nickname || user.email.split('@')[0],
                        ...stats
                    };
                })
            );

            // Trier par P&L total
            rankingData.sort((a, b) => b.totalPnL - a.totalPnL);

            this.displayRanking(rankingData);
        } catch (error) {
            console.error('❌ Erreur chargement classement VIP:', error);
        }
    }

    async calculateUserStats(uid) {
        try {
            const tradesRef = window.firebaseDB.ref(`users/${uid}/trades`);
            const snapshot = await tradesRef.once('value');
            const trades = snapshot.val() || {};
            
            const tradesList = Object.values(trades);
            const totalTrades = tradesList.length;
            const winningTrades = tradesList.filter(t => t.result > 0).length;
            const totalPnL = tradesList.reduce((sum, t) => sum + (t.result || 0), 0);
            const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
            
            // P&L du jour
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTrades = tradesList.filter(t => {
                const tradeDate = new Date(t.timestamp);
                tradeDate.setHours(0, 0, 0, 0);
                return tradeDate.getTime() === today.getTime();
            });
            const dailyPnL = todayTrades.reduce((sum, t) => sum + (t.result || 0), 0);
            
            return {
                totalTrades,
                winningTrades,
                totalPnL: Math.round(totalPnL * 100) / 100,
                winRate: Math.round(winRate * 100) / 100,
                dailyPnL: Math.round(dailyPnL * 100) / 100
            };
        } catch (error) {
            console.error(`❌ Erreur calcul stats pour ${uid}:`, error);
            return {
                totalTrades: 0,
                winningTrades: 0,
                totalPnL: 0,
                winRate: 0,
                dailyPnL: 0
            };
        }
    }

    displayRanking(rankingData) {
        if (!this.rankingContainer) return;

        this.rankingContainer.innerHTML = '';

        if (rankingData.length === 0) {
            this.rankingContainer.innerHTML = `
                <div class="ranking-item">
                    <div class="ranking-info">
                        <div class="ranking-name">Aucun utilisateur VIP trouvé</div>
                    </div>
                </div>
            `;
            return;
        }

        rankingData.forEach((user, index) => {
            const position = index + 1;
            const isCurrentUser = this.currentUser && user.uid === this.currentUser.uid;
            
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item ${isCurrentUser ? 'current-user' : ''}`;
            
            const positionEmoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}`;
            
            rankingItem.innerHTML = `
                <div class="ranking-position">${positionEmoji}</div>
                <div class="ranking-info">
                    <div class="ranking-name">${user.nickname}</div>
                    <div class="ranking-trades">${user.totalTrades} trades • ${user.winRate}% WR</div>
                    <div class="ranking-daily">Aujourd'hui: $${user.dailyPnL}</div>
                </div>
                <div class="ranking-pnl ${user.totalPnL >= 0 ? 'positive' : 'negative'}">
                    $${user.totalPnL}
                </div>
            `;
            
            this.rankingContainer.appendChild(rankingItem);
        });

        console.log(`✅ Classement VIP affiché: ${rankingData.length} utilisateurs`);
    }

    // Actualiser le classement toutes les 30 secondes
    startAutoRefresh() {
        setInterval(() => {
            this.loadVIPRanking();
        }, 30000);
    }
}

// Initialiser le classement VIP
document.addEventListener('DOMContentLoaded', () => {
    const mobileRankingVIP = new MobileRankingVIPOnly();
    mobileRankingVIP.startAutoRefresh();
});