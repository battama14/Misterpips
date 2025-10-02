// Corrections pour le dashboard mobile - Modification des trades et classement VIP

// Extension de la classe MobileTradingDashboard
if (window.MobileTradingDashboard) {
    // Ajouter les méthodes manquantes
    MobileTradingDashboard.prototype.editTrade = function(index) {
        const trade = this.trades[index];
        if (!trade) return;
        
        const modalContent = this.createModalContent();
        
        modalContent.innerHTML = `
            <h2>✏️ Modifier le Trade</h2>
            <div class="trade-form">
                <div class="form-group">
                    <label>Date:</label>
                    <input type="date" id="editDate" value="${trade.date}">
                </div>
                <div class="form-group">
                    <label>Instrument:</label>
                    <select id="editCurrency">
                        <option value="EUR/USD" ${trade.currency === 'EUR/USD' ? 'selected' : ''}>EUR/USD</option>
                        <option value="GBP/USD" ${trade.currency === 'GBP/USD' ? 'selected' : ''}>GBP/USD</option>
                        <option value="USD/JPY" ${trade.currency === 'USD/JPY' ? 'selected' : ''}>USD/JPY</option>
                        <option value="AUD/USD" ${trade.currency === 'AUD/USD' ? 'selected' : ''}>AUD/USD</option>
                        <option value="USD/CAD" ${trade.currency === 'USD/CAD' ? 'selected' : ''}>USD/CAD</option>
                        <option value="XAU/USD" ${trade.currency === 'XAU/USD' ? 'selected' : ''}>XAU/USD (Or)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Point d'entrée:</label>
                    <input type="number" id="editEntryPoint" step="0.00001" value="${trade.entryPoint}">
                </div>
                <div class="form-group">
                    <label>Stop Loss:</label>
                    <input type="number" id="editStopLoss" step="0.00001" value="${trade.stopLoss}">
                </div>
                <div class="form-group">
                    <label>Take Profit:</label>
                    <input type="number" id="editTakeProfit" step="0.00001" value="${trade.takeProfit}">
                </div>
                <div class="form-group">
                    <label>Lot:</label>
                    <input type="number" id="editLotSize" step="0.01" value="${trade.lotSize}">
                </div>
                ${trade.status === 'closed' ? `
                <div class="form-group">
                    <label>Résultat:</label>
                    <select id="editResult">
                        <option value="TP" ${trade.result === 'TP' ? 'selected' : ''}>Take Profit</option>
                        <option value="SL" ${trade.result === 'SL' ? 'selected' : ''}>Stop Loss</option>
                        <option value="BE" ${trade.result === 'BE' ? 'selected' : ''}>Break Even</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>P&L ($):</label>
                    <input type="number" id="editPnL" step="0.01" value="${trade.pnl || 0}">
                </div>
                ` : ''}
                <div class="form-buttons">
                    <button class="btn-submit" onclick="mobileDashboard.saveEditedTrade(${index})">Sauvegarder</button>
                    <button class="btn-secondary" onclick="mobileDashboard.hideEditModal()">Annuler</button>
                </div>
            </div>
        `;
        
        this.showEditModal();
    };
    
    MobileTradingDashboard.prototype.saveEditedTrade = function(index) {
        const trade = this.trades[index];
        if (!trade) return;
        
        const date = document.getElementById('editDate')?.value;
        const currency = document.getElementById('editCurrency')?.value;
        const entryPoint = parseFloat(document.getElementById('editEntryPoint')?.value);
        const stopLoss = parseFloat(document.getElementById('editStopLoss')?.value);
        const takeProfit = parseFloat(document.getElementById('editTakeProfit')?.value);
        const lotSize = parseFloat(document.getElementById('editLotSize')?.value);
        const result = document.getElementById('editResult')?.value;
        const pnl = parseFloat(document.getElementById('editPnL')?.value);

        if (!date || !currency || !entryPoint || !stopLoss || !takeProfit || !lotSize) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        trade.date = date;
        trade.currency = currency;
        trade.entryPoint = entryPoint;
        trade.stopLoss = stopLoss;
        trade.takeProfit = takeProfit;
        trade.lotSize = lotSize;
        
        if (trade.status === 'closed' && result) {
            trade.result = result;
            if (result === 'TP') {
                trade.closePrice = takeProfit;
            } else if (result === 'SL') {
                trade.closePrice = stopLoss;
            } else if (result === 'BE') {
                trade.closePrice = entryPoint;
            }
            trade.pnl = !isNaN(pnl) ? pnl : this.calculatePnL(trade);
        }
        
        trade.modifiedAt = Date.now();
        
        this.saveData();
        this.hideEditModal();
        this.updateAll();
        
        this.showNotification('Trade modifié avec succès!');
    };
    
    MobileTradingDashboard.prototype.closeTrade = function(index) {
        const trade = this.trades[index];
        if (!trade || trade.status === 'closed') return;
        
        const result = prompt('Résultat du trade:\n- TP (Take Profit)\n- SL (Stop Loss)\n- BE (Break Even)', 'TP');
        if (!result) return;
        
        const resultUpper = result.toUpperCase();
        if (!['TP', 'SL', 'BE'].includes(resultUpper)) {
            alert('Résultat invalide. Utilisez TP, SL ou BE');
            return;
        }
        
        trade.result = resultUpper;
        trade.status = 'closed';
        
        if (resultUpper === 'TP') {
            trade.closePrice = trade.takeProfit;
        } else if (resultUpper === 'SL') {
            trade.closePrice = trade.stopLoss;
        } else if (resultUpper === 'BE') {
            trade.closePrice = trade.entryPoint;
        }
        
        trade.pnl = this.calculatePnL(trade);
        trade.closedAt = Date.now();
        
        this.saveData();
        this.updateAll();
        
        this.showNotification(`Trade ${trade.currency} clôturé en ${resultUpper}`);
    };
    
    MobileTradingDashboard.prototype.deleteTrade = function(index) {
        const trade = this.trades[index];
        if (!trade) return;
        
        if (confirm(`Supprimer définitivement le trade ${trade.currency} du ${trade.date} ?`)) {
            this.trades.splice(index, 1);
            this.saveData();
            this.updateAll();
            this.showNotification('Trade supprimé!');
        }
    };
    
    MobileTradingDashboard.prototype.calculatePnL = function(trade) {
        const entryPoint = parseFloat(trade.entryPoint);
        const closePrice = parseFloat(trade.closePrice);
        const lotSize = parseFloat(trade.lotSize);
        const currency = trade.currency;
        
        if (!entryPoint || !closePrice || !lotSize) return 0;
        
        let priceDiff = closePrice - entryPoint;
        
        const isLong = parseFloat(trade.takeProfit) > entryPoint;
        if (!isLong) priceDiff = -priceDiff;
        
        let pnl = 0;
        
        if (currency === 'XAU/USD') {
            pnl = priceDiff * lotSize * 100;
        } else if (currency.includes('JPY')) {
            const pipDiff = priceDiff * 100;
            pnl = pipDiff * lotSize * 10;
        } else {
            const pipDiff = priceDiff * 10000;
            pnl = pipDiff * lotSize * 10;
        }
        
        return parseFloat(pnl.toFixed(2));
    };
    
    MobileTradingDashboard.prototype.createModalContent = function() {
        let modal = document.getElementById('mobileEditModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'mobileEditModal';
            modal.className = 'mobile-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div id="modalContent"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        return document.getElementById('modalContent');
    };
    
    MobileTradingDashboard.prototype.showEditModal = function() {
        const modal = document.getElementById('mobileEditModal');
        if (modal) modal.classList.add('show');
    };
    
    MobileTradingDashboard.prototype.hideEditModal = function() {
        const modal = document.getElementById('mobileEditModal');
        if (modal) modal.classList.remove('show');
    };
    
    // Améliorer la synchronisation avec le classement VIP
    MobileTradingDashboard.prototype.syncWithVipRanking = async function() {
        try {
            if (window.firebaseDB) {
                const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                
                // Calculer les statistiques actuelles
                const closedTrades = this.trades.filter(t => t.status === 'closed');
                const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
                const winRate = closedTrades.length > 0 ? 
                    (closedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length / closedTrades.length * 100) : 0;
                
                const today = new Date().toISOString().split('T')[0];
                const todayTrades = closedTrades.filter(t => t.date === today);
                const dailyPnL = todayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
                
                // Mettre à jour les données utilisateur pour le classement
                const userStatsRef = ref(window.firebaseDB, `users/${this.currentUser}/stats`);
                await set(userStatsRef, {
                    totalPnL,
                    dailyPnL,
                    winRate: winRate.toFixed(1),
                    totalTrades: this.trades.length,
                    closedTrades: closedTrades.length,
                    todayTrades: todayTrades.length,
                    lastUpdated: Date.now()
                });
                
                console.log('📊 Stats synchronisées avec le classement VIP');
            }
        } catch (error) {
            console.error('❌ Erreur sync classement VIP:', error);
        }
    };
    
    // Améliorer le rendu des trades avec boutons d'action
    const originalRenderTrades = MobileTradingDashboard.prototype.renderTrades;
    MobileTradingDashboard.prototype.renderTrades = function() {
        const container = document.getElementById('mobileTradesList');
        const recentTrades = this.trades.slice(-10).reverse();

        container.innerHTML = recentTrades.map((trade, index) => {
            const pnl = parseFloat(trade.pnl || 0);
            const pnlClass = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : '';
            const tradeIndex = this.trades.indexOf(trade);
            
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
                    <div class="trade-actions">
                        <button class="btn-edit" onclick="mobileDashboard.editTrade(${tradeIndex})">✏️ Modifier</button>
                        ${trade.status === 'open' ? 
                            `<button class="btn-close" onclick="mobileDashboard.closeTrade(${tradeIndex})">🔒 Clôturer</button>` : 
                            `<button class="btn-delete" onclick="mobileDashboard.deleteTrade(${tradeIndex})">🗑️ Supprimer</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    };
    
    // Améliorer le classement VIP avec plus de données
    const originalDisplayRanking = MobileTradingDashboard.prototype.displayRanking;
    MobileTradingDashboard.prototype.displayRanking = function(rankings) {
        const container = document.getElementById('mobileRankingList');
        
        container.innerHTML = rankings.map((trader, index) => {
            const isCurrentUser = trader.userId === this.currentUser || trader.name === 'Vous';
            const totalPnlClass = trader.totalPnL > 0 ? 'positive' : trader.totalPnL < 0 ? 'negative' : '';
            const dailyPnlClass = trader.dailyPnL > 0 ? 'positive' : trader.dailyPnL < 0 ? 'negative' : '';
            
            return `
                <div class="ranking-item ${isCurrentUser ? 'current-user' : ''}">
                    <div class="ranking-position">${index + 1}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${trader.name}${isCurrentUser ? ' (Vous)' : ''}</div>
                        <div class="ranking-stats">
                            <span class="ranking-trades">${trader.tradeCount} trades</span>
                            <span class="ranking-winrate">${trader.winRate}% WR</span>
                        </div>
                        <div class="ranking-daily">Aujourd'hui: <span class="${dailyPnlClass}">$${trader.dailyPnL.toFixed(2)}</span></div>
                    </div>
                    <div class="ranking-total ${totalPnlClass}">$${trader.totalPnL.toFixed(0)}</div>
                </div>
            `;
        }).join('');
    };
    
    // Améliorer le calcul du classement
    const originalCalculateRankingsFromData = MobileTradingDashboard.prototype.calculateRankingsFromData;
    MobileTradingDashboard.prototype.calculateRankingsFromData = function(users, dashboards) {
        const today = new Date().toISOString().split('T')[0];
        const rankings = [];
        
        for (const [userId, userData] of Object.entries(users)) {
            if (userData.isVIP) {
                const userDashboard = dashboards[userId];
                let dailyPnL = 0;
                let totalPnL = 0;
                let tradeCount = 0;
                let winRate = 0;
                
                if (userDashboard && userDashboard.trades) {
                    const todayTrades = userDashboard.trades.filter(t => 
                        t.date === today && t.status === 'closed'
                    );
                    const allClosedTrades = userDashboard.trades.filter(t => t.status === 'closed');
                    
                    dailyPnL = todayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
                    totalPnL = allClosedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
                    tradeCount = todayTrades.length;
                    
                    if (allClosedTrades.length > 0) {
                        const winningTrades = allClosedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length;
                        winRate = (winningTrades / allClosedTrades.length * 100).toFixed(1);
                    }
                }
                
                const displayName = userData.nickname || userData.email?.split('@')[0] || 'Membre VIP';
                rankings.push({
                    name: displayName,
                    dailyPnL,
                    totalPnL,
                    tradeCount,
                    winRate,
                    userId
                });
            }
        }
        
        rankings.sort((a, b) => b.totalPnL - a.totalPnL);
        return rankings;
    };
    
    // Améliorer loadRanking avec de meilleures données de démo
    const originalLoadRanking = MobileTradingDashboard.prototype.loadRanking;
    MobileTradingDashboard.prototype.loadRanking = async function() {
        const container = document.getElementById('mobileRankingList');
        
        try {
            if (window.firebaseDB) {
                const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const usersRef = ref(window.firebaseDB, 'users');
                const dashboardsRef = ref(window.firebaseDB, 'dashboards');
                
                const [usersSnapshot, dashboardsSnapshot] = await Promise.all([
                    get(usersRef),
                    get(dashboardsRef)
                ]);
                
                if (usersSnapshot.exists() && dashboardsSnapshot.exists()) {
                    const users = usersSnapshot.val();
                    const dashboards = dashboardsSnapshot.val();
                    const rankings = this.calculateRankingsFromData(users, dashboards);
                    this.displayRanking(rankings);
                    return;
                }
            }
        } catch (error) {
            console.error('Erreur chargement classement:', error);
        }

        // Calculer les données utilisateur actuelles
        const today = new Date().toISOString().split('T')[0];
        const todayTrades = this.trades.filter(t => t.date === today && t.status === 'closed');
        const dailyPnL = todayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const totalPnL = this.trades.filter(t => t.status === 'closed').reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const winRate = this.trades.filter(t => t.status === 'closed').length > 0 ? 
            (this.trades.filter(t => t.status === 'closed' && parseFloat(t.pnl || 0) > 0).length / this.trades.filter(t => t.status === 'closed').length * 100) : 0;
        
        const demoRankings = [
            { name: 'Trader Pro', dailyPnL: 250.50, totalPnL: 2500, tradeCount: 8, winRate: 75, userId: 'demo1' },
            { name: 'Expert FX', dailyPnL: 180.25, totalPnL: 1800, tradeCount: 5, winRate: 80, userId: 'demo2' },
            { name: 'Vous', dailyPnL: dailyPnL, totalPnL: totalPnL, tradeCount: todayTrades.length, winRate: winRate.toFixed(1), userId: this.currentUser },
            { name: 'Master Pips', dailyPnL: -45.30, totalPnL: 950, tradeCount: 15, winRate: 60, userId: 'demo3' },
            { name: 'Gold Trader', dailyPnL: 75.80, totalPnL: 1200, tradeCount: 3, winRate: 85, userId: 'demo4' }
        ].sort((a, b) => b.totalPnL - a.totalPnL);
        
        this.displayRanking(demoRankings);
    };
    
    // Améliorer updateAll pour inclure la synchronisation
    const originalUpdateAll = MobileTradingDashboard.prototype.updateAll;
    MobileTradingDashboard.prototype.updateAll = function() {
        this.updateStats();
        this.renderTrades();
        this.renderCalendar();
        this.updateObjectives();
        this.loadRanking();
        
        setTimeout(() => {
            this.initCharts();
        }, 100);
        
        // Synchroniser avec le classement VIP
        this.syncWithVipRanking();
    };
    
    // Améliorer saveData pour inclure la synchronisation
    const originalSaveData = MobileTradingDashboard.prototype.saveData;
    MobileTradingDashboard.prototype.saveData = async function() {
        try {
            const data = {
                trades: this.trades,
                settings: this.settings,
                lastUpdated: new Date().toISOString()
            };

            localStorage.setItem(`dashboard_${this.currentUser}`, JSON.stringify(data));
            console.log('💾 Données sauvegardées en localStorage');

            if (window.firebaseDB) {
                const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const userRef = ref(window.firebaseDB, `dashboards/${this.currentUser}`);
                await set(userRef, data);
                console.log('☁️ Données synchronisées avec Firebase');
                
                // Synchroniser avec le classement VIP
                await this.syncWithVipRanking();
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde Firebase:', error);
        }
    };
}

// Styles CSS pour les nouvelles fonctionnalités
const mobileFixesStyles = document.createElement('style');
mobileFixesStyles.textContent = `
    .trade-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .btn-edit, .btn-close, .btn-delete {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .btn-edit {
        background: linear-gradient(45deg, #00d4ff, #5b86e5);
        color: white;
    }
    
    .btn-close {
        background: linear-gradient(45deg, #4ecdc4, #44a08d);
        color: white;
    }
    
    .btn-delete {
        background: linear-gradient(45deg, #ff6b6b, #ee5a52);
        color: white;
    }
    
    .btn-edit:hover, .btn-close:hover, .btn-delete:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    .mobile-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        backdrop-filter: blur(10px);
    }
    
    .mobile-modal.show {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .mobile-modal .modal-content {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-radius: 15px;
        padding: 20px;
        max-width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        color: white;
    }
    
    .mobile-modal .form-group {
        margin-bottom: 15px;
    }
    
    .mobile-modal label {
        display: block;
        margin-bottom: 5px;
        color: #00d4ff;
        font-weight: bold;
    }
    
    .mobile-modal input, .mobile-modal select {
        width: 100%;
        padding: 10px;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        background: rgba(255,255,255,0.1);
        color: white;
        font-size: 16px;
    }
    
    .mobile-modal .form-buttons {
        display: flex;
        gap: 10px;
        margin-top: 20px;
    }
    
    .mobile-modal .btn-submit, .mobile-modal .btn-secondary {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
    }
    
    .mobile-modal .btn-submit {
        background: linear-gradient(45deg, #4ecdc4, #44a08d);
        color: white;
    }
    
    .mobile-modal .btn-secondary {
        background: linear-gradient(45deg, #6c757d, #5a6268);
        color: white;
    }
    
    .ranking-stats {
        display: flex;
        gap: 10px;
        font-size: 11px;
        color: #888;
        margin-top: 2px;
    }
    
    .ranking-daily {
        font-size: 11px;
        margin-top: 2px;
        color: #ccc;
    }
    
    .ranking-total {
        font-weight: bold;
        font-size: 14px;
    }
    
    .ranking-item.current-user {
        background: linear-gradient(45deg, rgba(0, 212, 255, 0.1), rgba(91, 134, 229, 0.1));
        border: 1px solid rgba(0, 212, 255, 0.3);
    }
`;
document.head.appendChild(mobileFixesStyles);

console.log('🔧 Corrections mobile appliquées - Modification des trades et classement VIP amélioré');