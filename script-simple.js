// Firebase est maintenant géré dans chaque page individuellement

// Système VIP avec authentification
function showVipAuthModal() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    
    modal.innerHTML = `<div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; border: 2px solid #00d4ff;"><h2 style="color: #00d4ff; margin-bottom: 20px;">🔐 Accès VIP</h2><input type="email" id="vipEmail" placeholder="Email" style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.1); color: white;"><input type="password" id="vipPassword" placeholder="Mot de passe" style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.1); color: white;"><button onclick="loginVipUser()" style="width: 100%; background: #00d4ff; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; margin: 10px 0;">Se connecter</button><button onclick="this.closest('div').parentElement.remove()" style="background: transparent; color: #ccc; border: 1px solid #ccc; padding: 8px 20px; border-radius: 8px; cursor: pointer;">Fermer</button></div>`;
    
    document.body.appendChild(modal);
}

async function loginVipUser() {
    const email = document.getElementById('vipEmail').value;
    const password = document.getElementById('vipPassword').value;
    
    if (!email || !password) {
        alert('Email et mot de passe requis');
        return;
    }
    
    try {
        // Vérifier d'abord si l'utilisateur a l'accès VIP
        const vipCheck = await db.collection('vip_users')
            .where('email', '==', email)
            .where('vip_access', '==', true)
            .get();
        
        if (vipCheck.empty) {
            showAccessDenied();
            return;
        }
        
        // Essayer de se connecter
        try {
            await auth.signInWithEmailAndPassword(email, password);
            document.querySelector('[style*="position: fixed"]').remove();
            window.open('vip-space.html', '_blank');
        } catch (authError) {
            // Si l'utilisateur n'existe pas, le créer
            if (authError.code === 'auth/user-not-found') {
                await auth.createUserWithEmailAndPassword(email, password);
                document.querySelector('[style*="position: fixed"]').remove();
                window.open('vip-space.html', '_blank');
            } else {
                alert('Mot de passe incorrect');
            }
        }
    } catch (error) {
        console.error('Erreur:', error);
        showAccessDenied();
    }
}

function showAccessDenied() {
    document.querySelector('[style*="position: fixed"]')?.remove();
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    modal.innerHTML = `<div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 40px; border-radius: 20px; text-align: center; max-width: 500px; border: 2px solid #ff6b6b;"><h2 style="color: #ff6b6b; margin-bottom: 20px;">🚫 Accès Refusé</h2><p style="color: #fff; margin-bottom: 30px;">Contactez-nous pour obtenir l'accès VIP</p><button onclick="window.open('https://t.me/misterpips_support', '_blank')" style="background: #0088cc; color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; margin: 10px;">@misterpips_support</button><button onclick="this.closest('div').parentElement.remove()" style="background: transparent; color: #ccc; border: 1px solid #ccc; padding: 8px 20px; border-radius: 8px; cursor: pointer;">Fermer</button></div>`;
    document.body.appendChild(modal);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    const accessButton = document.getElementById('accessVipSpace');
    if (accessButton) {
        accessButton.addEventListener('click', showVipAuthModal);
    }
});