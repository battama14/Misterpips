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
            
            const savedData = localStorage.getItem(`dashboard_${this.currentUser}`);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.trades = data.trades || [];
                this.settings = { ...this.settings, ...data.settings };
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
        const currentCapital = this.settings.capital + totalPnL;

        document.getElementById('mobileCapital').textContent = `$${currentCapital.toFixed(2)}`;
        document.getElementById('mobileWinRate').textContent = `${winRate}%`;
        document.getElementById('mobilePnL').textContent = `$${totalPnL.toFixed(2)}`;
        
        const pnlElement = document.getElementById('mobilePnL');
        pnlElement.className = totalPnL >= 0 ? 'stat-value positive' : 'stat-value negative';
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
        const currentCapital = this.settings.capital + totalPnL;

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

    async loadChatMessages() {
        try {
            if (window.firebaseDB) {
                const { ref, onValue } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                const messagesRef = ref(window.firebaseDB, 'vip_chat');
                
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
                const messagesRef = ref(window.firebaseDB, 'vip_chat');
                
                const userEmail = sessionStorage.getItem('userEmail') || 'Mobile User';
                const nickname = userEmail.split('@')[0] || 'Mobile User';
                
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
        document.getElementById('menuToggle').onclick = () => {
            document.getElementById('mobileMenu').classList.add('open');
        };

        document.getElementById('closeMenu').onclick = () => {
            document.getElementById('mobileMenu').classList.remove('open');
        };

        document.getElementById('newTradeBtn').onclick = () => this.showTradeModal();
        document.getElementById('addTradeBtn').onclick = () => this.showTradeModal();
        document.getElementById('closeTradeModal').onclick = () => this.hideTradeModal();
        document.getElementById('saveMobileTradeBtn').onclick = () => this.saveTrade();

        document.getElementById('prevMonthMobile').onclick = () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
            this.renderCalendar();
        };

        document.getElementById('nextMonthMobile').onclick = () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
            this.renderCalendar();
        };

        document.getElementById('saveSettingsBtn').onclick = () => this.saveSettings();

        document.getElementById('mobileChatToggle').onclick = () => {
            document.getElementById('mobileChatWindow').classList.toggle('show');
        };

        document.getElementById('closeMobileChat').onclick = () => {
            document.getElementById('mobileChatWindow').classList.remove('show');
        };

        document.getElementById('sendMobileMessage').onclick = () => this.sendChatMessage();
        
        document.getElementById('mobileChatInput').onkeypress = (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        };

        document.onclick = (e) => {
            const menu = document.getElementById('mobileMenu');
            const menuBtn = document.getElementById('menuToggle');
            if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
                menu.classList.remove('open');
            }
        };
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

// Navigation entre sections
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    document.getElementById('mobileMenu').classList.remove('open');
}

// Initialisation
let mobileDashboard;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Initialisation du dashboard mobile...');
    
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkAuth = setInterval(() => {
        attempts++;
        const firebaseUID = sessionStorage.getItem('firebaseUID');
        const userEmail = sessionStorage.getItem('userEmail');
        
        if (firebaseUID && userEmail) {
            console.log('✅ Authentification détectée:', userEmail);
            mobileDashboard = new MobileTradingDashboard();
            window.mobileDashboard = mobileDashboard;
            clearInterval(checkAuth);
        } else if (attempts >= maxAttempts) {
            console.log('⚠️ Timeout authentification, redirection...');
            clearInterval(checkAuth);
            window.location.href = 'index.html';
        }
    }, 100);
    
    initBasicElements();
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