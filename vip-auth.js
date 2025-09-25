// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDSDK0NfVSs_VQb3TnrixiJbOpTsmoUMvU",
    authDomain: "misterpips-b71fb.firebaseapp.com",
    projectId: "misterpips-b71fb",
    storageBucket: "misterpips-b71fb.firebasestorage.app",
    messagingSenderId: "574231126409",
    appId: "1:574231126409:web:b7ed93ac4ea62e247dc158"
};

// Initialiser Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Fonction d'authentification VIP
async function authenticateVIP() {
    showAuthModal();
}

// Afficher la modal d'authentification
function showAuthModal() {
    const modal = document.createElement('div');
    modal.id = 'vipAuthModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; justify-content: center;
        align-items: center; z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 40px; border-radius: 20px; text-align: center;
            max-width: 400px; border: 2px solid #00d4ff;
            box-shadow: 0 0 50px rgba(0,212,255,0.3);
        ">
            <h2 style="color: #00d4ff; margin-bottom: 20px;">
                🔐 Accès Espace VIP
            </h2>
            <p style="color: #fff; margin-bottom: 30px;">
                Connectez-vous pour accéder à vos outils exclusifs
            </p>
            
            <div style="margin-bottom: 20px;">
                <input type="email" id="vipEmail" placeholder="Email" style="
                    width: 100%; padding: 12px; margin-bottom: 10px;
                    border: 1px solid rgba(255,255,255,0.3); border-radius: 8px;
                    background: rgba(255,255,255,0.1); color: white;
                ">
                <input type="password" id="vipPassword" placeholder="Mot de passe" style="
                    width: 100%; padding: 12px; margin-bottom: 20px;
                    border: 1px solid rgba(255,255,255,0.3); border-radius: 8px;
                    background: rgba(255,255,255,0.1); color: white;
                ">
            </div>
            
            <button onclick="loginWithEmail()" style="
                width: 100%; background: linear-gradient(135deg, #00d4ff, #5b86e5);
                color: white; border: none; padding: 12px; border-radius: 8px;
                cursor: pointer; margin-bottom: 15px; font-weight: bold;
            ">
                Se connecter
            </button>
            
            <button onclick="loginWithGoogle()" style="
                width: 100%; background: #db4437; color: white; border: none;
                padding: 12px; border-radius: 8px; cursor: pointer; margin-bottom: 20px;
            ">
                <i class="fab fa-google"></i> Continuer avec Google
            </button>
            
            <button onclick="closeAuthModal()" style="
                background: transparent; color: #ccc; border: 1px solid #ccc;
                padding: 8px 20px; border-radius: 8px; cursor: pointer;
            ">
                Fermer
            </button>
            
            <div id="authError" style="color: #ff6b6b; margin-top: 15px; display: none;"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Connexion par email
async function loginWithEmail() {
    const email = document.getElementById('vipEmail').value;
    const password = document.getElementById('vipPassword').value;
    
    if (!email || !password) {
        showAuthError('Veuillez remplir tous les champs');
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await checkVipAccess(userCredential.user);
    } catch (error) {
        showAuthError('Email ou mot de passe incorrect');
    }
}

// Connexion avec Google
async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        await checkVipAccess(result.user);
    } catch (error) {
        showAuthError('Erreur de connexion Google');
    }
}

// Vérifier l'accès VIP
async function checkVipAccess(user) {
    try {
        const userDoc = await getDoc(doc(db, 'vip_users', user.uid));
        
        if (userDoc.exists() && userDoc.data().vip_access) {
            closeAuthModal();
            redirectToVipSpace();
        } else {
            showAccessDeniedModal();
        }
    } catch (error) {
        showAccessDeniedModal();
    }
}

// Rediriger vers l'espace VIP
function redirectToVipSpace() {
    window.open('../DASHBOARDTRADING/auth.html', '_blank', 'width=1400,height=900');
}

// Afficher modal d'accès refusé
function showAccessDeniedModal() {
    closeAuthModal();
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; justify-content: center;
        align-items: center; z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 40px; border-radius: 20px; text-align: center;
            max-width: 500px; border: 2px solid #ff6b6b;
            box-shadow: 0 0 50px rgba(255,107,107,0.3);
        ">
            <h2 style="color: #ff6b6b; margin-bottom: 20px;">
                🚫 Accès Non Autorisé
            </h2>
            <p style="color: #fff; margin-bottom: 30px; line-height: 1.6;">
                Votre compte n'a pas accès à l'espace VIP.<br>
                Contactez notre support pour faire votre demande d'accès.
            </p>
            
            <button onclick="window.open('https://t.me/misterpips_support', '_blank')" style="
                background: linear-gradient(135deg, #0088cc, #0066aa);
                color: white; border: none; padding: 15px 30px;
                border-radius: 8px; cursor: pointer; margin-bottom: 15px;
                font-weight: bold; font-size: 16px;
            ">
                📱 Contacter @misterpips_support
            </button>
            
            <br>
            
            <button onclick="this.closest('div').parentElement.remove()" style="
                background: transparent; color: #ccc; border: 1px solid #ccc;
                padding: 8px 20px; border-radius: 8px; cursor: pointer;
            ">
                Fermer
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Fonctions utilitaires
function closeAuthModal() {
    const modal = document.getElementById('vipAuthModal');
    if (modal) modal.remove();
}

function showAuthError(message) {
    const errorDiv = document.getElementById('authError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Exposer les fonctions globalement
window.authenticateVIP = authenticateVIP;
window.loginWithEmail = loginWithEmail;
window.loginWithGoogle = loginWithGoogle;
window.closeAuthModal = closeAuthModal;