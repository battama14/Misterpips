// Mobile Trades - Persistance Firebase
let mobileData = {
    trades: [],
    currentUser: null
};

// Attendre Firebase avec toutes les fonctions
async function waitForFirebase() {
    let attempts = 0;
    while ((!window.firebaseDB || !window.dbRef || !window.dbGet) && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        
        // Forcer l'import des fonctions Firebase si manquantes
        if (window.firebaseDB && !window.dbRef) {
            try {
                const { ref, get, set, onValue, push } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                window.dbRef = ref;
                window.dbGet = get;
                window.dbSet = set;
                window.onValue = onValue;
                window.push = push;
                console.log('🔥 Fonctions Firebase importées manuellement');
            } catch (error) {
                console.error('Erreur import Firebase:', error);
            }
        }
    }
}

// Charger les trades
async function loadMobileTrades() {
    try {
        await waitForFirebase();
        
        mobileData.currentUser = sessionStorage.getItem('firebaseUID');
        if (!mobileData.currentUser) return;
        
        const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
        const userRef = ref(window.firebaseDB, `dashboards/${mobileData.currentUser}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            mobileData.trades = data.trades || [];
            window.mobileTradesData = mobileData.trades;
            console.log('✅ Trades chargés:', mobileData.trades.length);
        }
        
        updateMobileTradesList();
        updateMobileStats();
        updateMobileCalendar();
        loadMobileRanking();
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
    }
}

// Sauvegarder les trades
async function saveMobileTrades() {
    try {
        if (!mobileData.currentUser || !window.firebaseDB) return;
        
        const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
        
        const data = {
            trades: mobileData.trades,
            lastUpdated: Date.now()
        };
        
        const userRef = ref(window.firebaseDB, `dashboards/${mobileData.currentUser}`);
        await set(userRef, data);
        
        console.log('✅ Trades sauvegardés:', mobileData.trades.length);
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
    }
}

// Ajouter un trade
async function addMobileTrade() {
    const pair = document.getElementById('tradePair')?.value;
    const type = document.getElementById('tradeType')?.value;
    const lot = parseFloat(document.getElementById('tradeLot')?.value);
    const entry = parseFloat(document.getElementById('tradeEntry')?.value);
    const sl = parseFloat(document.getElementById('tradeStopLoss')?.value);
    const tp = parseFloat(document.getElementById('tradeTakeProfit')?.value);
    
    if (!pair || !entry || !sl || !tp) {
        alert('Remplissez tous les champs');
        return;
    }
    
    const trade = {
        id: Date.now().toString(),
        currency: pair,
        type: type,
        lotSize: lot,
        entryPoint: entry,
        stopLoss: sl,
        takeProfit: tp,
        status: 'open',
        date: new Date().toISOString().split('T')[0],
        pnl: 0
    };
    
    mobileData.trades.push(trade);
    window.mobileTradesData = mobileData.trades;
    
    await saveMobileTrades();
    updateMobileTradesList();
    updateMobileStats();
    closeMobileModal();
}

// Fermer un trade
async function closeTrade(index, result) {
    const trade = mobileData.trades[index];
    if (!trade || trade.status !== 'open') return;
    
    let closePrice;
    if (result === 'tp') closePrice = trade.takeProfit;
    else if (result === 'sl') closePrice = trade.stopLoss;
    else if (result === 'be') closePrice = trade.entryPoint;
    
    trade.status = 'closed';
    trade.closePrice = closePrice;
    trade.result = result.toUpperCase();
    trade.pnl = calculatePnL(trade);
    trade.closeDate = new Date().toISOString().split('T')[0];
    
    window.mobileTradesData = mobileData.trades;
    
    await saveMobileTrades();
    updateMobileTradesList();
    updateMobileStats();
    updateMobileCalendar();
}

// Calculer P&L
function calculatePnL(trade) {
    const entry = parseFloat(trade.entryPoint);
    const close = parseFloat(trade.closePrice);
    const lots = parseFloat(trade.lotSize);
    
    let diff = close - entry;
    if (trade.type === 'SELL') diff = -diff;
    
    if (trade.currency === 'XAU/USD') {
        return diff * lots * 100;
    } else if (trade.currency.includes('JPY')) {
        return (diff * 100) * lots * 10;
    } else {
        return (diff * 10000) * lots * 10;
    }
}

// Supprimer un trade
async function deleteTrade(index) {
    if (!confirm('Supprimer ce trade ?')) return;
    
    mobileData.trades.splice(index, 1);
    window.mobileTradesData = mobileData.trades;
    
    await saveMobileTrades();
    updateMobileTradesList();
    updateMobileStats();
    
    // Mettre à jour le calendrier
    if (window.updateMobileCalendar) {
        window.updateMobileCalendar();
    }
}

// Mettre à jour l'affichage
function updateMobileTradesList() {
    const container = document.getElementById('mobileTradesList');
    if (!container) return;
    
    if (mobileData.trades.length === 0) {
        container.innerHTML = '<div class="no-trades">Aucun trade</div>';
        return;
    }
    
    container.innerHTML = mobileData.trades.map((trade, index) => `
        <div class="trade-item ${trade.status}">
            <div class="trade-header">
                <span class="trade-pair">${trade.currency}</span>
                <span class="trade-status ${trade.status}">${trade.status === 'open' ? 'OUVERT' : 'FERMÉ'}</span>
            </div>
            <div class="trade-details">
                <div class="trade-detail-item">
                    <span class="trade-detail-label">Date:</span>
                    <span class="trade-detail-value">${trade.date}</span>
                </div>
                <div class="trade-detail-item">
                    <span class="trade-detail-label">Type:</span>
                    <span class="trade-detail-value">${trade.type}</span>
                </div>
                <div class="trade-detail-item">
                    <span class="trade-detail-label">Lots:</span>
                    <span class="trade-detail-value">${trade.lotSize}</span>
                </div>
                <div class="trade-detail-item">
                    <span class="trade-detail-label">Entrée:</span>
                    <span class="trade-detail-value">${trade.entryPoint}</span>
                </div>
                <div class="trade-detail-item">
                    <span class="trade-detail-label">SL:</span>
                    <span class="trade-detail-value">${trade.stopLoss}</span>
                </div>
                <div class="trade-detail-item">
                    <span class="trade-detail-label">TP:</span>
                    <span class="trade-detail-value">${trade.takeProfit}</span>
                </div>
            </div>
            ${trade.status === 'closed' ? `
                <div class="trade-pnl ${trade.pnl >= 0 ? 'positive' : 'negative'}">
                    P&L: ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}
                </div>
            ` : ''}
            <div class="trade-actions">
                ${trade.status === 'open' ? `
                    <button class="btn-tp" onclick="closeTrade(${index}, 'tp')">TP</button>
                    <button class="btn-sl" onclick="closeTrade(${index}, 'sl')">SL</button>
                    <button class="btn-be" onclick="closeTrade(${index}, 'be')">BE</button>
                ` : ''}
                <button class="btn-delete" onclick="deleteTrade(${index})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function updateMobileStats() {
    const totalPnL = mobileData.trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const closedTrades = mobileData.trades.filter(t => t.status === 'closed');
    const winTrades = closedTrades.filter(t => t.pnl > 0);
    const lossTrades = closedTrades.filter(t => t.pnl < 0);
    const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length * 100) : 0;
    
    // Stats header
    document.getElementById('mobilePnL').textContent = `$${totalPnL.toFixed(0)}`;
    document.getElementById('mobileWinRate').textContent = `${winRate.toFixed(1)}%`;
    document.getElementById('mobileCapital').textContent = `$${(1000 + totalPnL).toFixed(0)}`;
    
    // Stats dashboard
    document.getElementById('totalTrades').textContent = mobileData.trades.length;
    document.getElementById('winningTrades').textContent = winTrades.length;
    
    const losingTradesEl = document.getElementById('losingTrades');
    const riskRewardEl = document.getElementById('riskReward');
    
    if (losingTradesEl) losingTradesEl.textContent = lossTrades.length;
    if (riskRewardEl) {
        const avgWin = winTrades.length > 0 ? winTrades.reduce((sum, t) => sum + t.pnl, 0) / winTrades.length : 0;
        const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((sum, t) => sum + t.pnl, 0) / lossTrades.length) : 0;
        const rr = avgLoss > 0 ? (avgWin / avgLoss).toFixed(1) : '1';
        riskRewardEl.textContent = `1:${rr}`;
    }
    
    // Mettre à jour les objectifs
    if (window.updateObjectives) {
        window.updateObjectives();
    }
    
    // Mettre à jour les graphiques dashboard
    updateDashboardCharts();
}

// Modal
function showTradeModal() {
    document.getElementById('tradeModal').style.display = 'block';
}

function closeMobileModal() {
    document.getElementById('tradeModal').style.display = 'none';
}

// Mettre à jour les graphiques dashboard
function updateDashboardCharts() {
    const totalPnL = mobileData.trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const closedTrades = mobileData.trades.filter(t => t.status === 'closed');
    const winTrades = closedTrades.filter(t => t.pnl > 0);
    const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length * 100) : 0;
    
    // Dernier trade fermé
    const lastClosedTrade = closedTrades.length > 0 ? closedTrades[closedTrades.length - 1] : null;
    
    // Graphique Performance
    const chartCapital = document.getElementById('chartCapital');
    const chartLastPnL = document.getElementById('chartLastPnL');
    
    if (chartCapital) {
        chartCapital.textContent = `$${(1000 + totalPnL).toFixed(0)}`;
        chartCapital.className = `chart-value ${totalPnL >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Afficher le dernier P&L
    if (chartLastPnL && lastClosedTrade) {
        const pnl = lastClosedTrade.pnl || 0;
        const sign = pnl >= 0 ? '+' : '';
        chartLastPnL.textContent = `${sign}$${pnl.toFixed(0)}`;
        chartLastPnL.className = `chart-pnl ${pnl >= 0 ? 'positive' : 'negative'}`;
        chartLastPnL.style.display = 'block';
    } else if (chartLastPnL) {
        chartLastPnL.style.display = 'none';
    }
    
    // Graphique WinRate
    const chartWinRate = document.getElementById('chartWinRate');
    const chartWins = document.getElementById('chartWins');
    const chartLosses = document.getElementById('chartLosses');
    const winrateCircle = document.querySelector('.winrate-circle');
    
    if (chartWinRate) {
        chartWinRate.textContent = `${winRate.toFixed(0)}%`;
    }
    
    if (chartWins) {
        chartWins.textContent = `${winTrades.length} Gains`;
    }
    
    if (chartLosses) {
        chartLosses.textContent = `${closedTrades.length - winTrades.length} Pertes`;
    }
    
    // Mettre à jour le cercle de progression
    if (winrateCircle) {
        const angle = (winRate / 100) * 360;
        winrateCircle.style.background = `conic-gradient(#4ecdc4 0deg, #4ecdc4 ${angle}deg, #333 ${angle}deg, #333 360deg)`;
    }
}

// Animation P&L
function showPnLAnimation(pnl) {
    const chartLastPnL = document.getElementById('chartLastPnL');
    if (chartLastPnL && pnl !== 0) {
        const sign = pnl >= 0 ? '+' : '';
        chartLastPnL.textContent = `${sign}$${pnl.toFixed(0)}`;
        chartLastPnL.className = `chart-pnl ${pnl >= 0 ? 'positive' : 'negative'}`;
        chartLastPnL.style.display = 'block';
        chartLastPnL.style.animation = 'pnlPulse 2s ease-in-out';
        
        // Supprimer l'animation après
        setTimeout(() => {
            if (chartLastPnL) {
                chartLastPnL.style.animation = '';
            }
        }, 2000);
    }
}

// Modal PC Style pour mobile
function showTradeModal() {
    const modal = document.getElementById('tradeModal');
    const modalContent = document.getElementById('modalContent');
    
    if (modalContent) {
        modalContent.innerHTML = `
            <h2>Nouveau Trade</h2>
            <div class="trade-form">
                <div class="form-group">
                    <label>Instrument:</label>
                    <select id="currency">
                        <option value="EUR/USD">EUR/USD</option>
                        <option value="GBP/USD">GBP/USD</option>
                        <option value="USD/JPY">USD/JPY</option>
                        <option value="AUD/USD">AUD/USD</option>
                        <option value="USD/CAD">USD/CAD</option>
                        <option value="XAU/USD">XAU/USD (Or)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Point d'entrée:</label>
                    <input type="number" id="entryPoint" step="0.00001" value="1.12345" required>
                </div>
                <div class="form-group">
                    <label>Stop Loss:</label>
                    <input type="number" id="stopLoss" step="0.00001" value="1.12000" required>
                </div>
                <div class="form-group">
                    <label>Take Profit:</label>
                    <input type="number" id="takeProfit" step="0.00001" value="1.13000" required>
                </div>
                <div class="form-group">
                    <label>Lot:</label>
                    <input type="number" id="lotSize" step="0.01" value="0.10" required>
                </div>
                <div class="form-buttons">
                    <button class="btn-submit" onclick="saveMobileTrade()">Enregistrer Trade</button>
                    <button class="btn-secondary" onclick="closeMobileModal()">Annuler</button>
                </div>
            </div>
        `;
    }
    
    if (modal) {
        modal.style.display = 'flex';
    }
}

function saveMobileTrade() {
    const currency = document.getElementById('currency')?.value;
    const entryPoint = parseFloat(document.getElementById('entryPoint')?.value);
    const stopLoss = parseFloat(document.getElementById('stopLoss')?.value);
    const takeProfit = parseFloat(document.getElementById('takeProfit')?.value);
    const lotSize = parseFloat(document.getElementById('lotSize')?.value);

    if (!currency || isNaN(entryPoint) || isNaN(stopLoss) || isNaN(takeProfit) || isNaN(lotSize)) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    const trade = {
        id: Date.now().toString(),
        currency: currency,
        entryPoint: entryPoint,
        stopLoss: stopLoss,
        takeProfit: takeProfit,
        lotSize: lotSize,
        status: 'open',
        date: new Date().toISOString().split('T')[0],
        pnl: 0
    };
    
    mobileData.trades.push(trade);
    window.mobileTradesData = mobileData.trades;
    
    saveMobileTrades();
    updateMobileTradesList();
    updateMobileStats();
    
    if (window.updateMobileCalendar) {
        window.updateMobileCalendar();
    }
    
    closeMobileModal();
}

// Fonction calendrier mobile
function updateMobileCalendar() {
    const calendar = document.getElementById('mobileCalendar');
    const monthYear = document.getElementById('monthYearMobile');
    
    if (!calendar || !monthYear) return;
    
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    monthYear.textContent = `${months[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let html = '<div class="calendar-grid">';
    
    // Jours de la semaine
    const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    dayNames.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Jours vides au début
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Vérifier si mobileData.trades existe
        const trades = mobileData && mobileData.trades ? mobileData.trades : [];
        const dayTrades = trades.filter(trade => 
            (trade.closeDate === dateStr || trade.date === dateStr) && trade.status === 'closed'
        );
        const dayPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
        
        let dayClass = 'calendar-day';
        if (dayTrades.length > 0) {
            dayClass += dayPnL > 0 ? ' profit-day' : dayPnL < 0 ? ' loss-day' : ' be-day';
        }
        
        html += `
            <div class="${dayClass}">
                <div class="calendar-date">${day}</div>
                ${dayTrades.length > 0 ? `
                    <div class="calendar-pnl">${dayPnL > 0 ? '+' : ''}$${dayPnL.toFixed(0)}</div>
                    <div class="calendar-trades">${dayTrades.length} trade${dayTrades.length > 1 ? 's' : ''}</div>
                ` : ''}
            </div>
        `;
    }
    
    html += '</div>';
    calendar.innerHTML = html;
}

// Fonction classement VIP mobile - COPIE EXACTE DU PC
async function loadMobileRanking() {
    const rankingContainer = document.getElementById('mobileRankingList');
    if (!rankingContainer) {
        console.log('Container mobileRankingList non trouvé');
        return;
    }
    
    try {
        await waitForFirebase();
        
        if (!window.firebaseDB || !window.dbRef || !window.dbGet) {
            rankingContainer.innerHTML = '<div class="no-ranking">Firebase non disponible</div>';
            return;
        }
        
        console.log('🏆 Lancement classement Mobile...');
        
        // Récupérer tous les utilisateurs VIP
        const usersRef = window.dbRef(window.firebaseDB, 'users');
        const usersSnapshot = await window.dbGet(usersRef);
        
        if (!usersSnapshot.exists()) {
            rankingContainer.innerHTML = '<div class="no-ranking">Aucun utilisateur trouvé</div>';
            return;
        }
        
        const users = usersSnapshot.val();
        const vipUsers = Object.entries(users).filter(([uid, userData]) => 
            userData.isVIP || userData.plan === 'VIP'
        );
        
        console.log(`${vipUsers.length} utilisateurs VIP trouvés`);
        
        // Même méthode que la version PC
        const today = new Date().toISOString().split('T')[0];
        const rankings = [];
        
        for (const [uid, userData] of vipUsers) {
            let userTrades = []; // Toujours initialiser comme array
            
            // Chercher dans dashboards
            try {
                const dashboardRef = window.dbRef(window.firebaseDB, `dashboards/${uid}/trades`);
                const dashboardSnapshot = await window.dbGet(dashboardRef);
                if (dashboardSnapshot.exists()) {
                    const trades = dashboardSnapshot.val();
                    if (Array.isArray(trades)) {
                        userTrades = trades;
                    }
                }
            } catch (error) {}
            
            // Chercher aussi dans users/accounts
            try {
                const userAccountsRef = window.dbRef(window.firebaseDB, `users/${uid}/accounts`);
                const accountsSnapshot = await window.dbGet(userAccountsRef);
                if (accountsSnapshot.exists()) {
                    const accounts = accountsSnapshot.val();
                    Object.values(accounts).forEach(account => {
                        if (account.trades && Array.isArray(account.trades)) {
                            userTrades = userTrades.concat(account.trades);
                        }
                    });
                }
            } catch (error) {}
            
            // S'assurer que userTrades est toujours un array
            if (!Array.isArray(userTrades)) {
                userTrades = [];
            }
            
            // Calculer P&L du jour
            const todayTrades = userTrades.filter(trade => 
                trade && trade.date === today && trade.status === 'closed'
            );
            const dailyPnL = todayTrades.reduce((sum, trade) => 
                sum + (parseFloat(trade.pnl) || 0), 0
            );
            
            // Récupérer le pseudo
            let nickname = userData.displayName || userData.email?.split('@')[0] || 'Trader VIP';
            try {
                const nicknameRef = window.dbRef(window.firebaseDB, `users/${uid}/nickname`);
                const nicknameSnapshot = await window.dbGet(nicknameRef);
                if (nicknameSnapshot.exists()) {
                    nickname = nicknameSnapshot.val();
                }
            } catch (error) {}
            
            rankings.push({
                uid,
                name: nickname,
                dailyPnL,
                todayTrades: todayTrades.length,
                totalTrades: userTrades.length
            });
            
            console.log(`${nickname}: ${todayTrades.length} trades aujourd'hui, $${dailyPnL}`);
        }
        
        // Trier par P&L
        rankings.sort((a, b) => b.dailyPnL - a.dailyPnL);
        
        console.log('Classement final Mobile:', rankings.map(r => `${r.name}: $${r.dailyPnL}`));
        
        // Afficher avec le même format que PC
        displayMobileRanking(rankings);
        
    } catch (error) {
        console.error('❌ Erreur classement mobile:', error);
        rankingContainer.innerHTML = '<div class="no-ranking">Erreur de chargement</div>';
    }
}

function displayMobileRanking(rankings) {
    const container = document.getElementById('mobileRankingList');
    if (!container) {
        console.error('❌ Container mobileRankingList non trouvé');
        return;
    }
    
    console.log('📊 Affichage classement mobile:', rankings ? rankings.length : 0, 'traders');
    
    if (!rankings || rankings.length === 0) {
        container.innerHTML = '<div class="no-ranking">🏆 Aucun trade aujourd\'hui<br><small>Fermez des trades pour apparaître dans le classement</small></div>';
        return;
    }
    
    // Format identique au PC
    let html = '<div class="ranking-header"><h4>🏆 Classement VIP</h4></div>';
    
    rankings.forEach((user, index) => {
        const position = index + 1;
        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
        
        html += `
            <div class="ranking-item">
                <div class="ranking-position">${medal}</div>
                <div class="ranking-info">
                    <div class="trader-name">${user.name}</div>
                    <div class="trader-stats">${user.todayTrades} trades aujourd'hui</div>
                </div>
                <div class="ranking-pnl ${user.dailyPnL >= 0 ? 'positive' : 'negative'}">
                    $${user.dailyPnL.toFixed(2)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    console.log('✅ Classement mobile affiché');
}

// Configuration Firebase temps réel (copié du PC)
async function setupRealtimeSync() {
    if (!window.firebaseDB || !window.currentUser) return;
    
    try {
        const { ref, onValue, off } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
        
        // Écouter les changements en temps réel
        const userRef = ref(window.firebaseDB, `dashboards/${window.currentUser}`);
        
        const unsubscribe = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const remoteVersion = data.version || 0;
                const localVersion = Date.now();
                
                // Éviter les boucles infinies
                if (Math.abs(remoteVersion - localVersion) > 5000) {
                    console.log('🔄 Synchronisation détectée');
                    mobileData.trades = data.trades || [];
                    window.mobileTradesData = mobileData.trades;
                    
                    updateMobileTradesList();
                    updateMobileStats();
                    updateMobileCalendar();
                    loadMobileRanking();
                }
            }
        });
        
        // Sauvegarder la fonction de désabonnement
        window.mobileUnsubscribe = unsubscribe;
        
        console.log('✅ Synchronisation temps réel activée');
    } catch (error) {
        console.error('❌ Erreur sync temps réel:', error);
    }
}

// Sauvegarde avec structure PC complète
async function saveMobileDataComplete() {
    if (!window.firebaseDB || !window.currentUser) return;
    
    try {
        const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
        
        const dataToSave = {
            trades: mobileData.trades,
            settings: {
                capital: 1000,
                riskPerTrade: 2,
                dailyTarget: 1,
                weeklyTarget: 3,
                monthlyTarget: 15,
                yearlyTarget: 200
            },
            accounts: {
                compte1: {
                    name: 'Compte Principal',
                    capital: 1000,
                    trades: mobileData.trades
                }
            },
            currentAccount: 'compte1',
            lastUpdated: new Date().toISOString(),
            version: Date.now()
        };
        
        // Sauvegarder dans dashboards
        const dashboardRef = ref(window.firebaseDB, `dashboards/${window.currentUser}`);
        await set(dashboardRef, dataToSave);
        
        // Sauvegarder dans users pour classement VIP
        const userRef = ref(window.firebaseDB, `users/${window.currentUser}`);
        await set(userRef, {
            isVIP: true,
            plan: 'VIP',
            email: sessionStorage.getItem('userEmail') || 'user@example.com',
            displayName: sessionStorage.getItem('userEmail')?.split('@')[0] || 'Trader',
            nickname: sessionStorage.getItem('userEmail')?.split('@')[0] || 'Trader',
            accounts: {
                compte1: {
                    trades: mobileData.trades,
                    capital: 1000,
                    settings: dataToSave.settings
                }
            },
            lastUpdated: new Date().toISOString()
        });
        
        console.log('✅ Sauvegarde complète Firebase OK');
    } catch (error) {
        console.error('❌ Erreur sauvegarde complète:', error);
    }
}

// Remplacer la fonction de sauvegarde simple
window.saveMobileTrades = saveMobileDataComplete;
window.setupRealtimeSync = setupRealtimeSync;

// Exposer les fonctions
window.addMobileTrade = saveMobileTrade;
window.closeTrade = closeTrade;
window.deleteTrade = deleteTrade;
window.showTradeModal = showTradeModal;
window.closeMobileModal = closeMobileModal;
window.updateDashboardCharts = updateDashboardCharts;
window.showPnLAnimation = showPnLAnimation;
window.saveMobileTrade = saveMobileTrade;
window.updateMobileCalendar = updateMobileCalendar;
window.loadMobileRanking = loadMobileRanking;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le calendrier immédiatement
    updateMobileCalendar();
    
    // Attendre Firebase puis charger le classement
    waitForFirebase().then(() => {
        setTimeout(() => {
            loadMobileRanking();
        }, 1000);
    });
    
    setTimeout(() => {
        if (sessionStorage.getItem('firebaseUID')) {
            loadMobileTrades();
            
            // Activer la synchronisation temps réel
            setTimeout(() => {
                if (window.setupRealtimeSync) {
                    window.setupRealtimeSync();
                }
            }, 3000);
        }
    }, 1000);
    
    // Events
    document.getElementById('newTradeBtn')?.addEventListener('click', showTradeModal);
    document.getElementById('addTradeBtn')?.addEventListener('click', showTradeModal);
    
    // Sauvegarde automatique toutes les 30 secondes
    setInterval(() => {
        if (window.saveMobileTrades) {
            window.saveMobileTrades();
        }
    }, 30000);
    
    // Recharger le classement toutes les 30 secondes
    setInterval(() => {
        loadMobileRanking();
    }, 30000);
});

// Sauvegarde avant fermeture
window.addEventListener('beforeunload', () => {
    if (window.saveMobileDataComplete) {
        window.saveMobileDataComplete();
    }
});

// Nettoyage lors de la fermeture
window.addEventListener('beforeunload', () => {
    if (window.mobileUnsubscribe) {
        window.mobileUnsubscribe();
    }
});