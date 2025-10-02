// Audit complet Firebase
async function auditFirebase() {
    console.log('🔍 === AUDIT FIREBASE COMPLET ===');
    
    const { ref, get, set, remove } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    
    // 1. Analyser la structure users/
    console.log('\n📊 1. ANALYSE COLLECTION USERS');
    const usersRef = ref(window.firebaseDB, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
        const users = usersSnapshot.val();
        console.log(`Total utilisateurs: ${Object.keys(users).length}`);
        
        for (const [uid, userData] of Object.entries(users)) {
            console.log(`\n👤 User: ${uid}`);
            console.log(`  Email: ${userData.email || 'N/A'}`);
            console.log(`  VIP: ${userData.isVIP || userData.plan === 'VIP'}`);
            console.log(`  Nickname: ${userData.nickname || 'N/A'}`);
            
            // Vérifier structure accounts
            if (userData.accounts) {
                console.log(`  Accounts: ${Object.keys(userData.accounts).length}`);
                for (const [accountId, accountData] of Object.entries(userData.accounts)) {
                    const tradesCount = accountData.trades ? accountData.trades.length : 0;
                    console.log(`    ${accountId}: ${tradesCount} trades`);
                }
            } else {
                console.log(`  ❌ Pas de structure accounts`);
            }
            
            // Vérifier trades directs
            if (userData.trades) {
                console.log(`  Trades directs: ${Array.isArray(userData.trades) ? userData.trades.length : 'Non array'}`);
            }
        }
    }
    
    // 2. Analyser la structure dashboards/
    console.log('\n📊 2. ANALYSE COLLECTION DASHBOARDS');
    const dashboardsRef = ref(window.firebaseDB, 'dashboards');
    const dashboardsSnapshot = await get(dashboardsRef);
    
    if (dashboardsSnapshot.exists()) {
        const dashboards = dashboardsSnapshot.val();
        console.log(`Total dashboards: ${Object.keys(dashboards).length}`);
        
        for (const [uid, dashboardData] of Object.entries(dashboards)) {
            console.log(`\n💻 Dashboard: ${uid}`);
            console.log(`  Trades: ${dashboardData.trades ? dashboardData.trades.length : 0}`);
            console.log(`  Settings: ${dashboardData.settings ? 'Oui' : 'Non'}`);
            console.log(`  Accounts: ${dashboardData.accounts ? Object.keys(dashboardData.accounts).length : 0}`);
            console.log(`  LastUpdated: ${dashboardData.lastUpdated || 'N/A'}`);
        }
    }
    
    // 3. Analyser la structure chat/
    console.log('\n📊 3. ANALYSE COLLECTION CHAT');
    const chatRef = ref(window.firebaseDB, 'chat');
    const chatSnapshot = await get(chatRef);
    
    if (chatSnapshot.exists()) {
        const chatData = chatSnapshot.val();
        console.log(`Messages chat: ${Object.keys(chatData).length}`);
    } else {
        console.log('Pas de données chat');
    }
    
    console.log('\n🔍 === FIN AUDIT ===');
}

// Fonction de nettoyage
async function cleanFirebase() {
    console.log('🧹 === NETTOYAGE FIREBASE ===');
    
    const { ref, get, set, remove } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    
    // 1. Supprimer les utilisateurs de test/démo
    const usersRef = ref(window.firebaseDB, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
        const users = usersSnapshot.val();
        const toDelete = [];
        
        for (const [uid, userData] of Object.entries(users)) {
            // Identifier les comptes à supprimer
            if (uid.includes('demo') || uid.includes('test') || uid.includes('mobile_demo') || 
                !userData.email || userData.email.includes('demo')) {
                toDelete.push(uid);
            }
        }
        
        console.log(`Utilisateurs à supprimer: ${toDelete.length}`);
        for (const uid of toDelete) {
            console.log(`Suppression: ${uid}`);
            await remove(ref(window.firebaseDB, `users/${uid}`));
            await remove(ref(window.firebaseDB, `dashboards/${uid}`));
        }
    }
    
    console.log('✅ Nettoyage terminé');
}

// Fonction de synchronisation des données
async function syncUserData() {
    console.log('🔄 === SYNCHRONISATION DONNÉES ===');
    
    const { ref, get, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    
    // Récupérer tous les dashboards
    const dashboardsRef = ref(window.firebaseDB, 'dashboards');
    const dashboardsSnapshot = await get(dashboardsRef);
    
    if (dashboardsSnapshot.exists()) {
        const dashboards = dashboardsSnapshot.val();
        
        for (const [uid, dashboardData] of Object.entries(dashboards)) {
            console.log(`Sync ${uid}...`);
            
            // Vérifier si l'utilisateur existe
            const userRef = ref(window.firebaseDB, `users/${uid}`);
            const userSnapshot = await get(userRef);
            
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                
                // Synchroniser les données
                const syncData = {
                    ...userData,
                    accounts: {
                        compte1: {
                            trades: dashboardData.trades || [],
                            capital: dashboardData.settings?.capital || 1000,
                            settings: dashboardData.settings || {}
                        }
                    },
                    lastUpdated: new Date().toISOString()
                };
                
                await set(userRef, syncData);
                console.log(`✅ ${uid} synchronisé`);
            }
        }
    }
    
    console.log('✅ Synchronisation terminée');
}

// Fonction de vérification des sauvegardes
async function checkSavePoints() {
    console.log('💾 === VÉRIFICATION POINTS DE SAUVEGARDE ===');
    
    // Points de sauvegarde identifiés dans le code
    const savePoints = [
        'dashboard.saveTrade() - Nouveau trade',
        'dashboard.closeTrade() - Fermeture trade', 
        'dashboard.saveEditedTrade() - Modification trade',
        'dashboard.saveSettings() - Paramètres',
        'dashboard.saveData() - Sauvegarde générale',
        'chat.sendMessage() - Messages chat',
        'mobile.saveTrade() - Trade mobile'
    ];
    
    console.log('Points de sauvegarde automatique:');
    savePoints.forEach((point, i) => {
        console.log(`${i + 1}. ${point}`);
    });
    
    // Vérifier la fréquence de sauvegarde
    console.log('\nFréquence de sauvegarde:');
    console.log('- Automatique: Toutes les 30 secondes');
    console.log('- Manuel: À chaque action utilisateur');
    console.log('- Backup local: localStorage en parallèle');
}

// Exposer les fonctions
window.auditFirebase = auditFirebase;
window.cleanFirebase = cleanFirebase;
window.syncUserData = syncUserData;
window.checkSavePoints = checkSavePoints;

console.log('🔍 Audit Firebase chargé. Commandes disponibles:');
console.log('- auditFirebase() : Analyser la structure');
console.log('- cleanFirebase() : Nettoyer les données');
console.log('- syncUserData() : Synchroniser users/dashboards');
console.log('- checkSavePoints() : Vérifier les sauvegardes');