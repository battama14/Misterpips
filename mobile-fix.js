// Correction mobile pour Misterpips-Optimized
console.log('🔧 Correction mobile en cours...');

// Forcer l'initialisation des boutons
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM chargé, correction en cours...');
    
    // Attendre que les éléments soient disponibles
    setTimeout(() => {
        initMobileFix();
    }, 100);
});

function initMobileFix() {
    console.log('🚀 Initialisation des corrections mobile...');
    
    // Corriger le menu mobile
    fixMobileMenu();
    
    // Corriger les boutons de trade
    fixTradeButtons();
    
    // Corriger la navigation
    fixNavigation();
    
    // Corriger les stats
    fixStats();
    
    // Corriger le chat
    fixChat();
    
    console.log('✅ Corrections mobile appliquées');
}

function fixMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMenu = document.getElementById('closeMenu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.onclick = function() {
            console.log('📱 Menu ouvert');
            mobileMenu.classList.add('open');
        };
        
        menuToggle.addEventListener('touchstart', function(e) {
            e.preventDefault();
            mobileMenu.classList.add('open');
        });
    }
    
    if (closeMenu && mobileMenu) {
        closeMenu.onclick = function() {
            console.log('📱 Menu fermé');
            mobileMenu.classList.remove('open');
        };
    }
    
    // Fermer en touchant ailleurs
    document.addEventListener('click', function(e) {
        if (mobileMenu && menuToggle && 
            !mobileMenu.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            mobileMenu.classList.remove('open');
        }
    });
}

function fixTradeButtons() {
    const newTradeBtn = document.getElementById('newTradeBtn');
    const addTradeBtn = document.getElementById('addTradeBtn');
    const closeTradeModal = document.getElementById('closeTradeModal');
    const saveMobileTradeBtn = document.getElementById('saveMobileTradeBtn');
    
    if (newTradeBtn) {
        newTradeBtn.onclick = function() {
            console.log('➕ Nouveau trade');
            showTradeModal();
        };
        newTradeBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            showTradeModal();
        });
    }
    
    if (addTradeBtn) {
        addTradeBtn.onclick = function() {
            console.log('➕ Ajouter trade');
            showTradeModal();
        };
    }
    
    if (closeTradeModal) {
        closeTradeModal.onclick = function() {
            hideTradeModal();
        };
    }
    
    if (saveMobileTradeBtn) {
        saveMobileTradeBtn.onclick = function() {
            saveMobileTrade();
        };
    }
}

function showTradeModal() {
    const modal = document.getElementById('mobileTradeModal');
    if (modal) {
        modal.classList.add('show');
        console.log('📝 Modal trade affichée');
    }
}

function hideTradeModal() {
    const modal = document.getElementById('mobileTradeModal');
    if (modal) {
        modal.classList.remove('show');
        // Réinitialiser le formulaire
        const form = document.getElementById('mobileTradeForm');
        if (form) form.reset();
    }
}

function saveMobileTrade() {
    const currency = document.getElementById('mobileCurrency')?.value || 'EUR/USD';
    const entryPoint = document.getElementById('mobileEntryPoint')?.value || '1.0000';
    const stopLoss = document.getElementById('mobileStopLoss')?.value || '0.9950';
    const takeProfit = document.getElementById('mobileTakeProfit')?.value || '1.0050';
    const lotSize = document.getElementById('mobileLotSize')?.value || '0.1';
    
    const trade = {
        id: Date.now(),
        currency: currency,
        entryPoint: parseFloat(entryPoint),
        stopLoss: parseFloat(stopLoss),
        takeProfit: parseFloat(takeProfit),
        lotSize: parseFloat(lotSize),
        status: 'open',
        date: new Date().toISOString().split('T')[0],
        pnl: 0
    };
    
    // Sauvegarder en localStorage
    let trades = [];
    try {
        const saved = localStorage.getItem('mobile_trades_optimized');
        if (saved) {
            trades = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Erreur chargement trades:', error);
    }
    
    trades.push(trade);
    localStorage.setItem('mobile_trades_optimized', JSON.stringify(trades));
    
    console.log('✅ Trade sauvegardé:', trade);
    hideTradeModal();
    updateMobileDisplay();
    showNotification('Trade ajouté avec succès !');
}

function fixNavigation() {
    // Corriger la navigation bottom
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Retirer active de tous les boutons
            navBtns.forEach(b => b.classList.remove('active'));
            // Ajouter active au bouton cliqué
            this.classList.add('active');
        });
        
        // Support tactile
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.click();
        });
    });
}

function fixStats() {
    // Mettre à jour les stats avec des données de base
    updateMobileStats();
    
    // Mettre à jour périodiquement
    setInterval(updateMobileStats, 5000);
}

function updateMobileStats() {
    try {
        const saved = localStorage.getItem('mobile_trades_optimized');
        const trades = saved ? JSON.parse(saved) : [];
        
        const closedTrades = trades.filter(t => t.status === 'closed');
        const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const winRate = closedTrades.length > 0 ? 
            (closedTrades.filter(t => (t.pnl || 0) > 0).length / closedTrades.length * 100) : 0;
        const currentCapital = 1000 + totalPnL;
        
        // Mettre à jour l'affichage
        const capitalEl = document.getElementById('mobileCapital');
        const winRateEl = document.getElementById('mobileWinRate');
        const pnlEl = document.getElementById('mobilePnL');
        
        if (capitalEl) capitalEl.textContent = `$${currentCapital.toFixed(2)}`;
        if (winRateEl) winRateEl.textContent = `${winRate.toFixed(1)}%`;
        if (pnlEl) {
            pnlEl.textContent = `$${totalPnL.toFixed(2)}`;
            pnlEl.className = `stat-value ${totalPnL >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Mettre à jour la liste des trades
        updateTradesList(trades);
        
    } catch (error) {
        console.error('Erreur mise à jour stats:', error);
    }
}

function updateTradesList(trades) {
    const container = document.getElementById('mobileTradesList');
    if (!container) return;
    
    if (trades.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #888;">
                <div style="font-size: 48px; margin-bottom: 20px;">📈</div>
                <h3>Aucun trade</h3>
                <p>Commencez par ajouter votre premier trade</p>
            </div>
        `;
        return;
    }
    
    const recentTrades = trades.slice(-10).reverse();
    container.innerHTML = recentTrades.map(trade => {
        const pnl = parseFloat(trade.pnl || 0);
        const pnlClass = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : '';
        
        return `
            <div class="trade-card">
                <div class="trade-header">
                    <span class="trade-pair">${trade.currency}</span>
                    <span class="trade-status ${trade.status}">${trade.status.toUpperCase()}</span>
                </div>
                <div class="trade-details">
                    <div class="trade-detail">
                        <span class="trade-detail-label">Date:</span>
                        <span>${trade.date}</span>
                    </div>
                    <div class="trade-detail">
                        <span class="trade-detail-label">Entrée:</span>
                        <span>${trade.entryPoint}</span>
                    </div>
                    <div class="trade-detail">
                        <span class="trade-detail-label">Lot:</span>
                        <span>${trade.lotSize}</span>
                    </div>
                    <div class="trade-detail">
                        <span class="trade-detail-label">P&L:</span>
                        <span class="trade-pnl ${pnlClass}">$${pnl.toFixed(2)}</span>
                    </div>
                </div>
                ${trade.status === 'open' ? `
                    <div class="trade-actions">
                        <button class="action-btn close" onclick="closeTrade(${trade.id})">🔒 Clôturer</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function closeTrade(tradeId) {
    const result = prompt('Résultat (TP/SL/BE):', 'TP');
    if (!result) return;
    
    try {
        const saved = localStorage.getItem('mobile_trades_optimized');
        let trades = saved ? JSON.parse(saved) : [];
        
        const trade = trades.find(t => t.id === tradeId);
        if (trade) {
            trade.status = 'closed';
            trade.result = result.toUpperCase();
            
            // Calculer P&L simple
            if (result.toUpperCase() === 'TP') {
                trade.pnl = Math.abs(trade.takeProfit - trade.entryPoint) * trade.lotSize * 100;
            } else if (result.toUpperCase() === 'SL') {
                trade.pnl = -Math.abs(trade.entryPoint - trade.stopLoss) * trade.lotSize * 100;
            } else {
                trade.pnl = 0;
            }
            
            localStorage.setItem('mobile_trades_optimized', JSON.stringify(trades));
            updateMobileDisplay();
            showNotification(`Trade clôturé en ${result}`);
        }
    } catch (error) {
        console.error('Erreur clôture trade:', error);
    }
}

function fixChat() {
    const chatToggle = document.getElementById('mobileChatToggle');
    const chatWindow = document.getElementById('mobileChatWindow');
    const closeChat = document.getElementById('closeMobileChat');
    const sendBtn = document.getElementById('sendMobileMessage');
    const chatInput = document.getElementById('mobileChatInput');
    
    if (chatToggle && chatWindow) {
        chatToggle.onclick = function() {
            chatWindow.classList.toggle('show');
        };
    }
    
    if (closeChat && chatWindow) {
        closeChat.onclick = function() {
            chatWindow.classList.remove('show');
        };
    }
    
    if (sendBtn) {
        sendBtn.onclick = function() {
            sendChatMessage();
        };
    }
    
    if (chatInput) {
        chatInput.onkeypress = function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        };
    }
}

function sendChatMessage() {
    const input = document.getElementById('mobileChatInput');
    const message = input?.value?.trim();
    
    if (message) {
        const messagesContainer = document.getElementById('mobileChatMessages');
        if (messagesContainer) {
            const messageEl = document.createElement('div');
            messageEl.className = 'chat-message own';
            messageEl.innerHTML = `
                <div class="message-header">
                    <span class="message-nickname">Vous</span>
                    <span class="message-time">${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</span>
                </div>
                <div class="message-content">${message}</div>
            `;
            messagesContainer.appendChild(messageEl);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        if (input) input.value = '';
        showNotification('Message envoyé !');
    }
}

function updateMobileDisplay() {
    updateMobileStats();
    // Autres mises à jour...
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(45deg, #00d4ff, #5b86e5);
        color: white;
        padding: 15px 20px;
        border-radius: 25px;
        z-index: 9999;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Fonction globale pour la navigation
window.showSection = function(sectionId) {
    console.log('🔄 Navigation vers:', sectionId);
    
    // Masquer toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('✅ Section affichée:', sectionId);
    }
    
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[onclick*="${sectionId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Fermer le menu mobile
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.remove('open');
    }
};

// Fonction globale pour clôturer un trade
window.closeTrade = closeTrade;

// Debug
window.debugMobileOptimized = function() {
    console.log('=== DEBUG MOBILE OPTIMIZED ===');
    console.log('Trades:', localStorage.getItem('mobile_trades_optimized'));
    console.log('Elements:');
    console.log('- menuToggle:', !!document.getElementById('menuToggle'));
    console.log('- newTradeBtn:', !!document.getElementById('newTradeBtn'));
    console.log('- mobileTradesList:', !!document.getElementById('mobileTradesList'));
    console.log('===============================');
};

console.log('✅ Script de correction mobile optimized chargé');