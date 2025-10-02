// Fix critique pour les boutons trades et chat mobile
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Fix critique mobile en cours...');
    
    // Attendre que tout soit chargé
    setTimeout(function() {
        fixTradeButtons();
        fixChatButtons();
        fixModalButtons();
        console.log('✅ Fix critique mobile terminé');
    }, 2000);
});

function fixTradeButtons() {
    console.log('🔧 Fix boutons trades...');
    
    // Bouton nouveau trade (dashboard)
    const newTradeBtn = document.getElementById('newTradeBtn');
    if (newTradeBtn) {
        newTradeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📈 Nouveau trade cliqué');
            showTradeModal();
        });
        newTradeBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📈 Nouveau trade touché');
            showTradeModal();
        });
    }
    
    // Bouton ajouter trade (section trades)
    const addTradeBtn = document.getElementById('addTradeBtn');
    if (addTradeBtn) {
        addTradeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📈 Ajouter trade cliqué');
            showTradeModal();
        });
        addTradeBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📈 Ajouter trade touché');
            showTradeModal();
        });
    }
}

function fixChatButtons() {
    console.log('🔧 Fix boutons chat...');
    
    // Bouton toggle chat
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    
    if (chatToggle) {
        chatToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('💬 Chat toggle cliqué');
            if (chatWindow) {
                chatWindow.classList.toggle('show');
            }
        });
        chatToggle.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('💬 Chat toggle touché');
            if (chatWindow) {
                chatWindow.classList.toggle('show');
            }
        });
    }
    
    // Bouton envoyer message
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📤 Envoi message cliqué');
            sendChatMessage();
        });
        sendBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📤 Envoi message touché');
            sendChatMessage();
        });
    }
    
    // Input message avec Enter
    const messageInput = document.getElementById('mobileMessageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('📤 Envoi message Enter');
                sendChatMessage();
            }
        });
    }
}

function fixModalButtons() {
    console.log('🔧 Fix boutons modal...');
    
    // Bouton fermer modal
    const closeModalBtn = document.querySelector('#tradeModal .close-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Fermer modal cliqué');
            hideTradeModal();
        });
        closeModalBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Fermer modal touché');
            hideTradeModal();
        });
    }
    
    // Bouton sauvegarder trade
    const saveTradeBtn = document.querySelector('.form-actions .primary-btn');
    if (saveTradeBtn) {
        saveTradeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('💾 Sauvegarder trade cliqué');
            saveTrade();
        });
        saveTradeBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('💾 Sauvegarder trade touché');
            saveTrade();
        });
    }
}

function showTradeModal() {
    const modal = document.getElementById('tradeModal');
    const title = document.getElementById('modalTitle');
    
    if (modal && title) {
        title.textContent = 'Nouveau Trade';
        
        // Réinitialiser le formulaire
        document.getElementById('tradePair').value = 'EUR/USD';
        document.getElementById('tradeType').value = 'BUY';
        document.getElementById('tradeLots').value = '0.01';
        document.getElementById('tradeEntry').value = '';
        document.getElementById('tradeStopLoss').value = '';
        document.getElementById('tradeTakeProfit').value = '';
        
        modal.classList.add('show');
        console.log('✅ Modal trade affichée');
    }
}

function hideTradeModal() {
    const modal = document.getElementById('tradeModal');
    if (modal) {
        modal.classList.remove('show');
        console.log('✅ Modal trade fermée');
    }
}

function saveTrade() {
    const currency = document.getElementById('tradePair')?.value;
    const type = document.getElementById('tradeType')?.value;
    const lotSize = parseFloat(document.getElementById('tradeLots')?.value);
    const entryPoint = parseFloat(document.getElementById('tradeEntry')?.value);
    const stopLoss = parseFloat(document.getElementById('tradeStopLoss')?.value);
    const takeProfit = parseFloat(document.getElementById('tradeTakeProfit')?.value);

    if (!currency || !entryPoint || !stopLoss || !takeProfit || !lotSize) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    console.log('💾 Sauvegarde trade:', { currency, type, lotSize, entryPoint, stopLoss, takeProfit });
    
    // Utiliser le dashboard mobile si disponible
    if (window.mobileDashboard) {
        window.mobileDashboard.saveTrade();
    } else {
        // Fallback manuel
        const trade = {
            id: Date.now().toString(),
            account: 'default',
            date: new Date().toISOString().split('T')[0],
            currency, type, entryPoint, stopLoss, takeProfit, lotSize,
            status: 'open',
            closePrice: null,
            pnl: 0
        };
        
        // Sauvegarder localement
        const trades = JSON.parse(localStorage.getItem('mobileTrades') || '[]');
        trades.push(trade);
        localStorage.setItem('mobileTrades', JSON.stringify(trades));
        
        hideTradeModal();
        alert('Trade sauvegardé !');
        location.reload();
    }
}

function sendChatMessage() {
    const input = document.getElementById('mobileMessageInput');
    const message = input?.value.trim();
    
    if (!message) {
        console.log('❌ Message vide');
        return;
    }
    
    console.log('📤 Envoi message:', message);
    
    // Utiliser le dashboard mobile si disponible
    if (window.mobileDashboard) {
        window.mobileDashboard.sendChatMessage();
    } else {
        // Fallback simple
        if (input) {
            input.value = '';
        }
        alert('Message envoyé: ' + message);
    }
}

// Fonctions globales pour compatibilité
window.showTradeModal = showTradeModal;
window.hideTradeModal = hideTradeModal;
window.saveTrade = saveTrade;
window.sendChatMessage = sendChatMessage;