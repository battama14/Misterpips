// Script pour nettoyer les utilisateurs mobiles en double
async function cleanMobileUsers() {
    if (!window.firebaseDB) {
        console.error('Firebase non initialisé');
        return;
    }

    const { ref, get, remove } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    
    try {
        // Nettoyer les utilisateurs mobiles en double
        const usersRef = ref(window.firebaseDB, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            let cleaned = 0;
            
            for (const [uid, userData] of Object.entries(users)) {
                // Supprimer tous les anciens utilisateurs mobiles
                if (uid.startsWith('mobile_demo_') || 
                    (userData.email && userData.email.includes('demo@mobile.com'))) {
                    console.log(`🗑️ Suppression utilisateur mobile: ${uid}`);
                    await remove(ref(window.firebaseDB, `users/${uid}`));
                    cleaned++;
                }
            }
            
            console.log(`✅ ${cleaned} utilisateurs mobiles supprimés`);
        }
        
        // Nettoyer aussi les dashboards
        const dashboardsRef = ref(window.firebaseDB, 'dashboards');
        const dashSnapshot = await get(dashboardsRef);
        
        if (dashSnapshot.exists()) {
            const dashboards = dashSnapshot.val();
            let cleanedDash = 0;
            
            for (const uid of Object.keys(dashboards)) {
                if (uid.startsWith('mobile_demo_')) {
                    console.log(`🗑️ Suppression dashboard mobile: ${uid}`);
                    await remove(ref(window.firebaseDB, `dashboards/${uid}`));
                    cleanedDash++;
                }
            }
            
            console.log(`✅ ${cleanedDash} dashboards mobiles supprimés`);
        }
        
        // Forcer le rechargement du classement
        if (window.loadVIPRanking) {
            setTimeout(() => window.loadVIPRanking(), 1000);
        }
        
        console.log('🧹 Nettoyage terminé - rechargez la page');
        
    } catch (error) {
        console.error('❌ Erreur nettoyage:', error);
    }
}

// Exporter la fonction
window.cleanMobileUsers = cleanMobileUsers;