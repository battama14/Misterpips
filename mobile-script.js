// Dashboard Mobile Complet avec Firebase - Version Synchronisée PC
class MobileDashboard {
    constructor() {
        this.currentUser = null;
        this.currentAccount = 'default';
        this.trades = [];
        this.accounts = { 'default': { name: 'Compte Principal', capital: 1000 } };
        this.settings = { capital: 1000, riskPerTrade: 2, dailyTarget: 10 };
        this.charts = {};
        this.editingTradeId = null;
        this.init();
    }

    async init() {
        await this.waitForFirebase();
        this.currentUser = sessionStorage.getItem('firebaseUID') || 'demo_' + Date.now();
        await this.loadData();
        this.setupEventListeners();
        this.updateAll();
        this.loadChatMessages();
        this.loadRanking();
        setInterval(() => this.loadRanking(), 30000); // Actualiser classement toutes les 30s
    }

    async waitForFirebase() {
        let attempts = 0;
        while (!window.firebaseDB && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }

    async loadData() {
        try {
            if (window.firebaseDB) {
                const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const userRef = ref(window.firebaseDB, `users/${this.currentUser}`);
                const snapshot = await get(userRef);
                
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    this.trades = data.trades || [];
                    this.accounts = data.accounts || this.accounts;
                    this.settings = { ...this.settings, ...data.settings };
                    this.currentAccount = data.currentAccount || this.currentAccount;
                }
            }
        } catch (error) {
            console.error('Erreur chargement:', error);
        }
    }

    async saveData() {
        try {
            const data = {
                trades: this.trades,
                accounts: this.accounts,
                settings: this.settings,
                currentAccount: this.currentAccount,
                lastUpdated: Date.now(),
                profile: { nickname: this.settings.nickname || 'Mobile User' }
            };

            if (window.firebaseDB) {
                const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const userRef = ref(window.firebaseDB, `users/${this.currentUser}`);
                await set(userRef, data);
                console.log('✅ Données sauvegardées');
            }
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
        }
    }

    updateStats() {
        const accountTrades = this.trades.filter(t => t.account === this.currentAccount);
        const closedTrades = accountTrades.filter(t => t.status === 'closed');
        const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const winRate = closedTrades.length > 0 ? 
            (closedTrades.filter(t => t.pnl > 0).length / closedTrades.length * 100).toFixed(1) : 0;
        const currentCapital = this.accounts[this.currentAccount].capital + totalPnL;

        document.getElementById('mobileCapital').textContent = `$${currentCapital.toFixed(0)}`;
        document.getElementById('mobileWinRate').textContent = `${winRate}%`;
        document.getElementById('mobilePnL').textContent = `$${totalPnL.toFixed(0)}`;
        
        const pnlElement = document.getElementById('mobilePnL');
        pnlElement.className = `stat-value ${totalPnL >= 0 ? 'positive' : 'negative'}`;
    }

    renderTrades() {
        const container = document.getElementById('mobileTradesList');
        const accountTrades = this.trades.filter(t => t.account === this.currentAccount);
        
        if (accountTrades.length === 0) {
            container.innerHTML = '<div class="text-center">Aucun trade pour ce compte</div>';
            return;
        }

        container.innerHTML = accountTrades.map((trade, index) => {
            const pnlClass = (trade.pnl || 0) >= 0 ? 'positive' : 'negative';
            const globalIndex = this.trades.findIndex(t => t.id === trade.id);
            
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
                            <span class="trade-detail-label">Type:</span>
                            <span>${trade.type || 'BUY'}</span>
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
                            <span class="trade-pnl ${pnlClass}">$${(trade.pnl || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="trade-actions">
                        <button class="action-btn edit" onclick="mobileDashboard.editTrade(${globalIndex})">✏️ Modifier</button>
                        ${trade.status === 'open' ? 
                            `<button class="action-btn close" onclick="mobileDashboard.closeTrade(${globalIndex})">🔒 Clôturer</button>` : 
                            `<button class="action-btn close" onclick="mobileDashboard.deleteTrade(${globalIndex})">🗑️ Supprimer</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    updateCharts() {
        this.updatePerformanceChart();
        this.updateWinRateChart();
    }

    updatePerformanceChart() {
        const ctx = document.getElementById('mobilePerformanceChart');
        if (!ctx) return;

        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        const accountTrades = this.trades.filter(t => t.account === this.currentAccount && t.status === 'closed');
        let cumulativePnL = 0;
        const data = accountTrades.map(trade => {
            cumulativePnL += trade.pnl || 0;
            return cumulativePnL;
        });

        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: accountTrades.map((_, i) => `T${i + 1}`),
                datasets: [{
                    data: data,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { 
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    updateWinRateChart() {
        const ctx = document.getElementById('mobileWinRateChart');
        if (!ctx) return;

        if (this.charts.winRate) {
            this.charts.winRate.destroy();
        }

        const accountTrades = this.trades.filter(t => t.account === this.currentAccount && t.status === 'closed');
        const wins = accountTrades.filter(t => (t.pnl || 0) > 0).length;
        const losses = accountTrades.length - wins;

        this.charts.winRate = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [wins, losses],
                    backgroundColor: ['#4ecdc4', '#ff6b6b'],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    async loadRanking() {
        try {
            if (window.firebaseDB) {
                const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const usersRef = ref(window.firebaseDB, 'users');
                const snapshot = await get(usersRef);
                
                if (snapshot.exists()) {
                    const users = snapshot.val();
                    const rankings = this.calculateRankings(users);
                    this.displayRanking(rankings);
                    return;
                }
            }
        } catch (error) {
            console.error('Erreur classement:', error);
        }

        // Fallback avec données demo
        const userTotalPnL = this.trades.filter(t => t.status === 'closed').reduce((sum, t) => sum + (t.pnl || 0), 0);
        const demoRankings = [
            { name: 'Trader Pro', totalPnL: 2500, dailyPnL: 150, trades: 45, winRate: 75 },
            { name: 'Vous', totalPnL: userTotalPnL, dailyPnL: 0, trades: this.trades.length, winRate: 0, isCurrentUser: true }
        ].sort((a, b) => b.totalPnL - a.totalPnL);
        
        this.displayRanking(demoRankings);
    }

    calculateRankings(users) {
        const today = new Date().toISOString().split('T')[0];
        const rankings = [];
        
        for (const [userId, userData] of Object.entries(users)) {
            if (!userData.trades) continue;
            
            const closedTrades = userData.trades.filter(t => t.status === 'closed');
            const todayTrades = closedTrades.filter(t => t.date === today);
            
            const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
            const dailyPnL = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
            const winRate = closedTrades.length > 0 ? 
                (closedTrades.filter(t => t.pnl > 0).length / closedTrades.length * 100) : 0;
            
            rankings.push({
                name: userData.profile?.nickname || userData.email?.split('@')[0] || 'Trader',
                totalPnL,
                dailyPnL,
                trades: closedTrades.length,
                winRate: winRate.toFixed(1),
                isCurrentUser: userId === this.currentUser
            });
        }
        
        return rankings.sort((a, b) => b.totalPnL - a.totalPnL);
    }

    displayRanking(rankings) {
        const container = document.getElementById('mobileRankingList');
        
        container.innerHTML = rankings.map((trader, index) => {
            const totalPnlClass = trader.totalPnL >= 0 ? 'positive' : 'negative';
            const dailyPnlClass = trader.dailyPnL >= 0 ? 'positive' : 'negative';
            
            return `
                <div class="ranking-item ${trader.isCurrentUser ? 'current-user' : ''}">
                    <div class="ranking-position">${index + 1}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${trader.name}${trader.isCurrentUser ? ' (Vous)' : ''}</div>
                        <div class="ranking-trades">${trader.trades} trades - ${trader.winRate}% WR</div>
                        <div class="ranking-daily">Aujourd'hui: <span class="${dailyPnlClass}">$${trader.dailyPnL.toFixed(0)}</span></div>
                    </div>
                    <div class="ranking-pnl ${totalPnlClass}">$${trader.totalPnL.toFixed(0)}</div>
                </div>
            `;
        }).join('');
    }

    async loadChatMessages() {
        try {
            if (window.firebaseDB) {
                const { ref, onValue } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const messagesRef = ref(window.firebaseDB, 'vip_chat_v2');
                
                onValue(messagesRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const messages = snapshot.val();
                        this.displayChatMessages(messages);
                    }
                });
            }
        } catch (error) {
            console.error('Erreur chat:', error);
        }
    }

    displayChatMessages(messages) {
        const container = document.getElementById('mobileMessages');
        if (!container) return;
        
        const messageArray = Object.keys(messages).map(key => ({
            id: key,
            ...messages[key]
        })).sort((a, b) => a.timestamp - b.timestamp).slice(-50);
        
        container.innerHTML = messageArray.map(msg => {
            const isOwn = msg.userId === this.currentUser;
            const time = new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit'
            });
            
            return `
                <div class="chat-message ${isOwn ? 'own' : 'other'}">
                    <div class="message-header">
                        <span class="message-nickname">${msg.nickname}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content">${msg.message}</div>
                </div>
            `;
        }).join('');
        
        container.scrollTop = container.scrollHeight;
    }

    async sendChatMessage() {
        const input = document.getElementById('mobileMessageInput');
        const message = input.value.trim();
        if (!message) return;

        try {
            if (window.firebaseDB) {
                const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const messagesRef = ref(window.firebaseDB, 'vip_chat_v2');
                
                await push(messagesRef, {
                    userId: this.currentUser,
                    nickname: this.settings.nickname || 'Mobile User',
                    message: message,
                    timestamp: Date.now(),
                    date: new Date().toISOString().split('T')[0]
                });
                
                input.value = '';
                // Garder le focus sur l'input pour éviter que le chat se ferme
                setTimeout(() => input.focus(), 100);
            }
        } catch (error) {
            console.error('Erreur envoi message:', error);
        }
    }

    // Gestion des trades
    showTradeModal(editingTrade = null) {
        const modal = document.getElementById('tradeModal');
        const title = document.getElementById('modalTitle');
        
        if (editingTrade) {
            title.textContent = 'Modifier Trade';
            document.getElementById('tradePair').value = editingTrade.currency;
            document.getElementById('tradeType').value = editingTrade.type || 'BUY';
            document.getElementById('tradeLots').value = editingTrade.lotSize;
            document.getElementById('tradeEntry').value = editingTrade.entryPoint;
            document.getElementById('tradeStopLoss').value = editingTrade.stopLoss;
            document.getElementById('tradeTakeProfit').value = editingTrade.takeProfit;
            document.getElementById('tradeStatus').value = editingTrade.status;
            
            if (editingTrade.status === 'closed') {
                document.getElementById('closePriceGroup').style.display = 'block';
                document.getElementById('tradeClosePrice').value = editingTrade.closePrice || '';
            }
            
            this.editingTradeId = editingTrade.id;
        } else {
            title.textContent = 'Nouveau Trade';
            this.editingTradeId = null;
        }
        
        modal.classList.add('show');
    }

    hideTradeModal() {
        document.getElementById('tradeModal').classList.remove('show');
        document.querySelector('#tradeModal form').reset();
        document.getElementById('closePriceGroup').style.display = 'none';
        this.editingTradeId = null;
    }

    async saveTrade() {
        const currency = document.getElementById('tradePair').value;
        const type = document.getElementById('tradeType').value;
        const lotSize = parseFloat(document.getElementById('tradeLots').value);
        const entryPoint = parseFloat(document.getElementById('tradeEntry').value);
        const stopLoss = parseFloat(document.getElementById('tradeStopLoss').value);
        const takeProfit = parseFloat(document.getElementById('tradeTakeProfit').value);
        const status = document.getElementById('tradeStatus').value;
        const closePrice = parseFloat(document.getElementById('tradeClosePrice').value) || null;

        if (!currency || !entryPoint || !stopLoss || !takeProfit || !lotSize) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (this.editingTradeId) {
            // Modification
            const tradeIndex = this.trades.findIndex(t => t.id === this.editingTradeId);
            if (tradeIndex !== -1) {
                this.trades[tradeIndex] = {
                    ...this.trades[tradeIndex],
                    currency, type, lotSize, entryPoint, stopLoss, takeProfit, status,
                    closePrice: status === 'closed' ? closePrice : null,
                    pnl: status === 'closed' ? this.calculatePnL({ currency, type, lotSize, entryPoint, stopLoss, takeProfit, closePrice }) : 0
                };
            }
        } else {
            // Nouveau trade
            const trade = {
                id: Date.now().toString(),
                account: this.currentAccount,
                date: new Date().toISOString().split('T')[0],
                currency, type, entryPoint, stopLoss, takeProfit, lotSize, status,
                closePrice: status === 'closed' ? closePrice : null,
                pnl: status === 'closed' ? this.calculatePnL({ currency, type, lotSize, entryPoint, stopLoss, takeProfit, closePrice }) : 0
            };
            this.trades.push(trade);
        }

        await this.saveData();
        this.hideTradeModal();
        this.updateAll();
    }

    editTrade(index) {
        const trade = this.trades[index];
        if (!trade) return;
        this.showTradeModal(trade);
    }

    async closeTrade(index) {
        const trade = this.trades[index];
        if (!trade) return;
        
        const closePrice = prompt('Prix de fermeture:', trade.takeProfit);
        if (!closePrice) return;
        
        this.trades[index].status = 'closed';
        this.trades[index].closePrice = parseFloat(closePrice);
        this.trades[index].pnl = this.calculatePnL(this.trades[index]);
        
        await this.saveData();
        this.updateAll();
    }

    async deleteTrade(index) {
        const trade = this.trades[index];
        if (!trade || !confirm(`Supprimer le trade ${trade.currency} ?`)) return;
        
        this.trades.splice(index, 1);
        await this.saveData();
        this.updateAll();
    }

    calculatePnL(trade) {
        const entryPoint = parseFloat(trade.entryPoint);
        const closePrice = parseFloat(trade.closePrice) || parseFloat(trade.takeProfit);
        const lotSize = parseFloat(trade.lotSize);
        const type = trade.type || 'BUY';
        
        let priceDiff = closePrice - entryPoint;
        if (type === 'SELL') priceDiff = -priceDiff;
        
        if (trade.currency === 'XAU/USD') {
            return priceDiff * lotSize * 100;
        } else if (trade.currency.includes('JPY')) {
            return (priceDiff * 100) * lotSize * 10;
        } else {
            return (priceDiff * 10000) * lotSize * 10;
        }
    }

    // Gestion des comptes
    updateAccountSelector() {
        const selector = document.getElementById('mobileAccountSelector');
        if (!selector) return;
        
        selector.innerHTML = '';
        Object.keys(this.accounts).forEach(accountId => {
            const option = document.createElement('option');
            option.value = accountId;
            option.textContent = this.accounts[accountId].name;
            option.selected = accountId === this.currentAccount;
            selector.appendChild(option);
        });
    }

    async switchAccount(accountId) {
        if (accountId === this.currentAccount) return;
        
        this.currentAccount = accountId;
        await this.saveData();
        this.updateAll();
    }

    async createNewAccount() {
        const name = prompt('Nom du nouveau compte:');
        if (!name) return;
        
        const capital = parseFloat(prompt('Capital initial ($):')) || 1000;
        const accountId = 'compte_' + Date.now();
        
        this.accounts[accountId] = { name, capital };
        await this.saveData();
        this.updateAccountSelector();
    }

    async deleteCurrentAccount() {
        if (Object.keys(this.accounts).length <= 1) {
            alert('Impossible de supprimer le dernier compte');
            return;
        }
        
        if (!confirm(`Supprimer le compte ${this.accounts[this.currentAccount].name} ?`)) return;
        
        delete this.accounts[this.currentAccount];
        this.trades = this.trades.filter(t => t.account !== this.currentAccount);
        this.currentAccount = Object.keys(this.accounts)[0];
        
        await this.saveData();
        this.updateAccountSelector();
        this.updateAll();
    }

    async saveSettings() {
        this.settings.capital = parseFloat(document.getElementById('mobileCapitalInput').value) || 1000;
        this.settings.riskPerTrade = parseFloat(document.getElementById('mobileRiskInput').value) || 2;
        this.settings.dailyTarget = parseFloat(document.getElementById('mobileDailyObjective').value) || 10;
        this.settings.nickname = document.getElementById('mobileNickname').value || 'Mobile User';
        
        await this.saveData();
        alert('Paramètres sauvegardés !');
    }

    updateAll() {
        this.updateStats();
        this.renderTrades();
        this.updateCharts();
        this.updateAccountSelector();
    }

    setupEventListeners() {
        // Menu
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            document.getElementById('mobileMenu').classList.add('open');
        });
        
        document.getElementById('closeMenu')?.addEventListener('click', () => {
            document.getElementById('mobileMenu').classList.remove('open');
        });

        // Trades
        document.getElementById('newTradeBtn')?.addEventListener('click', () => this.showTradeModal());
        document.getElementById('addTradeBtn')?.addEventListener('click', () => this.showTradeModal());

        // Chat
        document.getElementById('chatToggle')?.addEventListener('click', () => {
            document.getElementById('chatWindow').classList.toggle('show');
        });
        
        document.getElementById('mobileMessageInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendChatMessage();
            }
        });

        // Status change pour afficher/masquer le prix de fermeture
        document.getElementById('tradeStatus')?.addEventListener('change', (e) => {
            const closePriceGroup = document.getElementById('closePriceGroup');
            if (e.target.value === 'closed') {
                closePriceGroup.style.display = 'block';
            } else {
                closePriceGroup.style.display = 'none';
            }
        });
    }
}

// Fonctions globales pour les événements HTML
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(sectionName)?.classList.add('active');
    document.querySelector(`[ontouchend*="${sectionName}"]`)?.classList.add('active');
    
    document.getElementById('mobileMenu')?.classList.remove('open');
}

function toggleMobileChat() {
    document.getElementById('chatWindow').classList.toggle('show');
}

function toggleEmojiPanel() {
    const panel = document.getElementById('mobileEmojiPanel');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function insertEmoji(emoji) {
    const input = document.getElementById('mobileMessageInput');
    input.value += emoji;
    document.getElementById('mobileEmojiPanel').style.display = 'none';
    input.focus();
}

function sendMobileMessage() {
    window.mobileDashboard?.sendChatMessage();
}

function closeMobileModal() {
    window.mobileDashboard?.hideTradeModal();
}

function saveMobileTrade() {
    window.mobileDashboard?.saveTrade();
}

// Initialisation
let mobileDashboard;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        mobileDashboard = new MobileDashboard();
        window.mobileDashboard = mobileDashboard;
    }, 1000);
});