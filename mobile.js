// Dashboard Mobile - Version corrigée
class MobileTradingDashboard {
    constructor() {
        this.currentUser = sessionStorage.getItem('firebaseUID');
        this.currentAccount = 'compte1';
        this.trades = [];
        this.settings = { 
            capital: 1000, 
            riskPerTrade: 2,
            dailyTarget: 1,
            weeklyTarget: 3,
            monthlyTarget: 15
        };
        this.accounts = {
            'compte1': { name: 'Compte Principal', capital: 1000 },
            'compte2': { name: 'Compte Démo', capital: 500 },
            'compte3': { name: 'Compte Swing', capital: 2000 }
        };
        this.currentCalendarDate = new Date();
        this.init();
    }

    async init() {
        // Initialiser le gestionnaire de pseudo
        await window.nicknameManager.initialize();
        await window.nicknameManager.ensureNickname();
        
        await this.loadData();
        this.setupEventListeners();
        this.updateAccountDisplay();
        this.updateStats();
        this.renderTrades();
        this.renderCalendar();
        this.updateObjectives();
        this.initCharts();
        this.loadRanking();
        this.loadChatMessages();
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
                    this.settings = { ...this.settings, ...data.settings };
                    this.accounts = data.accounts || this.accounts;
                    this.currentAccount = data.currentAccount || this.currentAccount;
                    console.log('📱 Données chargées depuis Firebase:', this.trades.length, 'trades');
                    return;
                }
            }
            
            const savedData = localStorage.getItem(`dashboard_${this.currentUser}`);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.trades = data.trades || [];
                this.settings = { ...this.settings, ...data.settings };
                this.accounts = data.accounts || this.accounts;
                this.currentAccount = data.currentAccount || this.currentAccount;
                console.log('📱 Données chargées depuis localStorage:', this.trades.length, 'trades');
            }
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
        }
    }

    async saveData() {
        try {
            const data = {
                trades: this.trades,
                settings: this.settings,
                accounts: this.accounts,
                currentAccount: this.currentAccount,
                lastUpdated: new Date().toISOString()
            };

            localStorage.setItem(`dashboard_${this.currentUser}`, JSON.stringify(data));
            console.log('💾 Données sauvegardées en localStorage');

            if (window.firebaseDB) {
                const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const userRef = ref(window.firebaseDB, `dashboards/${this.currentUser}`);
                await set(userRef, data);
                console.log('☁️ Données synchronisées avec Firebase');
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde Firebase:', error);
        }
    }

    updateStats() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const winRate = closedTrades.length > 0 ? 
            (closedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length / closedTrades.length * 100).toFixed(1) : 0;
        const initialCapital = this.accounts[this.currentAccount]?.capital || this.settings.capital;
        const currentCapital = initialCapital + totalPnL;

        document.getElementById('mobileCapital').textContent = `$${currentCapital.toFixed(2)}`;
        document.getElementById('mobileWinRate').textContent = `${winRate}%`;
        document.getElementById('mobilePnL').textContent = `$${totalPnL.toFixed(2)}`;
        
        const pnlElement = document.getElementById('mobilePnL');
        pnlElement.className = totalPnL >= 0 ? 'stat-value positive' : 'stat-value negative';
    }

    renderTrades() {
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
    }

    renderCalendar() {
        const container = document.getElementById('mobileCalendar');
        const monthYear = document.getElementById('monthYearMobile');
        
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        
        monthYear.textContent = new Intl.DateTimeFormat('fr-FR', { 
            month: 'long', 
            year: 'numeric' 
        }).format(this.currentCalendarDate);

        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let html = '';
        
        ['D', 'L', 'M', 'M', 'J', 'V', 'S'].forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dateStr = currentDate.getFullYear() + '-' + 
                String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                String(currentDate.getDate()).padStart(2, '0');
            
            const dayTrades = this.trades.filter(t => t.date === dateStr && t.status === 'closed');
            const dayPnL = dayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
            
            let dayClass = 'calendar-day';
            if (currentDate.getMonth() !== month) dayClass += ' other-month';
            if (dayTrades.length > 0) {
                dayClass += ' has-trades';
                if (dayPnL > 0) dayClass += ' profit-day';
                else if (dayPnL < 0) dayClass += ' loss-day';
            }

            html += `
                <div class="${dayClass}">
                    <div class="calendar-date">${currentDate.getDate()}</div>
                    ${dayTrades.length > 0 ? `<div class="calendar-pnl">$${dayPnL.toFixed(0)}</div>` : ''}
                </div>
            `;
        }

        container.innerHTML = html;
    }

    updateObjectives() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const initialCapital = this.accounts[this.currentAccount]?.capital || this.settings.capital;
        const currentCapital = initialCapital + totalPnL;

        const dailyTarget = (currentCapital * this.settings.dailyTarget / 100);
        const weeklyTarget = (currentCapital * this.settings.weeklyTarget / 100);
        const monthlyTarget = (currentCapital * this.settings.monthlyTarget / 100);

        const today = new Date().toISOString().split('T')[0];
        const todayTrades = this.trades.filter(t => t.date === today && t.status === 'closed');
        const todayPnL = todayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);

        const dailyProgress = dailyTarget > 0 ? Math.min((todayPnL / dailyTarget) * 100, 100) : 0;

        document.getElementById('mobileDailyTarget').textContent = `$${dailyTarget.toFixed(0)}`;
        document.getElementById('mobileWeeklyTarget').textContent = `$${weeklyTarget.toFixed(0)}`;
        document.getElementById('mobileMonthlyTarget').textContent = `$${monthlyTarget.toFixed(0)}`;

        document.getElementById('mobileDailyProgress').style.width = `${dailyProgress}%`;
        document.getElementById('mobileDailyPercent').textContent = `${dailyProgress.toFixed(1)}%`;
    }

    initCharts() {
        this.initPerformanceChart();
        this.initWinRateChart();
    }

    initPerformanceChart() {
        const ctx = document.getElementById('mobilePerformanceChart');
        if (!ctx) return;

        const closedTrades = this.trades.filter(t => t.status === 'closed');
        let cumulativePnL = 0;
        const data = closedTrades.map(trade => {
            cumulativePnL += parseFloat(trade.pnl || 0);
            return cumulativePnL;
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: closedTrades.map((_, i) => `T${i + 1}`),
                datasets: [{
                    data: data,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 2,
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
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) { return '$' + value; }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    initWinRateChart() {
        const ctx = document.getElementById('mobileWinRateChart');
        if (!ctx) return;

        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const wins = closedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length;
        const losses = closedTrades.length - wins;

        new Chart(ctx, {
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
        
        const userNickname = window.nicknameManager.getNickname() || 'Vous';
        
        const demoRankings = [
            { name: 'Trader Pro', dailyPnL: 250.50, totalPnL: 2500, tradeCount: 8, winRate: 75, userId: 'demo1' },
            { name: 'Expert FX', dailyPnL: 180.25, totalPnL: 1800, tradeCount: 5, winRate: 80, userId: 'demo2' },
            { name: userNickname, dailyPnL: dailyPnL, totalPnL: totalPnL, tradeCount: todayTrades.length, winRate: winRate.toFixed(1), userId: this.currentUser },
            { name: 'Master Pips', dailyPnL: -45.30, totalPnL: 950, tradeCount: 15, winRate: 60, userId: 'demo3' },
            { name: 'Gold Trader', dailyPnL: 75.80, totalPnL: 1200, tradeCount: 3, winRate: 85, userId: 'demo4' }
        ].sort((a, b) => b.totalPnL - a.totalPnL);
        
        this.displayRanking(demoRankings);
    }

    calculateRankingsFromData(users, dashboards) {
        const today = new Date().toISOString().split('T')[0];
        const rankings = [];
        
        for (const [userId, userData] of Object.entries(users)) {
            const userDashboard = dashboards[userId];
            let dailyPnL = 0;
            let totalPnL = 0;
            let tradeCount = 0;
            let winRate = 0;
            
            if (userDashboard && userDashboard.trades) {
                const todayTrades = userDashboard.trades.filter(t => 
                    t.date === today && t.status === 'closed'
                );
                const closedTrades = userDashboard.trades.filter(t => t.status === 'closed');
                
                dailyPnL = todayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
                totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
                tradeCount = todayTrades.length;
                
                if (closedTrades.length > 0) {
                    const winningTrades = closedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length;
                    winRate = (winningTrades / closedTrades.length * 100).toFixed(1);
                }
            }
            
            const displayName = userData.profile?.nickname || userData.email?.split('@')[0] || 'Membre VIP';
            rankings.push({
                name: displayName,
                dailyPnL,
                totalPnL,
                tradeCount,
                winRate,
                userId
            });
        }
        
        rankings.sort((a, b) => b.totalPnL - a.totalPnL);
        return rankings;
    }

    displayRanking(rankings) {
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
            console.error('Erreur chargement chat:', error);
        }
    }

    displayChatMessages(messages) {
        const container = document.getElementById('mobileChatMessages');
        if (!container) return;
        
        const messageArray = Object.keys(messages).map(key => ({
            id: key,
            ...messages[key]
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        const recentMessages = messageArray.slice(-50);
        
        container.innerHTML = recentMessages.map(msg => {
            const isOwn = msg.userId === this.currentUser;
            const time = new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
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
            id: `${this.currentUser}_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            currency,
            entryPoint,
            stopLoss,
            takeProfit,
            lotSize,
            riskPercent: this.settings.riskPerTrade,
            status: 'open',
            createdAt: Date.now()
        };

        this.trades.push(trade);
        await this.saveData();
        this.hideTradeModal();
        this.updateAll();
        this.showNotification('Trade ajouté !');
    }

    async saveSettings() {
        this.settings.capital = parseFloat(document.getElementById('mobileCapitalInput').value) || 1000;
        this.settings.riskPerTrade = parseFloat(document.getElementById('mobileRiskInput').value) || 2;
        this.settings.dailyTarget = parseFloat(document.getElementById('mobileDailyTargetInput').value) || 1;
        
        await this.saveData();
        this.updateAll();
        this.showNotification('Paramètres sauvegardés !');
    }

    async sendChatMessage() {
        const input = document.getElementById('mobileChatInput');
        const message = input.value.trim();
        if (!message) return;

        try {
            if (window.firebaseDB) {
                const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const messagesRef = ref(window.firebaseDB, 'vip_chat_v2');
                
                const nickname = window.nicknameManager.getNickname() || 'Mobile User';
                
                await push(messagesRef, {
                    userId: this.currentUser,
                    nickname: nickname,
                    message: message,
                    timestamp: Date.now(),
                    date: new Date().toISOString().split('T')[0]
                });
                
                input.value = '';
                this.showNotification('Message envoyé !');
                
                setTimeout(() => {
                    const container = document.getElementById('mobileChatMessages');
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                }, 100);
            } else {
                this.showNotification('Chat non disponible (Firebase déconnecté)');
            }
        } catch (error) {
            console.error('Erreur envoi message:', error);
            this.showNotification('Erreur envoi message');
        }
    }

    updateAll() {
        this.updateStats();
        this.renderTrades();
        this.renderCalendar();
        this.updateObjectives();
        this.loadRanking();
        
        setTimeout(() => {
            this.initCharts();
        }, 100);
    }

    updateAccountDisplay() {
        // Mettre à jour les deux sélecteurs de compte
        const selectors = [
            document.querySelector('.mobile-header #mobileAccountSelect'),
            document.querySelector('#settings #mobileAccountSelect')
        ];
        
        selectors.forEach(accountSelect => {
            if (accountSelect) {
                accountSelect.innerHTML = '';
                Object.keys(this.accounts).forEach(accountId => {
                    const option = document.createElement('option');
                    option.value = accountId;
                    option.textContent = this.accounts[accountId].name;
                    if (accountId === this.currentAccount) {
                        option.selected = true;
                    }
                    accountSelect.appendChild(option);
                });
            }
        });
    }
    
    switchAccount(accountId) {
        if (!accountId || accountId === this.currentAccount) return;
        
        if (this.accounts[this.currentAccount]) {
            this.accounts[this.currentAccount].trades = [...this.trades];
            this.accounts[this.currentAccount].settings = { ...this.settings };
        }
        
        this.currentAccount = accountId;
        
        if (this.accounts[accountId]) {
            this.trades = this.accounts[accountId].trades || [];
            this.settings = this.accounts[accountId].settings || { ...this.settings, capital: this.accounts[accountId].capital };
        }
        
        this.saveData();
        this.updateAll();
        
        this.showNotification(`Compte changé: ${this.accounts[accountId]?.name || accountId}`);
    }
    
    addNewAccount() {
        const name = prompt('Nom du nouveau compte:');
        if (!name) return;
        
        const capital = parseFloat(prompt('Capital initial ($):')) || 1000;
        
        let accountId;
        let counter = Object.keys(this.accounts).length + 1;
        do {
            accountId = 'compte' + counter;
            counter++;
        } while (this.accounts[accountId]);
        
        this.accounts[accountId] = { 
            name, 
            capital,
            trades: [],
            settings: { ...this.settings, capital }
        };
        
        this.saveData();
        this.updateAccountDisplay();
        this.showNotification(`Compte "${name}" créé avec succès!`);
    }
    
    deleteAccount() {
        if (Object.keys(this.accounts).length <= 1) {
            alert('Impossible de supprimer le dernier compte');
            return;
        }
        
        const accountName = this.accounts[this.currentAccount].name;
        if (confirm(`Supprimer le compte "${accountName}" et toutes ses données ?`)) {
            delete this.accounts[this.currentAccount];
            
            this.currentAccount = Object.keys(this.accounts)[0];
            this.trades = [];
            
            this.saveData();
            this.updateAccountDisplay();
            this.updateAll();
            
            this.showNotification(`Compte "${accountName}" supprimé définitivement`);
        }
    }

    editTrade(index) {
        const trade = this.trades[index];
        if (!trade) return;
        
        const modal = document.getElementById('mobileTradeModal');
        const form = document.getElementById('mobileTradeForm');
        
        document.getElementById('mobileCurrency').value = trade.currency;
        document.getElementById('mobileEntryPoint').value = trade.entryPoint;
        document.getElementById('mobileStopLoss').value = trade.stopLoss;
        document.getElementById('mobileTakeProfit').value = trade.takeProfit;
        document.getElementById('mobileLotSize').value = trade.lotSize;
        
        const saveBtn = document.getElementById('saveMobileTradeBtn');
        saveBtn.textContent = '✏️ Modifier';
        saveBtn.onclick = () => this.saveEditedTrade(index);
        
        modal.classList.add('show');
    }
    
    saveEditedTrade(index) {
        const trade = this.trades[index];
        if (!trade) return;
        
        trade.currency = document.getElementById('mobileCurrency').value;
        trade.entryPoint = parseFloat(document.getElementById('mobileEntryPoint').value);
        trade.stopLoss = parseFloat(document.getElementById('mobileStopLoss').value);
        trade.takeProfit = parseFloat(document.getElementById('mobileTakeProfit').value);
        trade.lotSize = parseFloat(document.getElementById('mobileLotSize').value);
        
        this.saveData();
        this.hideTradeModal();
        this.updateAll();
        this.showNotification('Trade modifié !');
        
        const saveBtn = document.getElementById('saveMobileTradeBtn');
        saveBtn.textContent = '💾 Sauvegarder';
        saveBtn.onclick = () => this.saveTrade();
    }
    
    closeTrade(index) {
        const trade = this.trades[index];
        if (!trade || trade.status !== 'open') return;
        
        const result = prompt('Résultat du trade (TP/SL/BE):', 'TP');
        if (!result) return;
        
        trade.result = result.toUpperCase();
        trade.status = 'closed';
        
        if (result === 'TP') {
            trade.closePrice = trade.takeProfit;
        } else if (result === 'SL') {
            trade.closePrice = trade.stopLoss;
        } else if (result === 'BE') {
            trade.closePrice = trade.entryPoint;
        }
        
        trade.pnl = this.calculatePnL(trade);
        
        this.saveData();
        this.updateAll();
        this.showNotification(`Trade ${trade.currency} clôturé en ${result}`);
    }
    
    deleteTrade(index) {
        const trade = this.trades[index];
        if (!trade) return;
        
        if (confirm(`Supprimer le trade ${trade.currency} ?`)) {
            this.trades.splice(index, 1);
            this.saveData();
            this.updateAll();
            this.showNotification('Trade supprimé !');
        }
    }
    
    calculatePnL(trade) {
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
    }

    showNotification(message) {
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

    setupEventListeners() {
        // Menu mobile
        const menuToggle = document.getElementById('menuToggle');
        const closeMenu = document.getElementById('closeMenu');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', () => mobileMenu.classList.add('open'));
            menuToggle.addEventListener('touchend', () => mobileMenu.classList.add('open'));
        }
        if (closeMenu && mobileMenu) {
            closeMenu.addEventListener('click', () => mobileMenu.classList.remove('open'));
            closeMenu.addEventListener('touchend', () => mobileMenu.classList.remove('open'));
        }
        
        // Boutons de trade
        const newTradeBtn = document.getElementById('newTradeBtn');
        const addTradeBtn = document.getElementById('addTradeBtn');
        const closeTradeModal = document.getElementById('closeTradeModal');
        const saveMobileTradeBtn = document.getElementById('saveMobileTradeBtn');
        
        if (newTradeBtn) {
            newTradeBtn.addEventListener('click', () => this.showTradeModal());
            newTradeBtn.addEventListener('touchend', () => this.showTradeModal());
        }
        if (addTradeBtn) {
            addTradeBtn.addEventListener('click', () => this.showTradeModal());
            addTradeBtn.addEventListener('touchend', () => this.showTradeModal());
        }
        if (closeTradeModal) {
            closeTradeModal.addEventListener('click', () => this.hideTradeModal());
            closeTradeModal.addEventListener('touchend', () => this.hideTradeModal());
        }
        if (saveMobileTradeBtn) {
            saveMobileTradeBtn.addEventListener('click', () => this.saveTrade());
            saveMobileTradeBtn.addEventListener('touchend', () => this.saveTrade());
        }

        // Navigation calendrier
        const prevMonthBtn = document.getElementById('prevMonthMobile');
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
                this.renderCalendar();
            });
            prevMonthBtn.addEventListener('touchend', () => {
                this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
                this.renderCalendar();
            });
        }

        const nextMonthBtn = document.getElementById('nextMonthMobile');
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
                this.renderCalendar();
            });
            nextMonthBtn.addEventListener('touchend', () => {
                this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
                this.renderCalendar();
            });
        }

        // Paramètres
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
            saveSettingsBtn.addEventListener('touchend', () => this.saveSettings());
        }
        
        // Gestion des comptes
        const headerAccountSelect = document.querySelector('.mobile-header #mobileAccountSelect');
        if (headerAccountSelect) {
            headerAccountSelect.addEventListener('change', (e) => this.switchAccount(e.target.value));
        }
        
        const settingsAccountSelect = document.querySelector('#settings #mobileAccountSelect');
        if (settingsAccountSelect) {
            settingsAccountSelect.addEventListener('change', (e) => this.switchAccount(e.target.value));
        }
        
        const addAccountBtn = document.getElementById('mobileAddAccountBtn');
        if (addAccountBtn) {
            addAccountBtn.addEventListener('click', () => this.addNewAccount());
            addAccountBtn.addEventListener('touchend', () => this.addNewAccount());
        }
        
        const deleteAccountBtn = document.getElementById('mobileDeleteAccountBtn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => this.deleteAccount());
            deleteAccountBtn.addEventListener('touchend', () => this.deleteAccount());
        }

        // Chat mobile
        const mobileChatToggle = document.getElementById('mobileChatToggle');
        if (mobileChatToggle) {
            mobileChatToggle.addEventListener('click', () => document.getElementById('mobileChatWindow').classList.toggle('show'));
            mobileChatToggle.addEventListener('touchend', () => document.getElementById('mobileChatWindow').classList.toggle('show'));
        }

        const closeMobileChat = document.getElementById('closeMobileChat');
        if (closeMobileChat) {
            closeMobileChat.addEventListener('click', () => document.getElementById('mobileChatWindow').classList.remove('show'));
            closeMobileChat.addEventListener('touchend', () => document.getElementById('mobileChatWindow').classList.remove('show'));
        }

        const sendMobileMessage = document.getElementById('sendMobileMessage');
        if (sendMobileMessage) {
            sendMobileMessage.addEventListener('click', () => this.sendChatMessage());
            sendMobileMessage.addEventListener('touchend', () => this.sendChatMessage());
        }
        
        const mobileChatInput = document.getElementById('mobileChatInput');
        if (mobileChatInput) {
            mobileChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendChatMessage();
            });
        }
        
        // Emoji mobile
        const mobileEmojiBtn = document.getElementById('mobileEmojiBtn');
        const mobileEmojiPanel = document.getElementById('mobileEmojiPanel');
        
        if (mobileEmojiBtn && mobileEmojiPanel) {
            mobileEmojiBtn.addEventListener('click', () => {
                mobileEmojiPanel.style.display = mobileEmojiPanel.style.display === 'block' ? 'none' : 'block';
            });
            mobileEmojiBtn.addEventListener('touchend', () => {
                mobileEmojiPanel.style.display = mobileEmojiPanel.style.display === 'block' ? 'none' : 'block';
            });
            
            mobileEmojiPanel.querySelectorAll('.emoji-item').forEach(emoji => {
                emoji.addEventListener('click', () => {
                    const input = document.getElementById('mobileChatInput');
                    input.value += emoji.textContent;
                    mobileEmojiPanel.style.display = 'none';
                    input.focus();
                });
                emoji.addEventListener('touchend', () => {
                    const input = document.getElementById('mobileChatInput');
                    input.value += emoji.textContent;
                    mobileEmojiPanel.style.display = 'none';
                    input.focus();
                });
            });
        }

        // Navigation directe
        const navButtons = {
            'dashboard': () => window.showSection('dashboard'),
            'trades': () => window.showSection('trades'),
            'calendar': () => window.showSection('calendar'),
            'objectives': () => window.showSection('objectives'),
            'ranking': () => window.showSection('ranking')
        };

        // Attacher les événements aux boutons de navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const onclick = btn.getAttribute('onclick');
            if (onclick && onclick.includes('showSection')) {
                const section = onclick.match(/showSection\('([^']+)'\)/)?.[1];
                if (section && navButtons[section]) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log('🔄 Navigation vers:', section);
                        navButtons[section]();
                    });
                    btn.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        console.log('👆 Touch navigation vers:', section);
                        navButtons[section]();
                    });
                }
            }
        });

        // Menu links
        document.querySelectorAll('.menu-list a').forEach(link => {
            const onclick = link.getAttribute('onclick');
            if (onclick && onclick.includes('showSection')) {
                const section = onclick.match(/showSection\('([^']+)'\)/)?.[1];
                if (section && navButtons[section]) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log('🔄 Menu navigation vers:', section);
                        navButtons[section]();
                    });
                    link.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        console.log('👆 Touch menu navigation vers:', section);
                        navButtons[section]();
                    });
                }
            }
        });

        // Fermer menu en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('mobileMenu');
            const menuBtn = document.getElementById('menuToggle');
            if (menu && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
                menu.classList.remove('open');
            }
        });
        
        // Optimisation tactile
        document.querySelectorAll('button, .nav-btn, .menu-list a').forEach(element => {
            element.style.touchAction = 'manipulation';
            element.style.webkitTapHighlightColor = 'rgba(0, 212, 255, 0.3)';
        });
    }

// Chargement des données du compte mobile
async function loadMobileAccountData() {
    const firebaseUID = sessionStorage.getItem('firebaseUID');
    if (!firebaseUID || !window.firebaseDB) return;
    
    try {
        const accountRef = window.dbRef(window.firebaseDB, `users/${firebaseUID}/accounts/${currentAccount}`);
        const snapshot = await window.dbGet(accountRef);
        
        if (snapshot.exists()) {
            mobileTradesData[currentAccount] = snapshot.val();
            updateMobileStats();
            updateMobileObjectives();
            updateMobileTradesList();
            updateMobileCharts();
        }
    } catch (error) {
        console.error('Erreur de chargement mobile:', error);
    }
}

// Sauvegarde des données mobile
async function saveMobileAccountData() {
    const firebaseUID = sessionStorage.getItem('firebaseUID');
    if (!firebaseUID || !window.firebaseDB) return;
    
    try {
        const accountRef = window.dbRef(window.firebaseDB, `users/${firebaseUID}/accounts/${currentAccount}`);
        await window.dbSet(accountRef, mobileTradesData[currentAccount]);
    } catch (error) {
        console.error('Erreur de sauvegarde mobile:', error);
    }
}

// Configuration des événements mobiles
function setupMobileEventListeners() {
    // Menu mobile
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMenu = document.getElementById('closeMenu');
    
    menuToggle?.addEventListener('click', () => {
        mobileMenu.classList.add('open');
    });
    
    closeMenu?.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
    });
    
    // Fermer le menu en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            mobileMenu.classList.remove('open');
        }
    });
    
    // Boutons d'action
    document.getElementById('newTradeBtn')?.addEventListener('click', openMobileNewTradeModal);
    document.getElementById('addTradeBtn')?.addEventListener('click', openMobileNewTradeModal);
    document.getElementById('saveSettingsBtn')?.addEventListener('click', saveMobileSettings);
    
    // Navigation calendrier mobile
    document.getElementById('prevMonthMobile')?.addEventListener('click', () => navigateMobileMonth(-1));
    document.getElementById('nextMonthMobile')?.addEventListener('click', () => navigateMobileMonth(1));
    
    // Modal trade mobile
    document.getElementById('closeTradeModal')?.addEventListener('click', closeMobileTradeModal);
    document.getElementById('saveMobileTradeBtn')?.addEventListener('click', saveMobileTrade);
    
    // Chat mobile
    const mobileChatToggle = document.getElementById('mobileChatToggle');
    const mobileChatWindow = document.getElementById('mobileChatWindow');
    const closeMobileChat = document.getElementById('closeMobileChat');
    const sendMobileMessage = document.getElementById('sendMobileMessage');
    
    mobileChatToggle?.addEventListener('click', () => {
        mobileChatWindow.classList.toggle('show');
    });
    
    closeMobileChat?.addEventListener('click', () => {
        mobileChatWindow.classList.remove('show');
    });
    
    sendMobileMessage?.addEventListener('click', sendMobileChatMessage);
    
    // Navigation bottom
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Affichage des sections
function showSection(sectionName) {
    // Cacher toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Fermer le menu mobile
    document.getElementById('mobileMenu')?.classList.remove('open');
    
    // Charger les données spécifiques à la section
    switch(sectionName) {
        case 'dashboard':
            updateMobileCharts();
            break;
        case 'trades':
            updateMobileTradesList();
            break;
        case 'calendar':
            updateMobileCalendar();
            break;
        case 'objectives':
            updateMobileObjectives();
            break;
        case 'ranking':
            loadMobileRanking();
            break;
    }
}

// Mise à jour des statistiques mobiles
function updateMobileStats() {
    const accountData = mobileTradesData[currentAccount] || { trades: [], capital: 1000 };
    const trades = accountData.trades || [];
    const closedTrades = trades.filter(t => t.status === 'closed');
    
    // Calculs
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length * 100) : 0;
    const currentCapital = accountData.capital + totalPnL;
    
    // Mise à jour de l'affichage mobile
    document.getElementById('mobileCapital').textContent = `$${currentCapital.toFixed(0)}`;
    document.getElementById('mobileWinRate').textContent = `${winRate.toFixed(0)}%`;
    document.getElementById('mobilePnL').textContent = `$${totalPnL.toFixed(0)}`;
    
    // Classes CSS pour les couleurs
    const pnlElement = document.getElementById('mobilePnL');
    pnlElement.className = `stat-value ${totalPnL >= 0 ? 'positive' : 'negative'}`;
}

// Mise à jour des objectifs mobiles
function updateMobileObjectives() {
    const accountData = mobileTradesData[currentAccount] || { trades: [], capital: 1000, settings: {} };
    const settings = accountData.settings || {};
    const dailyTargetPercent = settings.dailyTarget || 1;
    const monthlyTargetPercent = settings.monthlyTarget || 15;
    
    const capital = accountData.capital || 1000;
    const dailyTarget = capital * (dailyTargetPercent / 100);
    const monthlyTarget = capital * (monthlyTargetPercent / 100);
    
    // Calcul des progrès
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const todayTrades = accountData.trades.filter(t => 
        t.status === 'closed' && new Date(t.closeDate) >= startOfDay
    );
    const monthTrades = accountData.trades.filter(t => 
        t.status === 'closed' && new Date(t.closeDate) >= startOfMonth
    );
    
    const dailyPnL = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const monthlyPnL = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    const dailyProgress = Math.min((dailyPnL / dailyTarget) * 100, 100);
    const monthlyProgress = Math.min((monthlyPnL / monthlyTarget) * 100, 100);
    
    // Mise à jour de l'affichage mobile
    document.getElementById('mobileDailyTarget').textContent = `$${dailyTarget.toFixed(0)}`;
    document.getElementById('mobileMonthlyTarget').textContent = `$${monthlyTarget.toFixed(0)}`;
    
    document.getElementById('mobileDailyProgress').style.width = `${dailyProgress}%`;
    document.getElementById('mobileDailyPercent').textContent = `${dailyProgress.toFixed(0)}%`;
    document.getElementById('mobileMonthlyProgress').style.width = `${monthlyProgress}%`;
    document.getElementById('mobileMonthlyPercent').textContent = `${monthlyProgress.toFixed(0)}%`;
}

// Initialisation des graphiques mobiles
function initializeMobileCharts() {
    initMobilePerformanceChart();
    initMobileWinRateChart();
}

// Graphique de performance mobile
function initMobilePerformanceChart() {
    const ctx = document.getElementById('mobilePerformanceChart');
    if (!ctx) return;
    
    if (mobileChartsInstances.performance) {
        mobileChartsInstances.performance.destroy();
    }
    
    const accountData = mobileTradesData[currentAccount] || { trades: [] };
    const closedTrades = accountData.trades.filter(t => t.status === 'closed').sort((a, b) => 
        new Date(a.closeDate) - new Date(b.closeDate)
    );
    
    let cumulativePnL = 0;
    const data = closedTrades.map(trade => {
        cumulativePnL += trade.pnl || 0;
        return cumulativePnL;
    });
    
    mobileChartsInstances.performance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: closedTrades.map((_, index) => `T${index + 1}`),
            datasets: [{
                label: 'Performance ($)',
                data: data,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    ticks: { 
                        color: '#ffffff',
                        font: { size: 10 }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

// Graphique de taux de réussite mobile
function initMobileWinRateChart() {
    const ctx = document.getElementById('mobileWinRateChart');
    if (!ctx) return;
    
    if (mobileChartsInstances.winRate) {
        mobileChartsInstances.winRate.destroy();
    }
    
    const accountData = mobileTradesData[currentAccount] || { trades: [] };
    const closedTrades = accountData.trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const losingTrades = closedTrades.length - winningTrades;
    
    mobileChartsInstances.winRate = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Gains', 'Pertes'],
            datasets: [{
                data: [winningTrades, losingTrades],
                backgroundColor: ['#4ecdc4', '#ff6b6b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Mise à jour des graphiques mobiles
function updateMobileCharts() {
    initMobilePerformanceChart();
    initMobileWinRateChart();
}

// Mise à jour de la liste des trades mobiles
function updateMobileTradesList() {
    const tradesList = document.getElementById('mobileTradesList');
    if (!tradesList) return;
    
    const accountData = mobileTradesData[currentAccount] || { trades: [] };
    const trades = [...accountData.trades].reverse(); // Plus récents en premier
    
    tradesList.innerHTML = '';
    
    if (trades.length === 0) {
        tradesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #888;">
                <div style="font-size: 48px; margin-bottom: 20px;">📈</div>
                <h3>Aucun trade</h3>
                <p>Commencez par ajouter votre premier trade</p>
            </div>
        `;
        return;
    }
    
    trades.forEach(trade => {
        const tradeCard = document.createElement('div');
        tradeCard.className = 'trade-card';
        
        const openDate = new Date(trade.openDate).toLocaleDateString('fr-FR');
        const pnlClass = (trade.pnl || 0) >= 0 ? 'positive' : 'negative';
        const statusClass = trade.status === 'open' ? 'open' : 'closed';
        const statusText = trade.status === 'open' ? 'Ouvert' : 'Fermé';
        
        tradeCard.innerHTML = `
            <div class="trade-header">
                <div class="trade-pair">${trade.currency}</div>
                <div class="trade-status ${statusClass}">${statusText}</div>
            </div>
            <div class="trade-details">
                <div class="trade-detail">
                    <span class="trade-detail-label">Date:</span>
                    <span>${openDate}</span>
                </div>
                <div class="trade-detail">
                    <span class="trade-detail-label">Type:</span>
                    <span>${trade.type}</span>
                </div>
                <div class="trade-detail">
                    <span class="trade-detail-label">Entrée:</span>
                    <span>${trade.entryPrice}</span>
                </div>
                <div class="trade-detail">
                    <span class="trade-detail-label">Lot:</span>
                    <span>${trade.lotSize}</span>
                </div>
            </div>
            <div class="trade-detail" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
                <span class="trade-detail-label">P&L:</span>
                <span class="trade-pnl ${pnlClass}">$${(trade.pnl || 0).toFixed(2)}</span>
            </div>
            <div class="trade-actions">
                <button class="action-btn edit" onclick="editMobileTrade('${trade.id}')">✏️ Modifier</button>
                <button class="action-btn close" onclick="deleteMobileTrade('${trade.id}')">🗑️ Supprimer</button>
            </div>
        `;
        
        tradesList.appendChild(tradeCard);
    });
}

// Ouverture du modal nouveau trade mobile
function openMobileNewTradeModal() {
    const modal = document.getElementById('mobileTradeModal');
    modal.classList.add('show');
    
    // Réinitialiser le formulaire
    document.getElementById('mobileTradeForm').reset();
}

// Fermeture du modal trade mobile
function closeMobileTradeModal() {
    const modal = document.getElementById('mobileTradeModal');
    modal.classList.remove('show');
}

// Sauvegarde du trade mobile
function saveMobileTrade() {
    const formData = {
        id: Date.now().toString(),
        currency: document.getElementById('mobileCurrency').value,
        entryPrice: parseFloat(document.getElementById('mobileEntryPoint').value),
        stopLoss: parseFloat(document.getElementById('mobileStopLoss').value),
        takeProfit: parseFloat(document.getElementById('mobileTakeProfit').value),
        lotSize: parseFloat(document.getElementById('mobileLotSize').value),
        openDate: new Date().toISOString(),
        status: 'open',
        pnl: 0,
        type: 'BUY' // Par défaut
    };
    
    if (!mobileTradesData[currentAccount]) {
        mobileTradesData[currentAccount] = { trades: [], capital: 1000, settings: {} };
    }
    
    mobileTradesData[currentAccount].trades.push(formData);
    
    updateMobileStats();
    updateMobileTradesList();
    updateMobileCharts();
    saveMobileAccountData();
    closeMobileTradeModal();
    
    // Notification mobile
    showMobileNotification(`Trade ${formData.currency} ajouté!`);
}

// Initialisation du calendrier mobile
function initializeMobileCalendar() {
    updateMobileCalendar();
}

// Navigation du calendrier mobile
function navigateMobileMonth(direction) {
    currentMobileDate.setMonth(currentMobileDate.getMonth() + direction);
    updateMobileCalendar();
}

// Mise à jour du calendrier mobile
function updateMobileCalendar() {
    const monthYear = document.getElementById('monthYearMobile');
    const calendar = document.getElementById('mobileCalendar');
    
    if (!monthYear || !calendar) return;
    
    monthYear.textContent = currentMobileDate.toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    const firstDay = new Date(currentMobileDate.getFullYear(), currentMobileDate.getMonth(), 1);
    const lastDay = new Date(currentMobileDate.getFullYear(), currentMobileDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    calendar.innerHTML = '';
    
    // Jours du calendrier mobile
    const currentDateCopy = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dayNumber = currentDateCopy.getDate();
        const isCurrentMonth = currentDateCopy.getMonth() === currentMobileDate.getMonth();
        
        if (!isCurrentMonth) {
            dayElement.style.opacity = '0.3';
        }
        
        // Vérifier s'il y a des trades ce jour
        const accountData = mobileTradesData[currentAccount] || { trades: [] };
        const dayTrades = accountData.trades.filter(trade => {
            const tradeDate = new Date(trade.closeDate || trade.openDate);
            return tradeDate.toDateString() === currentDateCopy.toDateString();
        });
        
        if (dayTrades.length > 0) {
            dayElement.classList.add('has-trades');
            const dayPnL = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
            
            if (dayPnL > 0) {
                dayElement.classList.add('profit-day');
            } else if (dayPnL < 0) {
                dayElement.classList.add('loss-day');
            }
            
            dayElement.innerHTML = `
                <div class="calendar-date">${dayNumber}</div>
                <div class="calendar-pnl ${dayPnL >= 0 ? 'positive' : 'negative'}">
                    $${dayPnL.toFixed(0)}
                </div>
            `;
        } else {
            dayElement.innerHTML = `<div class="calendar-date">${dayNumber}</div>`;
        }
        
        calendar.appendChild(dayElement);
        currentDateCopy.setDate(currentDateCopy.getDate() + 1);
    }
}

// Chargement du classement mobile
function loadMobileRanking() {
    const rankingData = [
        { name: 'Trader Pro', pnl: 2500, trades: 45 },
        { name: 'Vous', pnl: 0, trades: 0, isCurrentUser: true },
        { name: 'Forex Master', pnl: 1800, trades: 32 },
        { name: 'Pip Hunter', pnl: 1200, trades: 28 },
        { name: 'Gold Trader', pnl: 950, trades: 25 }
    ];
    
    // Mettre à jour avec les vraies données de l'utilisateur
    const accountData = mobileTradesData[currentAccount] || { trades: [] };
    const userPnL = accountData.trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const userTrades = accountData.trades.length;
    
    const userRanking = rankingData.find(r => r.isCurrentUser);
    if (userRanking) {
        userRanking.pnl = userPnL;
        userRanking.trades = userTrades;
    }
    
    // Trier par P&L
    rankingData.sort((a, b) => b.pnl - a.pnl);
    
    const rankingList = document.getElementById('mobileRankingList');
    if (rankingList) {
        rankingList.innerHTML = '';
        
        rankingData.forEach((trader, index) => {
            const item = document.createElement('div');
            item.className = `ranking-item ${trader.isCurrentUser ? 'current-user' : ''}`;
            
            item.innerHTML = `
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-info">
                    <div class="ranking-name">${trader.name}</div>
                    <div class="ranking-trades">${trader.trades} trades</div>
                </div>
                <div class="ranking-pnl ${trader.pnl >= 0 ? 'positive' : 'negative'}">
                    $${trader.pnl.toFixed(0)}
                </div>
            `;
            
            rankingList.appendChild(item);
        });
    }
}

// Sauvegarde des paramètres mobiles
function saveMobileSettings() {
    const capital = parseFloat(document.getElementById('mobileCapitalInput').value);
    const risk = parseFloat(document.getElementById('mobileRiskInput').value);
    const dailyTarget = parseFloat(document.getElementById('mobileDailyTargetInput').value);
    
    if (!mobileTradesData[currentAccount]) {
        mobileTradesData[currentAccount] = { trades: [], capital: 1000, settings: {} };
    }
    
    mobileTradesData[currentAccount].capital = capital;
    mobileTradesData[currentAccount].settings = {
        riskPerTrade: risk,
        dailyTarget: dailyTarget,
        monthlyTarget: dailyTarget * 20 // Approximation
    };
    
    updateMobileStats();
    updateMobileObjectives();
    saveMobileAccountData();
    
    showMobileNotification('Paramètres sauvegardés!');
}

// Envoi de message chat mobile
function sendMobileChatMessage() {
    const input = document.getElementById('mobileChatInput');
    const message = input.value.trim();
    
    if (message) {
        const messagesContainer = document.getElementById('mobileChatMessages');
        
        // Ajouter le message de l'utilisateur
        const userMessage = document.createElement('div');
        userMessage.className = 'message-bubble own';
        userMessage.innerHTML = `
            ${message}
            <div class="message-time">${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
        `;
        messagesContainer.appendChild(userMessage);
        
        // Réponse automatique
        setTimeout(() => {
            const botMessage = document.createElement('div');
            botMessage.className = 'message-bubble other';
            botMessage.innerHTML = `
                <div class="message-author">Misterpips Bot</div>
                Merci pour votre message ! Un membre de l'équipe vous répondra bientôt.
                <div class="message-time">${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
            `;
            messagesContainer.appendChild(botMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1000);
        
        input.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Notification mobile
function showMobileNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 212, 255, 0.9);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        z-index: 10000;
        font-weight: bold;
        backdrop-filter: blur(10px);
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Styles d'animation pour les notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Gestion des gestes tactiles
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', function(e) {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe up - fermer le chat s'il est ouvert
            const chatWindow = document.getElementById('mobileChatWindow');
            if (chatWindow.classList.contains('show')) {
                chatWindow.classList.remove('show');
            }
        }
    }
}

}



// Initialisation
let mobileDashboard;

// Fonction showSection disponible immédiatement
window.showSection = function(sectionId) {
    console.log('📱 Navigation immédiate vers:', sectionId);
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('✅ Section affichée:', sectionId);
    }
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[onclick*="showSection('${sectionId}')"`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.remove('open');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Initialisation du dashboard mobile...');
    
    // Initialiser immédiatement
    initBasicElements();
    
    // Créer un utilisateur par défaut si nécessaire
    if (!sessionStorage.getItem('firebaseUID')) {
        const tempUID = 'mobile_user_' + Date.now();
        sessionStorage.setItem('firebaseUID', tempUID);
        sessionStorage.setItem('userEmail', 'mobile@user.com');
        console.log('👤 Utilisateur temporaire créé');
    }
    
    // Initialiser le dashboard avec délai
    setTimeout(() => {
        try {
            mobileDashboard = new MobileTradingDashboard();
            window.mobileDashboard = mobileDashboard;
            console.log('✅ Dashboard mobile initialisé');
        } catch (error) {
            console.error('❌ Erreur initialisation:', error);
        }
    }, 500);
});

function initBasicElements() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMenu = document.getElementById('closeMenu');
    
    if (menuToggle && mobileMenu && closeMenu) {
        menuToggle.onclick = () => mobileMenu.classList.add('open');
        closeMenu.onclick = () => mobileMenu.classList.remove('open');
        
        document.onclick = (e) => {
            if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                mobileMenu.classList.remove('open');
            }
        };
    }
    
    console.log('📱 Éléments de base initialisés');
}

console.log('📱 Script dashboard mobile chargé');

window.debugMobile = () => {
    console.log('=== DEBUG MOBILE DASHBOARD ===');
    console.log('Firebase UID:', sessionStorage.getItem('firebaseUID'));
    console.log('User Email:', sessionStorage.getItem('userEmail'));
    console.log('Firebase DB:', !!window.firebaseDB);
    console.log('Mobile Dashboard:', !!window.mobileDashboard);
    if (window.mobileDashboard) {
        console.log('Trades:', window.mobileDashboard.trades.length);
        console.log('Settings:', window.mobileDashboard.settings);
    }
    console.log('==============================');
};