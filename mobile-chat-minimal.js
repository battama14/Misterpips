// Chat mobile minimal - Version ultra-simple
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupMinimalChat, 1000);
});

function setupMinimalChat() {
    console.log('💬 Setup chat minimal...');
    
    // 1. Widget toggle - SIMPLE
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    
    if (chatToggle) {
        chatToggle.addEventListener('click', function() {
            console.log('💬 Toggle');
            if (chatWindow) {
                chatWindow.classList.toggle('show');
            }
        });
    }
    
    // 2. Fermer chat - SIMPLE
    const closeBtn = document.querySelector('.chat-header .close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            console.log('❌ Fermer');
            if (chatWindow) {
                chatWindow.classList.remove('show');
            }
        });
    }
    
    // 3. Envoyer message - ULTRA SIMPLE
    const sendBtn = document.querySelector('.send-btn');
    const messageInput = document.getElementById('mobileMessageInput');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', function() {
            console.log('📤 Envoyer');
            sendMessage();
        });
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    console.log('✅ Chat minimal prêt');
}

function sendMessage() {
    const input = document.getElementById('mobileMessageInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    console.log('📤 Message:', message);
    
    // Vider immédiatement pour éviter les doublons
    input.value = '';
    
    // Envoyer en arrière-plan sans bloquer
    setTimeout(function() {
        sendToFirebaseSimple(message);
    }, 100);
}

function sendToFirebaseSimple(message) {
    try {
        if (!window.firebaseDB) {
            console.log('Firebase non disponible');
            return;
        }
        
        // Import dynamique pour éviter les blocages
        import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js')
            .then(function(firebase) {
                // IMPORTANT: Utiliser 'vip_chat' pour synchronisation PC
                const messagesRef = firebase.ref(window.firebaseDB, 'vip_chat');
                
                // Récupérer l'utilisateur connecté ou utiliser mobile par défaut
                const currentUser = sessionStorage.getItem('firebaseUID') || 'mobile_user_fixed';
                const userEmail = sessionStorage.getItem('userEmail') || 'mobile@misterpips.com';
                const nickname = sessionStorage.getItem('userNickname') || 'Mobile User';
                
                firebase.push(messagesRef, {
                    userId: currentUser,
                    nickname: nickname,
                    email: userEmail,
                    message: message,
                    timestamp: Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    platform: 'mobile'
                }).then(function() {
                    console.log('✅ Message envoyé vers vip_chat');
                }).catch(function(error) {
                    console.error('❌ Erreur envoi:', error);
                });
            })
            .catch(function(error) {
                console.error('❌ Import error:', error);
            });
            
    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}