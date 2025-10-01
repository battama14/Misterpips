// Dashboard Mobile - Version optimisée tactile
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
        this.currentCalendarDate = new Date();
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
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
            // Essayer Firebase d'abord
            if (window.firebaseDB) {
                const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const userRef = ref(window.firebaseDB, `dashboards/${this.currentUser}`);
                const snapshot = await get(userRef);
                
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    this.trades = data.trades || [];
                    this.settings = { ...this.settings, ...data.settings };
                    console.log('📱 Données chargées depuis Firebase:', this.trades.length, 'trades');
                    return;
                }
            }
            
            // Fallback localStorage
            const savedData = localStorage.getItem(`dashboard_${this.currentUser}`);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.trades = data.trades || [];
                this.settings = { ...this.settings, ...data.settings };
                console.log('📱 Données chargées depuis localStorage:', this.trades.length, 'trades');
            } else {
                console.log('📱 Aucune donnée trouvée, utilisation des valeurs par défaut');
            }
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            // Utiliser localStorage en cas d'erreur Firebase
            const savedData = localStorage.getItem(`dashboard_${this.currentUser}`);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.trades = data.trades || [];
                this.settings = { ...this.settings, ...data.settings };
            }
        }
    }

    async saveData() {
        try {
            const data = {
                trades: this.trades,
                settings: this.settings,
                lastUpdated: new Date().toISOString()
            };

            // Toujours sauvegarder en localStorage d'abord
            localStorage.setItem(`dashboard_${this.currentUser}`, JSON.stringify(data));
            console.log('💾 Données sauvegardées en localStorage');

            // Essayer Firebase
            if (window.firebaseDB) {
                const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const userRef = ref(window.firebaseDB, `dashboards/${this.currentUser}`);
                await set(userRef, data);
                console.log('☁️ Sync temps réel désactivée temporairement');
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde Firebase:', error);
            // localStorage est déjà sauvegardé, donc pas de perte de données
        }
    }

    setupEventListeners() {
        // Menu mobile avec vérification d'existence
        const menuToggle = document.getElementById('menuToggle');
        const closeMenu = document.getElementById('closeMenu');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (menuToggle && mobileMenu) {
            menuToggle.onclick = () => mobileMenu.classList.add('open');
        }
        if (closeMenu && mobileMenu) {
            closeMenu.onclick = () => mobileMenu.classList.remove('open');
        }

        // Modal trade avec vérification
        const newTradeBtn = document.getElementById('newTradeBtn');
        const addTradeBtn = document.getElementById('addTradeBtn');
        const closeTradeModal = document.getElementById('closeTradeModal');
        const saveMobileTradeBtn = document.getElementById('saveMobileTradeBtn');
        
        if (newTradeBtn) newTradeBtn.onclick = () => this.showTradeModal();
        if (addTradeBtn) addTradeBtn.onclick = () => this.showTradeModal();
        if (closeTradeModal) closeTradeModal.onclick = () => this.hideTradeModal();
        if (saveMobileTradeBtn) saveMobileTradeBtn.onclick = () => this.saveTrade();

        // Calendrier avec vérification
        const prevMonthMobile = document.getElementById('prevMonthMobile');
        const nextMonthMobile = document.getElementById('nextMonthMobile');
        
        if (prevMonthMobile) {
            prevMonthMobile.onclick = () => {
                this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
                this.renderCalendar();
            };
        }
        if (nextMonthMobile) {
            nextMonthMobile.onclick = () => {
                this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
                this.renderCalendar();
            };
        }

        // Paramètres avec vérification
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) saveSettingsBtn.onclick = () => this.saveSettings();

        // Chat mobile avec vérification
        const mobileChatToggle = document.getElementById('mobileChatToggle');
        const closeMobileChat = document.getElementById('closeMobileChat');
        const sendMobileMessage = document.getElementById('sendMobileMessage');
        const mobileChatInput = document.getElementById('mobileChatInput');
        const mobileChatWindow = document.getElementById('mobileChatWindow');
        
        if (mobileChatToggle && mobileChatWindow) {
            mobileChatToggle.onclick = () => mobileChatWindow.classList.toggle('show');
        }
        if (closeMobileChat && mobileChatWindow) {
            closeMobileChat.onclick = () => mobileChatWindow.classList.remove('show');
        }
        if (sendMobileMessage) sendMobileMessage.onclick = () => this.sendChatMessage();
        if (mobileChatInput) {
            mobileChatInput.onkeypress = (e) => {
                if (e.key === 'Enter') this.sendChatMessage();
            };
        }

        // Fermer menu en touchant ailleurs avec vérification
        document.onclick = (e) => {
            const menu = document.getElementById('mobileMenu');
            const menuBtn = document.getElementById('menuToggle');
            if (menu && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
                menu.classList.remove('open');
            }
        };
        
        console.log('📱 Event listeners configurés');
    }

    updateStats() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const winRate = closedTrades.length > 0 ? 
            (closedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length / closedTrades.length * 100).toFixed(1) : 0;
        const currentCapital = this.settings.capital + totalPnL;

        // Vérifier l'existence des éléments avant mise à jour
        const mobileCapital = document.getElementById('mobileCapital');
        const mobileWinRate = document.getElementById('mobileWinRate');
        const mobilePnL = document.getElementById('mobilePnL');
        
        if (mobileCapital) mobileCapital.textContent = `$${currentCapital.toFixed(2)}`;
        if (mobileWinRate) mobileWinRate.textContent = `${winRate}%`;
        if (mobilePnL) {
            mobilePnL.textContent = `$${totalPnL.toFixed(2)}`;
            mobilePnL.className = totalPnL >= 0 ? 'stat-value positive' : 'stat-value negative';
        }
        
        console.log('📊 Stats mises à jour:', { capital: currentCapital, winRate, pnl: totalPnL });
    }

    renderTrades() {
        const container = document.getElementById('mobileTradesList');
        const recentTrades = this.trades.slice(-10).reverse();

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
                            <button class="action-btn edit" onclick="mobileDashboard.editTrade(${this.trades.indexOf(trade)})">✏️ Modifier</button>
                            <button class="action-btn close" onclick="mobileDashboard.closeTrade(${this.trades.indexOf(trade)})">🔒 Clôturer</button>
                        </div>
                    ` : ''}
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
        
        // En-têtes des jours
        ['D', 'L', 'M', 'M', 'J', 'V', 'S'].forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });

        // Jours du calendrier
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
        const currentCapital = this.settings.capital + totalPnL;

        // Objectifs en dollars
        const dailyTarget = (currentCapital * this.settings.dailyTarget / 100);
        const weeklyTarget = (currentCapital * this.settings.weeklyTarget / 100);
        const monthlyTarget = (currentCapital * this.settings.monthlyTarget / 100);

        // P&L aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const todayTrades = this.trades.filter(t => t.date === today && t.status === 'closed');
        const todayPnL = todayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);

        // Progrès
        const dailyProgress = dailyTarget > 0 ? Math.min((todayPnL / dailyTarget) * 100, 100) : 0;

        // Mise à jour des éléments
        document.getElementById('mobileDailyTarget').textContent = `$${dailyTarget.toFixed(0)}`;
        document.getElementById('mobileWeeklyTarget').textContent = `$${weeklyTarget.toFixed(0)}`;
        document.getElementById('mobileMonthlyTarget').textContent = `$${monthlyTarget.toFixed(0)}`;

        document.getElementById('mobileDailyProgress').style.width = `${dailyProgress}%`;
        document.getElementById('mobileDailyPercent').textContent = `${dailyProgress.toFixed(1)}%`;
    }

    initCharts() {
        this.destroyExistingCharts();
        this.initPerformanceChart();
        this.initWinRateChart();
    }

    destroyExistingCharts() {
        if (this.performanceChart) {
            this.performanceChart.destroy();
            this.performanceChart = null;
        }
        if (this.winRateChart) {
            this.winRateChart.destroy();
            this.winRateChart = null;
        }
    }

    initPerformanceChart() {
        const ctx = document.getElementById('mobilePerformanceChart');
        if (!ctx) {
            console.log('❌ Canvas mobilePerformanceChart non trouvé');
            return;
        }

        const closedTrades = this.trades.filter(t => t.status === 'closed');
        console.log('📊 Trades fermés pour graphique performance:', closedTrades.length);
        
        if (closedTrades.length === 0) {
            // Afficher un message au lieu de laisser vide
            const context = ctx.getContext('2d');
            context.clearRect(0, 0, ctx.width, ctx.height);
            context.fillStyle = '#ffffff';
            context.font = '14px Arial';
            context.textAlign = 'center';
            context.fillText('Aucun trade fermé', ctx.width / 2, ctx.height / 2);
            return;
        }

        let cumulativePnL = 0;
        const data = closedTrades.map(trade => {
            cumulativePnL += parseFloat(trade.pnl || 0);
            return cumulativePnL;
        });

        console.log('📊 Données performance:', data);

        this.performanceChart = new Chart(ctx, {
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
        
        console.log('✅ Graphique performance créé');
    }

    initWinRateChart() {
        const ctx = document.getElementById('mobileWinRateChart');
        if (!ctx) {
            console.log('❌ Canvas mobileWinRateChart non trouvé');
            return;
        }

        const closedTrades = this.trades.filter(t => t.status === 'closed');
        console.log('📊 Trades fermés pour graphique winrate:', closedTrades.length);
        
        if (closedTrades.length === 0) {
            // Afficher un message au lieu de laisser vide
            const context = ctx.getContext('2d');
            context.clearRect(0, 0, ctx.width, ctx.height);
            context.fillStyle = '#ffffff';
            context.font = '14px Arial';
            context.textAlign = 'center';
            context.fillText('Aucun trade fermé', ctx.width / 2, ctx.height / 2);
            return;
        }

        const wins = closedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length;
        const losses = closedTrades.length - wins;
        
        console.log('📊 Données winrate:', { wins, losses });

        this.winRateChart = new Chart(ctx, {
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
        
        console.log('✅ Graphique winrate créé');
    }

    async loadRanking() {
        const container = document.getElementById('mobileRankingList');
        
        try {
            if (window.firebaseDB) {
                const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                
                // Charger les utilisateurs et leurs dashboards
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
                    console.log('🏆 Classement chargé depuis Firebase');
                    return;
                }
            }
        } catch (error) {
            console.error('❌ Erreur chargement classement:', error);
        }

        // Calculer le classement avec les données locales
        const today = new Date().toISOString().split('T')[0];
        const todayTrades = this.trades.filter(t => t.date === today && t.status === 'closed');
        const dailyPnL = todayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        
        const demoRankings = [
            { name: 'Trader Pro', dailyPnL: 250.50, tradeCount: 8, userId: 'demo1' },
            { name: 'Expert FX', dailyPnL: 180.25, tradeCount: 5, userId: 'demo2' },
            { name: 'Vous', dailyPnL: dailyPnL, tradeCount: todayTrades.length, userId: this.currentUser },
            { name: 'Master Pips', dailyPnL: -45.30, tradeCount: 15, userId: 'demo3' }
        ].sort((a, b) => b.dailyPnL - a.dailyPnL);
        
        this.displayRanking(demoRankings);
        console.log('🏆 Classement local affiché');
    }

    async loadChatMessages() {
        try {
            if (window.firebaseDB) {
                const { ref, onValue } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const messagesRef = ref(window.firebaseDB, 'vip_chat');
                
                onValue(messagesRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const messages = snapshot.val();
                        const messageArray = Object.keys(messages).map(key => ({
                            id: key,
                            ...messages[key]
                        })).sort((a, b) => a.timestamp - b.timestamp);
                        
                        // Vérifier s'il y a un nouveau message
                        if (this.lastMessageCount && messageArray.length > this.lastMessageCount) {
                            const lastMessage = messageArray[messageArray.length - 1];
                            if (lastMessage.userId !== this.currentUser) {
                                this.playNotificationSound();
                                this.showChatNotification(lastMessage);
                            }
                        }
                        
                        this.lastMessageCount = messageArray.length;
                        this.displayChatMessages(messages);
                    }
                });
            }
        } catch (error) {
            console.error('❌ Erreur chargement chat:', error);
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

    calculateRankingsFromData(users, dashboards) {
        const today = new Date().toISOString().split('T')[0];
        const rankings = [];
        
        for (const [userId, userData] of Object.entries(users)) {
            if (userData.isVIP) {
                const userDashboard = dashboards[userId];
                let dailyPnL = 0;
                let tradeCount = 0;
                
                if (userDashboard && userDashboard.trades) {
                    const todayTrades = userDashboard.trades.filter(t => 
                        t.date === today && t.status === 'closed'
                    );
                    dailyPnL = todayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
                    tradeCount = todayTrades.length;
                }
                
                const displayName = userData.nickname || userData.email?.split('@')[0] || 'Membre VIP';
                rankings.push({
                    name: displayName,
                    dailyPnL,
                    tradeCount,
                    userId
                });
            }
        }
        
        rankings.sort((a, b) => b.dailyPnL - a.dailyPnL);
        return rankings;
    }

    async getUserStats(userId, date) {
        try {
            if (window.firebaseDB) {
                const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const tradesRef = ref(window.firebaseDB, `dashboards/${userId}/trades`);
                const snapshot = await get(tradesRef);
                
                if (snapshot.exists()) {
                    const trades = snapshot.val();
                    const todayTrades = trades.filter(t => t.date === date && t.status === 'closed');
                    const dailyPnL = todayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
                    return { dailyPnL, tradeCount: todayTrades.length };
                }
            }
        } catch (error) {
            console.error('Erreur stats utilisateur:', error);
        }
        return { dailyPnL: 0, tradeCount: 0 };
    }

    displayRanking(rankings) {
        const container = document.getElementById('mobileRankingList');
        
        container.innerHTML = rankings.map((trader, index) => {
            const isCurrentUser = trader.userId === this.currentUser || trader.name === 'Vous';
            const pnlClass = trader.dailyPnL > 0 ? 'positive' : trader.dailyPnL < 0 ? 'negative' : '';
            
            return `
                <div class="ranking-item ${isCurrentUser ? 'current-user' : ''}">
                    <div class="ranking-position">${index + 1}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${trader.name}${isCurrentUser ? ' (Vous)' : ''}</div>
                        <div class="ranking-trades">${trader.tradeCount} trades</div>
                    </div>
                    <div class="ranking-pnl ${pnlClass}">$${trader.dailyPnL.toFixed(2)}</div>
                </div>
            `;
        }).join('');
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
        
        // Sauvegarder dans Firebase ET localStorage
        await this.saveData();
        await this.syncWithFirebaseAccounts(trade);
        
        this.hideTradeModal();
        this.updateAll();
        this.showNotification('Trade ajouté !', 'success');
        
        // Vibration de confirmation
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    async closeTrade(index) {
        const result = prompt('Résultat (TP/SL/BE):', 'TP');
        if (!result) return;

        const trade = this.trades[index];
        trade.result = result.toUpperCase();
        trade.status = 'closed';
        trade.closeTime = new Date().toISOString();
        
        if (result === 'TP') {
            trade.closePrice = trade.takeProfit;
        } else if (result === 'SL') {
            trade.closePrice = trade.stopLoss;
        } else {
            trade.closePrice = trade.entryPoint;
        }
        
        trade.pnl = this.calculatePnL(trade);
        
        // Sauvegarder dans Firebase ET localStorage
        await this.saveData();
        await this.syncWithFirebaseAccounts(trade);
        
        this.updateAll();
        this.showNotification(`Trade clôturé en ${result}`, trade.pnl > 0 ? 'success' : 'error');
        
        // Vibration selon le résultat
        if ('vibrate' in navigator) {
            if (trade.pnl > 0) {
                navigator.vibrate([200, 100, 200]); // Succès
            } else {
                navigator.vibrate([500]); // Perte
            }
        }
    }

    calculatePnL(trade) {
        const entryPoint = parseFloat(trade.entryPoint);
        const closePrice = parseFloat(trade.closePrice);
        const lotSize = parseFloat(trade.lotSize);
        
        if (!entryPoint || !closePrice || !lotSize) return 0;
        
        let priceDiff = closePrice - entryPoint;
        const isLong = parseFloat(trade.takeProfit) > entryPoint;
        if (!isLong) priceDiff = -priceDiff;
        
        let pnl = 0;
        if (trade.currency === 'XAU/USD') {
            pnl = priceDiff * lotSize * 100;
        } else if (trade.currency.includes('JPY')) {
            pnl = priceDiff * 100 * lotSize * 10;
        } else {
            pnl = priceDiff * 10000 * lotSize * 10;
        }
        
        return parseFloat(pnl.toFixed(2));
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
            if (window.firebaseDB && window.userManager) {
                const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const messagesRef = ref(window.firebaseDB, 'vip_chat');
                
                // Utiliser le pseudo persistant
                const currentUser = window.userManager.getCurrentUser();
                const nickname = currentUser ? currentUser.nickname : 'Mobile User';
                
                await push(messagesRef, {
                    userId: this.currentUser,
                    nickname: nickname,
                    message: message,
                    timestamp: Date.now(),
                    date: new Date().toISOString().split('T')[0]
                });
                
                input.value = '';
                this.showNotification('Message envoyé !', 'success');
                console.log('💬 Message envoyé au chat VIP par:', nickname);
                
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
            console.error('❌ Erreur envoi message:', error);
            this.showNotification('Erreur envoi message');
        }
    }

    updateAll() {
        console.log('🔄 Mise à jour complète du dashboard...');
        this.updateStats();
        this.renderTrades();
        this.renderCalendar();
        this.updateObjectives();
        this.loadRanking();
        
        // Forcer la mise à jour des graphiques avec délai
        setTimeout(() => {
            console.log('📊 Mise à jour des graphiques...');
            this.initCharts();
        }, 100);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        
        let bgColor = 'linear-gradient(45deg, #00d4ff, #5b86e5)';
        if (type === 'success') bgColor = 'linear-gradient(45deg, #4ecdc4, #44a08d)';
        if (type === 'error') bgColor = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
        if (type === 'warning') bgColor = 'linear-gradient(45deg, #ffc107, #ff8f00)';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 25px;
            z-index: 9999;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
            animation: slideInDown 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    playNotificationSound() {
        try {
            // Vibration d'abord
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
            
            // Son de notification amélioré
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Créer une mélodie de notification
            const frequencies = [800, 1000, 800];
            const duration = 0.15;
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                oscillator.type = 'sine';
                
                const startTime = audioContext.currentTime + (index * duration);
                const endTime = startTime + duration;
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
                
                oscillator.start(startTime);
                oscillator.stop(endTime);
            });
            
            console.log('🔔 Son de notification joué');
        } catch (error) {
            console.log('🔇 Son de notification non disponible:', error);
            // Fallback: vibration seulement
            if ('vibrate' in navigator) {
                navigator.vibrate([300, 100, 300, 100, 300]);
            }
        }
    }

    showChatNotification(message) {
        // Notification visuelle pour nouveau message
        const chatToggle = document.getElementById('mobileChatToggle');
        if (chatToggle) {
            chatToggle.style.animation = 'pulse 1s infinite';
            chatToggle.textContent = '💬🔴';
            
            setTimeout(() => {
                chatToggle.style.animation = '';
                chatToggle.textContent = '💬';
            }, 3000);
        }
        
        // Notification push si supportée
        this.sendPushNotification(`Nouveau message de ${message.nickname}`, message.message);
    }

    async sendPushNotification(title, body) {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                const notification = new Notification(title, {
                    body: body,
                    icon: '/Misterpips.jpg',
                    badge: '/Misterpips.jpg',
                    tag: 'misterpips-chat',
                    vibrate: [200, 100, 200],
                    requireInteraction: false,
                    silent: false,
                    timestamp: Date.now(),
                    data: {
                        url: '/mobile-dashboard.html',
                        action: 'open-chat'
                    }
                });
                
                // Clic sur notification
                notification.onclick = () => {
                    window.focus();
                    // Ouvrir le chat
                    const chatWindow = document.getElementById('mobileChatWindow');
                    if (chatWindow) {
                        chatWindow.classList.add('show');
                    }
                    notification.close();
                };
                
                // Auto-fermer après 8 secondes
                setTimeout(() => {
                    if (notification) {
                        notification.close();
                    }
                }, 8000);
                
                console.log('🔔 Notification push envoyée');
                
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    // Réessayer avec la permission
                    this.sendPushNotification(title, body);
                }
            }
        }
    }

    async syncWithFirebaseAccounts(trade) {
        try {
            if (window.firebaseDB) {
                const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                
                // Synchroniser avec la structure users/{uid}/accounts/compte1
                const accountRef = ref(window.firebaseDB, `users/${this.currentUser}/accounts/${this.currentAccount}/trades/${trade.id}`);
                await set(accountRef, {
                    ...trade,
                    syncedAt: Date.now(),
                    source: 'mobile'
                });
                
                console.log('🔄 Sync temps réel désactivée temporairement');
            }
        } catch (error) {
            console.error('❌ Erreur sync Firebase accounts:', error);
        }
    }
}

// Navigation entre sections
function showSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    document.getElementById(sectionId).classList.add('active');
    
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    // Fermer le menu mobile
    document.getElementById('mobileMenu').classList.remove('open');
}

// Initialisation
let mobileDashboard;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Initialisation du dashboard mobile...');
    
    // Initialiser immédiatement sans attendre Firebase
    initBasicElements();
    
    // Créer le dashboard avec un utilisateur par défaut
    const firebaseUID = sessionStorage.getItem('firebaseUID') || 'mobile_user_' + Date.now();
    const userEmail = sessionStorage.getItem('userEmail') || 'mobile@user.com';
    
    sessionStorage.setItem('firebaseUID', firebaseUID);
    sessionStorage.setItem('userEmail', userEmail);
    
    console.log('✅ Initialisation avec utilisateur:', userEmail);
    mobileDashboard = new MobileTradingDashboard();
    window.mobileDashboard = mobileDashboard;
});

function initBasicElements() {
    // Initialiser les éléments qui ne dépendent pas de Firebase
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMenu = document.getElementById('closeMenu');
    
    if (menuToggle && mobileMenu && closeMenu) {
        menuToggle.onclick = () => mobileMenu.classList.add('open');
        closeMenu.onclick = () => mobileMenu.classList.remove('open');
        
        // Fermer le menu en cliquant ailleurs
        document.onclick = (e) => {
            if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                mobileMenu.classList.remove('open');
            }
        };
    }
    
    // Initialiser la navigation bottom
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    console.log('📱 Éléments de base initialisés');
}

console.log('📱 Script dashboard mobile chargé');

// Fonction globale pour déboguer
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