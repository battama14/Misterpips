// Version simple sans conflits SES
console.log('📱 Mobile simple chargé');

var mobileData = {
    trades: [],
    capital: 1000
};

function initMobileSimple() {
    console.log('🚀 Init mobile simple');
    
    // Menu
    var menuToggle = document.getElementById('menuToggle');
    var mobileMenu = document.getElementById('mobileMenu');
    var closeMenu = document.getElementById('closeMenu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.onclick = function() {
            mobileMenu.classList.add('open');
        };
    }
    
    if (closeMenu && mobileMenu) {
        closeMenu.onclick = function() {
            mobileMenu.classList.remove('open');
        };
    }
    
    // Boutons trade
    var newTradeBtn = document.getElementById('newTradeBtn');
    var addTradeBtn = document.getElementById('addTradeBtn');
    
    if (newTradeBtn) {
        newTradeBtn.onclick = function() {
            showSimpleModal();
        };
    }
    
    if (addTradeBtn) {
        addTradeBtn.onclick = function() {
            showSimpleModal();
        };
    }
    
    // Navigation
    var navBtns = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < navBtns.length; i++) {
        navBtns[i].onclick = function() {
            for (var j = 0; j < navBtns.length; j++) {
                navBtns[j].classList.remove('active');
            }
            this.classList.add('active');
        };
    }
    
    loadMobileData();
    updateMobileStats();
}

function showSimpleModal() {
    var modal = document.getElementById('mobileTradeModal');
    if (modal) {
        modal.classList.add('show');
    } else {
        // Créer modal simple
        var simpleModal = document.createElement('div');
        simpleModal.innerHTML = '<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;"><div style="background: #1a1a2e; padding: 20px; border-radius: 10px; width: 100%; max-width: 400px;"><h3 style="color: #00d4ff;">Nouveau Trade</h3><div style="margin: 15px 0;"><label style="color: #00d4ff; display: block;">Paire:</label><select id="simplePair" style="width: 100%; padding: 10px; background: #333; color: white; border: 1px solid #00d4ff; border-radius: 5px;"><option>EUR/USD</option><option>GBP/USD</option><option>USD/JPY</option><option>XAU/USD</option></select></div><div style="margin: 15px 0;"><label style="color: #00d4ff; display: block;">Entrée:</label><input type="number" id="simpleEntry" step="0.00001" style="width: 100%; padding: 10px; background: #333; color: white; border: 1px solid #00d4ff; border-radius: 5px;"></div><div style="display: flex; gap: 10px; margin-top: 20px;"><button onclick="saveSimpleTrade()" style="flex: 1; background: #00d4ff; color: white; border: none; padding: 12px; border-radius: 5px;">💾 Sauvegarder</button><button onclick="closeSimpleModal()" style="flex: 1; background: #ff6b6b; color: white; border: none; padding: 12px; border-radius: 5px;">❌ Fermer</button></div></div></div>';
        simpleModal.id = 'simpleModal';
        document.body.appendChild(simpleModal);
    }
}

function saveSimpleTrade() {
    var pair = document.getElementById('simplePair') ? document.getElementById('simplePair').value : 'EUR/USD';
    var entry = document.getElementById('simpleEntry') ? document.getElementById('simpleEntry').value : '1.0000';
    
    var trade = {
        id: Date.now(),
        pair: pair,
        entry: parseFloat(entry),
        status: 'open',
        date: new Date().toISOString().split('T')[0],
        pnl: 0
    };
    
    mobileData.trades.push(trade);
    saveMobileData();
    closeSimpleModal();
    updateMobileStats();
    updateTradesList();
    showMobileNotification('Trade ajouté !');
}

function closeSimpleModal() {
    var modal = document.getElementById('simpleModal');
    if (modal) {
        modal.remove();
    }
    var originalModal = document.getElementById('mobileTradeModal');
    if (originalModal) {
        originalModal.classList.remove('show');
    }
}

function loadMobileData() {
    try {
        var saved = localStorage.getItem('mobile_data_simple');
        if (saved) {
            mobileData = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Erreur chargement:', error);
    }
}

function saveMobileData() {
    try {
        localStorage.setItem('mobile_data_simple', JSON.stringify(mobileData));
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
    }
}

function updateMobileStats() {
    var closedTrades = mobileData.trades.filter(function(t) { return t.status === 'closed'; });
    var totalPnL = closedTrades.reduce(function(sum, t) { return sum + (t.pnl || 0); }, 0);
    var winRate = closedTrades.length > 0 ? (closedTrades.filter(function(t) { return (t.pnl || 0) > 0; }).length / closedTrades.length * 100) : 0;
    var currentCapital = mobileData.capital + totalPnL;
    
    var capitalEl = document.getElementById('mobileCapital');
    var winRateEl = document.getElementById('mobileWinRate');
    var pnlEl = document.getElementById('mobilePnL');
    
    if (capitalEl) capitalEl.textContent = '$' + currentCapital.toFixed(2);
    if (winRateEl) winRateEl.textContent = winRate.toFixed(1) + '%';
    if (pnlEl) {
        pnlEl.textContent = '$' + totalPnL.toFixed(2);
        pnlEl.className = totalPnL >= 0 ? 'stat-value positive' : 'stat-value negative';
    }
}

function updateTradesList() {
    var container = document.getElementById('mobileTradesList');
    if (!container) return;
    
    if (mobileData.trades.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;"><div style="font-size: 48px; margin-bottom: 20px;">📈</div><h3>Aucun trade</h3><p>Commencez par ajouter votre premier trade</p></div>';
        return;
    }
    
    var recentTrades = mobileData.trades.slice(-10).reverse();
    var html = '';
    for (var i = 0; i < recentTrades.length; i++) {
        var trade = recentTrades[i];
        var pnl = parseFloat(trade.pnl || 0);
        var pnlClass = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : '';
        
        html += '<div class="trade-card">';
        html += '<div class="trade-header">';
        html += '<span class="trade-pair">' + trade.pair + '</span>';
        html += '<span class="trade-status ' + trade.status + '">' + trade.status.toUpperCase() + '</span>';
        html += '</div>';
        html += '<div class="trade-details">';
        html += '<div class="trade-detail"><span class="trade-detail-label">Date:</span><span>' + trade.date + '</span></div>';
        html += '<div class="trade-detail"><span class="trade-detail-label">Entrée:</span><span>' + trade.entry + '</span></div>';
        html += '<div class="trade-detail"><span class="trade-detail-label">P&L:</span><span class="trade-pnl ' + pnlClass + '">$' + pnl.toFixed(2) + '</span></div>';
        html += '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function showMobileNotification(message) {
    var notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(0, 212, 255, 0.9); color: white; padding: 12px 20px; border-radius: 25px; z-index: 10000; font-weight: bold;';
    document.body.appendChild(notification);
    
    setTimeout(function() {
        document.body.removeChild(notification);
    }, 2000);
}

function showMobileSection(sectionId) {
    var sections = document.querySelectorAll('.section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.remove('active');
    }
    
    var targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    var navBtns = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < navBtns.length; i++) {
        navBtns[i].classList.remove('active');
    }
    
    var mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.remove('open');
    }
}

// Fonctions globales
window.showSection = showMobileSection;
window.saveSimpleTrade = saveSimpleTrade;
window.closeSimpleModal = closeSimpleModal;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        initMobileSimple();
    }, 100);
});

console.log('✅ Mobile simple prêt');