// Classe TradingDashboard complète pour le dashboard de trading
class TradingDashboard {
    constructor() {
        this.trades = JSON.parse(localStorage.getItem('trades')) || [];
        this.settings = JSON.parse(localStorage.getItem('settings')) || {
            capital: 1000,
            riskPerTrade: 2,
            currency: 'USD'
        };
        this.charts = {};
        this.currentAccount = 'compte1';
        this.accounts = JSON.parse(localStorage.getItem('accounts')) || {
            compte1: { name: 'Compte Principal', trades: [], capital: 1000 },
            compte2: { name: 'Compte Démo', trades: [], capital: 10000 },
            compte3: { name: 'Compte Swing', trades: [], capital: 5000 }
        };
        this.syncCode = localStorage.getItem('syncCode') || this.generateSyncCode();
        this.lastLocalChange = 0;
        this.syncInterval = null;
    }

    // Initialisation du dashboard
    init() {
        console.log('🚀 Initialisation du TradingDashboard...');
        
        // Initialiser les événements
        this.initEventListeners();
        
        // Charger les données
        this.loadAccountData();
        
        // Initialiser les graphiques
        this.initCharts();
        
        // Mettre à jour l'affichage
        this.updateDisplay();
        
        // Initialiser le calendrier
        this.initCalendar();
        
        // Démarrer la synchronisation
        this.startSync();
        
        console.log('✅ TradingDashboard initialisé avec succès');
    }

    // Initialiser les événements
    initEventListeners() {
        // Boutons principaux
        const newTradeBtn = document.getElementById('newTradeBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const closeTradeBtn = document.getElementById('closeTradeBtn');
        const resetBtn = document.getElementById('resetBtn');
        const manualCloseBtn = document.getElementById('manualCloseBtn');
        const exportBtn = document.getElementById('exportBtn');

        if (newTradeBtn) newTradeBtn.addEventListener('click', () => this.openNewTradeModal());
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.openSettingsModal());
        if (closeTradeBtn) closeTradeBtn.addEventListener('click', () => this.closeRandomTrade());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetData());
        if (manualCloseBtn) manualCloseBtn.addEventListener('click', () => this.openManualCloseModal());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportToExcel());

        // Sélecteur de compte
        const accountSelect = document.getElementById('accountSelect');
        if (accountSelect) {
            accountSelect.addEventListener('change', (e) => {
                this.switchAccount(e.target.value);
            });
        }

        // Calendrier
        const prevMonth = document.getElementById('prevMonth');
        const nextMonth = document.getElementById('nextMonth');
        if (prevMonth) prevMonth.addEventListener('click', () => this.changeMonth(-1));
        if (nextMonth) nextMonth.addEventListener('click', () => this.changeMonth(1));

        // Modal
        const modal = document.getElementById('tradeModal');
        const closeModal = document.querySelector('.close');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                if (modal) modal.style.display = 'none';
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    // Générer un code de synchronisation unique
    generateSyncCode() {
        const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('syncCode', code);
        return code;
    }

    // Charger les données du compte
    loadAccountData() {
        const account = this.accounts[this.currentAccount];
        if (account) {
            this.trades = account.trades || [];
            this.settings.capital = account.capital || 1000;
        }
    }

    // Sauvegarder les données du compte
    saveAccountData() {
        if (!this.accounts[this.currentAccount]) {
            this.accounts[this.currentAccount] = {
                name: `Compte ${this.currentAccount}`,
                trades: [],
                capital: 1000
            };
        }
        
        this.accounts[this.currentAccount].trades = this.trades;
        this.accounts[this.currentAccount].capital = this.settings.capital;
        
        localStorage.setItem('accounts', JSON.stringify(this.accounts));
        localStorage.setItem('trades', JSON.stringify(this.trades));
        localStorage.setItem('settings', JSON.stringify(this.settings));
        
        this.lastLocalChange = Date.now();
    }

    // Changer de compte
    switchAccount(accountId) {
        this.saveAccountData();
        this.currentAccount = accountId;
        this.loadAccountData();
        this.updateDisplay();
        this.updateCharts();
    }

    // Ajouter un nouveau compte
    addNewAccount() {
        const name = prompt('Nom du nouveau compte:');
        if (name) {
            const accountId = 'compte' + (Object.keys(this.accounts).length + 1);
            this.accounts[accountId] = {
                name: name,
                trades: [],
                capital: 1000
            };
            
            // Ajouter l'option au select
            const accountSelect = document.getElementById('accountSelect');
            if (accountSelect) {
                const option = document.createElement('option');
                option.value = accountId;
                option.textContent = name;
                accountSelect.appendChild(option);
                accountSelect.value = accountId;
                this.switchAccount(accountId);
            }
            
            this.saveAccountData();
        }
    }

    // Supprimer un compte
    deleteAccount() {
        if (Object.keys(this.accounts).length <= 1) {
            alert('Impossible de supprimer le dernier compte');
            return;
        }
        
        if (confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
            delete this.accounts[this.currentAccount];
            
            // Passer au premier compte disponible
            const firstAccount = Object.keys(this.accounts)[0];
            this.currentAccount = firstAccount;
            
            // Mettre à jour le select
            const accountSelect = document.getElementById('accountSelect');
            if (accountSelect) {
                accountSelect.innerHTML = '';
                Object.keys(this.accounts).forEach(accountId => {
                    const option = document.createElement('option');
                    option.value = accountId;
                    option.textContent = this.accounts[accountId].name;
                    accountSelect.appendChild(option);
                });
                accountSelect.value = this.currentAccount;
            }
            
            this.loadAccountData();
            this.updateDisplay();
            this.updateCharts();
            this.saveAccountData();
        }
    }

    // Ouvrir la modal nouveau trade
    openNewTradeModal() {
        const modal = document.getElementById('tradeModal');
        const modalContent = document.getElementById('modalContent');
        
        if (!modal || !modalContent) return;

        modalContent.innerHTML = `
            <h2>📈 Nouveau Trade</h2>
            <form id="newTradeForm">
                <div class="form-group">
                    <label>Paire de devises:</label>
                    <select id="tradePair" required>
                        <option value="EURUSD">EUR/USD</option>
                        <option value="GBPUSD">GBP/USD</option>
                        <option value="USDJPY">USD/JPY</option>
                        <option value="AUDUSD">AUD/USD</option>
                        <option value="USDCHF">USD/CHF</option>
                        <option value="USDCAD">USD/CAD</option>
                        <option value="NZDUSD">NZD/USD</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Type:</label>
                    <select id="tradeType" required>
                        <option value="BUY">Achat (Long)</option>
                        <option value="SELL">Vente (Short)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Prix d'entrée:</label>
                    <input type="number" id="entryPrice" step="0.00001" required>
                </div>
                
                <div class="form-group">
                    <label>Stop Loss:</label>
                    <input type="number" id="stopLoss" step="0.00001" required>
                </div>
                
                <div class="form-group">
                    <label>Take Profit:</label>
                    <input type="number" id="takeProfit" step="0.00001" required>
                </div>
                
                <div class="form-group">
                    <label>Lot:</label>
                    <input type="number" id="lotSize" step="0.01" value="0.01" required>
                    <small>Risque calculé automatiquement</small>
                </div>
                
                <div class="form-group">
                    <label>Commentaire (optionnel):</label>
                    <textarea id="tradeComment" rows="3"></textarea>
                </div>
                
                <div class="risk-display">
                    <div>Risque: <span id="riskAmount">$0</span> (<span id="riskPercent">0%</span>)</div>
                    <div>Gain potentiel: <span id="potentialGain">$0</span></div>
                    <div>R:R: <span id="riskReward">0:0</span></div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Ouvrir le Trade</button>
                    <button type="button" class="btn-secondary" onclick="document.getElementById('tradeModal').style.display='none'">Annuler</button>
                </div>
            </form>
        `;

        // Calculer le risque en temps réel
        const inputs = ['entryPrice', 'stopLoss', 'takeProfit', 'lotSize'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.calculateRisk());
            }
        });

        // Gérer la soumission du formulaire
        const form = document.getElementById('newTradeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTrade();
            });
        }

        modal.style.display = 'block';
    }

    // Calculer le risque
    calculateRisk() {
        const entryPrice = parseFloat(document.getElementById('entryPrice')?.value || 0);
        const stopLoss = parseFloat(document.getElementById('stopLoss')?.value || 0);
        const takeProfit = parseFloat(document.getElementById('takeProfit')?.value || 0);
        const lotSize = parseFloat(document.getElementById('lotSize')?.value || 0);

        if (entryPrice && stopLoss && lotSize) {
            const pipValue = 10; // Valeur approximative d'un pip
            const pips = Math.abs(entryPrice - stopLoss) * 10000;
            const riskAmount = pips * pipValue * lotSize;
            const riskPercent = (riskAmount / this.settings.capital) * 100;

            document.getElementById('riskAmount').textContent = `$${riskAmount.toFixed(2)}`;
            document.getElementById('riskPercent').textContent = `${riskPercent.toFixed(2)}%`;

            if (takeProfit) {
                const gainPips = Math.abs(takeProfit - entryPrice) * 10000;
                const potentialGain = gainPips * pipValue * lotSize;
                const riskReward = (potentialGain / riskAmount).toFixed(2);

                document.getElementById('potentialGain').textContent = `$${potentialGain.toFixed(2)}`;
                document.getElementById('riskReward').textContent = `1:${riskReward}`;
            }
        }
    }

    // Ajouter un trade
    addTrade() {
        const trade = {
            id: Date.now(),
            pair: document.getElementById('tradePair').value,
            type: document.getElementById('tradeType').value,
            entryPrice: parseFloat(document.getElementById('entryPrice').value),
            stopLoss: parseFloat(document.getElementById('stopLoss').value),
            takeProfit: parseFloat(document.getElementById('takeProfit').value),
            lotSize: parseFloat(document.getElementById('lotSize').value),
            comment: document.getElementById('tradeComment').value,
            openTime: new Date(),
            status: 'OPEN',
            result: null,
            closePrice: null,
            closeTime: null,
            pnl: 0
        };

        this.trades.push(trade);
        this.saveAccountData();
        this.updateDisplay();
        this.updateCharts();
        
        document.getElementById('tradeModal').style.display = 'none';
        
        // Notification
        this.showNotification('Trade ouvert avec succès!', 'success');
    }

    // Fermer un trade aléatoire (simulation)
    closeRandomTrade() {
        const openTrades = this.trades.filter(t => t.status === 'OPEN');
        if (openTrades.length === 0) {
            this.showNotification('Aucun trade ouvert', 'warning');
            return;
        }

        const randomTrade = openTrades[Math.floor(Math.random() * openTrades.length)];
        const isWin = Math.random() > 0.4; // 60% de chance de gain
        
        // Simuler un prix de clôture
        const variation = (Math.random() - 0.5) * 0.02; // ±1%
        randomTrade.closePrice = randomTrade.entryPrice * (1 + variation);
        randomTrade.closeTime = new Date();
        randomTrade.status = 'CLOSED';
        
        // Calculer le P&L
        const pipValue = 10;
        let pips;
        if (randomTrade.type === 'BUY') {
            pips = (randomTrade.closePrice - randomTrade.entryPrice) * 10000;
        } else {
            pips = (randomTrade.entryPrice - randomTrade.closePrice) * 10000;
        }
        
        randomTrade.pnl = pips * pipValue * randomTrade.lotSize;
        randomTrade.result = randomTrade.pnl > 0 ? 'WIN' : 'LOSS';

        this.saveAccountData();
        this.updateDisplay();
        this.updateCharts();
        
        const resultText = randomTrade.result === 'WIN' ? 'gagnant' : 'perdant';
        this.showNotification(`Trade ${resultText}: ${randomTrade.pnl.toFixed(2)}$`, randomTrade.result === 'WIN' ? 'success' : 'error');
    }

    // Ouvrir la modal de clôture manuelle
    openManualCloseModal() {
        const openTrades = this.trades.filter(t => t.status === 'OPEN');
        if (openTrades.length === 0) {
            this.showNotification('Aucun trade ouvert', 'warning');
            return;
        }

        const modal = document.getElementById('tradeModal');
        const modalContent = document.getElementById('modalContent');
        
        if (!modal || !modalContent) return;

        let tradesHtml = '';
        openTrades.forEach(trade => {
            tradesHtml += `
                <div class="trade-item" style="border: 1px solid #333; padding: 10px; margin: 5px 0; border-radius: 5px;">
                    <div><strong>${trade.pair}</strong> - ${trade.type}</div>
                    <div>Entrée: ${trade.entryPrice} | SL: ${trade.stopLoss} | TP: ${trade.takeProfit}</div>
                    <div>Lot: ${trade.lotSize}</div>
                    <button onclick="dashboard.closeTradeManually(${trade.id})" class="btn-warning" style="margin-top: 5px;">Clôturer</button>
                </div>
            `;
        });

        modalContent.innerHTML = `
            <h2>🎯 Clôture Manuelle</h2>
            <div class="trades-list">
                ${tradesHtml}
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="document.getElementById('tradeModal').style.display='none'">Fermer</button>
            </div>
        `;

        modal.style.display = 'block';
    }

    // Clôturer un trade manuellement
    closeTradeManually(tradeId) {
        const trade = this.trades.find(t => t.id === tradeId);
        if (!trade) return;

        const closePrice = prompt(`Prix de clôture pour ${trade.pair}:`, trade.entryPrice);
        if (!closePrice) return;

        trade.closePrice = parseFloat(closePrice);
        trade.closeTime = new Date();
        trade.status = 'CLOSED';
        
        // Calculer le P&L
        const pipValue = 10;
        let pips;
        if (trade.type === 'BUY') {
            pips = (trade.closePrice - trade.entryPrice) * 10000;
        } else {
            pips = (trade.entryPrice - trade.closePrice) * 10000;
        }
        
        trade.pnl = pips * pipValue * trade.lotSize;
        trade.result = trade.pnl > 0 ? 'WIN' : 'LOSS';

        this.saveAccountData();
        this.updateDisplay();
        this.updateCharts();
        
        document.getElementById('tradeModal').style.display = 'none';
        
        const resultText = trade.result === 'WIN' ? 'gagnant' : 'perdant';
        this.showNotification(`Trade ${resultText}: ${trade.pnl.toFixed(2)}$`, trade.result === 'WIN' ? 'success' : 'error');
    }

    // Ouvrir les paramètres
    openSettingsModal() {
        const modal = document.getElementById('tradeModal');
        const modalContent = document.getElementById('modalContent');
        
        if (!modal || !modalContent) return;

        modalContent.innerHTML = `
            <h2>⚙️ Paramètres</h2>
            <form id="settingsForm">
                <div class="form-group">
                    <label>Capital initial:</label>
                    <input type="number" id="settingsCapital" value="${this.settings.capital}" required>
                </div>
                
                <div class="form-group">
                    <label>Risque par trade (%):</label>
                    <input type="number" id="settingsRisk" value="${this.settings.riskPerTrade}" step="0.1" required>
                </div>
                
                <div class="form-group">
                    <label>Devise:</label>
                    <select id="settingsCurrency">
                        <option value="USD" ${this.settings.currency === 'USD' ? 'selected' : ''}>USD</option>
                        <option value="EUR" ${this.settings.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                        <option value="GBP" ${this.settings.currency === 'GBP' ? 'selected' : ''}>GBP</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Code de synchronisation:</label>
                    <input type="text" id="syncCodeInput" value="${this.syncCode}" readonly>
                    <button type="button" onclick="dashboard.generateNewSyncCode()" class="btn-info">Nouveau Code</button>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Sauvegarder</button>
                    <button type="button" class="btn-secondary" onclick="document.getElementById('tradeModal').style.display='none'">Annuler</button>
                </div>
            </form>
        `;

        const form = document.getElementById('settingsForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }

        modal.style.display = 'block';
    }

    // Sauvegarder les paramètres
    saveSettings() {
        this.settings.capital = parseFloat(document.getElementById('settingsCapital').value);
        this.settings.riskPerTrade = parseFloat(document.getElementById('settingsRisk').value);
        this.settings.currency = document.getElementById('settingsCurrency').value;
        
        this.accounts[this.currentAccount].capital = this.settings.capital;
        
        this.saveAccountData();
        this.updateDisplay();
        
        document.getElementById('tradeModal').style.display = 'none';
        this.showNotification('Paramètres sauvegardés', 'success');
    }

    // Générer un nouveau code de sync
    generateNewSyncCode() {
        this.syncCode = this.generateSyncCode();
        document.getElementById('syncCodeInput').value = this.syncCode;
        this.showNotification('Nouveau code généré', 'success');
    }

    // Réinitialiser les données
    resetData() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ?')) {
            this.trades = [];
            this.accounts[this.currentAccount].trades = [];
            this.saveAccountData();
            this.updateDisplay();
            this.updateCharts();
            this.showNotification('Données réinitialisées', 'success');
        }
    }

    // Mettre à jour l'affichage
    updateDisplay() {
        this.updateStats();
        this.updateTradesTable();
    }

    // Mettre à jour les statistiques
    updateStats() {
        const closedTrades = this.trades.filter(t => t.status === 'CLOSED');
        const openTrades = this.trades.filter(t => t.status === 'OPEN');
        const winTrades = closedTrades.filter(t => t.result === 'WIN');
        
        const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
        const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 0;

        // Mettre à jour les éléments
        const elements = {
            capital: `$${this.settings.capital}`,
            winRate: `${winRate.toFixed(1)}%`,
            totalPnL: `$${totalPnL.toFixed(2)}`,
            openTrades: openTrades.length,
            totalTrades: this.trades.length
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
                
                // Couleur pour P&L
                if (id === 'totalPnL') {
                    element.style.color = totalPnL >= 0 ? '#4CAF50' : '#F44336';
                }
            }
        });

        // Mettre à jour les jauges
        this.updateGauges(totalPnL, winRate);
    }

    // Mettre à jour les jauges
    updateGauges(totalPnL, winRate) {
        const gainsGauge = document.getElementById('gainsGauge');
        const gainsValue = document.getElementById('gainsValue');
        const gainsPercent = document.getElementById('gainsPercent');

        if (gainsGauge && gainsValue && gainsPercent) {
            const percentage = Math.min(Math.abs(totalPnL) / this.settings.capital * 100, 100);
            const color = totalPnL >= 0 ? '#4CAF50' : '#F44336';
            
            gainsGauge.style.background = `conic-gradient(${color} ${percentage * 3.6}deg, #333 0deg)`;
            gainsValue.textContent = `$${totalPnL.toFixed(2)}`;
            gainsPercent.textContent = `${(totalPnL / this.settings.capital * 100).toFixed(1)}%`;
        }
    }

    // Mettre à jour le tableau des trades
    updateTradesTable() {
        const tbody = document.querySelector('#tradesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.trades.slice().reverse().forEach(trade => {
            const row = document.createElement('tr');
            row.className = trade.status === 'OPEN' ? 'trade-open' : 
                           trade.result === 'WIN' ? 'trade-win' : 'trade-loss';
            
            const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR');
            const formatTime = (date) => new Date(date).toLocaleTimeString('fr-FR');
            
            row.innerHTML = `
                <td>${formatDate(trade.openTime)}<br><small>${formatTime(trade.openTime)}</small></td>
                <td><strong>${trade.pair}</strong><br><small>${trade.type}</small></td>
                <td>${trade.entryPrice}</td>
                <td>${trade.stopLoss}</td>
                <td>${trade.takeProfit}</td>
                <td>${trade.lotSize}</td>
                <td>2%</td>
                <td><span class="status-${trade.status.toLowerCase()}">${trade.status}</span></td>
                <td class="${trade.pnl >= 0 ? 'positive' : 'negative'}">$${trade.pnl.toFixed(2)}</td>
                <td>
                    ${trade.status === 'OPEN' ? 
                        `<button onclick="dashboard.closeTradeManually(${trade.id})" class="btn-warning btn-sm">Clôturer</button>` :
                        `<button onclick="dashboard.deleteTrade(${trade.id})" class="btn-danger btn-sm">Supprimer</button>`
                    }
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // Supprimer un trade
    deleteTrade(tradeId) {
        if (confirm('Supprimer ce trade ?')) {
            this.trades = this.trades.filter(t => t.id !== tradeId);
            this.saveAccountData();
            this.updateDisplay();
            this.updateCharts();
            this.showNotification('Trade supprimé', 'success');
        }
    }

    // Initialiser les graphiques
    initCharts() {
        this.initConfluencesChart();
        this.initCorrelationMatrix();
        this.initPerformanceCharts();
    }

    // Graphique des confluences
    initConfluencesChart() {
        const ctx = document.getElementById('confluencesChart');
        if (!ctx) return;

        this.charts.confluences = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Support/Résistance', 'Fibonacci', 'Moyennes Mobiles', 'Volumes', 'Divergences'],
                datasets: [{
                    data: [25, 20, 20, 15, 20],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ]
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#fff' }
                    }
                }
            }
        });
    }

    // Matrice de corrélation ICT
    initCorrelationMatrix() {
        const matrix = document.getElementById('correlationMatrix');
        if (!matrix) return;

        const ictConcepts = [
            { name: 'Order Block', strength: 85, description: 'Zone d\'offre/demande institutionnelle' },
            { name: 'Fair Value Gap', strength: 78, description: 'Déséquilibre de prix à combler' },
            { name: 'Liquidity Sweep', strength: 92, description: 'Balayage de liquidité' },
            { name: 'Market Structure', strength: 88, description: 'Structure de marché (BOS/CHoCH)' },
            { name: 'Kill Zone', strength: 75, description: 'Session de trading institutionnelle' },
            { name: 'Premium/Discount', strength: 82, description: 'Zone de prix premium/discount' }
        ];

        let html = '<div class="ict-correlation-grid">';
        ictConcepts.forEach(concept => {
            let className = 'poor';
            if (concept.strength > 80) className = 'excellent';
            else if (concept.strength > 70) className = 'good';
            else if (concept.strength > 60) className = 'average';

            html += `
                <div class="ict-concept ${className}">
                    <div class="concept-name">${concept.name}</div>
                    <div class="concept-strength">${concept.strength}%</div>
                    <div class="concept-description">${concept.description}</div>
                </div>
            `;
        });
        html += '</div>';
        matrix.innerHTML = html;
    }

    // Graphiques de performance
    initPerformanceCharts() {
        this.initPerformanceTotal();
        this.initCumulativePerformance();
        this.initMonthlyPerformance();
    }

    // Performance totale
    initPerformanceTotal() {
        const container = document.getElementById('performanceTotal');
        if (!container) return;

        const closedTrades = this.trades.filter(t => t.status === 'CLOSED');
        const winTrades = closedTrades.filter(t => t.result === 'WIN');
        const lossTrades = closedTrades.filter(t => t.result === 'LOSS');

        const avgWin = winTrades.length > 0 ? winTrades.reduce((sum, t) => sum + t.pnl, 0) / winTrades.length : 0;
        const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((sum, t) => sum + t.pnl, 0) / lossTrades.length) : 0;
        const profitFactor = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '∞';

        // Mettre à jour les statistiques
        document.getElementById('avgWinTrade').textContent = `$${avgWin.toFixed(2)}`;
        document.getElementById('avgLossTrade').textContent = `$${avgLoss.toFixed(2)}`;
        document.getElementById('profitFactor').textContent = profitFactor;
        document.getElementById('maxDrawdown').textContent = '5.2%';
        document.getElementById('sharpeRatio').textContent = '1.45';
    }

    // Performance cumulative
    initCumulativePerformance() {
        const container = document.getElementById('cumulativePerformance');
        if (!container) return;

        // Créer un graphique simple avec Chart.js si disponible
        if (typeof Chart !== 'undefined') {
            const canvas = document.createElement('canvas');
            container.appendChild(canvas);

            const closedTrades = this.trades.filter(t => t.status === 'CLOSED').sort((a, b) => new Date(a.closeTime) - new Date(b.closeTime));
            let cumulative = 0;
            const data = closedTrades.map(trade => {
                cumulative += trade.pnl;
                return {
                    x: new Date(trade.closeTime),
                    y: cumulative
                };
            });

            new Chart(canvas, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Performance Cumulative',
                        data: data,
                        borderColor: '#00d4ff',
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'time' },
                        y: { beginAtZero: true }
                    },
                    plugins: {
                        legend: { labels: { color: '#fff' } }
                    }
                }
            });
        }
    }

    // Performance mensuelle
    initMonthlyPerformance() {
        const container = document.getElementById('monthlyPerformance');
        if (!container) return;

        const monthlyData = {};
        const closedTrades = this.trades.filter(t => t.status === 'CLOSED');

        closedTrades.forEach(trade => {
            const month = new Date(trade.closeTime).toISOString().slice(0, 7);
            if (!monthlyData[month]) monthlyData[month] = 0;
            monthlyData[month] += trade.pnl;
        });

        let html = '<div class="monthly-grid">';
        Object.keys(monthlyData).sort().forEach(month => {
            const pnl = monthlyData[month];
            const className = pnl >= 0 ? 'positive' : 'negative';
            html += `
                <div class="monthly-item ${className}">
                    <div class="month-label">${month}</div>
                    <div class="month-pnl">$${pnl.toFixed(2)}</div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    // Mettre à jour les graphiques
    updateCharts() {
        this.initPerformanceCharts();
        if (this.charts.confluences) {
            this.charts.confluences.update();
        }
    }

    // Initialiser le calendrier
    initCalendar() {
        this.currentDate = new Date();
        this.updateCalendar();
    }

    // Changer de mois
    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.updateCalendar();
    }

    // Mettre à jour le calendrier
    updateCalendar() {
        const monthLabel = document.getElementById('monthLabel');
        const calendarGrid = document.getElementById('calendarGrid');
        const calendarSummary = document.getElementById('calendarSummary');

        if (!monthLabel || !calendarGrid) return;

        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        monthLabel.textContent = `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        // Générer le calendrier
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let html = '';
        const today = new Date();
        
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
            const isToday = date.toDateString() === today.toDateString();
            
            // Vérifier s'il y a des trades ce jour
            const dayTrades = this.trades.filter(trade => {
                const tradeDate = new Date(trade.openTime);
                return tradeDate.toDateString() === date.toDateString();
            });

            let className = 'calendar-day';
            if (!isCurrentMonth) className += ' other-month';
            if (isToday) className += ' today';
            if (dayTrades.length > 0) className += ' has-trades';

            html += `
                <div class="${className}" data-date="${date.toISOString().split('T')[0]}">
                    <div class="day-number">${date.getDate()}</div>
                    ${dayTrades.length > 0 ? `<div class="trade-count">${dayTrades.length}</div>` : ''}
                </div>
            `;
        }

        calendarGrid.innerHTML = html;

        // Résumé du mois
        if (calendarSummary) {
            const monthTrades = this.trades.filter(trade => {
                const tradeDate = new Date(trade.openTime);
                return tradeDate.getMonth() === this.currentDate.getMonth() &&
                       tradeDate.getFullYear() === this.currentDate.getFullYear();
            });

            const monthPnL = monthTrades.filter(t => t.status === 'CLOSED').reduce((sum, t) => sum + t.pnl, 0);
            const monthWins = monthTrades.filter(t => t.result === 'WIN').length;
            const monthLosses = monthTrades.filter(t => t.result === 'LOSS').length;

            calendarSummary.innerHTML = `
                <div class="summary-item">
                    <strong>Trades du mois:</strong> ${monthTrades.length}
                </div>
                <div class="summary-item">
                    <strong>Gains:</strong> ${monthWins} | <strong>Pertes:</strong> ${monthLosses}
                </div>
                <div class="summary-item">
                    <strong>P&L:</strong> <span class="${monthPnL >= 0 ? 'positive' : 'negative'}">$${monthPnL.toFixed(2)}</span>
                </div>
            `;
        }
    }

    // Exporter vers Excel
    exportToExcel() {
        const data = this.trades.map(trade => ({
            Date: new Date(trade.openTime).toLocaleDateString('fr-FR'),
            Paire: trade.pair,
            Type: trade.type,
            Entrée: trade.entryPrice,
            'Stop Loss': trade.stopLoss,
            'Take Profit': trade.takeProfit,
            Lot: trade.lotSize,
            Statut: trade.status,
            Résultat: trade.result || '',
            'P&L': trade.pnl.toFixed(2),
            Commentaire: trade.comment || ''
        }));

        // Créer un CSV simple
        const headers = Object.keys(data[0] || {});
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => row[header]).join(','))
        ].join('\n');

        // Télécharger
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showNotification('Export terminé', 'success');
    }

    // Démarrer la synchronisation
    startSync() {
        // Synchronisation toutes les 30 secondes
        this.syncInterval = setInterval(() => {
            this.syncWithFirebase();
        }, 30000);

        // Sync initial
        this.syncWithFirebase();
    }

    // Synchronisation Firebase
    async syncWithFirebase() {
        try {
            // Vérifier si on a fait des changements récents (moins de 10 secondes)
            const timeSinceLastChange = Date.now() - this.lastLocalChange;
            if (timeSinceLastChange < 10000) {
                console.log('🔄 Changements locaux récents, skip sync');
                return;
            }

            // Simuler la synchronisation (remplacer par vraie logique Firebase)
            const syncStatus = document.getElementById('syncStatus');
            if (syncStatus) {
                syncStatus.style.background = 'rgba(255,193,7,0.2)';
                syncStatus.style.color = '#ffc107';
                syncStatus.textContent = '🔄 Sync...';

                setTimeout(() => {
                    syncStatus.style.background = 'rgba(78,205,196,0.2)';
                    syncStatus.style.color = '#4ecdc4';
                    syncStatus.textContent = '🔄 Sync Auto';
                }, 1000);
            }
        } catch (error) {
            console.error('Erreur sync:', error);
            const syncStatus = document.getElementById('syncStatus');
            if (syncStatus) {
                syncStatus.style.background = 'rgba(244,67,54,0.2)';
                syncStatus.style.color = '#f44336';
                syncStatus.textContent = '❌ Sync Error';
            }
        }
    }

    // Afficher une notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Styles CSS pour les notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .trade-open { background-color: rgba(33, 150, 243, 0.1); }
    .trade-win { background-color: rgba(76, 175, 80, 0.1); }
    .trade-loss { background-color: rgba(244, 67, 54, 0.1); }
    
    .status-open { color: #2196F3; font-weight: bold; }
    .status-closed { color: #4CAF50; font-weight: bold; }
    
    .positive { color: #4CAF50; }
    .negative { color: #F44336; }
    
    .btn-sm { padding: 4px 8px; font-size: 0.8em; }
    
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; color: #fff; }
    .form-group input, .form-group select, .form-group textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #333;
        border-radius: 4px;
        background: #222;
        color: #fff;
    }
    
    .form-actions { margin-top: 20px; text-align: center; }
    .form-actions button { margin: 0 5px; }
    
    .risk-display {
        background: rgba(0, 212, 255, 0.1);
        padding: 15px;
        border-radius: 5px;
        margin: 15px 0;
        border: 1px solid rgba(0, 212, 255, 0.3);
    }
    
    .risk-display div { margin: 5px 0; color: #fff; }
    
    .calendar-day {
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 1px solid #333;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
    }
    
    .calendar-day:hover { background-color: rgba(0, 212, 255, 0.1); }
    .calendar-day.today { background-color: rgba(0, 212, 255, 0.3); }
    .calendar-day.has-trades { background-color: rgba(76, 175, 80, 0.2); }
    .calendar-day.other-month { opacity: 0.3; }
    
    .day-number { font-weight: bold; }
    .trade-count {
        position: absolute;
        top: 2px;
        right: 2px;
        background: #4CAF50;
        color: white;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .monthly-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
    .monthly-item {
        padding: 15px;
        border-radius: 5px;
        text-align: center;
        border: 1px solid #333;
    }
    .monthly-item.positive { background-color: rgba(76, 175, 80, 0.1); border-color: #4CAF50; }
    .monthly-item.negative { background-color: rgba(244, 67, 54, 0.1); border-color: #F44336; }
    
    .month-label { font-weight: bold; margin-bottom: 5px; }
    .month-pnl { font-size: 1.2em; font-weight: bold; }
    
    .ict-correlation-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .ict-concept {
        padding: 15px;
        text-align: center;
        border-radius: 10px;
        border: 1px solid #333;
        transition: all 0.3s ease;
    }
    .ict-concept:hover { transform: translateY(-3px); }
    .ict-concept.excellent { background-color: rgba(76, 175, 80, 0.2); border-color: #4CAF50; }
    .ict-concept.good { background-color: rgba(255, 193, 7, 0.2); border-color: #FFC107; }
    .ict-concept.average { background-color: rgba(33, 150, 243, 0.2); border-color: #2196F3; }
    .ict-concept.poor { background-color: rgba(244, 67, 54, 0.2); border-color: #F44336; }
    
    .concept-name { font-size: 1.1em; font-weight: bold; margin-bottom: 8px; color: #00d4ff; }
    .concept-strength { font-weight: bold; font-size: 1.3em; margin-bottom: 5px; }
    .concept-description { font-size: 0.85em; color: #b0b0b0; line-height: 1.3; }
`;

document.head.appendChild(notificationStyles);