// Dashboard Mobile Complet avec Firebase
class MobileDashboard {
    constructor() {
        this.currentUser = null;
        this.currentAccount = 'compte1';
        this.trades = [];
        this.accounts = {
            'compte1': { name: 'Compte Principal', capital: 1000 }
        };
        this.settings = { capital: 1000, riskPerTrade: 2, dailyTarget: 1 };
        this.charts = {};
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
                const userRef = ref(window.firebaseDB, `dashboards/${this.currentUser}`);
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
                lastUpdated: Date.now()
            };

            if (window.firebaseDB) {
                const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const userRef = ref(window.firebaseDB, `dashboards/${this.currentUser}`);
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
                            <span class="trade-pnl ${pnlClass}">$${(trade.pnl || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="trade-actions">
                        <button class="action-btn edit" onclick="mobileDashboard.editTrade(${index})">✏️ Modifier</button>
                        ${trade.status === 'open' ? 
                            `<button class="action-btn close" onclick="mobileDashboard.closeTrade(${index})">🔒 Clôturer</button>` : 
                            `<button class="action-btn close" onclick="mobileDashboard.deleteTrade(${index})">🗑️ Supprimer</button>`
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
        const container = document.getElementById('mobileRankingList');
        
        try {
            if (window.firebaseDB) {
                const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const dashboardsRef = ref(window.firebaseDB, 'dashboards');
                const usersRef = ref(window.firebaseDB, 'users');
                
                const [dashboardsSnapshot, usersSnapshot] = await Promise.all([
                    get(dashboardsRef),
                    get(usersRef)
                ]);
                
                if (dashboardsSnapshot.exists() && usersSnapshot.exists()) {
                    const dashboards = dashboardsSnapshot.val();
                    const users = usersSnapshot.val();
                    const rankings = this.calculateRankings(dashboards, users);
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
            { name: 'Vous', totalPnL: userTotalPnL, dailyPnL: 0, trades: this.trades.length, winRate: 0, isCurrentUser: true },
            { name: 'Expert FX', totalPnL: 1800, dailyPnL: 80, trades: 32, winRate: 80 }
        ].sort((a, b) => b.totalPnL - a.totalPnL);
        
        this.displayRanking(demoRankings);
    }

    calculateRankings(dashboards, users) {
        const today = new Date().toISOString().split('T')[0];
        const rankings = [];
        
        for (const [userId, dashboard] of Object.entries(dashboards)) {
            const user = users[userId];
            if (!user || !dashboard.trades) continue;
            
            const closedTrades = dashboard.trades.filter(t => t.status === 'closed');
            const todayTrades = closedTrades.filter(t => t.date === today);
            
            const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
            const dailyPnL = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
            const winRate = closedTrades.length > 0 ? 
                (closedTrades.filter(t => t.pnl > 0).length / closedTrades.length * 100) : 0;
            
            rankings.push({
                name: user.profile?.nickname || user.email?.split('@')[0] || 'Trader',
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
        const container = document.getElementById('mobileChatMessages');
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
        const input = document.getElementById('mobileChatInput');
        const message = input.value.trim();
        if (!message) return;

        try {
            if (window.firebaseDB) {
                const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const messagesRef = ref(window.firebaseDB, 'vip_chat_v2');
                
                await push(messagesRef, {
                    userId: this.currentUser,
                    nickname: 'Mobile User',
                    message: message,
                    timestamp: Date.now(),
                    date: new Date().toISOString().split('T')[0]
                });
                
                input.value = '';
            }
        } catch (error) {
            console.error('Erreur envoi message:', error);
        }
    }

    // Gestion des trades
    showTradeModal() {
        document.getElementById('mobileTradeModal').classList.add('show');
    }

    hideTradeModal() {
        document.getElementById('mobileTradeModal').classList.remove('show');
        document.getElementById('mobileTradeForm').reset();
    }

    async saveTrade() {
        const currency = document.getElementById('mobileCurrency').value;
        const entryPoint = parseFloat(document.getElementById('mobileEntryPoint').value);
        const stopLoss = parseFloat(document.getElementById('mobileStopLoss').value);
        const takeProfit = parseFloat(document.getElementById('mobileTakeProfit').value);
        const lotSize = parseFloat(document.getElementById('mobileLotSize').value);

        if (!currency || !entryPoint || !stopLoss || !takeProfit || !lotSize) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        const trade = {
            id: Date.now().toString(),
            account: this.currentAccount,
            date: new Date().toISOString().split('T')[0],
            currency,
            entryPoint,
            stopLoss,
            takeProfit,
            lotSize,
            status: 'open',
            pnl: 0
        };

        this.trades.push(trade);
        await this.saveData();
        this.hideTradeModal();
        this.updateAll();
    }

    editTrade(index) {
        const accountTrades = this.trades.filter(t => t.account === this.currentAccount);
        const trade = accountTrades[index];
        if (!trade) return;
        
        document.getElementById('mobileCurrency').value = trade.currency;
        document.getElementById('mobileEntryPoint').value = trade.entryPoint;
        document.getElementById('mobileStopLoss').value = trade.stopLoss;
        document.getElementById('mobileTakeProfit').value = trade.takeProfit;
        document.getElementById('mobileLotSize').value = trade.lotSize;
        
        this.editingTradeId = trade.id;
        this.showTradeModal();
    }

    async closeTrade(index) {
        const accountTrades = this.trades.filter(t => t.account === this.currentAccount);
        const trade = accountTrades[index];
        if (!trade) return;
        
        const result = prompt('Résultat (TP/SL/BE):', 'TP');
        if (!result) return;
        
        const tradeIndex = this.trades.findIndex(t => t.id === trade.id);
        this.trades[tradeIndex].status = 'closed';
        this.trades[tradeIndex].result = result.toUpperCase();
        this.trades[tradeIndex].pnl = this.calculatePnL(this.trades[tradeIndex], result);
        
        await this.saveData();
        this.updateAll();
    }

    async deleteTrade(index) {
        const accountTrades = this.trades.filter(t => t.account === this.currentAccount);
        const trade = accountTrades[index];
        if (!trade || !confirm(`Supprimer le trade ${trade.currency} ?`)) return;
        
        const tradeIndex = this.trades.findIndex(t => t.id === trade.id);
        this.trades.splice(tradeIndex, 1);
        
        await this.saveData();
        this.updateAll();
    }

    calculatePnL(trade, result) {
        const entryPoint = parseFloat(trade.entryPoint);
        const lotSize = parseFloat(trade.lotSize);
        let closePrice;
        
        if (result === 'TP') closePrice = parseFloat(trade.takeProfit);
        else if (result === 'SL') closePrice = parseFloat(trade.stopLoss);
        else closePrice = entryPoint; // BE
        
        const priceDiff = closePrice - entryPoint;
        const isLong = parseFloat(trade.takeProfit) > entryPoint;
        const finalDiff = isLong ? priceDiff : -priceDiff;
        
        if (trade.currency === 'XAU/USD') {
            return finalDiff * lotSize * 100;
        } else if (trade.currency.includes('JPY')) {
            return (finalDiff * 100) * lotSize * 10;
        } else {
            return (finalDiff * 10000) * lotSize * 10;
        }
    }

    // Gestion des comptes
    updateAccountSelector() {
        const selector = document.getElementById('mobileAccountSelect');
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

    async addAccount() {
        const name = prompt('Nom du nouveau compte:');
        if (!name) return;
        
        const capital = parseFloat(prompt('Capital initial ($):')) || 1000;
        const accountId = 'compte' + (Object.keys(this.accounts).length + 1);
        
        this.accounts[accountId] = { name, capital };
        await this.saveData();
        this.updateAccountSelector();
    }

    async deleteAccount() {
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
        document.getElementById('closeTradeModal')?.addEventListener('click', () => this.hideTradeModal());
        document.getElementById('saveMobileTradeBtn')?.addEventListener('click', () => this.saveTrade());

        // Chat
        document.getElementById('mobileChatToggle')?.addEventListener('click', () => {
            document.getElementById('mobileChatWindow').classList.toggle('show');
        });
        
        document.getElementById('closeMobileChat')?.addEventListener('click', () => {
            document.getElementById('mobileChatWindow').classList.remove('show');
        });
        
        document.getElementById('sendMobileMessage')?.addEventListener('click', () => this.sendChatMessage());
        
        document.getElementById('mobileChatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });

        // Comptes
        document.getElementById('mobileAccountSelect')?.addEventListener('change', (e) => {
            this.switchAccount(e.target.value);
        });
        
        document.getElementById('mobileAddAccountBtn')?.addEventListener('click', () => this.addAccount());
        document.getElementById('mobileDeleteAccountBtn')?.addEventListener('click', () => this.deleteAccount());
        
        // Emoji
        document.getElementById('mobileEmojiBtn')?.addEventListener('click', () => {
            const panel = document.getElementById('mobileEmojiPanel');
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        });
        
        document.querySelectorAll('.emoji-item').forEach(emoji => {
            emoji.addEventListener('click', () => {
                const input = document.getElementById('mobileChatInput');
                input.value += emoji.textContent;
                document.getElementById('mobileEmojiPanel').style.display = 'none';
                input.focus();
            });
        });
    }
}

// Initialisation
let mobileDashboard;
window.mobileDashboard = mobileDashboard;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        mobileDashboard = new MobileDashboard();
        window.mobileDashboard = mobileDashboard;
    }, 1000);
});