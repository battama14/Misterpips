import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDSDK0NfVSs_VQb3TnrixiJbOpTsmoUMvU",
    authDomain: "misterpips-b71fb.firebaseapp.com",
    projectId: "misterpips-b71fb",
    storageBucket: "misterpips-b71fb.firebasestorage.app",
    messagingSenderId: "574231126409",
    appId: "1:574231126409:web:b7ed93ac4ea62e247dc158"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

window.firebaseVip = {
    async loginWithEmail(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return await this.checkVipAccess(userCredential.user);
        } catch (error) {
            throw new Error('Email ou mot de passe incorrect');
        }
    },

    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return await this.checkVipAccess(result.user);
        } catch (error) {
            throw new Error('Erreur de connexion Google');
        }
    },

    async checkVipAccess(user) {
        try {
            const userDoc = await getDoc(doc(db, 'vip_users', user.uid));
            return userDoc.exists() && userDoc.data().vip_access === true;
        } catch (error) {
            return false;
        }
    }
};