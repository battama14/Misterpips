class TradingDashboard {
    constructor() {
        this.currentUser = null;
        this.currentAccount = 'compte1';
        this.trades = [];
        this.settings = { capital: 1000, riskPerTrade: 2 };
        this.accounts = {
            'compte1': { name: 'Compte Principal', capital: 1000 },
            'compte2': { name: 'Compte Démo', capital: 500 },
            'compte3': { name: 'Compte Swing', capital: 2000 }
        };
        this.syncInProgress = false;
        this.lastSyncTime = 0;
        this.lastDataHash = null;
        this.saveTimeout = null;
        this.initFirebase();
        this.currentStep = 0;
        this.currentTrade = {};
        this.livePrices = {};
        this.previousModalContent = null;
        this.checklistSteps = [
            {
                title: "✅ 1. Contexte Global",
                question: "Quelle est la tendance Daily et la zone H4 ?",
                key: "contextGlobal",
                education: `<strong>🎯 Objectif :</strong> Comprendre la tendance générale<br><br><strong>📊 Daily :</strong> Haussière/Baissière/Range<br><strong>📊 H4 :</strong> Premium/Discount/Équilibre`,
                options: ["Hausse + Discount", "Baisse + Premium", "Range", "Hausse + Premium", "Baisse + Discount"]
            },
            {
                title: "✅ 2. Zone Institutionnelle",
                question: "Zone institutionnelle identifiée ?",
                key: "zoneInstitutionnelle",
                education: `<strong>🎯 Objectif :</strong> Trouver les zones d'entrée<br><br><strong>🏦 Order Blocks :</strong> Dernière bougie avant impulsion<br><strong>⚡ Fair Value Gaps :</strong> Gaps à combler`,
                options: ["Order Block Valide", "Fair Value Gap", "Liquidity Grab", "Aucune Zone"]
            },
            {
                title: "✅ 3. Structure de Marché",
                question: "Structure confirmée ?",
                key: "structureMarche",
                education: `<strong>🎯 Objectif :</strong> Confirmer la direction<br><br><strong>🔄 CHOCH :</strong> Changement de caractère<br><strong>📈 BOS :</strong> Cassure de structure`,
                options: ["CHOCH Confirmé", "BOS Confirmé", "Structure Unclear", "Faux Signal"]
            },
            {
                title: "✅ 4. Timing Killzones",
                question: "Timing optimal ?",
                key: "timingKillzones",
                education: `<strong>🎯 Objectif :</strong> Trader aux bonnes heures<br><br><strong>⏰ Londres :</strong> 8h-11h<br><strong>⏰ New York :</strong> 14h-17h`,
                options: ["Killzone Londres", "Killzone New York", "Overlap", "Hors Killzone"]
            },
            {
                title: "✅ 5. Signal d'Entrée",
                question: "Signal précis confirmé ?",
                key: "signalEntree",
                education: `<strong>🎯 Objectif :</strong> Signal d'exécution<br><br><strong>📍 Pin Bar :</strong> Rejet avec mèche<br><strong>📍 Doji :</strong> Indécision puis direction`,
                options: ["Pin Bar", "Doji", "Engulfing", "Signal Faible"]
            },
            {
                title: "✅ 6. Risk Management",
                question: "R:R optimal ?",
                key: "riskManagement",
                education: `<strong>🎯 Objectif :</strong> Protéger le capital<br><br><strong>🛡️ Stop Loss :</strong> Niveau d'invalidation<br><strong>🎯 Take Profit :</strong> Zone de liquidité`,
                options: ["R:R ≥ 1:3", "R:R = 1:2", "R:R < 1:2", "SL Trop Large"]
            },
            {
                title: "✅ 7. Discipline",
                question: "Plan respecté ?",
                key: "discipline",
                education: `<strong>🎯 Objectif :</strong> Cohérence<br><br><strong>🧠 Discipline :</strong> Suivre le plan<br><strong>📝 Journal :</strong> Documenter`,
                options: ["Plan Respecté", "Discipline OK", "Émotions Contrôlées", "Amélioration Nécessaire"]
            }
        ];
        
        this.init();
    }

    async initFirebase() {
        try {
            await this.waitForFirebaseAuth();
            
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
            const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
            const { getFirestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            const firebaseConfig = {
                apiKey: "AIzaSyDSDK0NfVSs_VQb3TnrixiJbOpTsmoUMvU",
                authDomain: "misterpips-b71fb.firebaseapp.com",
                projectId: "misterpips-b71fb",
                storageBucket: "misterpips-b71fb.firebasestorage.app",
                messagingSenderId: "574231126409",
                appId: "1:574231126409:web:b7ed93ac4ea62e247dc158"
            };
            
            this.app = initializeApp(firebaseConfig);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);
            this.firebaseModules = { doc, setDoc, getDoc, onSnapshot, serverTimestamp };
            
            onAuthStateChanged(this.auth, (user) => {
                if (user) {
                    this.currentUser = user.email;
                    this.loadUserData();
                    this.setupRealtimeSync();
                } else {
                    window.location.href = 'index.html';
                }
            });
            
        } catch (error) {
            console.error('Erreur Firebase:', error);
            this.currentUser = 'local_user';
            this.loadLocalData();
        }
    }
    
    waitForFirebaseAuth() {
        return new Promise((resolve) => {
            const checkAuth = () => {
                if (window.firebaseAuth || document.querySelector('script[src*="firebase-auth"]')) {
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }
    
    async loadUserData() {
        if (!this.db || !this.currentUser) {
            this.loadLocalData();
            return;
        }
        
        try {
            const userDocRef = this.firebaseModules.doc(this.db, 'users', this.currentUser);
            const userDoc = await this.firebaseModules.getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                this.accounts = userData.accounts || this.accounts;
                this.currentAccount = userData.currentAccount || 'compte1';
                this.trades = userData.trades?.[this.currentAccount] || [];
                this.settings = userData.settings?.[this.currentAccount] || { capital: 1000, riskPerTrade: 2 };
                this.lastDataHash = userData.dataHash;
            } else {
                await this.saveUserData();
            }
            
            this.updateStats();
            this.renderTradesTable();
            this.updateCharts();
            this.updateCalendar();
            this.updateAccountDisplay();
            this.updateAccountSelector();
            
        } catch (error) {
            console.error('Erreur chargement données utilisateur:', error);
            this.loadLocalData();
        }
    }
    
    loadLocalData() {
        this.currentUser = sessionStorage.getItem('currentUser') || 'local_user';
        this.currentAccount = localStorage.getItem(`currentAccount_${this.currentUser}`) || 'compte1';
        
        try {
            this.trades = JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${this.currentAccount}`)) || [];
            this.settings = JSON.parse(localStorage.getItem(`settings_${this.currentUser}_${this.currentAccount}`)) || { capital: 1000, riskPerTrade: 2 };
            this.accounts = JSON.parse(localStorage.getItem(`accounts_${this.currentUser}`)) || this.accounts;
        } catch (error) {
            console.error('Erreur chargement local:', error);
        }
    }
    
    generateDataHash() {
        const dataString = JSON.stringify({
            accounts: this.accounts,
            currentAccount: this.currentAccount,
            trades: this.trades,
            settings: this.settings
        });
        return this.simpleHash(dataString);
    }
    
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    
    async saveUserData() {
        this.saveToStorage();
        
        if (this.db && this.currentUser && !this.syncInProgress) {
            try {
                this.syncInProgress = true;
                
                const currentDataHash = this.generateDataHash();
                if (currentDataHash === this.lastDataHash) {
                    this.syncInProgress = false;
                    return;
                }
                
                const userData = {
                    accounts: this.accounts,
                    currentAccount: this.currentAccount,
                    trades: {},
                    settings: {},
                    lastModified: this.firebaseModules.serverTimestamp(),
                    dataHash: currentDataHash
                };
                
                Object.keys(this.accounts).forEach(accountId => {
                    userData.trades[accountId] = accountId === this.currentAccount ? this.trades : 
                        JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${accountId}`)) || [];
                    userData.settings[accountId] = accountId === this.currentAccount ? this.settings :
                        JSON.parse(localStorage.getItem(`settings_${this.currentUser}_${accountId}`)) || { capital: 1000, riskPerTrade: 2 };
                });
                
                const userDocRef = this.firebaseModules.doc(this.db, 'users', this.currentUser);
                await this.firebaseModules.setDoc(userDocRef, userData);
                
                this.lastDataHash = currentDataHash;
                this.updateSyncStatus('✅ Syncé');
                setTimeout(() => this.updateSyncStatus('🔄 Sync Auto'), 1000);
                
            } catch (error) {
                console.error('Erreur sauvegarde Firebase:', error);
                this.updateSyncStatus('❌ Erreur sync');
            } finally {
                this.syncInProgress = false;
            }
        }
    }

    init() {
        console.log('Initializing dashboard...');
        this.setupEventListeners();
        this.initAccountSelector();
        this.updateStats();
        this.renderTradesTable();
        this.initCharts();
        this.updateCharts();
        this.initCalendar();
        this.updateAccountDisplay();
        this.updateAccountSelector();
        console.log('Dashboard initialized successfully');
    }

    setupEventListeners() {
        // Attendre que le DOM soit complètement chargé
        const setupButtons = () => {
            const newTradeBtn = document.getElementById('newTradeBtn');
            const settingsBtn = document.getElementById('settingsBtn');
            const closeTradeBtn = document.getElementById('closeTradeBtn');
            const resetBtn = document.getElementById('resetBtn');
            const manualCloseBtn = document.getElementById('manualCloseBtn');
            const exportBtn = document.getElementById('exportBtn');
            const closeModal = document.querySelector('.close');
            const addAccountBtn = document.getElementById('addAccountBtn');
            const deleteAccountBtn = document.getElementById('deleteAccountBtn');
            const accountSelect = document.getElementById('accountSelect');
            const prevMonth = document.getElementById('prevMonth');
            const nextMonth = document.getElementById('nextMonth');

            if (newTradeBtn) {
                newTradeBtn.onclick = () => this.startNewTrade();
                console.log('New Trade button configured');
            }
            if (settingsBtn) {
                settingsBtn.onclick = () => this.showSettings();
                console.log('Settings button configured');
            }
            if (closeTradeBtn) {
                closeTradeBtn.onclick = () => this.showCloseTradeModal();
                console.log('Close Trade button configured');
            }
            if (resetBtn) {
                resetBtn.onclick = () => this.resetAllData();
                console.log('Reset button configured');
            }
            if (manualCloseBtn) {
                manualCloseBtn.onclick = () => this.showManualCloseModal();
                console.log('Manual Close button configured');
            }
            if (exportBtn) {
                exportBtn.onclick = () => this.exportToExcel();
                console.log('Export button configured');
            }
            if (closeModal) {
                closeModal.onclick = () => this.closeModal();
            }
            if (addAccountBtn) {
                addAccountBtn.onclick = () => this.addNewAccount();
            }
            if (deleteAccountBtn) {
                deleteAccountBtn.onclick = () => this.deleteAccount();
            }
            if (accountSelect) {
                accountSelect.onchange = (e) => this.switchAccount(e.target.value);
            }
            if (prevMonth) {
                prevMonth.onclick = () => {
                    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
                    this.renderCalendar();
                };
            }
            if (nextMonth) {
                nextMonth.onclick = () => {
                    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
                    this.renderCalendar();
                };
            }
            
            window.onclick = (e) => {
                if (e.target === document.getElementById('tradeModal')) {
                    this.closeModal();
                }
                if (e.target === document.getElementById('fullscreenModal')) {
                    this.closeFullscreen();
                }
            };
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupButtons);
        } else {
            setupButtons();
        }
    }

    updateStats() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const openTrades = this.trades.filter(t => t.status === 'open');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const winRate = closedTrades.length > 0 ? 
            (closedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length / closedTrades.length * 100).toFixed(1) : 0;
        
        const initialCapital = this.accounts[this.currentAccount]?.capital || this.settings.capital;
        const currentCapital = initialCapital + totalPnL;
        
        const statsElements = {
            totalTrades: document.getElementById('totalTrades'),
            openTrades: document.getElementById('openTrades'),
            totalPnL: document.getElementById('totalPnL'),
            winRate: document.getElementById('winRate'),
            capital: document.getElementById('capital')
        };
        
        if (statsElements.totalTrades) statsElements.totalTrades.textContent = this.trades.length;
        if (statsElements.openTrades) statsElements.openTrades.textContent = openTrades.length;
        if (statsElements.totalPnL) {
            statsElements.totalPnL.textContent = `$${totalPnL.toFixed(2)}`;
            statsElements.totalPnL.className = totalPnL >= 0 ? 'positive' : 'negative';
        }
        if (statsElements.winRate) statsElements.winRate.textContent = `${winRate}%`;
        if (statsElements.capital) {
            statsElements.capital.textContent = `$${currentCapital.toFixed(2)}`;
            statsElements.capital.className = totalPnL >= 0 ? 'positive' : 'negative';
        }
    }

    instantSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveUserData();
        }, 100);
    }

    saveToStorage() {
        if (!this.currentUser) return;
        
        localStorage.setItem(`trades_${this.currentUser}_${this.currentAccount}`, JSON.stringify(this.trades));
        localStorage.setItem(`settings_${this.currentUser}_${this.currentAccount}`, JSON.stringify(this.settings));
        localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
        localStorage.setItem(`currentAccount_${this.currentUser}`, this.currentAccount);
        
        this.instantSave();
    }

    switchAccount(accountId) {
        if (!accountId || accountId === this.currentAccount) return;
        
        this.saveToStorage();
        this.currentAccount = accountId;
        
        if (this.currentUser) {
            this.trades = JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${this.currentAccount}`)) || [];
            this.settings = JSON.parse(localStorage.getItem(`settings_${this.currentUser}_${this.currentAccount}`)) || { capital: this.accounts[accountId]?.capital || 1000, riskPerTrade: 2 };
        }
        
        this.updateStats();
        this.renderTradesTable();
        this.updateCharts();
        this.updateCalendar();
        this.updateAccountDisplay();
        
        this.showNotification(`Compte changé: ${this.accounts[accountId]?.name || accountId}`);
        
        setTimeout(() => this.instantSave(), 500);
    }

    updateAccountDisplay() {
        const capitalElement = document.getElementById('capital');
        if (capitalElement && this.accounts[this.currentAccount]) {
            const closedTrades = this.trades.filter(t => t.status === 'closed');
            const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
            const initialCapital = this.accounts[this.currentAccount].capital;
            const currentCapital = initialCapital + totalPnL;
            
            capitalElement.textContent = `$${currentCapital.toFixed(2)}`;
            capitalElement.className = totalPnL >= 0 ? 'positive' : 'negative';
            
            const headerTitle = document.querySelector('header h1');
            if (headerTitle && this.currentUser) {
                const userName = this.currentUser.split('@')[0] || this.currentUser;
                headerTitle.innerHTML = `Dashboard Trading <span style="font-size: 0.6em; opacity: 0.7;">- ${userName}</span>`;
            }
        }
    }

    setupRealtimeSync() {
        if (!this.db || !this.currentUser) return;
        
        try {
            const userDocRef = this.firebaseModules.doc(this.db, 'users', this.currentUser);
            
            this.firebaseModules.onSnapshot(userDocRef, (doc) => {
                if (doc.exists() && !this.syncInProgress) {
                    const data = doc.data();
                    if (data.lastModified && data.lastModified.seconds) {
                        const remoteTime = data.lastModified.seconds * 1000;
                        const localTime = this.lastSyncTime || 0;
                        
                        if (remoteTime > localTime) {
                            this.handleRemoteUpdate(data);
                        }
                    }
                }
            });
            
            setInterval(() => {
                if (!this.syncInProgress) {
                    const currentHash = this.generateDataHash();
                    if (currentHash !== this.lastDataHash) {
                        this.saveUserData();
                    }
                }
            }, 30000);
            
            this.updateSyncStatus('🔄 Sync Auto');
            
        } catch (error) {
            console.error('Erreur setup sync temps réel:', error);
            this.updateSyncStatus('❌ Sync désactivé');
        }
    }
    
    handleRemoteUpdate(data) {
        console.log('Mise à jour reçue depuis un autre appareil');
        
        const remoteHash = data.dataHash;
        const localHash = this.generateDataHash();
        
        if (remoteHash === localHash) {
            return;
        }
        
        const remoteTime = data.lastModified?.seconds * 1000 || 0;
        const localTime = this.lastSyncTime || 0;
        
        if (remoteTime <= localTime) {
            return;
        }
        
        this.syncInProgress = true;
        
        try {
            this.accounts = data.accounts || this.accounts;
            
            if (data.trades && data.trades[this.currentAccount]) {
                this.trades = data.trades[this.currentAccount];
            }
            if (data.settings && data.settings[this.currentAccount]) {
                this.settings = data.settings[this.currentAccount];
            }
            
            localStorage.setItem(`trades_${this.currentUser}_${this.currentAccount}`, JSON.stringify(this.trades));
            localStorage.setItem(`settings_${this.currentUser}_${this.currentAccount}`, JSON.stringify(this.settings));
            localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
            
            this.updateStats();
            this.renderTradesTable();
            this.updateCharts();
            this.updateCalendar();
            this.updateAccountSelector();
            this.updateAccountDisplay();
            
            this.lastSyncTime = remoteTime;
            this.lastDataHash = remoteHash;
            this.showNotification('🔄 Données synchronisées depuis un autre appareil');
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    updateSyncStatus(status) {
        const syncStatusElement = document.getElementById('syncStatus');
        if (syncStatusElement) {
            syncStatusElement.textContent = status;
            syncStatusElement.className = status.includes('✅') ? 'sync-success' : 
                                         status.includes('❌') ? 'sync-error' : 'sync-active';
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00d4ff, #5b86e5);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    startNewTrade() {
        this.currentStep = 0;
        this.currentTrade = {
            date: this.getCurrentDate(),
            confluences: {},
            comments: {}
        };
        this.showModal();
        this.renderChecklistStep();
    }

    getCurrentDate() {
        const now = new Date();
        const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    renderChecklistStep() {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        if (this.currentStep < this.checklistSteps.length) {
            const step = this.checklistSteps[this.currentStep];
            const optionsHtml = step.options.map((option, index) => 
                `<button class="btn-yes btn-small" data-answer="${option}">${option}</button>`
            ).join('');
            
            const chartHtml = this.renderStepChart(this.currentStep + 1);
            const validationHtml = this.renderValidationCriteria(this.currentStep + 1);
            
            modalContent.innerHTML = `
                <h2>Étape ${this.currentStep + 1}/${this.checklistSteps.length}</h2>
                <div class="step">
                    <h3>${step.title}</h3>
                    <div class="education-content">
                        <h4>💡 Explication :</h4>
                        <p>${step.education}</p>
                    </div>
                    ${chartHtml}
                    ${validationHtml}
                    <p><strong>${step.question}</strong></p>
                    <div class="step-buttons">
                        ${optionsHtml}
                    </div>
                    <textarea class="comment-box" placeholder="Commentaire (optionnel)..." id="stepComment"></textarea>
                    <div style="text-align: center; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
                        <button class="btn-skip" id="skipToTradeBtn">⏩ Passer les étapes</button>
                    </div>
                </div>
            `;
            
            // Event listeners pour les boutons d'options
            modalContent.querySelectorAll('.btn-yes').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.answerStep(e.target.dataset.answer);
                });
            });
            
            // Event listener pour le bouton skip
            const skipBtn = document.getElementById('skipToTradeBtn');
            if (skipBtn) {
                skipBtn.addEventListener('click', () => this.skipToTrade());
            }
        } else {
            this.renderTradeForm();
        }
    }

    renderStepChart(stepNumber) {
        const charts = {
            1: `<div class="strategy-chart"><img src="step1_context.svg" alt="Contexte Multi-timeframe" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('step1_context.svg', 'Contexte Multi-timeframe')">🔍 Plein écran</button></div>`,
            2: `<div class="strategy-chart"><img src="step2_orderblock.svg" alt="Order Block Strategy" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('step2_orderblock.svg', 'Order Block Strategy')">🔍 Plein écran</button></div>`,
            3: `<div class="strategy-chart"><img src="step3_bos.svg" alt="Break of Structure" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('step3_bos.svg', 'Break of Structure')">🔍 Plein écran</button></div>`,
            4: `<div class="strategy-chart"><img src="step4_killzones.svg" alt="Killzones Trading" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('step4_killzones.svg', 'Killzones Trading')">🔍 Plein écran</button></div>`,
            5: `<div class="strategy-chart"><img src="step5_entry.svg" alt="Signal d'Entrée" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('step5_entry.svg', 'Signal d\\'Entrée')">🔍 Plein écran</button></div>`,
            6: `<div class="strategy-chart"><img src="step6_risk.svg" alt="Risk Management" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('step6_risk.svg', 'Risk Management')">🔍 Plein écran</button></div>`,
            7: `<div class="strategy-chart"><img src="step7_discipline.svg" alt="Discipline Trading" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('step7_discipline.svg', 'Discipline Trading')">🔍 Plein écran</button></div>`
        };
        return charts[stepNumber] || '';
    }

    renderValidationCriteria(stepNumber) {
        const criteria = {
            1: [
                '✓ Tendance Daily identifiée clairement',
                '✓ Zone H4 Premium/Discount définie',
                '✓ Confluence avec structure majeure',
                '✓ Direction cohérente multi-timeframe'
            ],
            2: [
                '✓ Zone de rejet claire identifiée',
                '✓ Volume élevé dans la zone',
                '✓ Respect de la zone précédemment',
                '✓ Confluence avec structure majeure'
            ],
            3: [
                '✓ Cassure nette du niveau précédent',
                '✓ Clôture au-dessus/en-dessous',
                '✓ Volume accompagnant la cassure',
                '✓ Pas de faux breakout récent'
            ],
            4: [
                '✓ Heure de session respectée',
                '✓ Liquidité institutionnelle présente',
                '✓ Confluence avec analyse technique',
                '✓ Momentum favorable'
            ],
            5: [
                '✓ Signal d\'entrée clair',
                '✓ Confluence de 3+ facteurs',
                '✓ Risk/Reward favorable (>1:2)',
                '✓ Stop loss logique placé'
            ],
            6: [
                '✓ Risque ≤ 2% du capital',
                '✓ Position sizing calculée',
                '✓ Stop loss défini',
                '✓ Take profit planifié'
            ],
            7: [
                '✓ Plan de trading suivi',
                '✓ Émotions contrôlées',
                '✓ Pas de sur-trading',
                '✓ Journal de trading tenu'
            ]
        };
        
        const stepCriteria = criteria[stepNumber] || [];
        return `
            <div class="validation-criteria">
                <h4>🎯 Critères de Validation:</h4>
                <ul class="criteria-list">
                    ${stepCriteria.map(criterion => `<li>${criterion}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    answerStep(answer) {
        const step = this.checklistSteps[this.currentStep];
        const commentElement = document.getElementById('stepComment');
        const comment = commentElement ? commentElement.value : '';
        
        this.currentTrade.confluences[step.key] = answer;
        if (comment) {
            this.currentTrade.comments[step.key] = comment;
        }
        
        this.currentStep++;
        this.renderChecklistStep();
    }

    skipToTrade() {
        for (let i = this.currentStep; i < this.checklistSteps.length; i++) {
            const step = this.checklistSteps[i];
            this.currentTrade.confluences[step.key] = step.options[0];
        }
        this.renderTradeForm();
    }

    renderTradeForm() {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const initialCapital = this.accounts[this.currentAccount]?.capital || this.settings.capital;
        const currentCapital = initialCapital + totalPnL;
        const riskAmount = (currentCapital * this.settings.riskPerTrade / 100).toFixed(2);
        
        modalContent.innerHTML = `
            <h2>Paramètres du Trade</h2>
            <div class="education-content">
                <h4>💰 Capital actuel: $${currentCapital.toFixed(2)} | Risque: ${this.settings.riskPerTrade}% ($${riskAmount})</h4>
            </div>
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
                    <input type="number" id="entryPoint" step="0.00001" placeholder="1.12345">
                </div>
                <div class="form-group">
                    <label>Stop Loss:</label>
                    <input type="number" id="stopLoss" step="0.00001" placeholder="1.12000">
                </div>
                <div class="form-group">
                    <label>Take Profit:</label>
                    <input type="number" id="takeProfit" step="0.00001" placeholder="1.13000">
                </div>
                <div class="form-group">
                    <label>Lot:</label>
                    <input type="number" id="lotSize" step="0.01" placeholder="0.10">
                </div>
                <div class="form-group">
                    <label>Ratio R:R:</label>
                    <input type="text" id="riskReward" readonly>
                </div>
                <div class="form-group">
                    <label>Montant risqué ($):</label>
                    <input type="text" id="riskAmount" readonly>
                </div>
                <div class="form-group">
                    <label>Gain potentiel ($):</label>
                    <input type="text" id="potentialGain" readonly>
                </div>
                <div class="form-buttons">
                    <button class="btn-submit" id="saveTradeBtn">Enregistrer Trade</button>
                    <button class="btn-secondary" id="cancelTradeBtn">Annuler</button>
                </div>
            </div>
        `;
        
        // Event listeners pour les inputs
        const entryPoint = document.getElementById('entryPoint');
        const stopLoss = document.getElementById('stopLoss');
        const takeProfit = document.getElementById('takeProfit');
        const lotSize = document.getElementById('lotSize');
        
        if (entryPoint) entryPoint.addEventListener('input', () => this.calculateLotSize());
        if (stopLoss) stopLoss.addEventListener('input', () => this.calculateLotSize());
        if (takeProfit) takeProfit.addEventListener('input', () => this.calculateLotSize());
        if (lotSize) lotSize.addEventListener('input', () => this.calculateFromLot());
        
        // Event listeners pour les boutons
        const saveBtn = document.getElementById('saveTradeBtn');
        const cancelBtn = document.getElementById('cancelTradeBtn');
        
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveTrade());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
    }

    calculateLotSize() {
        const entryPoint = parseFloat(document.getElementById('entryPoint')?.value) || 0;
        const stopLoss = parseFloat(document.getElementById('stopLoss')?.value) || 0;
        const currency = document.getElementById('currency')?.value || 'EUR/USD';
        
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const initialCapital = this.accounts[this.currentAccount]?.capital || this.settings.capital;
        const currentCapital = initialCapital + totalPnL;
        const riskAmount = currentCapital * this.settings.riskPerTrade / 100;
        
        if (entryPoint > 0 && stopLoss > 0 && entryPoint !== stopLoss) {
            let lotSize = 0;
            const slDistance = Math.abs(entryPoint - stopLoss);
            
            if (currency === 'XAU/USD') {
                lotSize = riskAmount / (slDistance * 100);
            } else if (currency.includes('JPY')) {
                const pipDistance = slDistance * 100;
                lotSize = riskAmount / (pipDistance * 10);
            } else {
                const pipDistance = slDistance * 10000;
                lotSize = riskAmount / (pipDistance * 10);
            }
            
            const lotSizeElement = document.getElementById('lotSize');
            if (lotSizeElement) {
                lotSizeElement.value = Math.max(0.01, lotSize).toFixed(2);
            }
        }
        
        this.calculateFromLot();
    }

    calculateFromLot() {
        const entryPoint = parseFloat(document.getElementById('entryPoint')?.value) || 0;
        const stopLoss = parseFloat(document.getElementById('stopLoss')?.value) || 0;
        const takeProfit = parseFloat(document.getElementById('takeProfit')?.value) || 0;
        const lotSize = parseFloat(document.getElementById('lotSize')?.value) || 0;
        const currency = document.getElementById('currency')?.value || 'EUR/USD';
        
        if (entryPoint > 0 && stopLoss > 0 && lotSize > 0 && entryPoint !== stopLoss) {
            const slDistance = Math.abs(entryPoint - stopLoss);
            let riskAmount = 0;
            
            if (currency === 'XAU/USD') {
                riskAmount = slDistance * lotSize * 100;
            } else if (currency.includes('JPY')) {
                const pipDistance = slDistance * 100;
                riskAmount = pipDistance * lotSize * 10;
            } else {
                const pipDistance = slDistance * 10000;
                riskAmount = pipDistance * lotSize * 10;
            }
            
            const riskAmountElement = document.getElementById('riskAmount');
            if (riskAmountElement) {
                riskAmountElement.value = '$' + riskAmount.toFixed(2);
            }
            
            if (takeProfit > 0 && takeProfit !== entryPoint) {
                const tpDistance = Math.abs(takeProfit - entryPoint);
                let potentialGain = 0;
                
                if (currency === 'XAU/USD') {
                    potentialGain = tpDistance * lotSize * 100;
                } else if (currency.includes('JPY')) {
                    const pipDistanceTP = tpDistance * 100;
                    potentialGain = pipDistanceTP * lotSize * 10;
                } else {
                    const pipDistanceTP = tpDistance * 10000;
                    potentialGain = pipDistanceTP * lotSize * 10;
                }
                
                const potentialGainElement = document.getElementById('potentialGain');
                const riskRewardElement = document.getElementById('riskReward');
                
                if (potentialGainElement) {
                    potentialGainElement.value = '$' + potentialGain.toFixed(2);
                }
                
                if (riskRewardElement && riskAmount > 0) {
                    const riskReward = (potentialGain / riskAmount).toFixed(2);
                    riskRewardElement.value = `1:${riskReward}`;
                }
            }
        }
    }

    saveTrade() {
        const currency = document.getElementById('currency')?.value;
        const entryPoint = parseFloat(document.getElementById('entryPoint')?.value);
        const stopLoss = parseFloat(document.getElementById('stopLoss')?.value);
        const takeProfit = parseFloat(document.getElementById('takeProfit')?.value);
        const lotSize = parseFloat(document.getElementById('lotSize')?.value);
        const riskPercent = this.settings.riskPerTrade;
        const timestamp = Date.now();

        if (!currency || !entryPoint || !stopLoss || !takeProfit || !lotSize) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const trade = {
            ...this.currentTrade,
            id: `${this.currentUser}_${timestamp}`,
            currency,
            entryPoint,
            stopLoss,
            takeProfit,
            lotSize,
            riskPercent,
            status: 'open',
            createdAt: timestamp,
            lastModified: timestamp
        };
        
        this.trades.push(trade);
        this.saveToStorage();
        this.closeModal();
        this.updateStats();
        this.renderTradesTable();
        this.updateCharts();
        this.updateCalendar();
        this.showNotification('Trade enregistré avec succès!');
    }

    showModal() {
        const modal = document.getElementById('tradeModal');
        if (modal) modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('tradeModal');
        if (modal) modal.style.display = 'none';
    }

    renderTradesTable() {
        const tbody = document.querySelector('#tradesTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.trades.slice(-10).reverse().forEach((trade, index) => {
            const row = document.createElement('tr');
            const pnl = parseFloat(trade.pnl || 0);
            const pnlClass = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : '';
            
            row.innerHTML = `
                <td>${trade.date}</td>
                <td>${trade.currency}</td>
                <td>${trade.entryPoint}</td>
                <td>${trade.stopLoss}</td>
                <td>${trade.takeProfit}</td>
                <td>${trade.lotSize}</td>
                <td>${trade.riskPercent || 2}%</td>
                <td>${trade.result || (trade.status === 'open' ? 'OPEN' : '-')}</td>
                <td class="${pnlClass}">$${pnl.toFixed(2)}</td>
                <td>
                    ${trade.status === 'open' ? 
                        `<button class="btn-small btn-danger" onclick="dashboard.quickCloseTrade(${this.trades.indexOf(trade)})">Clôturer</button>` : 
                        '-'
                    }
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    quickCloseTrade(index) {
        const trade = this.trades[index];
        if (!trade || trade.status === 'closed') return;
        
        const result = prompt('Résultat du trade (TP/SL/BE):', 'TP');
        if (!result) return;
        
        this.closeTrade(index, result.toUpperCase());
    }

    closeTrade(index, result) {
        const trade = this.trades[index];
        if (!trade || trade.status === 'closed') return;
        
        trade.result = result;
        trade.status = 'closed';
        trade.lastModified = Date.now();
        
        if (result === 'TP') {
            trade.closePrice = trade.takeProfit;
        } else if (result === 'SL') {
            trade.closePrice = trade.stopLoss;
        } else if (result === 'BE') {
            trade.closePrice = trade.entryPoint;
        }
        
        trade.pnl = this.calculatePnL(trade);
        
        this.saveToStorage();
        this.updateStats();
        this.renderTradesTable();
        this.updateCharts();
        this.updateCalendar();
        
        this.showNotification(`Trade ${trade.currency} clôturé en ${result}`);
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

    showSettings() {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <h2>⚙️ Paramètres</h2>
            <div class="trade-form">
                <div class="form-group">
                    <label>Capital initial ($):</label>
                    <input type="number" id="capitalInput" value="${this.settings.capital}" step="100">
                </div>
                <div class="form-group">
                    <label>Risque par trade (%):</label>
                    <input type="number" id="riskInput" value="${this.settings.riskPerTrade}" step="0.1" min="0.1" max="10">
                </div>
                <div class="form-buttons">
                    <button class="btn-submit" id="saveSettingsBtn">Sauvegarder</button>
                    <button class="btn-secondary" id="cancelSettingsBtn">Annuler</button>
                </div>
            </div>
        `;
        
        // Event listeners pour les boutons
        const saveBtn = document.getElementById('saveSettingsBtn');
        const cancelBtn = document.getElementById('cancelSettingsBtn');
        
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveSettings());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        
        this.showModal();
    }

    saveSettings() {
        const capital = parseFloat(document.getElementById('capitalInput')?.value) || 1000;
        const riskPerTrade = parseFloat(document.getElementById('riskInput')?.value) || 2;
        
        this.settings = { capital, riskPerTrade };
        this.accounts[this.currentAccount].capital = capital;
        this.saveToStorage();
        this.updateStats();
        this.updateAccountDisplay();
        this.closeModal();
        this.showNotification('Paramètres sauvegardés!');
    }

    showFullscreenImage(imageSrc, title) {
        const modal = document.getElementById('fullscreenModal');
        const content = document.getElementById('fullscreenContent');
        if (modal && content) {
            content.innerHTML = `
                <div class="fullscreen-header">
                    <h2>${title}</h2>
                    <button class="close-fullscreen">✕</button>
                </div>
                <div class="fullscreen-image-container">
                    <img src="${imageSrc}" alt="${title}" style="width: 100%; height: auto; max-height: 90vh; object-fit: contain;">
                </div>
            `;
            modal.style.display = 'flex';
            
            const closeBtn = content.querySelector('.close-fullscreen');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeFullscreen());
            }
        }
    }

    closeFullscreen() {
        const modal = document.getElementById('fullscreenModal');
        if (modal) modal.style.display = 'none';
    }

    initAccountSelector() {
        const accountSelect = document.getElementById('accountSelect');
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
    }

    updateAccountSelector() {
        this.initAccountSelector();
    }

    addNewAccount() {
        const name = prompt('Nom du nouveau compte:');
        const capital = parseFloat(prompt('Capital initial ($):')) || 1000;
        
        if (name) {
            const accountId = 'compte' + (Object.keys(this.accounts).length + 1);
            this.accounts[accountId] = { name, capital };
            this.saveToStorage();
            this.updateAccountSelector();
            this.showNotification(`Compte "${name}" créé avec succès!`);
        }
    }

    deleteAccount() {
        if (Object.keys(this.accounts).length <= 1) {
            alert('Impossible de supprimer le dernier compte');
            return;
        }
        
        if (confirm(`Supprimer le compte "${this.accounts[this.currentAccount].name}" ?")) {
            delete this.accounts[this.currentAccount];
            this.currentAccount = Object.keys(this.accounts)[0];
            this.loadUserData();
            this.updateAccountSelector();
            this.showNotification('Compte supprimé');
        }
    }

    resetAllData() {
        if (confirm('⚠️ ATTENTION: Cette action supprimera TOUS vos trades et données. Êtes-vous sûr ?')) {
            this.trades = [];
            this.settings = { capital: 1000, riskPerTrade: 2 };
            this.accounts[this.currentAccount].capital = 1000;
            this.saveToStorage();
            this.updateStats();
            this.renderTradesTable();
            this.updateCharts();
            this.updateCalendar();
            this.showNotification('Toutes les données ont été supprimées');
        }
    }

    exportToExcel() {
        if (this.trades.length === 0) {
            alert('Aucun trade à exporter');
            return;
        }
        
        let csvContent = "Date,Instrument,Entrée,Stop Loss,Take Profit,Lot,Risque %,Résultat,P&L\n";
        
        this.trades.forEach(trade => {
            const pnl = parseFloat(trade.pnl || 0);
            csvContent += `${trade.date},${trade.currency},${trade.entryPoint},${trade.stopLoss},${trade.takeProfit},${trade.lotSize},${trade.riskPercent || 2}%,${trade.result || 'OPEN'},${pnl.toFixed(2)}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `trades_${this.currentUser}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Export CSV téléchargé!');
    }

    initCharts() {
        this.createPerformanceChart();
        this.createWinRateChart();
        this.createMonthlyChart();
    }

    createPerformanceChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const closedTrades = this.trades.filter(t => t.status === 'closed').sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let cumulativePnL = 0;
        const data = [0];
        const labels = ['Début'];
        
        closedTrades.forEach((trade, index) => {
            cumulativePnL += parseFloat(trade.pnl || 0);
            data.push(cumulativePnL);
            labels.push(`T${index + 1}`);
        });
        
        this.drawLineChart(ctx, labels, data, 'Performance Cumulative', '#00d4ff');
    }

    createWinRateChart() {
        const canvas = document.getElementById('winRateChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const wins = closedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length;
        const losses = closedTrades.length - wins;
        
        this.drawPieChart(ctx, ['Gains', 'Pertes'], [wins, losses], ['#00ff88', '#ff4444']);
    }

    createMonthlyChart() {
        const canvas = document.getElementById('monthlyChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const monthlyData = {};
        
        closedTrades.forEach(trade => {
            const month = trade.date.substring(0, 7);
            if (!monthlyData[month]) monthlyData[month] = 0;
            monthlyData[month] += parseFloat(trade.pnl || 0);
        });
        
        const labels = Object.keys(monthlyData).sort();
        const data = labels.map(month => monthlyData[month]);
        
        this.drawBarChart(ctx, labels, data, 'Performance Mensuelle', '#5b86e5');
    }

    drawLineChart(ctx, labels, data, title, color) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 20);
        
        if (data.length < 2) return;
        
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);
        const range = maxValue - minValue || 1;
        
        const stepX = (width - 2 * padding) / (data.length - 1);
        const stepY = (height - 2 * padding - 40) / range;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = padding + index * stepX;
            const y = height - padding - ((value - minValue) * stepY);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        ctx.fillStyle = color;
        data.forEach((value, index) => {
            const x = padding + index * stepX;
            const y = height - padding - ((value - minValue) * stepY);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    drawPieChart(ctx, labels, data, colors) {
        const canvas = ctx.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const total = data.reduce((sum, value) => sum + value, 0);
        if (total === 0) return;
        
        let currentAngle = -Math.PI / 2;
        
        data.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.fillStyle = colors[index];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${labels[index]}: ${value}`, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    }

    drawBarChart(ctx, labels, data, title, color) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 20);
        
        if (data.length === 0) return;
        
        const maxValue = Math.max(...data, 0);
        const minValue = Math.min(...data, 0);
        const range = maxValue - minValue || 1;
        
        const barWidth = (width - 2 * padding) / data.length * 0.8;
        const stepX = (width - 2 * padding) / data.length;
        
        data.forEach((value, index) => {
            const x = padding + index * stepX + stepX * 0.1;
            const barHeight = Math.abs(value) / range * (height - 2 * padding - 40);
            const y = value >= 0 ? 
                height - padding - (maxValue / range * (height - 2 * padding - 40)) - barHeight :
                height - padding - (maxValue / range * (height - 2 * padding - 40));
            
            ctx.fillStyle = value >= 0 ? color : '#ff4444';
            ctx.fillRect(x, y, barWidth, barHeight);
        });
    }

    updateCharts() {
        this.createPerformanceChart();
        this.createWinRateChart();
        this.createMonthlyChart();
        this.updateGauge();
        this.updateConfluenceAnalysis();
        this.updateCorrelationMatrix();
    }

    updateGauge() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const initialCapital = this.accounts[this.currentAccount]?.capital || this.settings.capital;
        const currentCapital = initialCapital + totalPnL;
        const returnPercent = initialCapital > 0 ? ((totalPnL / initialCapital) * 100) : 0;
        
        const gainsValue = document.getElementById('gainsValue');
        const gainsPercent = document.getElementById('gainsPercent');
        const gainsGauge = document.getElementById('gainsGauge');
        
        if (gainsValue) {
            gainsValue.textContent = `$${totalPnL.toFixed(2)}`;
            gainsValue.className = totalPnL >= 0 ? 'gauge-value positive' : 'gauge-value negative';
        }
        
        if (gainsPercent) {
            gainsPercent.textContent = `${returnPercent.toFixed(1)}%`;
            gainsPercent.className = returnPercent >= 0 ? 'gauge-percent positive' : 'gauge-percent negative';
        }
        
        if (gainsGauge) {
            const angle = Math.min(Math.max((returnPercent + 50) * 3.6, 0), 360);
            gainsGauge.style.background = `conic-gradient(from 0deg, 
                ${returnPercent < -20 ? '#ff6b6b' : returnPercent < 0 ? '#ffc107' : returnPercent < 20 ? '#4ecdc4' : '#00ff88'} 0deg ${angle}deg, 
                #333 ${angle}deg 360deg)`;
        }
    }

    updateConfluenceAnalysis() {
        const confluenceAnalysis = document.getElementById('confluenceAnalysis');
        const confluencesChart = document.getElementById('confluencesChart');
        
        if (!confluenceAnalysis || !confluencesChart) return;
        
        const closedTrades = this.trades.filter(t => t.status === 'closed' && t.confluences);
        
        if (closedTrades.length === 0) {
            confluenceAnalysis.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6);">Aucune donnée de confluence disponible</p>';
            return;
        }
        
        const confluenceStats = {};
        const confluenceWins = {};
        
        closedTrades.forEach(trade => {
            Object.entries(trade.confluences || {}).forEach(([key, value]) => {
                if (!confluenceStats[key]) {
                    confluenceStats[key] = { total: 0, wins: 0 };
                }
                confluenceStats[key].total++;
                if (parseFloat(trade.pnl || 0) > 0) {
                    confluenceStats[key].wins++;
                }
            });
        });
        
        let analysisHtml = '<h4>📊 Analyse des Confluences</h4>';
        
        Object.entries(confluenceStats).forEach(([confluence, stats]) => {
            const winRate = stats.total > 0 ? (stats.wins / stats.total * 100) : 0;
            const scoreClass = winRate >= 80 ? 'score-excellent' : 
                              winRate >= 60 ? 'score-good' : 
                              winRate >= 40 ? 'score-average' : 'score-poor';
            
            analysisHtml += `
                <div class="analysis-item">
                    <span class="confluence-name">${this.getConfluenceName(confluence)}</span>
                    <span class="confluence-score ${scoreClass}">${winRate.toFixed(1)}%</span>
                </div>
            `;
        });
        
        const bestConfluence = Object.entries(confluenceStats)
            .sort(([,a], [,b]) => (b.wins/b.total) - (a.wins/a.total))[0];
        
        if (bestConfluence) {
            const [name, stats] = bestConfluence;
            const winRate = (stats.wins / stats.total * 100).toFixed(1);
            analysisHtml += `
                <div class="recommendation">
                    <strong>💡 Recommandation:</strong> Votre meilleure confluence est "${this.getConfluenceName(name)}" avec ${winRate}% de réussite sur ${stats.total} trades.
                </div>
            `;
        }
        
        confluenceAnalysis.innerHTML = analysisHtml;
        
        this.drawConfluenceChart(confluencesChart, confluenceStats);
    }

    getConfluenceName(key) {
        const names = {
            'contextGlobal': 'Contexte Global',
            'zoneInstitutionnelle': 'Zone Institutionnelle',
            'structureMarche': 'Structure de Marché',
            'timingKillzones': 'Timing Killzones',
            'signalEntree': 'Signal d\'Entrée',
            'riskManagement': 'Risk Management',
            'discipline': 'Discipline'
        };
        return names[key] || key;
    }

    drawConfluenceChart(canvas, confluenceStats) {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const entries = Object.entries(confluenceStats);
        if (entries.length === 0) return;
        
        const barWidth = (width - 40) / entries.length;
        const maxWinRate = Math.max(...entries.map(([,stats]) => stats.wins / stats.total * 100));
        
        entries.forEach(([confluence, stats], index) => {
            const winRate = stats.total > 0 ? (stats.wins / stats.total * 100) : 0;
            const barHeight = (winRate / 100) * (height - 60);
            const x = 20 + index * barWidth;
            const y = height - 30 - barHeight;
            
            const color = winRate >= 80 ? '#4ecdc4' : 
                         winRate >= 60 ? '#00d4ff' : 
                         winRate >= 40 ? '#ffc107' : '#ff6b6b';
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth - 10, barHeight);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${winRate.toFixed(0)}%`, x + (barWidth - 10) / 2, y - 5);
            
            ctx.save();
            ctx.translate(x + (barWidth - 10) / 2, height - 10);
            ctx.rotate(-Math.PI / 4);
            ctx.textAlign = 'right';
            ctx.fillText(this.getConfluenceName(confluence), 0, 0);
            ctx.restore();
        });
    }

    updateCorrelationMatrix() {
        const correlationMatrix = document.getElementById('correlationMatrix');
        if (!correlationMatrix) return;
        
        const confluences = [
            'contextGlobal',
            'zoneInstitutionnelle', 
            'structureMarche',
            'timingKillzones',
            'signalEntree',
            'riskManagement',
            'discipline'
        ];
        
        const closedTrades = this.trades.filter(t => t.status === 'closed' && t.confluences);
        
        if (closedTrades.length < 5) {
            correlationMatrix.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 20px;">Minimum 5 trades fermés requis pour l\'analyse de corrélation</p>';
            return;
        }
        
        let matrixHtml = '<div class="correlation-grid">';
        
        matrixHtml += '<div class="correlation-cell header"></div>';
        confluences.forEach(conf => {
            matrixHtml += `<div class="correlation-cell header">${this.getConfluenceName(conf).substring(0, 8)}</div>`;
        });
        
        confluences.forEach(conf1 => {
            matrixHtml += `<div class="correlation-cell row-header">${this.getConfluenceName(conf1)}</div>`;
            
            confluences.forEach(conf2 => {
                const correlation = this.calculateCorrelation(conf1, conf2, closedTrades);
                const correlationClass = correlation >= 0.8 ? 'excellent' :
                                       correlation >= 0.6 ? 'good' :
                                       correlation >= 0.4 ? 'average' : 'poor';
                
                matrixHtml += `<div class="correlation-cell data ${correlationClass}" title="Corrélation ${this.getConfluenceName(conf1)} - ${this.getConfluenceName(conf2)}: ${(correlation * 100).toFixed(0)}%">${(correlation * 100).toFixed(0)}%</div>`;
            });
        });
        
        matrixHtml += '</div>';
        correlationMatrix.innerHTML = matrixHtml;
    }

    calculateCorrelation(conf1, conf2, trades) {
        if (conf1 === conf2) return 1.0;
        
        const pairs = trades.map(trade => {
            const val1 = trade.confluences[conf1] || '';
            const val2 = trade.confluences[conf2] || '';
            const pnl = parseFloat(trade.pnl || 0);
            return {
                conf1Success: pnl > 0 && val1.includes('Confirmé') || val1.includes('Respecté') || val1.includes('Valide'),
                conf2Success: pnl > 0 && val2.includes('Confirmé') || val2.includes('Respecté') || val2.includes('Valide')
            };
        });
        
        const bothSuccess = pairs.filter(p => p.conf1Success && p.conf2Success).length;
        const conf1Success = pairs.filter(p => p.conf1Success).length;
        const conf2Success = pairs.filter(p => p.conf2Success).length;
        
        if (conf1Success === 0 || conf2Success === 0) return 0;
        
        return Math.min(bothSuccess / Math.max(conf1Success, conf2Success), 1.0);
    }

    initCalendar() {
        this.currentCalendarDate = new Date();
        this.renderCalendar();
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const monthYear = document.getElementById('monthYear');
        
        if (!calendarGrid || !monthYear) return;
        
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        
        monthYear.textContent = new Intl.DateTimeFormat('fr-FR', { 
            month: 'long', 
            year: 'numeric' 
        }).format(this.currentCalendarDate);
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        calendarGrid.innerHTML = '';
        
        const dayHeaders = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            if (currentDate.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayTrades = this.trades.filter(t => t.date === dateStr);
            const dayPnL = dayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
            
            dayElement.innerHTML = `
                <div class="calendar-date">${currentDate.getDate()}</div>
                ${dayTrades.length > 0 ? `
                    <div class="calendar-trades">
                        <div class="trade-count">${dayTrades.length} trade${dayTrades.length > 1 ? 's' : ''}</div>
                        <div class="trade-pnl ${dayPnL >= 0 ? 'positive' : 'negative'}">$${dayPnL.toFixed(2)}</div>
                    </div>
                ` : ''}
            `;
            
            if (dayTrades.length > 0) {
                dayElement.classList.add('has-trades');
                if (dayPnL > 0) dayElement.classList.add('profit-day');
                else if (dayPnL < 0) dayElement.classList.add('loss-day');
            }
            
            calendarGrid.appendChild(dayElement);
        }
        
        this.updateCalendarStats();
    }

    updateCalendarStats() {
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        
        const monthTrades = this.trades.filter(t => {
            const tradeDate = new Date(t.date);
            return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
        });
        
        const monthPnL = monthTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const monthWins = monthTrades.filter(t => parseFloat(t.pnl || 0) > 0).length;
        const monthWinRate = monthTrades.length > 0 ? (monthWins / monthTrades.length * 100).toFixed(1) : 0;
        
        const yearTrades = this.trades.filter(t => {
            const tradeDate = new Date(t.date);
            return tradeDate.getFullYear() === year;
        });
        
        const yearPnL = yearTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const yearWins = yearTrades.filter(t => parseFloat(t.pnl || 0) > 0).length;
        const yearWinRate = yearTrades.length > 0 ? (yearWins / yearTrades.length * 100).toFixed(1) : 0;
        
        const initialCapital = this.accounts[this.currentAccount]?.capital || this.settings.capital;
        const currentCapital = initialCapital + yearPnL;
        const yearReturn = initialCapital > 0 ? ((yearPnL / initialCapital) * 100).toFixed(1) : 0;
        
        const monthlyTarget = (initialCapital * 0.05);
        const yearlyTarget = (initialCapital * 0.6);
        
        const monthProgress = monthlyTarget > 0 ? Math.min((monthPnL / monthlyTarget) * 100, 100).toFixed(1) : 0;
        const yearProgress = yearlyTarget > 0 ? Math.min((yearPnL / yearlyTarget) * 100, 100).toFixed(1) : 0;
        
        const statsElements = {
            monthPnL: document.getElementById('monthPnL'),
            monthWinRate: document.getElementById('monthWinRate'),
            monthProgress: document.getElementById('monthProgress'),
            monthlyTarget: document.getElementById('monthlyTarget'),
            monthlyProgressBar: document.getElementById('monthlyProgressBar'),
            yearPnL: document.getElementById('yearPnL'),
            yearWinRate: document.getElementById('yearWinRate'),
            yearProgress: document.getElementById('yearProgress'),
            yearlyTarget: document.getElementById('yearlyTarget'),
            yearlyProgressBar: document.getElementById('yearlyProgressBar'),
            yearReturn: document.getElementById('yearReturn')
        };
        
        if (statsElements.monthPnL) {
            statsElements.monthPnL.textContent = `$${monthPnL.toFixed(2)}`;
            statsElements.monthPnL.className = 'stat-value ' + (monthPnL >= 0 ? 'positive' : 'negative');
        }
        if (statsElements.monthWinRate) statsElements.monthWinRate.textContent = `${monthWinRate}%`;
        if (statsElements.monthProgress) {
            statsElements.monthProgress.textContent = `${monthProgress}%`;
            statsElements.monthProgress.style.color = monthProgress >= 100 ? '#00ff88' : '#00d4ff';
        }
        if (statsElements.monthlyTarget) {
            statsElements.monthlyTarget.textContent = monthlyTarget.toFixed(0);
        }
        if (statsElements.monthlyProgressBar) {
            statsElements.monthlyProgressBar.style.width = `${Math.min(monthProgress, 100)}%`;
            if (monthProgress >= 100) {
                statsElements.monthlyProgressBar.classList.add('completed');
            }
        }
        
        if (statsElements.yearPnL) {
            statsElements.yearPnL.textContent = `$${yearPnL.toFixed(2)}`;
            statsElements.yearPnL.className = 'stat-value ' + (yearPnL >= 0 ? 'positive' : 'negative');
        }
        if (statsElements.yearWinRate) statsElements.yearWinRate.textContent = `${yearWinRate}%`;
        if (statsElements.yearProgress) {
            statsElements.yearProgress.textContent = `${yearProgress}%`;
            statsElements.yearProgress.style.color = yearProgress >= 100 ? '#00ff88' : '#00d4ff';
        }
        if (statsElements.yearlyTarget) {
            statsElements.yearlyTarget.textContent = yearlyTarget.toFixed(0);
        }
        if (statsElements.yearlyProgressBar) {
            statsElements.yearlyProgressBar.style.width = `${Math.min(yearProgress, 100)}%`;
            if (yearProgress >= 100) {
                statsElements.yearlyProgressBar.classList.add('completed');
            }
        }
        if (statsElements.yearReturn) {
            statsElements.yearReturn.textContent = `${yearReturn}%`;
            statsElements.yearReturn.className = yearReturn >= 0 ? 'positive' : 'negative';
        }
    }

    updateCalendar() {
        this.renderCalendar();
    }

    showCloseTradeModal() {
        const openTrades = this.trades.filter(t => t.status === 'open');
        if (openTrades.length === 0) {
            alert('Aucun trade ouvert à clôturer');
            return;
        }
        
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        const tradesHtml = openTrades.map((trade, index) => {
            const tradeIndex = this.trades.indexOf(trade);
            return `
                <div class="trade-item">
                    <div class="trade-info">
                        <strong>${trade.currency}</strong> - ${trade.date}<br>
                        Entrée: ${trade.entryPoint} | SL: ${trade.stopLoss} | TP: ${trade.takeProfit}
                    </div>
                    <div class="trade-actions">
                        <button class="btn-small btn-success" onclick="dashboard.closeTrade(${tradeIndex}, 'TP')">TP</button>
                        <button class="btn-small btn-danger" onclick="dashboard.closeTrade(${tradeIndex}, 'SL')">SL</button>
                        <button class="btn-small btn-warning" onclick="dashboard.closeTrade(${tradeIndex}, 'BE')">BE</button>
                    </div>
                </div>
            `;
        }).join('');
        
        modalContent.innerHTML = `
            <h2>Clôturer un Trade</h2>
            <div class="trades-list">
                ${tradesHtml}
            </div>
            <div class="form-buttons">
                <button class="btn-secondary" onclick="dashboard.closeModal()">Annuler</button>
            </div>
        `;
        
        this.showModal();
    }

    showManualCloseModal() {
        const openTrades = this.trades.filter(t => t.status === 'open');
        if (openTrades.length === 0) {
            alert('Aucun trade ouvert');
            return;
        }
        
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        const tradesOptions = openTrades.map((trade, index) => {
            const tradeIndex = this.trades.indexOf(trade);
            return `<option value="${tradeIndex}">${trade.currency} - ${trade.date}</option>`;
        }).join('');
        
        modalContent.innerHTML = `
            <h2>Clôture Manuelle</h2>
            <div class="trade-form">
                <div class="form-group">
                    <label>Trade à clôturer:</label>
                    <select id="tradeToClose">
                        ${tradesOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Prix de clôture:</label>
                    <input type="number" id="manualClosePrice" step="0.00001" placeholder="Prix de sortie">
                </div>
                <div class="form-buttons">
                    <button class="btn-submit" id="executeManualCloseBtn">Clôturer</button>
                    <button class="btn-secondary" id="cancelManualBtn">Annuler</button>
                </div>
            </div>
        `;
        
        this.showModal();
    }

    executeManualClose() {
        const tradeIndex = parseInt(document.getElementById('tradeToClose')?.value);
        const closePrice = parseFloat(document.getElementById('manualClosePrice')?.value);
        
        if (isNaN(tradeIndex) || isNaN(closePrice)) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        const trade = this.trades[tradeIndex];
        if (!trade || trade.status === 'closed') {
            alert('Trade invalide');
            return;
        }
        
        trade.closePrice = closePrice;
        trade.status = 'closed';
        trade.result = 'MANUAL';
        trade.pnl = this.calculatePnL(trade);
        trade.lastModified = Date.now();
        
        this.saveToStorage();
        this.updateStats();
        this.renderTradesTable();
        this.updateCharts();
        this.updateCalendar();
        this.closeModal();
        
        this.showNotification(`Trade ${trade.currency} clôturé manuellement`);
    }
}

// Initialisation globale
let dashboard;

// Fonction d'initialisation
function initializeDashboard() {
    console.log('Starting dashboard initialization...');
    try {
        dashboard = new TradingDashboard();
        window.dashboard = dashboard;
        console.log('Dashboard created successfully');
    } catch (error) {
        console.error('Error creating dashboard:', error);
    }
}

// Initialiser dès que possible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    // DOM déjà chargé
    setTimeout(initializeDashboard, 100);
}

// Backup au cas où
window.addEventListener('load', function() {
    if (!window.dashboard) {
        console.log('Backup initialization...');
        initializeDashboard();
    }
});