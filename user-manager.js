// Gestionnaire d'utilisateurs avec pseudos persistants
class UserManager {
    constructor() {
        this.currentUser = null;
        this.userProfiles = {};
        this.loadUserProfiles();
    }

    // Charger les profils utilisateurs depuis Firebase et localStorage
    async loadUserProfiles() {
        try {
            // Essayer Firebase d'abord
            if (window.firebaseDB) {
                const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const profilesRef = ref(window.firebaseDB, 'user_profiles');
                const snapshot = await get(profilesRef);
                
                if (snapshot.exists()) {
                    this.userProfiles = snapshot.val();
                    console.log('👤 Profils utilisateurs chargés depuis Firebase');
                }
            }
        } catch (error) {
            console.error('❌ Erreur chargement profils Firebase:', error);
        }

        // Fallback localStorage
        const savedProfiles = localStorage.getItem('misterpips_user_profiles');
        if (savedProfiles) {
            const localProfiles = JSON.parse(savedProfiles);
            this.userProfiles = { ...localProfiles, ...this.userProfiles };
            console.log('👤 Profils utilisateurs chargés depuis localStorage');
        }
    }

    // Sauvegarder les profils utilisateurs
    async saveUserProfiles() {
        try {
            // Sauvegarder en localStorage d'abord
            localStorage.setItem('misterpips_user_profiles', JSON.stringify(this.userProfiles));
            
            // Puis Firebase
            if (window.firebaseDB) {
                const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const profilesRef = ref(window.firebaseDB, 'user_profiles');
                await set(profilesRef, this.userProfiles);
                console.log('💾 Profils utilisateurs sauvegardés');
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde profils:', error);
        }
    }

    // Obtenir ou créer un profil utilisateur
    async getUserProfile(email, uid) {
        const userKey = email || uid;
        
        // Si le profil existe déjà, le retourner
        if (this.userProfiles[userKey]) {
            console.log('👤 Profil existant trouvé pour:', userKey);
            return this.userProfiles[userKey];
        }

        // Créer un nouveau profil
        const newProfile = {
            email: email,
            uid: uid,
            nickname: null,
            createdAt: Date.now(),
            lastLogin: Date.now(),
            isVIP: false
        };

        this.userProfiles[userKey] = newProfile;
        await this.saveUserProfiles();
        
        console.log('👤 Nouveau profil créé pour:', userKey);
        return newProfile;
    }

    // Demander le pseudo si nécessaire
    async promptForNickname(userProfile) {
        if (userProfile.nickname) {
            console.log('👤 Pseudo existant:', userProfile.nickname);
            return userProfile.nickname;
        }

        // Demander le pseudo
        const nickname = prompt('👋 Bienvenue ! Choisissez votre pseudo pour le chat VIP:', '');
        
        if (nickname && nickname.trim()) {
            const cleanNickname = nickname.trim();
            
            // Vérifier si le pseudo n'est pas déjà pris
            const isNicknameTaken = Object.values(this.userProfiles).some(
                profile => profile.nickname && profile.nickname.toLowerCase() === cleanNickname.toLowerCase()
            );
            
            if (isNicknameTaken) {
                alert('❌ Ce pseudo est déjà pris. Veuillez en choisir un autre.');
                return await this.promptForNickname(userProfile);
            }
            
            // Sauvegarder le pseudo
            userProfile.nickname = cleanNickname;
            await this.saveUserProfiles();
            
            console.log('✅ Pseudo sauvegardé:', cleanNickname);
            return cleanNickname;
        }
        
        // Si pas de pseudo, utiliser l'email par défaut
        const defaultNickname = userProfile.email ? userProfile.email.split('@')[0] : 'Utilisateur';
        userProfile.nickname = defaultNickname;
        await this.saveUserProfiles();
        
        return defaultNickname;
    }

    // Connexion utilisateur
    async loginUser(email, uid) {
        const userProfile = await this.getUserProfile(email, uid);
        
        // Mettre à jour la dernière connexion
        userProfile.lastLogin = Date.now();
        await this.saveUserProfiles();
        
        // Obtenir le pseudo
        const nickname = await this.promptForNickname(userProfile);
        
        // Définir l'utilisateur actuel
        this.currentUser = {
            ...userProfile,
            nickname: nickname
        };
        
        // Sauvegarder dans sessionStorage
        sessionStorage.setItem('firebaseUID', uid);
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('userNickname', nickname);
        
        console.log('✅ Utilisateur connecté:', nickname);
        return this.currentUser;
    }

    // Obtenir l'utilisateur actuel
    getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        // Essayer de récupérer depuis sessionStorage
        const uid = sessionStorage.getItem('firebaseUID');
        const email = sessionStorage.getItem('userEmail');
        const nickname = sessionStorage.getItem('userNickname');
        
        if (uid && email && nickname) {
            this.currentUser = {
                uid: uid,
                email: email,
                nickname: nickname
            };
            return this.currentUser;
        }
        
        return null;
    }

    // Changer le pseudo
    async changeNickname(newNickname) {
        if (!this.currentUser) return false;
        
        const cleanNickname = newNickname.trim();
        if (!cleanNickname) return false;
        
        // Vérifier si le pseudo n'est pas déjà pris
        const isNicknameTaken = Object.values(this.userProfiles).some(
            profile => profile.nickname && 
                      profile.nickname.toLowerCase() === cleanNickname.toLowerCase() &&
                      profile.email !== this.currentUser.email
        );
        
        if (isNicknameTaken) {
            alert('❌ Ce pseudo est déjà pris.');
            return false;
        }
        
        // Mettre à jour le pseudo
        const userKey = this.currentUser.email || this.currentUser.uid;
        if (this.userProfiles[userKey]) {
            this.userProfiles[userKey].nickname = cleanNickname;
            await this.saveUserProfiles();
            
            this.currentUser.nickname = cleanNickname;
            sessionStorage.setItem('userNickname', cleanNickname);
            
            console.log('✅ Pseudo mis à jour:', cleanNickname);
            return true;
        }
        
        return false;
    }

    // Déconnexion
    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('firebaseUID');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('userNickname');
        console.log('👋 Utilisateur déconnecté');
    }
}

// Instance globale
window.userManager = new UserManager();

console.log('👤 User Manager chargé');