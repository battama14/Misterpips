// Mobile Dashboard Complet - Version Finale
class MobileDashboard {
    constructor() {
        this.currentUser = null;
        this.currentAccount = 'default';
        this.trades = [];
        this.accounts = { 'default': { name: 'Compte Principal', capital: 1000 } };
        this.settings = { capital: 1000, riskPerTrade: 2, dailyTarget: 10, nickname: 'Mobile User' };
        this.charts = {};
        this.editingTradeId = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation Mobile Dashboard...');
        await this.waitForFirebase();
        this.currentUser = sessionStorage.getItem('firebaseUID') || 'demo_' + Date.now();
        await this.loadData();
        this.setupAllEvents();
        this.updateAll();
        this.loadChatMessages();
        this.loadRanking();
        this.renderCalendar();
        // Auto-refresh désactivé pour éviter l'effacement
        // setInterval(() => {
        //     console.log('🔄 Actualisation automatique du classement...');
        //     this.loadRanking();
        // }, 15000);
    }

    updateRankingAfterTrade() {
        console.log('🔄 Mise à jour du classement mobile...');
        
        // Forcer la sauvegarde d'abord
        this.saveData().then(() => {
            // Attendre que la sauvegarde soit terminée
            setTimeout(() => {
                this.loadRanking();
                console.log('✅ Classement mobile mis à jour');
            }, 3000);
        });
        console.log('✅ Mobile Dashboard initialisé');
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
                
                // Essayer de charger depuis dashboards d'abord (comme PC)
                const dashboardRef = ref(window.firebaseDB, `dashboards/${this.currentUser}`);
                const dashboardSnapshot = await get(dashboardRef);
                
                if (dashboardSnapshot.exists()) {
                    const data = dashboardSnapshot.val();
                    this.trades = data.trades || [];
                    this.accounts = data.accounts || this.accounts;
                    this.settings = { ...this.settings, ...data.settings };
                    this.currentAccount = data.currentAccount || this.currentAccount;
                    console.log('📈 Données chargées depuis dashboards');
                } else {
                    // Fallback vers users
                    const userRef = ref(window.firebaseDB, `users/${this.currentUser}`);
                    const userSnapshot = await get(userRef);
                    
                    if (userSnapshot.exists()) {
                        const data = userSnapshot.val();
                        this.trades = data.trades || [];
                        this.accounts = data.accounts || this.accounts;
                        this.settings = { ...this.settings, ...data.settings };
                        this.currentAccount = data.currentAccount || this.currentAccount;
                        console.log('📈 Données chargées depuis users');
                    }
                }
            }
        } catch (error) {
            console.error('Erreur chargement:', error);
        }
    }

    async saveData() {
        try {
            // Dédupliquer les trades avant sauvegarde
            const uniqueTrades = [];
            const seenIds = new Set();
            
            for (const trade of this.trades) {
                if (!seenIds.has(trade.id)) {
                    seenIds.add(trade.id);
                    uniqueTrades.push(trade);
                }
            }
            
            this.trades = uniqueTrades;
            
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
                
                // Sauvegarder dans users pour le classement VIP
                const userRef = ref(window.firebaseDB, `users/${this.currentUser}`);
                await set(userRef, {
                    ...data,
                    isVIP: true,
                    plan: 'VIP',
                    email: sessionStorage.getItem('userEmail') || 'demo@mobile.com',
                    displayName: this.settings.nickname || 'Mobile User',
                    nickname: this.settings.nickname || 'Mobile User'
                });
                
                // Sauvegarder le pseudo séparément
                const nicknameRef = ref(window.firebaseDB, `users/${this.currentUser}/nickname`);
                await set(nicknameRef, this.settings.nickname || 'Mobile User');
                
                // Sauvegarder dans dashboards pour compatibilité PC
                const dashboardRef = ref(window.firebaseDB, `dashboards/${this.currentUser}`);
                await set(dashboardRef, data);
                
                console.log('✅ Données sauvegardées');
            }
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
        }
    }

    setupAllEvents() {
        console.log('🔧 Configuration des événements...');
        
        // Menu et navigation
        this.setupMenuEvents();
        this.setupNavigationEvents();
        
        // Chat
        this.setupChatEvents();
        
        // Trades
        this.setupTradeEvents();
        
        // Calendrier
        this.setupCalendarEvents();
        
        // Comptes
        this.setupAccountEvents();
        
        // Paramètres
        this.setupSettingsEvents();
        
        console.log('✅ Tous les événements configurés');
    }

    setupMenuEvents() {
        const menuToggle = document.getElementById('menuToggle');
        const closeMenu = document.getElementById('closeMenu');
        const mobileMenu = document.getElementById('mobileMenu');

        if (menuToggle) {
            menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                mobileMenu?.classList.add('open');
            });
        }

        if (closeMenu) {
            closeMenu.addEventListener('click', (e) => {
                e.preventDefault();
                mobileMenu?.classList.remove('open');
            });
        }
    }

    setupNavigationEvents() {
        // Navigation bottom
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const section = btn.getAttribute('ontouchend')?.match(/'([^']+)'/)?.[1];
            if (section) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showSection(section);
                }, { passive: false });
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showSection(section);
                });
            }
        });

        // Menu links
        document.querySelectorAll('.menu-list a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const section = href.substring(1);
                link.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showSection(section);
                    document.getElementById('mobileMenu')?.classList.remove('open');
                }, { passive: false });
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showSection(section);
                    document.getElementById('mobileMenu')?.classList.remove('open');
                });
            }
        });
    }

    setupChatEvents() {
        const chatToggle = document.getElementById('chatToggle');
        const chatWindow = document.getElementById('chatWindow');
        const messageInput = document.getElementById('mobileMessageInput');
        const sendBtn = document.querySelector('.send-btn');
        const emojiBtn = document.querySelector('.emoji-btn');
        const emojiPanel = document.getElementById('mobileEmojiPanel');

        // Toggle chat
        if (chatToggle) {
            chatToggle.addEventListener('click', (e) => {
                e.preventDefault();
                chatWindow?.classList.toggle('show');
            });
        }

        // Close chat
        const closeChat = document.querySelector('.chat-header .close-btn');
        if (closeChat) {
            closeChat.addEventListener('click', (e) => {
                e.preventDefault();
                chatWindow?.classList.remove('show');
            });
        }

        // Send message - FIX CRITIQUE
        if (sendBtn) {
            sendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.sendChatMessage();
            });
            sendBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.sendChatMessage();
            });
        }

        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
        }

        // Emoji panel
        if (emojiBtn) {
            emojiBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const isVisible = emojiPanel?.style.display === 'block';
                if (emojiPanel) emojiPanel.style.display = isVisible ? 'none' : 'block';
            });
        }

        // Emoji items
        document.querySelectorAll('.emoji-item').forEach(emoji => {
            emoji.addEventListener('click', (e) => {
                e.preventDefault();
                if (messageInput) {
                    messageInput.value += emoji.textContent;
                    messageInput.focus();
                }
                if (emojiPanel) emojiPanel.style.display = 'none';
            });
        });
    }

    setupTradeEvents() {
        const newTradeBtn = document.getElementById('newTradeBtn');
        const addTradeBtn = document.getElementById('addTradeBtn');
        const tradeModal = document.getElementById('tradeModal');
        const closeModalBtn = document.querySelector('#tradeModal .close-btn');
        const saveTradeBtn = document.querySelector('.form-actions .primary-btn');
        const tradeStatus = document.getElementById('tradeStatus');

        // Boutons nouveau trade
        [newTradeBtn, addTradeBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showTradeModal();
                });
            }
        });

        // Fermer modal
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideTradeModal();
            });
        }

        // Sauvegarder trade
        if (saveTradeBtn) {
            saveTradeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveTrade();
            });
        }


    }

    setupCalendarEvents() {
        const prevBtn = document.getElementById('prevMonthMobile');
        const nextBtn = document.getElementById('nextMonthMobile');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentMonth--;
                if (this.currentMonth < 0) {
                    this.currentMonth = 11;
                    this.currentYear--;
                }
                this.renderCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentMonth++;
                if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
                this.renderCalendar();
            });
        }
    }

    setupAccountEvents() {
        const accountSelector = document.getElementById('mobileAccountSelector');
        
        if (accountSelector) {
            accountSelector.addEventListener('change', (e) => {
                this.switchAccount(e.target.value);
            });
        }
    }

    setupSettingsEvents() {
        const saveSettingsBtn = document.querySelector('.settings-list .primary-btn');
        
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
    }

    showSection(sectionName) {
        console.log('📱 Affichage section:', sectionName);
        
        // Masquer toutes les sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        
        // Afficher la section demandée
        const section = document.getElementById(sectionName);
        if (section) {
            section.classList.add('active');
        }
        
        // Activer le bouton de navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const btnSection = btn.getAttribute('ontouchend')?.match(/'([^']+)'/)?.[1];
            if (btnSection === sectionName) {
                btn.classList.add('active');
            }
        });
        
        // Fermer le menu
        document.getElementById('mobileMenu')?.classList.remove('open');
        
        // Charger les données spécifiques à la section
        if (sectionName === 'ranking') {
            this.loadRanking();
        } else if (sectionName === 'calendar') {
            this.renderCalendar();
        }
    }

    async sendChatMessage() {
        const input = document.getElementById('mobileMessageInput');
        const message = input?.value.trim();
        if (!message) return;

        console.log('📤 Envoi message:', message);

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
                
                if (input) {
                    input.value = '';
                    console.log('✅ Message envoyé');
                }
            }
        } catch (error) {
            console.error('❌ Erreur envoi message:', error);
        }
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

    async loadRanking() {
        try {
            if (window.firebaseDB) {
                const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
                
                console.log('📊 Chargement du classement VIP...');
                
                // Récupérer tous les utilisateurs VIP (comme dans vip-ranking.js)
                const usersRef = ref(window.firebaseDB, 'users');
                const usersSnapshot = await get(usersRef);
                
                if (!usersSnapshot.exists()) {
                    console.log('Aucun utilisateur trouvé');
                    this.displayRanking([]);
                    return;
                }

                const users = usersSnapshot.val();
                const vipUsers = Object.entries(users).filter(([uid, userData]) => 
                    userData.isVIP || userData.plan === 'VIP'
                );

                console.log(`👥 ${vipUsers.length} utilisateurs VIP trouvés`);

                const rankings = [];
                // Même méthode que la version PC
                const today = new Date().toISOString().split('T')[0];

                for (const [uid, userData] of vipUsers) {
                    try {
                        // Chercher les trades dans la structure correcte
                        const accountRef = ref(window.firebaseDB, `users/${uid}/accounts/compte1`);
                        const accountSnapshot = await get(accountRef);
                        
                        let userTrades = [];
                        let dailyPnL = 0;
                        
                        if (accountSnapshot.exists()) {
                            const accountData = accountSnapshot.val();
                            if (accountData.trades && Array.isArray(accountData.trades)) {
                                userTrades = accountData.trades;
                                
                                // Calculer seulement les trades fermés d'aujourd'hui
                                const todayTrades = userTrades.filter(trade => 
                                    trade && trade.date === today && 
                                    (trade.status === 'closed' || trade.status === 'completed')
                                );
                                
                                dailyPnL = todayTrades.reduce((total, trade) => 
                                    total + (parseFloat(trade.pnl) || 0), 0
                                );
                            }
                        }

                        const todayTrades = userTrades.filter(trade => 
                            trade && trade.date === today && 
                            (trade.status === 'closed' || trade.status === 'completed')
                        );

                        const totalTrades = userTrades.length;
                        const winningTrades = userTrades.filter(t => 
                            (t.status === 'closed' || t.status === 'completed') && 
                            parseFloat(t.pnl || 0) > 0
                        ).length;
                        
                        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0;

                        // Récupérer le pseudo (comme dans vip-ranking.js)
                        let nickname = 'Trader VIP';
                        try {
                            const nicknameRef = ref(window.firebaseDB, `users/${uid}/nickname`);
                            const nicknameSnapshot = await get(nicknameRef);
                            if (nicknameSnapshot.exists()) {
                                nickname = nicknameSnapshot.val();
                            } else {
                                nickname = userData.displayName || userData.email?.split('@')[0] || 'Trader VIP';
                            }
                        } catch (error) {
                            nickname = userData.displayName || userData.email?.split('@')[0] || 'Trader VIP';
                        }

                        rankings.push({
                            name: nickname,
                            dailyPnL: dailyPnL,
                            todayTrades: todayTrades.length,
                            totalTrades: totalTrades,
                            winRate: winRate,
                            isCurrentUser: uid === this.currentUser
                        });

                    } catch (error) {
                        console.error(`Erreur pour l'utilisateur ${uid}:`, error);
                    }
                }

                // Trier par P&L journalier
                rankings.sort((a, b) => b.dailyPnL - a.dailyPnL);
                this.displayRanking(rankings);
                return;
            }
        } catch (error) {
            console.error('Erreur classement:', error);
        }

        // Fallback
        const userTotalPnL = this.trades.filter(t => t.status === 'closed').reduce((sum, t) => sum + (t.pnl || 0), 0);
        const demoRankings = [
            { name: 'Vous', dailyPnL: userTotalPnL, todayTrades: 0, totalTrades: this.trades.length, winRate: 0, isCurrentUser: true }
        ];
        this.displayRanking(demoRankings);
    }



    displayRanking(rankings) {
        const container = document.getElementById('mobileRankingList');
        if (!container) return;
        
        console.log('📊 Affichage classement avec', rankings.length, 'utilisateurs');
        
        if (rankings.length === 0) {
            container.innerHTML = `
                <div class="no-ranking">
                    <h4>🏆 Classement VIP</h4>
                    <p>Aucun utilisateur VIP trouvé</p>
                    <button onclick="window.mobileDashboard.loadRanking()" class="primary-btn">
                        🔄 Actualiser
                    </button>
                </div>
            `;
            return;
        }

        let html = `
            <div class="ranking-header">
                <h4>🏆 Classement VIP Journalier</h4>
                <small>Mis à jour: ${new Date().toLocaleTimeString()}</small>
            </div>
        `;
        
        rankings.forEach((user, index) => {
            const position = index + 1;
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
            
            html += `
                <div class="ranking-item ${user.isCurrentUser ? 'current-user' : ''}">
                    <div class="ranking-position">${medal}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${user.name}</div>
                        <div class="ranking-trades">
                            ${user.todayTrades || 0} trades • ${Math.round(user.winRate || 0)}% WR
                        </div>
                    </div>
                    <div class="ranking-pnl ${(user.dailyPnL || 0) >= 0 ? 'positive' : 'negative'}">
                        $${(user.dailyPnL || 0).toFixed(2)}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        console.log('✅ Classement mobile affiché avec', rankings.length, 'utilisateurs VIP');
    }

    renderCalendar() {
        const container = document.getElementById('mobileCalendar');
        const monthYearEl = document.getElementById('monthYearMobile');
        
        if (!container || !monthYearEl) return;

        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                           'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        monthYearEl.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let calendarHTML = '';
        
        // Jours du calendrier avec grille CSS
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            // Utiliser le même format que les trades
            const dateStr = currentDate.getFullYear() + '-' + 
                String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                String(currentDate.getDate()).padStart(2, '0');
            const dayTrades = this.trades.filter(t => t.date === dateStr && t.status === 'closed');
            const dayPnL = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
            
            let dayClass = 'calendar-day';
            if (currentDate.getMonth() !== this.currentMonth) {
                dayClass += ' other-month';
            }
            if (dayTrades.length > 0) {
                dayClass += ' has-trades';
                if (dayPnL > 0) dayClass += ' profit-day';
                else if (dayPnL < 0) dayClass += ' loss-day';
            }

            calendarHTML += `
                <div class="${dayClass}">
                    <div class="calendar-date">${currentDate.getDate()}</div>
                    ${dayTrades.length > 0 ? `<div class="calendar-pnl">$${dayPnL.toFixed(0)}</div>` : ''}
                </div>
            `;
        }

        container.innerHTML = calendarHTML;
    }

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
            this.editingTradeId = editingTrade.id;
        } else {
            title.textContent = 'Nouveau Trade';
            // Réinitialiser le formulaire
            document.getElementById('tradePair').value = 'EUR/USD';
            document.getElementById('tradeType').value = 'BUY';
            document.getElementById('tradeLots').value = '0.01';
            document.getElementById('tradeEntry').value = '';
            document.getElementById('tradeStopLoss').value = '';
            document.getElementById('tradeTakeProfit').value = '';
            this.editingTradeId = null;
        }
        
        modal?.classList.add('show');
    }

    hideTradeModal() {
        const modal = document.getElementById('tradeModal');
        modal?.classList.remove('show');
        this.editingTradeId = null;
    }

    async saveTrade() {
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

        if (this.editingTradeId) {
            // Modification
            const tradeIndex = this.trades.findIndex(t => t.id === this.editingTradeId);
            if (tradeIndex !== -1) {
                this.trades[tradeIndex] = {
                    ...this.trades[tradeIndex],
                    currency, type, lotSize, entryPoint, stopLoss, takeProfit
                };
            }
        } else {
            // Nouveau trade (toujours ouvert)
            // Même méthode que la version PC
            const localDate = new Date().toISOString().split('T')[0];
            
            const trade = {
                id: Date.now().toString(),
                account: this.currentAccount,
                date: localDate,
                currency, type, entryPoint, stopLoss, takeProfit, lotSize,
                status: 'open',
                closePrice: null,
                pnl: 0
            };
            this.trades.push(trade);
        }

        await this.saveData();
        this.hideTradeModal();
        this.updateAll();
        this.updateCharts();
    }

    editTrade(index) {
        const trade = this.trades[index];
        if (!trade) return;
        this.showTradeModal(trade);
    }

    async closeTrade(index) {
        const trade = this.trades[index];
        if (!trade || trade.status !== 'open') return;
        
        const result = prompt('Comment s\'est terminé le trade ?\n\nTP = Take Profit\nSL = Stop Loss\nBE = Break Even', 'TP');
        if (!result) return;
        
        let closePrice;
        const resultUpper = result.toUpperCase();
        
        if (resultUpper === 'TP') {
            closePrice = trade.takeProfit;
        } else if (resultUpper === 'SL') {
            closePrice = trade.stopLoss;
        } else if (resultUpper === 'BE') {
            closePrice = trade.entryPoint;
        } else {
            alert('Résultat invalide. Utilisez TP, SL ou BE');
            return;
        }
        
        this.trades[index].status = 'closed';
        this.trades[index].closePrice = closePrice;
        this.trades[index].result = resultUpper;
        this.trades[index].pnl = this.calculatePnL(this.trades[index]);
        
        console.log('🔒 Trade fermé:', {
            pair: this.trades[index].currency,
            date: this.trades[index].date,
            result: resultUpper,
            pnl: this.trades[index].pnl,
            status: this.trades[index].status
        });
        
        await this.saveData();
        this.updateAll();
        this.updateCharts();
        
        // Actualiser le classement immédiatement
        this.updateRankingAfterTrade();
        
        // Forcer aussi le ranking-fix
        setTimeout(() => {
            if (window.showRankingNow) {
                window.showRankingNow();
            }
        }, 2000);
    }

    async deleteTrade(index) {
        const trade = this.trades[index];
        if (!trade || !confirm(`Supprimer le trade ${trade.currency} ?`)) return;
        
        this.trades.splice(index, 1);
        await this.saveData();
        this.updateAll();
        this.updateCharts(); // IMPORTANT: Mettre à jour les graphiques
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
        this.settings.capital = parseFloat(document.getElementById('mobileCapitalInput')?.value) || 1000;
        this.settings.riskPerTrade = parseFloat(document.getElementById('mobileRiskInput')?.value) || 2;
        this.settings.dailyTarget = parseFloat(document.getElementById('mobileDailyObjective')?.value) || 10;
        this.settings.nickname = document.getElementById('mobileNickname')?.value || 'Mobile User';
        
        await this.saveData();
        alert('Paramètres sauvegardés !');
    }

    updateStats() {
        const accountTrades = this.trades.filter(t => t.account === this.currentAccount);
        const closedTrades = accountTrades.filter(t => t.status === 'closed');
        const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const winRate = closedTrades.length > 0 ? 
            (closedTrades.filter(t => t.pnl > 0).length / closedTrades.length * 100).toFixed(1) : 0;
        const currentCapital = this.accounts[this.currentAccount].capital + totalPnL;

        const capitalEl = document.getElementById('mobileCapital');
        const winRateEl = document.getElementById('mobileWinRate');
        const pnlEl = document.getElementById('mobilePnL');

        if (capitalEl) capitalEl.textContent = `$${currentCapital.toFixed(0)}`;
        if (winRateEl) winRateEl.textContent = `${winRate}%`;
        if (pnlEl) {
            pnlEl.textContent = `$${totalPnL.toFixed(0)}`;
            pnlEl.className = `stat-value ${totalPnL >= 0 ? 'positive' : 'negative'}`;
        }
    }

    renderTrades() {
        const container = document.getElementById('mobileTradesList');
        if (!container) return;
        
        // Dédupliquer les trades avant affichage
        const uniqueTrades = [];
        const seenIds = new Set();
        
        for (const trade of this.trades) {
            if (trade.account === this.currentAccount && !seenIds.has(trade.id)) {
                seenIds.add(trade.id);
                uniqueTrades.push(trade);
            }
        }
        
        if (uniqueTrades.length === 0) {
            container.innerHTML = '<div class="text-center">Aucun trade pour ce compte</div>';
            return;
        }

        container.innerHTML = uniqueTrades.map((trade) => {
            const globalIndex = this.trades.findIndex(t => t.id === trade.id);
            
            // Calculer les gains/pertes potentiels pour les trades ouverts
            let potentialTP = 0, potentialSL = 0;
            if (trade.status === 'open') {
                potentialTP = this.calculatePnL({...trade, closePrice: trade.takeProfit});
                potentialSL = this.calculatePnL({...trade, closePrice: trade.stopLoss});
            }
            
            return `
                <div class="trade-card ${trade.status}">
                    <div class="trade-header">
                        <span class="trade-pair">${trade.currency}</span>
                        <span class="trade-status ${trade.status}">${trade.status === 'open' ? 'OUVERT' : 'FERMÉ'}</span>
                    </div>
                    <div class="trade-details">
                        <div class="trade-detail">
                            <span class="trade-detail-label">Date:</span>
                            <span>${trade.date}</span>
                        </div>
                        <div class="trade-detail">
                            <span class="trade-detail-label">Type:</span>
                            <span class="trade-type ${trade.type?.toLowerCase()}">${trade.type || 'BUY'}</span>
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
                            <span class="trade-detail-label">SL:</span>
                            <span class="sl-price">${trade.stopLoss}</span>
                        </div>
                        <div class="trade-detail">
                            <span class="trade-detail-label">TP:</span>
                            <span class="tp-price">${trade.takeProfit}</span>
                        </div>
                        ${trade.status === 'open' ? `
                            <div class="potential-pnl">
                                <div class="potential-item">
                                    <span class="potential-label">Si TP:</span>
                                    <span class="potential-value positive">+$${potentialTP.toFixed(2)}</span>
                                </div>
                                <div class="potential-item">
                                    <span class="potential-label">Si SL:</span>
                                    <span class="potential-value negative">$${potentialSL.toFixed(2)}</span>
                                </div>
                            </div>
                        ` : `
                            <div class="trade-detail">
                                <span class="trade-detail-label">Résultat:</span>
                                <span class="trade-result ${trade.result?.toLowerCase()}">${trade.result || 'FERMÉ'}</span>
                            </div>
                            <div class="trade-detail">
                                <span class="trade-detail-label">P&L:</span>
                                <span class="trade-pnl ${(trade.pnl || 0) >= 0 ? 'positive' : 'negative'}">$${(trade.pnl || 0).toFixed(2)}</span>
                            </div>
                        `}
                    </div>
                    <div class="trade-actions">
                        ${trade.status === 'open' ? `
                            <button class="action-btn close-trade" onclick="window.mobileDashboard.closeTrade(${globalIndex})">🔒 Fermer</button>
                            <button class="action-btn edit" onclick="window.mobileDashboard.editTrade(${globalIndex})">✏️ Modifier</button>
                        ` : `
                            <button class="action-btn edit" onclick="window.mobileDashboard.editTrade(${globalIndex})">✏️ Modifier</button>
                            <button class="action-btn delete" onclick="window.mobileDashboard.deleteTrade(${globalIndex})">🗑️ Supprimer</button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

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

    updateAll() {
        this.updateStats();
        this.renderTrades();
        this.updateCharts();
        this.updateAccountSelector();
        this.renderCalendar();
    }
}

// Fonctions globales
function showSection(sectionName) {
    window.mobileDashboard?.showSection(sectionName);
}

function toggleMobileChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow?.classList.toggle('show');
}

function toggleEmojiPanel() {
    const panel = document.getElementById('mobileEmojiPanel');
    if (panel) {
        const isVisible = panel.style.display === 'block';
        panel.style.display = isVisible ? 'none' : 'block';
    }
}

function insertEmoji(emoji) {
    const input = document.getElementById('mobileMessageInput');
    if (input) {
        input.value += emoji;
        input.focus();
    }
    const panel = document.getElementById('mobileEmojiPanel');
    if (panel) panel.style.display = 'none';
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
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.mobileDashboard = new MobileDashboard();
        console.log('🎯 Mobile Dashboard prêt !');
    }, 1000);
});