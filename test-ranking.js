// Script de test pour le classement VIP
console.log('🧪 Script de test du classement VIP');

function testRanking() {
    console.log('🔍 Test du classement VIP...');
    
    if (!window.firebaseDB) {
        console.error('❌ Firebase non disponible');
        return;
    }
    
    const currentUser = sessionStorage.getItem('firebaseUID');
    if (!currentUser) {
        console.error('❌ Utilisateur non connecté');
        return;
    }
    
    // Test 1: Vérifier la structure des données utilisateur
    testUserData(currentUser);
    
    // Test 2: Vérifier les trades
    testUserTrades(currentUser);
    
    // Test 3: Forcer la mise à jour du classement
    setTimeout(() => {
        if (window.vipRanking) {
            console.log('🔄 Rechargement du classement...');
            window.vipRanking.loadRanking();
        }
    }, 2000);
}

async function testUserData(uid) {
    try {
        const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
        
        console.log('📊 Test des données utilisateur...');
        const userRef = ref(window.firebaseDB, `users/${uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log('✅ Données utilisateur trouvées:', {
                isVIP: userData.isVIP,
                plan: userData.plan,
                email: userData.email,
                nickname: userData.nickname,
                hasAccounts: !!userData.accounts
            });
            
            if (userData.accounts && userData.accounts.compte1) {
                console.log('✅ Compte1 trouvé:', {
                    hasTrades: !!userData.accounts.compte1.trades,
                    tradesCount: userData.accounts.compte1.trades ? userData.accounts.compte1.trades.length : 0
                });
            } else {
                console.warn('⚠️ Aucun compte1 trouvé');
            }
        } else {
            console.warn('⚠️ Aucune donnée utilisateur trouvée');
        }
    } catch (error) {
        console.error('❌ Erreur test données utilisateur:', error);
    }
}

async function testUserTrades(uid) {
    try {
        const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
        
        console.log('📈 Test des trades utilisateur...');
        const tradesRef = ref(window.firebaseDB, `users/${uid}/accounts/compte1/trades`);
        const snapshot = await get(tradesRef);
        
        if (snapshot.exists()) {
            const trades = snapshot.val();
            console.log('✅ Trades trouvés:', trades.length);
            
            const today = new Date().toISOString().split('T')[0];
            const todayTrades = trades.filter(trade => 
                trade && trade.date === today && 
                (trade.status === 'closed' || trade.status === 'completed')
            );
            
            const dailyPnL = todayTrades.reduce((total, trade) => 
                total + (parseFloat(trade.pnl) || 0), 0
            );
            
            console.log('📊 Statistiques du jour:', {
                totalTrades: trades.length,
                todayTrades: todayTrades.length,
                dailyPnL: dailyPnL.toFixed(2)
            });
        } else {
            console.warn('⚠️ Aucun trade trouvé');
        }
    } catch (error) {
        console.error('❌ Erreur test trades:', error);
    }
}

// Fonction pour créer un trade de test
async function createTestTrade() {
    if (!window.dashboard) {
        console.error('❌ Dashboard non disponible');
        return;
    }
    
    console.log('🧪 Création d\'un trade de test...');
    
    const testTrade = {
        id: `test_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        currency: 'EUR/USD',
        entryPoint: 1.1000,
        stopLoss: 1.0950,
        takeProfit: 1.1100,
        lotSize: 0.1,
        result: 'TP',
        status: 'closed',
        pnl: 10.00,
        createdAt: Date.now(),
        isTest: true
    };
    
    window.dashboard.trades.push(testTrade);
    await window.dashboard.saveData();
    
    console.log('✅ Trade de test créé et sauvegardé');
    
    // Mettre à jour l'affichage
    window.dashboard.fullDashboardUpdate();
    
    // Forcer la mise à jour du classement
    setTimeout(() => {
        if (window.vipRanking) {
            window.vipRanking.loadRanking();
        }
    }, 3000);
}

// Fonction pour nettoyer les trades de test
function cleanTestTrades() {
    if (!window.dashboard) {
        console.error('❌ Dashboard non disponible');
        return;
    }
    
    console.log('🧹 Nettoyage des trades de test...');
    
    const originalLength = window.dashboard.trades.length;
    window.dashboard.trades = window.dashboard.trades.filter(trade => !trade.isTest);
    const newLength = window.dashboard.trades.length;
    
    console.log(`✅ ${originalLength - newLength} trades de test supprimés`);
    
    window.dashboard.saveData();
    window.dashboard.fullDashboardUpdate();
}

// Exposer les fonctions globalement
window.testRanking = testRanking;
window.createTestTrade = createTestTrade;
window.cleanTestTrades = cleanTestTrades;

console.log('✅ Script de test chargé. Utilisez:');
console.log('- testRanking() pour tester le classement');
console.log('- createTestTrade() pour créer un trade de test');
console.log('- cleanTestTrades() pour nettoyer les trades de test');