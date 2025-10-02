class NicknameManager {
    constructor() {
        this.currentUser = null;
        this.nickname = null;
    }

    async initialize() {
        if (!window.firebaseAuth || !window.firebaseDB) {
            console.warn('Firebase non disponible');
            return null;
        }
        
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
        
        return new Promise((resolve) => {
            onAuthStateChanged(window.firebaseAuth, async (user) => {
                if (user) {
                    this.currentUser = user;
                    await this.loadNickname();
                    resolve(this.nickname);
                } else {
                    resolve(null);
                }
            });
        });
    }

    async loadNickname() {
        if (!this.currentUser || !window.firebaseDB) return null;
        
        try {
            const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            const nicknameRef = ref(window.firebaseDB, `users/${this.currentUser.uid}/nickname`);
            const snapshot = await get(nicknameRef);
            
            this.nickname = snapshot.exists() ? snapshot.val() : null;
            return this.nickname;
        } catch (error) {
            console.error('Erreur chargement pseudo:', error);
            return null;
        }
    }

    async saveNickname(nickname) {
        if (!this.currentUser || !nickname || !window.firebaseDB) return false;
        
        try {
            const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            const nicknameRef = ref(window.firebaseDB, `users/${this.currentUser.uid}/nickname`);
            await set(nicknameRef, nickname);
            
            this.nickname = nickname;
            return true;
        } catch (error) {
            console.error('Erreur sauvegarde pseudo:', error);
            return false;
        }
    }

    async promptForNickname() {
        const nickname = prompt('Choisissez votre pseudo pour le chat et le classement:');
        if (nickname && nickname.trim()) {
            const success = await this.saveNickname(nickname.trim());
            if (success) {
                return nickname.trim();
            }
        }
        return null;
    }

    async ensureNickname() {
        if (this.nickname) {
            return this.nickname;
        }
        
        return await this.promptForNickname();
    }

    getNickname() {
        return this.nickname;
    }

    async changeNickname(newNickname) {
        if (newNickname && newNickname.trim()) {
            return await this.saveNickname(newNickname.trim());
        }
        return false;
    }
}

// Instance globale
window.nicknameManager = new NicknameManager();