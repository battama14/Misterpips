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
            // Attendre que Firebase Auth soit disponible
            await this.waitForFirebaseAuth();
            
            // Importer Firebase modules
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
            
            // Écouter les changements d'authentification
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
            // Fallback en mode local
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
            } else {
                // Créer les données par défaut pour le nouvel utilisateur
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
    
    async saveUserData() {
        // Sauvegarder en local d'abord
        this.saveToStorage();
        
        // Puis sauvegarder dans Firebase si disponible
        if (this.db && this.currentUser && !this.syncInProgress) {
            try {
                this.syncInProgress = true;
                
                const userData = {
                    accounts: this.accounts,
                    currentAccount: this.currentAccount,
                    trades: {},
                    settings: {},
                    lastModified: this.firebaseModules.serverTimestamp()
                };
                
                // Sauvegarder tous les comptes
                Object.keys(this.accounts).forEach(accountId => {
                    userData.trades[accountId] = accountId === this.currentAccount ? this.trades : 
                        JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${accountId}`)) || [];
                    userData.settings[accountId] = accountId === this.currentAccount ? this.settings :
                        JSON.parse(localStorage.getItem(`settings_${this.currentUser}_${accountId}`)) || { capital: 1000, riskPerTrade: 2 };
                });
                
                const userDocRef = this.firebaseModules.doc(this.db, 'users', this.currentUser);
                await this.firebaseModules.setDoc(userDocRef, userData);
                
                this.updateSyncStatus('✅ Syncé');
                setTimeout(() => this.updateSyncStatus('🔄 Sync Auto'), 2000);
                
            } catch (error) {
                console.error('Erreur sauvegarde Firebase:', error);
                this.updateSyncStatus('❌ Erreur sync');
            } finally {
                this.syncInProgress = false;
            }
        }
    }

    init() {
        this.setupEventListeners();
        this.initAccountSelector();
        this.updateStats();
        this.renderTradesTable();
        this.initCharts();
        this.updateCharts();
        this.initCalendar();
        this.updateAccountDisplay();
        this.updateAccountSelector();
        
        // Chargement initial des données
        setTimeout(() => {
            if (this.currentUser) {
                this.loadUserData();
            }
        }, 1000);
        
        // Setup account selector listener
        const accountSelect = document.getElementById('accountSelect');
        if (accountSelect) {
            accountSelect.addEventListener('change', (e) => {
                this.switchAccount(e.target.value);
            });
        }
    }

    setupEventListeners() {
        const newTradeBtn = document.getElementById('newTradeBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const closeTradeBtn = document.getElementById('closeTradeBtn');
        const resetBtn = document.getElementById('resetBtn');
        const manualCloseBtn = document.getElementById('manualCloseBtn');
        const exportBtn = document.getElementById('exportBtn');
        const closeModal = document.querySelector('.close');

        if (newTradeBtn) newTradeBtn.addEventListener('click', () => this.startNewTrade());
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettings());
        if (closeTradeBtn) closeTradeBtn.addEventListener('click', () => this.showCloseTradeModal());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetAllData());
        if (manualCloseBtn) manualCloseBtn.addEventListener('click', () => this.showManualCloseModal());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportToExcel());
        if (closeModal) closeModal.addEventListener('click', () => this.closeModal());
        
        const closeFullscreen = document.querySelector('.close-fullscreen');
        if (closeFullscreen) closeFullscreen.addEventListener('click', () => this.closeFullscreen());
        
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('tradeModal')) {
                this.closeModal();
            }
            if (e.target === document.getElementById('fullscreenModal')) {
                this.closeFullscreen();
            }
        });
    }

    updateStats() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const openTrades = this.trades.filter(t => t.status === 'open');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const winRate = closedTrades.length > 0 ? 
            (closedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length / closedTrades.length * 100).toFixed(1) : 0;
        
        // Calculer le capital actuel (capital initial + gains/pertes)
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

    saveToStorage() {
        if (!this.currentUser) return;
        
        localStorage.setItem(`trades_${this.currentUser}_${this.currentAccount}`, JSON.stringify(this.trades));
        localStorage.setItem(`settings_${this.currentUser}_${this.currentAccount}`, JSON.stringify(this.settings));
        localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
        localStorage.setItem(`currentAccount_${this.currentUser}`, this.currentAccount);
    }

    switchAccount(accountId) {
        if (!accountId || accountId === this.currentAccount) return;
        
        // Sauvegarder le compte actuel avant de changer
        this.saveToStorage();
        
        this.currentAccount = accountId;
        
        // Charger les données du nouveau compte
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
        
        // Sauvegarder le changement de compte
        setTimeout(() => this.saveUserData(), 500);
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
            
            // Mettre à jour le titre avec l'utilisateur actuel
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
            
            // Écouter les changements en temps réel
            this.firebaseModules.onSnapshot(userDocRef, (doc) => {
                if (doc.exists() && !this.syncInProgress) {
                    const data = doc.data();
                    if (data.lastModified && data.lastModified.seconds) {
                        const remoteTime = data.lastModified.seconds * 1000;
                        const localTime = this.lastSyncTime || 0;
                        
                        // Si les données distantes sont plus récentes
                        if (remoteTime > localTime) {
                            this.handleRemoteUpdate(data);
                        }
                    }
                }
            });
            
            // Sync automatique toutes les 60 secondes
            setInterval(() => {
                if (!this.syncInProgress) {
                    this.saveUserData();
                }
            }, 60000);
            
            this.updateSyncStatus('🔄 Sync Auto');
            
        } catch (error) {
            console.error('Erreur setup sync temps réel:', error);
            this.updateSyncStatus('❌ Sync désactivé');
        }
    }
    
    handleRemoteUpdate(data) {
        console.log('Mise à jour reçue depuis un autre appareil');
        
        this.syncInProgress = true;
        
        try {
            // Mettre à jour les données locales
            this.accounts = data.accounts || this.accounts;
            
            // Mettre à jour les données du compte actuel
            if (data.trades && data.trades[this.currentAccount]) {
                this.trades = data.trades[this.currentAccount];
            }
            if (data.settings && data.settings[this.currentAccount]) {
                this.settings = data.settings[this.currentAccount];
            }
            
            // Sauvegarder localement
            this.saveToStorage();
            
            // Mettre à jour l'interface
            this.updateStats();
            this.renderTradesTable();
            this.updateCharts();
            this.updateCalendar();
            this.updateAccountSelector();
            this.updateAccountDisplay();
            
            this.lastSyncTime = data.lastModified?.seconds * 1000 || Date.now();
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

    // Méthodes simplifiées pour les fonctionnalités de base
    startNewTrade() {
        this.currentStep = 0;
        this.currentTrade = {
            date: this.getCurrentDate(),
            confluences: {},
            comments: {}
        };
        this.showModal();
        this.renderTradeForm();
    }

    getCurrentDate() {
        const now = new Date();
        const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
            <h2>Nouveau Trade</h2>
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
                    <input type="number" id="entryPoint" step="0.00001" placeholder="1.12345" oninput="dashboard.calculateLotSize()">
                </div>
                <div class="form-group">
                    <label>Stop Loss:</label>
                    <input type="number" id="stopLoss" step="0.00001" placeholder="1.12000" oninput="dashboard.calculateLotSize()">
                </div>
                <div class="form-group">
                    <label>Take Profit:</label>
                    <input type="number" id="takeProfit" step="0.00001" placeholder="1.13000" oninput="dashboard.calculateLotSize()">
                </div>
                <div class="form-group">
                    <label>Lot:</label>
                    <input type="number" id="lotSize" step="0.01" placeholder="0.10" oninput="dashboard.calculateFromLot()">
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
                    <button class="btn-submit" onclick="dashboard.saveTrade()">Enregistrer Trade</button>
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Annuler</button>
                </div>
            </div>
        `;
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
        
        // Sauvegarde automatique
        this.saveUserData();
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
        
        // Sauvegarde automatique
        this.saveUserData();
    }

    calculatePnL(trade) {
        const entryPoint = parseFloat(trade.entryPoint);
        const closePrice = parseFloat(trade.closePrice);
        const lotSize = parseFloat(trade.lotSize);
        const currency = trade.currency;
        
        if (!entryPoint || !closePrice || !lotSize) return 0;
        
        let priceDiff = closePrice - entryPoint;
        
        // Déterminer la direction du trade
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

    // Méthodes simplifiées pour les autres fonctionnalités
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
                    <button class="btn-submit" onclick="dashboard.saveSettings()">Sauvegarder</button>
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Annuler</button>
                </div>
            </div>
        `;
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
        
        // Sauvegarde automatique
        this.saveUserData();
    }

    // Méthodes vides pour éviter les erreurs
    initAccountSelector() {}
    updateAccountSelector() {}
    addNewAccount() {}
    deleteAccount() {}
    resetAllData() {}
    exportToExcel() {}
    initCharts() {}
    updateCharts() {}
    initCalendar() {}
    updateCalendar() {}
    showCloseTradeModal() {}
    showManualCloseModal() {}
    closeFullscreen() {}
}

// Initialisation
let dashboard;
window.dashboard = null;

document.addEventListener('DOMContentLoaded', function() {
    dashboard = new TradingDashboard();
    window.dashboard = dashboard;
});