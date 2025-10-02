class NicknameManager {
    constructor() {
        this.currentUser = null;
        this.nickname = null;
    }

    async initialize() {
        return new Promise((resolve) => {
            firebase.auth().onAuthStateChanged(async (user) => {
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
        if (!this.currentUser) return null;
        
        try {
            const snapshot = await firebase.database()
                .ref(`users/${this.currentUser.uid}/profile/nickname`)
                .once('value');
            
            this.nickname = snapshot.val();
            return this.nickname;
        } catch (error) {
            console.error('Erreur chargement pseudo:', error);
            return null;
        }
    }

    async saveNickname(nickname) {
        if (!this.currentUser || !nickname) return false;
        
        try {
            await firebase.database()
                .ref(`users/${this.currentUser.uid}/profile/nickname`)
                .set(nickname);
            
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