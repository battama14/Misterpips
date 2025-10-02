// Nettoyage des doublons Mobile User
class MobileDuplicateCleaner {
    constructor() {
        this.cleanupDone = false;
    }

    async cleanMobileDuplicates() {
        if (this.cleanupDone) return;
        
        try {
            console.log('🧹 Nettoyage des doublons Mobile User...');
            
            if (!window.firebaseDB) return;
            
            const { ref, get, remove } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            
            // Récupérer tous les utilisateurs
            const usersRef = ref(window.firebaseDB, 'users');
            const snapshot = await get(usersRef);
            
            if (!snapshot.exists()) return;
            
            const users = snapshot.val();
            const mobileUsers = [];
            
            // Identifier tous les utilisateurs mobiles
            Object.keys(users).forEach(uid => {
                const userData = users[uid];
                if (userData.nickname === 'Mobile User' || 
                    userData.displayName === 'Mobile User' ||
                    uid.includes('mobile_user') ||
                    userData.email === 'mobile@misterpips.com') {
                    mobileUsers.push(uid);
                }
            });
            
            console.log(`📱 Trouvé ${mobileUsers.length} utilisateurs mobiles`);
            
            // Garder seulement 'mobile_user_fixed' et supprimer les autres
            const toDelete = mobileUsers.filter(uid => uid !== 'mobile_user_fixed');
            
            for (const uid of toDelete) {
                console.log(`🗑️ Suppression du doublon: ${uid}`);
                const userRef = ref(window.firebaseDB, `users/${uid}`);
                await remove(userRef);
            }
            
            console.log('✅ Nettoyage terminé');
            this.cleanupDone = true;
            
        } catch (error) {
            console.error('❌ Erreur nettoyage:', error);
        }
    }
}

// Initialisation et nettoyage automatique
window.mobileDuplicateCleaner = new MobileDuplicateCleaner();

// Nettoyer au démarrage
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.mobileDuplicateCleaner.cleanMobileDuplicates();
    }, 3000);
});