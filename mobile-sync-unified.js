class MobileUnifiedSync {
    constructor() {
        this.currentUser = null;
        this.isRealVIP = false;
        this.init();
    }

    init() {
        this.waitForFirebase();
    }

    waitForFirebase() {
        if (window.firebaseDB && window.firebaseAuth) {
            this.setupAuth();
        } else {
            setTimeout(() => this.waitForFirebase(), 500);
        }
    }

    setupAuth() {
        window.firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                this.checkRealVIP(user);
            } else {
                this.handleNoAuth();
            }
        });
    }

    async checkRealVIP(user) {
        try {
            const userRef = window.firebaseDB.ref(`users/${user.uid}`);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();
            
            if (userData && userData.isVIP === true) {
                this.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    nickname: userData.nickname || user.email.split('@')[0],
                    isVIP: true
                };
                this.isRealVIP = true;
                console.log('✅ Utilisateur VIP réel connecté:', this.currentUser.email);
                this.initUserManager();
            } else {
                console.log('❌ Utilisateur non-VIP, redirection...');
                window.location.href = 'index-fixed.html';
            }
        } catch (error) {
            console.error('❌ Erreur vérification VIP:', error);
            this.handleNoAuth();
        }
    }

    handleNoAuth() {
        console.log('❌ Aucun utilisateur connecté, redirection...');
        window.location.href = 'index-fixed.html';
    }

    initUserManager() {
        if (window.userManager) {
            window.userManager.loginUser(this.currentUser.email, this.currentUser.uid);
            window.userManager.currentUser.nickname = this.currentUser.nickname;
            window.userManager.currentUser.isVIP = true;
        } else {
            setTimeout(() => this.initUserManager(), 100);
        }
    }

    // Méthode pour ajouter un trade unifié
    async addUnifiedTrade(tradeData) {
        if (!this.isRealVIP || !this.currentUser) {
            console.log('❌ Utilisateur non autorisé');
            return false;
        }

        const unifiedTrade = {
            ...tradeData,
            userId: this.currentUser.uid,
            userEmail: this.currentUser.email,
            nickname: this.currentUser.nickname,
            timestamp: Date.now(),
            platform: 'mobile',
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        try {
            // Sauvegarder dans la structure unifiée
            const tradeRef = window.firebaseDB.ref(`users/${this.currentUser.uid}/trades/${unifiedTrade.id}`);
            await tradeRef.set(unifiedTrade);
            
            console.log('✅ Trade unifié ajouté:', unifiedTrade);
            return true;
        } catch (error) {
            console.error('❌ Erreur ajout trade:', error);
            return false;
        }
    }

    // Méthode pour récupérer tous les trades unifiés
    async getUnifiedTrades() {
        if (!this.isRealVIP || !this.currentUser) return [];

        try {
            const tradesRef = window.firebaseDB.ref(`users/${this.currentUser.uid}/trades`);
            const snapshot = await tradesRef.once('value');
            const trades = snapshot.val() || {};
            
            return Object.values(trades).sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('❌ Erreur récupération trades:', error);
            return [];
        }
    }

    // Méthode pour calculer les stats unifiées
    async getUnifiedStats() {
        const trades = await this.getUnifiedTrades();
        
        const totalTrades = trades.length;
        const winningTrades = trades.filter(t => t.result > 0).length;
        const totalPnL = trades.reduce((sum, t) => sum + (t.result || 0), 0);
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        
        return {
            totalTrades,
            winningTrades,
            totalPnL,
            winRate: Math.round(winRate * 100) / 100
        };
    }
}

// Initialiser le système unifié
document.addEventListener('DOMContentLoaded', () => {
    window.mobileUnifiedSync = new MobileUnifiedSync();
});