// Chat mobile simplifié pour éviter les freezes
let chatInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSimpleChat, 2000);
});

function initSimpleChat() {
    if (chatInitialized) return;
    chatInitialized = true;
    
    console.log('💬 Init chat simple...');
    
    // Toggle chat
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    
    if (chatToggle && chatWindow) {
        chatToggle.onclick = function(e) {
            e.preventDefault();
            console.log('💬 Toggle chat');
            chatWindow.classList.toggle('show');
        };
    }
    
    // Fermer chat
    const closeChat = document.querySelector('.chat-header .close-btn');
    if (closeChat && chatWindow) {
        closeChat.onclick = function(e) {
            e.preventDefault();
            console.log('❌ Fermer chat');
            chatWindow.classList.remove('show');
        };
    }
    
    // Envoyer message - VERSION SIMPLIFIÉE
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) {
        sendBtn.onclick = function(e) {
            e.preventDefault();
            console.log('📤 Envoi message simple');
            sendSimpleMessage();
        };
    }
    
    // Enter pour envoyer
    const messageInput = document.getElementById('mobileMessageInput');
    if (messageInput) {
        messageInput.onkeypress = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendSimpleMessage();
            }
        };
    }
    
    // Emoji simple
    const emojiBtn = document.querySelector('.emoji-btn');
    const emojiPanel = document.getElementById('mobileEmojiPanel');
    
    if (emojiBtn && emojiPanel) {
        emojiBtn.onclick = function(e) {
            e.preventDefault();
            const isVisible = emojiPanel.style.display === 'block';
            emojiPanel.style.display = isVisible ? 'none' : 'block';
        };
    }
    
    // Emojis
    document.querySelectorAll('.emoji-item').forEach(function(emoji) {
        emoji.onclick = function(e) {
            e.preventDefault();
            if (messageInput) {
                messageInput.value += emoji.textContent;
            }
            if (emojiPanel) {
                emojiPanel.style.display = 'none';
            }
        };
    });
    
    console.log('✅ Chat simple initialisé');
}

function sendSimpleMessage() {
    const input = document.getElementById('mobileMessageInput');
    const message = input?.value.trim();
    
    if (!message) return;
    
    console.log('📤 Message:', message);
    
    // Version ultra-simple pour éviter les freezes
    try {
        if (window.firebaseDB) {
            sendToFirebase(message);
        } else {
            console.log('Firebase non disponible');
        }
        
        if (input) {
            input.value = '';
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        if (input) {
            input.value = '';
        }
    }
}

async function sendToFirebase(message) {
    try {
        const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
        const messagesRef = ref(window.firebaseDB, 'vip_chat');
        
        const currentUser = sessionStorage.getItem('firebaseUID') || 'mobile_user_fixed';
        const nickname = sessionStorage.getItem('userNickname') || 'Mobile User';
        
        await push(messagesRef, {
            userId: currentUser,
            nickname: nickname,
            message: message,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0]
        });
        
        console.log('✅ Message envoyé');
        
    } catch (error) {
        console.error('❌ Erreur Firebase:', error);
    }
}

// Fonctions globales
window.initSimpleChat = initSimpleChat;
window.sendSimpleMessage = sendSimpleMessage;