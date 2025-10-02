// Fix complet pour le chat mobile
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        fixMobileChat();
    }, 3000);
});

function fixMobileChat() {
    console.log('🔧 Fix chat mobile...');
    
    // 1. Fix bouton toggle chat
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    
    if (chatToggle && chatWindow) {
        // Supprimer tous les anciens événements
        chatToggle.replaceWith(chatToggle.cloneNode(true));
        const newChatToggle = document.getElementById('chatToggle');
        
        newChatToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('💬 Toggle chat');
            chatWindow.classList.toggle('show');
        });
        
        newChatToggle.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('💬 Toggle chat (touch)');
            chatWindow.classList.toggle('show');
        });
    }
    
    // 2. Fix bouton fermer chat
    const closeChat = document.querySelector('.chat-header .close-btn');
    if (closeChat && chatWindow) {
        closeChat.replaceWith(closeChat.cloneNode(true));
        const newCloseChat = document.querySelector('.chat-header .close-btn');
        
        newCloseChat.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Fermer chat');
            chatWindow.classList.remove('show');
        });
        
        newCloseChat.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Fermer chat (touch)');
            chatWindow.classList.remove('show');
        });
    }
    
    // 3. Fix bouton envoyer message
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) {
        sendBtn.replaceWith(sendBtn.cloneNode(true));
        const newSendBtn = document.querySelector('.send-btn');
        
        newSendBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📤 Envoyer message');
            sendMobileChatMessage();
        });
        
        newSendBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📤 Envoyer message (touch)');
            sendMobileChatMessage();
        });
    }
    
    // 4. Fix input Enter
    const messageInput = document.getElementById('mobileMessageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('📤 Envoyer message (Enter)');
                sendMobileChatMessage();
            }
        });
    }
    
    // 5. Fix bouton emoji
    const emojiBtn = document.querySelector('.emoji-btn');
    const emojiPanel = document.getElementById('mobileEmojiPanel');
    
    if (emojiBtn && emojiPanel) {
        emojiBtn.replaceWith(emojiBtn.cloneNode(true));
        const newEmojiBtn = document.querySelector('.emoji-btn');
        
        newEmojiBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('😀 Toggle emoji');
            const isVisible = emojiPanel.style.display === 'block';
            emojiPanel.style.display = isVisible ? 'none' : 'block';
        });
        
        newEmojiBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('😀 Toggle emoji (touch)');
            const isVisible = emojiPanel.style.display === 'block';
            emojiPanel.style.display = isVisible ? 'none' : 'block';
        });
    }
    
    // 6. Fix emojis individuels
    document.querySelectorAll('.emoji-item').forEach(function(emoji) {
        emoji.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const emojiText = emoji.textContent;
            console.log('😀 Emoji sélectionné:', emojiText);
            
            if (messageInput) {
                messageInput.value += emojiText;
                messageInput.focus();
            }
            
            if (emojiPanel) {
                emojiPanel.style.display = 'none';
            }
        });
        
        emoji.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const emojiText = emoji.textContent;
            console.log('😀 Emoji sélectionné (touch):', emojiText);
            
            if (messageInput) {
                messageInput.value += emojiText;
                messageInput.focus();
            }
            
            if (emojiPanel) {
                emojiPanel.style.display = 'none';
            }
        });
    });
    
    console.log('✅ Chat mobile fixé');
}

async function sendMobileChatMessage() {
    const input = document.getElementById('mobileMessageInput');
    const message = input?.value.trim();
    
    if (!message) {
        console.log('❌ Message vide');
        return;
    }
    
    console.log('📤 Envoi message mobile:', message);
    
    try {
        if (window.firebaseDB) {
            const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            const messagesRef = ref(window.firebaseDB, 'vip_chat');
            
            // Récupérer l'utilisateur actuel
            const currentUser = sessionStorage.getItem('firebaseUID') || 'mobile_user_fixed';
            const nickname = sessionStorage.getItem('userNickname') || 'Mobile User';
            
            await push(messagesRef, {
                userId: currentUser,
                nickname: nickname,
                message: message,
                timestamp: Date.now(),
                date: new Date().toISOString().split('T')[0]
            });
            
            if (input) {
                input.value = '';
            }
            
            console.log('✅ Message envoyé avec succès');
            
        } else {
            console.error('❌ Firebase non disponible');
            alert('Erreur: Firebase non disponible');
        }
        
    } catch (error) {
        console.error('❌ Erreur envoi message:', error);
        alert('Erreur envoi message: ' + error.message);
    }
}

// Fonctions globales
window.sendMobileChatMessage = sendMobileChatMessage;
window.fixMobileChat = fixMobileChat;