// Fix Classement Mobile - Version Stable
class MobileRankingFix {
    constructor() {
        this.currentUser = 'mobile_user_fixed';
        this.isLoading = false;
        this.lastUpdate = 0;
        this.cachedRanking = [];
    }

    async loadStableRanking() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            console.log('🏆 Chargement classement VIP réel...');
            
            const container = document.getElementById('mobileRankingList');
            if (!container) return;

            container.innerHTML = `
                <div class="ranking-loading">
                    <h4>🔄 Chargement du classement VIP...</h4>
                </div>
            `;

            const rankings = await this.loadRealVipUsers();
            this.displayStableRanking(rankings);
            this.cachedRanking = rankings;
            this.lastUpdate = Date.now();

        } catch (error) {
            console.error('❌ Erreur classement mobile:', error);
            this.displayErrorRanking();
        } finally {
            this.isLoading = false;
        }
    }

    getLocalTrades() {
        try {
            if (window.mobileDashboard && window.mobileDashboard.trades) {
                return window.mobileDashboard.trades;
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    calculateUserStats(trades) {
        const today = new Date().toISOString().split('T')[0];
        const closedTrades = trades.filter(t => t.status === 'closed');
        const todayTrades = closedTrades.filter(t => t.date === today);
        
        const dailyPnL = todayTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
        const totalPnL = closedTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
        const winningTrades = closedTrades.filter(t => (parseFloat(t.pnl) || 0) > 0).length;
        const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length * 100) : 0;

        return {
            dailyPnL: dailyPnL,
            todayTrades: todayTrades.length,
            totalTrades: closedTrades.length,
            winRate: winRate,
            totalPnL: totalPnL
        };
    }

    getUserNickname() {
        try {
            if (window.mobileDashboard && window.mobileDashboard.settings) {
                return window.mobileDashboard.settings.nickname || 'Mobile Trader';
            }
            return 'Mobile Trader';
        } catch (error) {
            return 'Mobile Trader';
        }
    }

    async loadRealVipUsers() {
        const rankings = [];
        
        try {
            if (!window.firebaseDB) {
                return this.getFallbackRanking();
            }

            const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            const usersRef = ref(window.firebaseDB, 'users');
            const snapshot = await get(usersRef);
            
            if (!snapshot.exists()) {
                return this.getFallbackRanking();
            }

            const users = snapshot.val();
            const today = new Date().toISOString().split('T')[0];
            
            for (const [uid, userData] of Object.entries(users)) {
                if (!userData.isVIP && userData.plan !== 'VIP') continue;
                
                // Chercher les trades dans plusieurs emplacements
                let userTrades = [];
                try {
                    // Essayer d'abord users/uid/trades
                    const tradesRef = ref(window.firebaseDB, `users/${uid}/trades`);
                    const tradesSnapshot = await get(tradesRef);
                    if (tradesSnapshot.exists()) {
                        const tradesData = tradesSnapshot.val();
                        userTrades = Array.isArray(tradesData) ? tradesData : Object.values(tradesData || {});
                    }
                    
                    // Si pas de trades, essayer dashboards/uid/trades
                    if (userTrades.length === 0) {
                        const dashboardRef = ref(window.firebaseDB, `dashboards/${uid}/trades`);
                        const dashboardSnapshot = await get(dashboardRef);
                        if (dashboardSnapshot.exists()) {
                            const dashboardData = dashboardSnapshot.val();
                            userTrades = Array.isArray(dashboardData) ? dashboardData : Object.values(dashboardData || {});
                        }
                    }
                } catch (error) {
                    console.log(`Erreur trades pour ${uid}:`, error);
                }

                const closedTrades = userTrades.filter(t => t && t.status === 'closed');
                const todayTrades = closedTrades.filter(t => t.date === today);
                const dailyPnL = todayTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
                const winningTrades = closedTrades.filter(t => (parseFloat(t.pnl) || 0) > 0).length;
                const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length * 100) : 0;

                // Récupérer le pseudo
                let nickname = 'Trader VIP';
                try {
                    const nicknameRef = ref(window.firebaseDB, `users/${uid}/nickname`);
                    const nicknameSnapshot = await get(nicknameRef);
                    if (nicknameSnapshot.exists()) {
                        nickname = nicknameSnapshot.val();
                    } else {
                        nickname = userData.displayName || userData.email?.split('@')[0] || 'Trader VIP';
                    }
                } catch (error) {
                    nickname = userData.displayName || userData.email?.split('@')[0] || 'Trader VIP';
                }

                // Ajouter tous les utilisateurs VIP, même sans trades
                rankings.push({
                    uid: uid,
                    name: nickname,
                    email: userData.email || 'N/A',
                    dailyPnL: dailyPnL,
                    todayTrades: todayTrades.length,
                    totalTrades: closedTrades.length,
                    winRate: winRate,
                    isCurrentUser: uid === this.currentUser
                });
            }

            // Trier par P&L journalier
            rankings.sort((a, b) => b.dailyPnL - a.dailyPnL);
            
            console.log(`📊 ${rankings.length} utilisateurs VIP chargés`);
            return rankings;
            
        } catch (error) {
            console.error('Erreur chargement VIP:', error);
            return this.getFallbackRanking();
        }
    }

    getFallbackRanking() {
        const localTrades = this.getLocalTrades();
        const userStats = this.calculateUserStats(localTrades);
        
        return [{
            uid: this.currentUser,
            name: this.getUserNickname(),
            email: 'mobile@misterpips.com',
            dailyPnL: userStats.dailyPnL,
            todayTrades: userStats.todayTrades,
            totalTrades: userStats.totalTrades,
            winRate: userStats.winRate,
            isCurrentUser: true
        }];
    }

    displayStableRanking(rankings) {
        const container = document.getElementById('mobileRankingList');
        if (!container) return;

        let html = `
            <div class="ranking-header">
                <h4>🏆 Classement VIP Réel</h4>
                <small>Mis à jour: ${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</small>
                <small class="vip-count">${rankings.length} utilisateurs VIP</small>
            </div>
        `;

        if (rankings.length === 0) {
            html += `
                <div class="no-vip-users">
                    <p>🚫 Aucun utilisateur VIP actif</p>
                </div>
            `;
        } else {
            rankings.forEach((user, index) => {
                const position = index + 1;
                const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
                
                html += `
                    <div class="ranking-item ${user.isCurrentUser ? 'current-user' : ''}">
                        <div class="ranking-position">${medal}</div>
                        <div class="ranking-info">
                            <div class="ranking-name">
                                ${user.name}${user.isCurrentUser ? ' (Vous)' : ''}
                            </div>
                            <div class="ranking-details">
                                <div class="ranking-trades">
                                    ${user.todayTrades} trades • ${Math.round(user.winRate)}% WR
                                </div>
                                <div class="ranking-id">
                                    🆔 ${user.uid.substring(0, 8)}... • 📧 ${user.email}
                                </div>
                            </div>
                        </div>
                        <div class="ranking-pnl ${user.dailyPnL >= 0 ? 'positive' : 'negative'}">
                            $${user.dailyPnL.toFixed(2)}
                        </div>
                    </div>
                `;
            });
        }

        html += `
            <div class="ranking-footer">
                <button onclick="window.mobileRankingFix.loadStableRanking()" class="secondary-btn">
                    🔄 Actualiser
                </button>
            </div>
        `;

        container.innerHTML = html;
        console.log(`✅ Classement VIP réel affiché (${rankings.length} utilisateurs)`);
    }

    displayErrorRanking() {
        const container = document.getElementById('mobileRankingList');
        if (!container) return;

        container.innerHTML = `
            <div class="ranking-error">
                <h4>⚠️ Erreur de chargement</h4>
                <p>Impossible de charger le classement</p>
                <button onclick="window.mobileRankingFix.loadStableRanking()" class="primary-btn">
                    🔄 Réessayer
                </button>
            </div>
        `;
    }

    // Méthode appelée quand un trade est fermé
    onTradeUpdate() {
        console.log('📊 Mise à jour classement après trade');
        setTimeout(() => {
            this.loadStableRanking();
        }, 1000);
    }

    // Auto-refresh périodique (optionnel)
    startAutoRefresh() {
        setInterval(() => {
            if (document.getElementById('ranking')?.classList.contains('active')) {
                this.loadStableRanking();
            }
        }, 30000); // Toutes les 30 secondes
    }
}

// Initialisation
window.mobileRankingFix = new MobileRankingFix();

// Hook dans le dashboard mobile
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Charger le classement quand on va sur la section
        const originalShowSection = window.showSection;
        window.showSection = function(sectionName) {
            if (originalShowSection) originalShowSection(sectionName);
            
            if (sectionName === 'ranking') {
                setTimeout(() => {
                    window.mobileRankingFix.loadStableRanking();
                }, 100);
            }
        };

        // Hook dans le mobile dashboard pour les mises à jour
        if (window.mobileDashboard) {
            const originalCloseTrade = window.mobileDashboard.closeTrade;
            window.mobileDashboard.closeTrade = function(...args) {
                const result = originalCloseTrade.apply(this, args);
                window.mobileRankingFix.onTradeUpdate();
                return result;
            };
        }

        console.log('🏆 Mobile Ranking Fix initialisé');
    }, 2000);
});