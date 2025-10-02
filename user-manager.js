// Gestionnaire d'utilisateurs simple pour mobile
class UserManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    async loginUser(email, uid) {
        this.currentUser = uid;
        this.isAuthenticated = true;
        
        // Stocker dans sessionStorage
        sessionStorage.setItem('firebaseUID', uid);
        sessionStorage.setItem('userEmail', email);
        
        console.log('✅ Utilisateur connecté:', { email, uid });
        return true;
    }

    getCurrentUser() {
        return this.currentUser || sessionStorage.getItem('firebaseUID');
    }

    isLoggedIn() {
        return this.isAuthenticated || !!sessionStorage.getItem('firebaseUID');
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        sessionStorage.removeItem('firebaseUID');
        sessionStorage.removeItem('userEmail');
    }
}

// Initialiser le gestionnaire d'utilisateurs
window.userManager = new UserManager();
console.log('👤 Gestionnaire d'utilisateurs initialisé');