window.TradingDashboard = window.TradingDashboard || class TradingDashboard {
    constructor() {
        this.currentUser = sessionStorage.getItem('currentUser') || 'default';
        this.currentAccount = localStorage.getItem(`currentAccount_${this.currentUser}`) || 'compte1';
        
        try {
            this.trades = JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${this.currentAccount}`)) || [];
        } catch (error) {
            console.error('Erreur lors du chargement des trades:', error);
            this.trades = [];
        }
        
        try {
            this.settings = JSON.parse(localStorage.getItem(`settings_${this.currentUser}_${this.currentAccount}`)) || { capital: 1000, riskPerTrade: 2 };
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
            this.settings = { capital: 1000, riskPerTrade: 2 };
        }
        this.accounts = JSON.parse(localStorage.getItem(`accounts_${this.currentUser}`)) || {
            'compte1': { name: 'Compte Principal', capital: 1000 },
            'compte2': { name: 'Compte Démo', capital: 500 },
            'compte3': { name: 'Compte Swing', capital: 2000 }
        };
        this.initFirebase();
        this.currentStep = 0;
        this.currentTrade = {};
        this.livePrices = {};
        this.previousModalContent = null;
        this.lastLocalChange = 0;
        this.autoSyncCode = localStorage.getItem('autoSyncCode') || `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        localStorage.setItem('autoSyncCode', this.autoSyncCode);
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

    init() {
        this.setupEventListeners();
        this.initAccountSelector();
        
        // Chargement automatique Firebase au démarrage
        this.autoLoadFromFirebase().then(() => {
            this.updateStats();
            this.renderTradesTable();
            this.initCharts();
            this.updateCharts();
            this.initCalendar();
            this.updateAccountDisplay();
            this.updateAccountSelector();
            this.renderCorrelationMatrix();
            this.updatePerformanceMetrics();
            this.updateCumulativePerformance();
            this.updateMonthlyPerformance();
            console.log('Dashboard initialisé avec', this.trades.length, 'trades');
        });
        
        const accountSelect = document.getElementById('accountSelect');
        if (accountSelect) {
            accountSelect.addEventListener('change', (e) => {
                this.switchAccount(e.target.value);
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

    showCloseTradeModal() {
        const openTrades = this.trades.filter(t => t.status === 'open');
        if (openTrades.length === 0) {
            this.showNotification('Aucun trade ouvert à clôturer');
            return;
        }
        
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        let tradesHtml = '<h2>Clôturer un Trade</h2><div class="trade-form">';
        
        openTrades.forEach((trade, index) => {
            const tradeIndex = this.trades.indexOf(trade);
            tradesHtml += `
                <div style="background: rgba(30,30,30,0.6); padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${trade.currency}</strong>
                            <div style="font-size: 0.9em; opacity: 0.8;">Entrée: ${trade.entryPoint} | SL: ${trade.stopLoss} | TP: ${trade.takeProfit}</div>
                            <div style="font-size: 0.8em; opacity: 0.6;">Lot: ${trade.lotSize} | Date: ${trade.date}</div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn-success" onclick="dashboard.closeTrade(${tradeIndex}, 'TP')">TP</button>
                            <button class="btn-danger" onclick="dashboard.closeTrade(${tradeIndex}, 'SL')">SL</button>
                            <button class="btn-warning" onclick="dashboard.closeTrade(${tradeIndex}, 'BE')">BE</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        tradesHtml += '<button class="btn-secondary" onclick="dashboard.closeModal()">Fermer</button></div>';
        
        modalContent.innerHTML = tradesHtml;
        this.showModal();
    }
    
    showManualCloseModal() {
        const openTrades = this.trades.filter(t => t.status === 'open');
        if (openTrades.length === 0) {
            alert('Aucun trade ouvert à clôturer');
            return;
        }
        
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        let tradesHtml = '<h2>🎯 Clôture Manuelle</h2><div class="trade-form">';
        
        openTrades.forEach((trade, index) => {
            const tradeIndex = this.trades.indexOf(trade);
            tradesHtml += `
                <div style="background: rgba(30,30,30,0.6); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <strong>${trade.currency}</strong>
                            <div style="font-size: 0.9em; opacity: 0.8;">Entrée: ${trade.entryPoint} | SL: ${trade.stopLoss} | TP: ${trade.takeProfit}</div>
                            <div style="font-size: 0.8em; opacity: 0.6;">Lot: ${trade.lotSize} | Date: ${trade.date}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <select id="closeType_${tradeIndex}" style="padding: 5px; border-radius: 4px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);">
                            <option value="TP">Take Profit</option>
                            <option value="SL">Stop Loss</option>
                            <option value="Manual">Manuel</option>
                        </select>
                        <input type="number" id="closePrice_${tradeIndex}" placeholder="Prix de clôture" step="0.00001" value="${trade.takeProfit}" style="padding: 5px; border-radius: 4px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); width: 120px;">
                        <button class="btn-warning" onclick="dashboard.executeManualClose(${tradeIndex})">Clôturer</button>
                    </div>
                </div>
            `;
        });
        
        tradesHtml += '<button class="btn-secondary" onclick="dashboard.closeModal()">Fermer</button></div>';
        
        modalContent.innerHTML = tradesHtml;
        this.showModal();
        
        // Ajouter les event listeners pour les selects
        openTrades.forEach((trade, index) => {
            const tradeIndex = this.trades.indexOf(trade);
            const select = document.getElementById(`closeType_${tradeIndex}`);
            const priceInput = document.getElementById(`closePrice_${tradeIndex}`);
            
            if (select && priceInput) {
                select.addEventListener('change', (e) => {
                    if (e.target.value === 'TP') {
                        priceInput.value = trade.takeProfit;
                    } else if (e.target.value === 'SL') {
                        priceInput.value = trade.stopLoss;
                    } else {
                        priceInput.value = trade.entryPoint;
                    }
                });
            }
        });
    }
    
    executeManualClose(tradeIndex) {
        const trade = this.trades[tradeIndex];
        if (!trade || trade.status === 'closed') return;
        
        const closeType = document.getElementById(`closeType_${tradeIndex}`)?.value || 'Manual';
        const closePrice = parseFloat(document.getElementById(`closePrice_${tradeIndex}`)?.value);
        
        if (!closePrice || isNaN(closePrice)) {
            alert('Veuillez entrer un prix de clôture valide');
            return;
        }
        
        this.lastLocalChange = Date.now(); // Marquer modification locale
        trade.closeType = closeType;
        trade.closePrice = closePrice;
        trade.status = 'closed';
        trade.lastModified = Date.now();
        
        // Déterminer le résultat basé sur le type de clôture
        if (closeType === 'TP') {
            trade.result = 'Take Profit';
        } else if (closeType === 'SL') {
            trade.result = 'Stop Loss';
        } else {
            // Pour manuel, déterminer si c'est un gain ou une perte
            const isLong = parseFloat(trade.takeProfit) > parseFloat(trade.entryPoint);
            const isProfit = isLong ? closePrice > trade.entryPoint : closePrice < trade.entryPoint;
            trade.result = isProfit ? 'Gain Manuel' : 'Perte Manuel';
        }
        
        trade.pnl = this.calculatePnL(trade);
        
        this.saveToStorage();
        this.updateStats();
        this.renderTradesTable();
        this.updateCharts();
        this.updateCalendar();
        this.closeModal();
        
        this.showNotification(`Trade ${trade.currency} clôturé en ${trade.result}`);
        
        // Mise à jour immédiate
        this.renderCorrelationMatrix();
        this.updatePerformanceMetrics();
        this.updateCumulativePerformance();
        this.updateMonthlyPerformance();
        
        // Sync automatique
        this.autoSyncToFirebase();
    }
    
    closeTrade(index, result) {
        const trade = this.trades[index];
        if (!trade || trade.status === 'closed') return;
        
        this.lastLocalChange = Date.now(); // Marquer modification locale
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
        this.closeModal();
        
        this.showNotification(`Trade ${trade.currency} clôturé en ${result}`);
        
        // Mise à jour immédiate
        this.renderCorrelationMatrix();
        this.updatePerformanceMetrics();
        this.updateCumulativePerformance();
        this.updateMonthlyPerformance();
        
        // Sync automatique
        this.autoSyncToFirebase();
    }

    getCurrentDate() {
        // Utiliser le fuseau horaire local mais s'assurer que c'est bien la date actuelle
        const now = new Date();
        // Ajuster pour éviter les problèmes de fuseau horaire
        const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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

    showModal() {
        const modal = document.getElementById('tradeModal');
        if (modal) modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('tradeModal');
        if (modal) modal.style.display = 'none';
    }

    renderChecklistStep() {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        if (this.currentStep < this.checklistSteps.length) {
            const step = this.checklistSteps[this.currentStep];
            const optionsHtml = step.options.map((option, index) => 
                `<button class="btn-yes btn-small" onclick="dashboard.answerStep('${option}')">${option}</button>`
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
                        <button class="btn-skip" onclick="dashboard.skipToTrade()">⏩ Passer les étapes</button>
                    </div>
                </div>
            `;
        } else {
            this.renderTradeForm();
        }
    }

    renderStepChart(stepNumber) {
        const charts = {
            1: `<div class="strategy-chart"><img src="images/step1_context.svg" alt="Contexte Multi-timeframe" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('images/step1_context.svg', 'Contexte Multi-timeframe')">🔍 Plein écran</button></div>`,
            2: `<div class="strategy-chart"><img src="images/step2_orderblock.svg" alt="Order Block Strategy" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('images/step2_orderblock.svg', 'Order Block Strategy')">🔍 Plein écran</button></div>`,
            3: `<div class="strategy-chart"><img src="images/step3_bos.svg" alt="Break of Structure" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('images/step3_bos.svg', 'Break of Structure')">🔍 Plein écran</button></div>`,
            4: `<div class="strategy-chart"><img src="images/step4_killzones.svg" alt="Killzones Trading" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('images/step4_killzones.svg', 'Killzones Trading')">🔍 Plein écran</button></div>`,
            5: `<div class="strategy-chart"><img src="images/step5_entry.svg" alt="Signal d'Entrée" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('images/step5_entry.svg', 'Signal d\'Entrée')">🔍 Plein écran</button></div>`,
            6: `<div class="strategy-chart"><img src="images/step6_risk.svg" alt="Risk Management" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('images/step6_risk.svg', 'Risk Management')">🔍 Plein écran</button></div>`,
            7: `<div class="strategy-chart"><img src="images/step7_discipline.svg" alt="Discipline Trading" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px;"><button class="btn-fullscreen" onclick="dashboard.showFullscreenImage('images/step7_discipline.svg', 'Discipline Trading')">🔍 Plein écran</button></div>`
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
        const currentCapital = this.settings.capital + totalPnL;
        const riskAmount = (currentCapital * this.settings.riskPerTrade / 100).toFixed(2);
        
        modalContent.innerHTML = `
            <h2>Paramètres du Trade</h2>
            <div class="education-content">
                <h4>💰 Gestion du Risque :</h4>
                <p>Capital actuel: $${currentCapital.toFixed(2)} | Risque par trade: ${this.settings.riskPerTrade}% | Montant risqué: $${riskAmount}</p>
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
                        <option value="EUR/GBP">EUR/GBP</option>
                        <option value="EUR/JPY">EUR/JPY</option>
                        <option value="GBP/JPY">GBP/JPY</option>
                        <option value="XAU/USD">XAU/USD (Or)</option>
                        <option value="NAS100">NASDAQ 100</option>
                        <option value="GER40">DAX 40</option>
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
                    <label>Lot (modifiable):</label>
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
                <div class="form-group">
                    <input type="checkbox" id="multipleTP" onchange="dashboard.toggleMultipleTP()">
                    <label for="multipleTP">Trades multiples avec TP différents</label>
                </div>
                <div id="multipleTrades" style="display: none;">
                    <h4>Trades supplémentaires (même entrée/SL):</h4>
                    <p style="font-size: 0.9em; opacity: 0.8; margin-bottom: 15px;">Le trade principal ci-dessus + les trades supplémentaires ci-dessous partageront la même entrée et le même stop loss.</p>
                    <div id="tradesContainer">
                        <div class="trade-config">
                            <label>TP 2:</label>
                            <input type="number" class="tp-input" step="0.00001" placeholder="1.12800">
                            <label>Lot:</label>
                            <input type="number" class="lot-input" step="0.01" placeholder="0.05">
                        </div>
                        <div class="trade-config">
                            <label>TP 3:</label>
                            <input type="number" class="tp-input" step="0.00001" placeholder="1.13000">
                            <label>Lot:</label>
                            <input type="number" class="lot-input" step="0.01" placeholder="0.03">
                        </div>
                    </div>
                    <button type="button" class="btn-secondary" onclick="dashboard.addTradeConfig()">+ Ajouter TP</button>
                </div>
                <div class="form-buttons">
                    <button class="btn-submit" onclick="dashboard.saveTrade()">Enregistrer Trade(s)</button>
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
        const currentCapital = this.settings.capital + totalPnL;
        const riskAmount = currentCapital * this.settings.riskPerTrade / 100;
        
        if (entryPoint > 0 && stopLoss > 0 && entryPoint !== stopLoss) {
            let lotSize = 0;
            const slDistance = Math.abs(entryPoint - stopLoss);
            
            if (currency === 'XAU/USD') {
                lotSize = riskAmount / (slDistance * 100);
            } else if (currency === 'NAS100' || currency === 'GER40') {
                lotSize = riskAmount / slDistance;
            } else {
                const pipDistance = slDistance * Math.pow(10, this.getDecimalPlaces(currency));
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
            } else if (currency === 'NAS100' || currency === 'GER40') {
                riskAmount = slDistance * lotSize;
            } else {
                const pipDistance = slDistance * Math.pow(10, this.getDecimalPlaces(currency));
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
                } else if (currency === 'NAS100' || currency === 'GER40') {
                    potentialGain = tpDistance * lotSize;
                } else {
                    const pipDistanceTP = tpDistance * Math.pow(10, this.getDecimalPlaces(currency));
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

    getDecimalPlaces(currency) {
        if (currency.includes('JPY')) return 2;
        if (currency === 'XAU/USD') return 2;
        if (currency === 'NAS100' || currency === 'GER40') return 2;
        return 4;
    }

    toggleMultipleTP() {
        const checkbox = document.getElementById('multipleTP');
        const container = document.getElementById('multipleTrades');
        if (checkbox && container) {
            container.style.display = checkbox.checked ? 'block' : 'none';
        }
    }

    addTradeConfig() {
        const container = document.getElementById('tradesContainer');
        if (!container) return;
        
        const tpCount = container.children.length + 2; // +2 car TP1 est le principal
        const newConfig = document.createElement('div');
        newConfig.className = 'trade-config';
        newConfig.innerHTML = `
            <label>TP ${tpCount}:</label>
            <input type="number" class="tp-input" step="0.00001" placeholder="1.13500">
            <label>Lot:</label>
            <input type="number" class="lot-input" step="0.01" placeholder="0.02">
            <button type="button" class="btn-danger btn-small" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(newConfig);
    }

    saveTrade() {
        const currency = document.getElementById('currency')?.value;
        const entryPoint = parseFloat(document.getElementById('entryPoint')?.value);
        const stopLoss = parseFloat(document.getElementById('stopLoss')?.value);
        const riskPercent = this.settings.riskPerTrade;
        const multipleTP = document.getElementById('multipleTP')?.checked;
        const timestamp = Date.now();
        this.lastLocalChange = timestamp; // Marquer modification locale

        if (!currency || !entryPoint || !stopLoss) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (multipleTP) {
            // Sauvegarder plusieurs trades avec même entrée/SL
            const tpInputs = document.querySelectorAll('.tp-input');
            const lotInputs = document.querySelectorAll('.lot-input');
            let tradesAdded = 0;
            
            for (let i = 0; i < tpInputs.length; i++) {
                const takeProfit = parseFloat(tpInputs[i].value);
                const lotSize = parseFloat(lotInputs[i].value);
                
                if (takeProfit && lotSize) {
                    const trade = {
                        ...this.currentTrade,
                        id: `${this.deviceId}_${timestamp}_${i}`,
                        currency,
                        entryPoint,
                        stopLoss,
                        takeProfit,
                        lotSize,
                        riskPercent,
                        status: 'open',
                        tradeGroup: timestamp,
                        createdAt: timestamp,
                        lastModified: timestamp,
                        deviceId: this.deviceId
                    };
                    this.trades.push(trade);
                    tradesAdded++;
                }
            }
            
            // Ajouter aussi le trade principal si rempli
            const mainTP = parseFloat(document.getElementById('takeProfit')?.value);
            const mainLot = parseFloat(document.getElementById('lotSize')?.value);
            
            if (mainTP && mainLot) {
                const mainTrade = {
                    ...this.currentTrade,
                    id: `${this.deviceId}_${timestamp}_main`,
                    currency,
                    entryPoint,
                    stopLoss,
                    takeProfit: mainTP,
                    lotSize: mainLot,
                    riskPercent,
                    status: 'open',
                    tradeGroup: timestamp,
                    createdAt: timestamp,
                    lastModified: timestamp,
                    deviceId: this.deviceId
                };
                this.trades.push(mainTrade);
                tradesAdded++;
            }
            
            if (tradesAdded === 0) {
                alert('Veuillez remplir au moins un TP et Lot');
                return;
            }
        } else {
            // Sauvegarder un seul trade
            const takeProfit = parseFloat(document.getElementById('takeProfit')?.value);
            const lotSize = parseFloat(document.getElementById('lotSize')?.value);
            
            if (!takeProfit || !lotSize) {
                alert('Veuillez remplir le Take Profit et le Lot');
                return;
            }
            
            const trade = {
                ...this.currentTrade,
                id: `${this.deviceId}_${timestamp}`,
                currency,
                entryPoint,
                stopLoss,
                takeProfit,
                lotSize,
                riskPercent,
                status: 'open',
                createdAt: timestamp,
                lastModified: timestamp,
                deviceId: this.deviceId
            };
            this.trades.push(trade);
        }

        this.saveToStorage();
        this.closeModal();
        this.updateStats();
        this.renderTradesTable();
        this.updateCharts();
        this.updateCalendar();
        this.showNotification('Trade(s) enregistré(s) avec succès!');
        
        // Mise à jour immédiate
        this.renderCorrelationMatrix();
        this.updatePerformanceMetrics();
        this.updateCumulativePerformance();
        this.updateMonthlyPerformance();
        
        // Sync automatique
        this.autoSyncToFirebase();
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

    updateStats() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const openTrades = this.trades.filter(t => t.status === 'open');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const winningTrades = closedTrades.filter(t => parseFloat(t.pnl || 0) > 0);
        const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length * 100).toFixed(1) : '0.0';
        
        const statsElements = {
            totalTrades: document.getElementById('totalTrades'),
            openTrades: document.getElementById('openTrades'),
            totalPnL: document.getElementById('totalPnL'),
            winRate: document.getElementById('winRate'),
            capital: document.getElementById('capital')
        };
        
        if (statsElements.totalTrades) statsElements.totalTrades.textContent = this.trades.length;
        if (statsElements.openTrades) {
            statsElements.openTrades.textContent = openTrades.length;
            statsElements.openTrades.className = openTrades.length > 0 ? 'warning' : '';
        }
        if (statsElements.totalPnL) {
            statsElements.totalPnL.textContent = `$${totalPnL.toFixed(2)}`;
            statsElements.totalPnL.className = totalPnL >= 0 ? 'positive' : 'negative';
        }
        if (statsElements.winRate) {
            statsElements.winRate.textContent = `${winRate}%`;
            const rate = parseFloat(winRate);
            statsElements.winRate.className = rate >= 60 ? 'positive' : rate >= 40 ? 'warning' : 'negative';
        }
        if (statsElements.capital) {
            const currentCapital = this.settings.capital + totalPnL;
            statsElements.capital.textContent = `$${currentCapital.toFixed(2)}`;
            statsElements.capital.className = totalPnL >= 0 ? 'positive' : 'negative';
        }
        
        // Les métriques avancées sont mises à jour via setTimeout dans les fonctions appelantes
    }

    renderTradesTable() {
        const tbody = document.querySelector('#tradesTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.trades.slice(-10).reverse().forEach((trade, index) => {
            const row = document.createElement('tr');
            const pnl = parseFloat(trade.pnl || 0);
            const pnlClass = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : '';
            
            // Calculer le risque et gain potentiel
            const riskAmount = this.calculateRiskAmount(trade);
            const potentialGain = this.calculatePotentialGain(trade);
            const riskReward = riskAmount > 0 ? (potentialGain / riskAmount).toFixed(2) : '0.00';
            
            row.innerHTML = `
                <td>${trade.date}</td>
                <td>${trade.currency}</td>
                <td>${trade.entryPoint}</td>
                <td>${trade.stopLoss}</td>
                <td>${trade.takeProfit}</td>
                <td>${trade.lotSize}</td>
                <td>${trade.riskPercent || 2}%</td>
                <td class="negative">$${riskAmount.toFixed(2)}</td>
                <td class="positive">$${potentialGain.toFixed(2)}</td>
                <td class="${parseFloat(riskReward) >= 2 ? 'positive' : parseFloat(riskReward) >= 1.5 ? 'warning' : 'negative'}">1:${riskReward}</td>
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
        
        const validResults = ['TP', 'SL', 'BE'];
        const cleanResult = result.toUpperCase().trim();
        if (validResults.includes(cleanResult)) {
            this.closeTrade(index, cleanResult);
        } else {
            this.showNotification('Résultat invalide. Utilisez TP, SL ou BE');
        }
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
        } else if (currency === 'NAS100' || currency === 'GER40') {
            pnl = priceDiff * lotSize;
        } else {
            const pipDiff = priceDiff * Math.pow(10, this.getDecimalPlaces(currency));
            pnl = pipDiff * lotSize * 10;
        }
        
        return parseFloat(pnl.toFixed(2));
    }

    calculateRiskAmount(trade) {
        const entryPoint = parseFloat(trade.entryPoint);
        const stopLoss = parseFloat(trade.stopLoss);
        const lotSize = parseFloat(trade.lotSize);
        const currency = trade.currency;
        
        if (!entryPoint || !stopLoss || !lotSize) return 0;
        
        const slDistance = Math.abs(entryPoint - stopLoss);
        let riskAmount = 0;
        
        if (currency === 'XAU/USD') {
            riskAmount = slDistance * lotSize * 100;
        } else if (currency === 'NAS100' || currency === 'GER40') {
            riskAmount = slDistance * lotSize;
        } else {
            const pipDistance = slDistance * Math.pow(10, this.getDecimalPlaces(currency));
            riskAmount = pipDistance * lotSize * 10;
        }
        
        return riskAmount;
    }

    calculatePotentialGain(trade) {
        const entryPoint = parseFloat(trade.entryPoint);
        const takeProfit = parseFloat(trade.takeProfit);
        const lotSize = parseFloat(trade.lotSize);
        const currency = trade.currency;
        
        if (!entryPoint || !takeProfit || !lotSize) return 0;
        
        const tpDistance = Math.abs(takeProfit - entryPoint);
        let potentialGain = 0;
        
        if (currency === 'XAU/USD') {
            potentialGain = tpDistance * lotSize * 100;
        } else if (currency === 'NAS100' || currency === 'GER40') {
            potentialGain = tpDistance * lotSize;
        } else {
            const pipDistance = tpDistance * Math.pow(10, this.getDecimalPlaces(currency));
            potentialGain = pipDistance * lotSize * 10;
        }
        
        return potentialGain;
    }

    saveToStorage() {
        try {
            localStorage.setItem(`trades_${this.currentUser}_${this.currentAccount}`, JSON.stringify(this.trades));
            localStorage.setItem(`settings_${this.currentUser}_${this.currentAccount}`, JSON.stringify(this.settings));
            localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
            this.lastLocalChange = Date.now();
            // Auto-sync immédiat après sauvegarde
            setTimeout(() => this.autoSyncToFirebase(), 100);
        } catch (error) {
            console.error('Erreur sauvegarde localStorage:', error);
            this.showNotification('⚠️ Erreur de sauvegarde locale');
        }
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
                
                <h3 style="margin-top: 30px; color: #00d4ff;">🎯 Objectifs de Trading</h3>
                <div class="form-group">
                    <label>Objectif journalier (%):</label>
                    <input type="number" id="dailyTargetInput" value="${this.settings.dailyTarget || 2}" step="0.1" min="0.1">
                </div>
                <div class="form-group">
                    <label>Objectif mensuel (%):</label>
                    <input type="number" id="monthlyTargetInput" value="${this.settings.monthlyTarget || 20}" step="0.1" min="1">
                </div>
                <div class="form-group">
                    <label>Objectif annuel (%):</label>
                    <input type="number" id="yearlyTargetInput" value="${this.settings.yearlyTarget || 100}" step="1" min="10">
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
        const dailyTarget = parseFloat(document.getElementById('dailyTargetInput')?.value) || 2;
        const monthlyTarget = parseFloat(document.getElementById('monthlyTargetInput')?.value) || 20;
        const yearlyTarget = parseFloat(document.getElementById('yearlyTargetInput')?.value) || 100;
        
        this.lastLocalChange = Date.now(); // Marquer modification locale
        this.settings = { 
            capital, 
            riskPerTrade, 
            dailyTarget, 
            monthlyTarget, 
            yearlyTarget 
        };
        this.accounts[this.currentAccount].capital = capital;
        this.saveToStorage();
        this.updateStats();
        this.updateAccountDisplay();
        this.updateCalendar();
        this.closeModal();
        this.showNotification('Paramètres sauvegardés!');
        
        // Sync automatique
        this.autoSyncToFirebase();
    }

    resetAllData() {
        if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données ?')) {
            try {
                this.lastLocalChange = Date.now(); // Marquer modification locale
                this.trades = [];
                this.settings = { capital: 1000, riskPerTrade: 2 };
                this.saveToStorage();
                this.updateStats();
                this.renderTradesTable();
                this.updateCharts();
                this.updateCalendar();
                this.showNotification('Données réinitialisées!');
                this.autoSyncToFirebase(); // Sync immédiat
            } catch (error) {
                console.error('Erreur reset:', error);
                this.showNotification('⚠️ Erreur lors de la réinitialisation');
            }
        }
    }

    initAccountSelector() {
        const select = document.getElementById('accountSelect');
        if (select) {
            select.value = this.currentAccount;
            this.updateAccountDisplay();
        }
    }

    switchAccount(accountId) {
        if (!accountId || accountId === this.currentAccount) return;
        
        this.currentAccount = accountId;
        localStorage.setItem(`currentAccount_${this.currentUser}`, accountId);
        this.trades = JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${this.currentAccount}`)) || [];
        this.settings = JSON.parse(localStorage.getItem(`settings_${this.currentUser}_${this.currentAccount}`)) || { capital: 1000, riskPerTrade: 2 };
        
        this.updateStats();
        this.renderTradesTable();
        this.updateCharts();
        this.updateCalendar();
        this.updateAccountDisplay();
        
        this.showNotification(`Compte changé: ${this.accounts[accountId]?.name || accountId}`);
        
        // Sync automatique
        this.autoSyncToCloud();
    }

    addNewAccount() {
        const name = prompt('Nom du nouveau compte:');
        if (!name) return;
        const capital = parseFloat(prompt('Capital initial:', '1000')) || 1000;
        const accountId = 'compte' + (Object.keys(this.accounts).length + 1);
        this.lastLocalChange = Date.now(); // Marquer modification locale
        this.accounts[accountId] = { name, capital };
        localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
        this.updateAccountSelector();
        this.showNotification('Nouveau compte créé!');
        this.autoSyncToFirebase(); // Sync immédiat
    }

    deleteAccount() {
        if (Object.keys(this.accounts).length <= 1) {
            this.showNotification('Impossible de supprimer le dernier compte');
            return;
        }
        if (confirm(`Supprimer le compte ${this.accounts[this.currentAccount]?.name}?`)) {
            try {
                this.lastLocalChange = Date.now(); // Marquer la modification locale
                delete this.accounts[this.currentAccount];
                localStorage.removeItem(`trades_${this.currentUser}_${this.currentAccount}`);
                localStorage.removeItem(`settings_${this.currentUser}_${this.currentAccount}`);
                this.currentAccount = Object.keys(this.accounts)[0];
                localStorage.setItem(`currentAccount_${this.currentUser}`, this.currentAccount);
                localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
                this.updateAccountSelector();
                this.switchAccount(this.currentAccount);
                this.showNotification('Compte supprimé avec succès');
                // Sync immédiat pour écraser Firebase
                this.autoSyncToFirebase();
            } catch (error) {
                console.error('Erreur suppression compte:', error);
                this.showNotification('⚠️ Erreur lors de la suppression');
            }
        }
    }

    updateAccountSelector() {
        const select = document.getElementById('accountSelect');
        if (!select) return;
        select.innerHTML = '';
        Object.entries(this.accounts).forEach(([id, account]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = account.name;
            select.appendChild(option);
        });
        select.value = this.currentAccount;
    }

    updateAccountDisplay() {
        const capitalElement = document.getElementById('capital');
        if (capitalElement && this.accounts[this.currentAccount]) {
            const closedTrades = this.trades.filter(t => t.status === 'closed');
            const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
            const currentCapital = this.accounts[this.currentAccount].capital + totalPnL;
            capitalElement.textContent = `$${currentCapital.toFixed(2)}`;
        }
    }

    initFirebase() {
        try {
            if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                const firebaseConfig = {
                    apiKey: "AIzaSyDSDK0NfVSs_VQb3TnrixiJbOpTsmoUMvU",
                    authDomain: "misterpips-b71fb.firebaseapp.com",
                    databaseURL: "https://misterpips-b71fb-default-rtdb.europe-west1.firebasedatabase.app",
                    projectId: "misterpips-b71fb",
                    storageBucket: "misterpips-b71fb.firebasestorage.app",
                    messagingSenderId: "574231126409",
                    appId: "1:574231126409:web:b7ed93ac4ea62e247dc158"
                };
                firebase.initializeApp(firebaseConfig);
            }
            this.database = firebase?.database?.() || null;
            this.deviceId = this.getDeviceId();
            this.syncInProgress = false;
            this.lastSyncTime = 0;
            if (this.database) {
                this.setupRealtimeSync();
            }
        } catch (error) {
            console.log('Firebase non disponible, mode local uniquement');
            this.database = null;
        }
    }

    showCloudSync() {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        const lastSync = localStorage.getItem('lastSyncTime');
        const syncStatus = this.database ? '🟢 Connecté' : '🔴 Hors ligne';
        
        modalContent.innerHTML = `
            <h2>☁️ Synchronisation Cloud</h2>
            <div class="trade-form">
                <div style="background: rgba(0,212,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4>📊 État de la synchronisation</h4>
                    <p><strong>Statut:</strong> ${syncStatus}</p>
                    <p><strong>Dernière sync:</strong> ${lastSync ? new Date(parseInt(lastSync)).toLocaleString() : 'Jamais'}</p>
                    <p><strong>Référence:</strong> ${localStorage.getItem('syncCode') || 'Non définie'}</p>
                </div>
                
                <div class="form-group">
                    <label>Code de synchronisation (référence unique):</label>
                    <input type="text" id="syncCode" placeholder="Entrez votre code" value="${this.getSyncCode()}">
                    <small style="opacity: 0.8; font-size: 0.9em;">Ce code permet de synchroniser vos données entre appareils</small>
                </div>
                
                <div class="form-buttons">
                    <button class="btn-primary" onclick="dashboard.uploadToFirebase()">📤 Sauvegarder vers Cloud</button>
                    <button class="btn-secondary" onclick="dashboard.downloadFromFirebase()">📥 Charger depuis Cloud</button>
                    <button class="btn-info" onclick="dashboard.exportAllData()">💾 Export Local (.json)</button>
                    <button class="btn-warning" onclick="dashboard.importAllData()">📁 Import Local (.json)</button>
                    <button class="btn-danger" onclick="dashboard.closeModal()">Fermer</button>
                </div>
                
                <div style="background: rgba(255,193,7,0.1); padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <h4>ℹ️ Comment ça marche</h4>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9em;">
                        <li><strong>Sauvegarder:</strong> Envoie vos données vers le cloud avec votre code</li>
                        <li><strong>Charger:</strong> Récupère les données du cloud avec un code</li>
                        <li><strong>Auto-sync:</strong> Synchronisation automatique toutes les 2 minutes</li>
                        <li><strong>Référence:</strong> La dernière modification est utilisée comme référence</li>
                    </ul>
                </div>
            </div>
        `;
        this.showModal();
    }

    getSyncCode() {
        return localStorage.getItem('syncCode') || this.currentUser + '_' + Date.now().toString().slice(-6);
    }

    uploadToFirebase() {
        if (!this.database) {
            this.showNotification('❌ Firebase non disponible - mode local uniquement');
            return;
        }
        
        const syncCode = document.getElementById('syncCode')?.value?.trim();
        if (!syncCode) {
            this.showNotification('❌ Veuillez entrer un code de synchronisation');
            return;
        }
        
        this.updateSyncStatus('🔄 Sauvegarde...');
        
        const data = {
            accounts: this.accounts,
            trades: {},
            settings: {},
            lastSync: Date.now(),
            deviceId: this.deviceId,
            version: '2.0'
        };
        
        Object.keys(this.accounts).forEach(accountId => {
            data.trades[accountId] = JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${accountId}`)) || [];
            data.settings[accountId] = JSON.parse(localStorage.getItem(`settings_${this.currentUser}_${accountId}`)) || { capital: 1000, riskPerTrade: 2 };
        });
        
        this.database.ref(`users/${syncCode}`).set(data)
            .then(() => {
                localStorage.setItem('syncCode', syncCode);
                localStorage.setItem('lastSyncTime', data.lastSync.toString());
                this.lastSyncTime = data.lastSync;
                this.showNotification('✅ Données sauvegardées dans le cloud!');
                this.updateSyncStatus('✅ Sauvegardé');
                this.closeModal();
            })
            .catch(error => {
                console.error('Erreur Firebase:', error);
                this.showNotification('❌ Erreur de sauvegarde: ' + error.message);
                this.updateSyncStatus('❌ Erreur');
            });
    }

    downloadFromFirebase() {
        if (!this.database) {
            this.showNotification('❌ Firebase non disponible - mode local uniquement');
            return;
        }
        
        const syncCode = document.getElementById('syncCode')?.value?.trim();
        if (!syncCode) {
            this.showNotification('❌ Veuillez entrer un code de synchronisation');
            return;
        }
        
        this.updateSyncStatus('🔄 Chargement...');
        
        this.database.ref(`users/${syncCode}`).once('value')
            .then(snapshot => {
                const data = snapshot.val();
                if (!data) {
                    this.showNotification('❌ Aucune donnée trouvée pour ce code');
                    this.updateSyncStatus('❌ Code invalide');
                    return;
                }
                
                // Confirmation avant écrasement
                if (!confirm('⚠️ Cela va remplacer vos données locales. Continuer?')) {
                    this.updateSyncStatus('🔄 Annulé');
                    return;
                }
                
                // Fusionner les données
                this.accounts = data.accounts || this.accounts;
                Object.keys(data.trades || {}).forEach(accountId => {
                    const remoteTrades = data.trades[accountId] || [];
                    const localTrades = JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${accountId}`)) || [];
                    const mergedTrades = this.mergeTrades(localTrades, remoteTrades);
                    localStorage.setItem(`trades_${this.currentUser}_${accountId}`, JSON.stringify(mergedTrades));
                });
                
                Object.keys(data.settings || {}).forEach(accountId => {
                    localStorage.setItem(`settings_${this.currentUser}_${accountId}`, JSON.stringify(data.settings[accountId]));
                });
                
                localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
                localStorage.setItem('syncCode', syncCode);
                localStorage.setItem('lastSyncTime', (data.lastSync || Date.now()).toString());
                this.lastSyncTime = data.lastSync || Date.now();
                
                // Recharger l'interface
                this.switchAccount(this.currentAccount);
                this.updateAccountSelector();
                this.updateStats();
                this.renderTradesTable();
                this.updateCharts();
                this.updateCalendar();
                
                this.showNotification('✅ Données chargées depuis le cloud!');
                this.updateSyncStatus('✅ Chargé');
                this.closeModal();
            })
            .catch(error => {
                console.error('Erreur Firebase:', error);
                this.showNotification('❌ Erreur de chargement: ' + error.message);
                this.updateSyncStatus('❌ Erreur');
            });
    }

    exportAllData() {
        const data = {
            accounts: this.accounts,
            trades: {},
            settings: {},
            exportDate: new Date().toISOString()
        };
        
        Object.keys(this.accounts).forEach(accountId => {
            data.trades[accountId] = JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${accountId}`)) || [];
            data.settings[accountId] = JSON.parse(localStorage.getItem(`settings_${this.currentUser}_${accountId}`)) || { capital: 1000, riskPerTrade: 2 };
        });
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trading_data_${this.currentUser}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('Données exportées!');
    }

    importAllData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => this.handleFileImport(e);
        input.click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('Importer ces données? Cela remplacera vos données actuelles.')) {
                    this.accounts = data.accounts || this.accounts;
                    Object.keys(data.trades || {}).forEach(accountId => {
                        localStorage.setItem(`trades_${this.currentUser}_${accountId}`, JSON.stringify(data.trades[accountId]));
                    });
                    Object.keys(data.settings || {}).forEach(accountId => {
                        localStorage.setItem(`settings_${this.currentUser}_${accountId}`, JSON.stringify(data.settings[accountId]));
                    });
                    
                    localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
                    
                    this.switchAccount(this.currentAccount);
                    this.updateAccountSelector();
                    this.showNotification('Données importées avec succès!');
                    this.closeModal();
                }
            } catch (error) {
                alert('Erreur lors de l\'import: ' + error.message);
            }
        };
        reader.readAsText(file);
    }




    

    
    updateSimulatedPrices() {
        // Prix réalistes basés sur les derniers cours connus
        const pairs = {
            'EURUSD': { current: 1.05234, decimals: 5, volatility: 0.0002 },
            'GBPUSD': { current: 1.26789, decimals: 5, volatility: 0.0003 },
            'USDJPY': { current: 149.123, decimals: 3, volatility: 0.02 },
            'AUDUSD': { current: 0.65432, decimals: 5, volatility: 0.0002 },
            'USDCAD': { current: 1.36789, decimals: 5, volatility: 0.0002 },
            'XAUUSD': { current: 2034.56, decimals: 2, volatility: 0.5 }
        };
        
        Object.entries(pairs).forEach(([pair, config]) => {
            const element = document.getElementById(`price_${pair}`);
            if (element) {
                const previousPrice = parseFloat(element.textContent) || config.current;
                const change = (Math.random() - 0.5) * config.volatility * 2;
                const newPrice = previousPrice + change;
                this.updatePriceElement(`price_${pair}`, newPrice.toFixed(config.decimals), previousPrice);
            }
        });
        
        const statusEl = document.getElementById('apiStatus');
        if (statusEl) statusEl.textContent = '⚠️ Prix simulés (APIs indisponibles)';
    }
    
    updatePriceElement(elementId, newPrice, previousPrice) {
        const element = document.getElementById(elementId);
        if (element) {
            const change = parseFloat(newPrice) - parseFloat(previousPrice);
            element.textContent = newPrice;
            element.style.color = change > 0 ? '#4ecdc4' : change < 0 ? '#ff6b6b' : '#ffffff';
            
            // Animation de changement
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }
    




    exportToExcel() {
        let csvContent = "Date,Devise,Entrée,SL,TP,Lot,Risque%,Résultat,Gain/Perte\n";
        this.trades.forEach(trade => {
            csvContent += `${trade.date},${trade.currency},${trade.entryPoint},${trade.stopLoss},${trade.takeProfit},${trade.lotSize},${trade.riskPercent || 2},${trade.result || 'Open'},${trade.pnl || 0}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trades_${this.currentUser}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('Données exportées en CSV!');
    }

    initCharts() {
        this.initGainsGauge();
        this.initConfluencesChart();
    }

    initGainsGauge() {
        // Initialisation de la gauge avec valeurs par défaut
        this.updateGainsGauge();
    }

    initConfluencesChart() {
        const ctx = document.getElementById('confluencesChart');
        if (!ctx) return;
        
        try {
            this.confluencesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Excellentes (6-7)', 'Bonnes (4-5)', 'Moyennes (2-3)', 'Faibles (0-1)'],
                    datasets: [{
                        data: [0, 0, 0, 1],
                        backgroundColor: ['#4ecdc4', '#00d4ff', '#ffc107', '#ff6b6b'],
                        borderWidth: 2,
                        borderColor: '#1a1a2e'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { 
                                color: '#ffffff',
                                padding: 6,
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erreur graphique confluences:', error);
        }
    }

    updateCharts() {
        try {
            this.updateGainsGauge();
            this.updateConfluencesChart();
            this.renderCorrelationMatrix();
            this.updatePerformanceMetrics();
            this.updateCumulativePerformance();
            this.updateMonthlyPerformance();
        } catch (error) {
            console.log('Erreur updateCharts:', error);
        }
    }

    generateCorrelationMatrix() {
        const confluenceKeys = [
            { key: 'contextGlobal', name: 'Contexte Global' },
            { key: 'zoneInstitutionnelle', name: 'Zone Instit.' },
            { key: 'structureMarche', name: 'Structure' },
            { key: 'timingKillzones', name: 'Killzones' },
            { key: 'signalEntree', name: 'Signal' },
            { key: 'riskManagement', name: 'Risk Mgmt' },
            { key: 'discipline', name: 'Discipline' }
        ];

        const matrix = {};
        const closedTrades = this.trades.filter(t => t.status === 'closed' && t.confluences);
        
        confluenceKeys.forEach(conf1 => {
            matrix[conf1.key] = {};
            confluenceKeys.forEach(conf2 => {
                if (conf1.key === conf2.key) {
                    // Diagonal: taux de réussite de cette confluence seule
                    const tradesWithConf = closedTrades.filter(t => 
                        t.confluences[conf1.key] && this.isValidConfluence(t.confluences[conf1.key])
                    );
                    const winningTrades = tradesWithConf.filter(t => parseFloat(t.pnl || 0) > 0);
                    matrix[conf1.key][conf2.key] = tradesWithConf.length > 0 ? 
                        Math.round((winningTrades.length / tradesWithConf.length) * 100) : 0;
                } else {
                    // Corrélation entre deux confluences différentes
                    const tradesWithBoth = closedTrades.filter(t => 
                        t.confluences[conf1.key] && this.isValidConfluence(t.confluences[conf1.key]) &&
                        t.confluences[conf2.key] && this.isValidConfluence(t.confluences[conf2.key])
                    );
                    const winningTradesBoth = tradesWithBoth.filter(t => parseFloat(t.pnl || 0) > 0);
                    
                    if (tradesWithBoth.length > 0) {
                        matrix[conf1.key][conf2.key] = Math.round((winningTradesBoth.length / tradesWithBoth.length) * 100);
                    } else {
                        // Estimation basée sur les données existantes
                        const baseRate = closedTrades.length > 0 ? 
                            (closedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length / closedTrades.length) * 100 : 50;
                        matrix[conf1.key][conf2.key] = Math.round(baseRate);
                    }
                }
            });
        });
        
        return { matrix, confluenceKeys };
    }
    
    isValidConfluence(confluenceValue) {
        if (!confluenceValue) return false;
        const invalid = ['Aucune', 'Faible', 'Aucune Zone', 'Structure Unclear', 'Hors Killzone', 'Signal Faible', 'SL Trop Large', 'Amélioration Nécessaire'];
        return !invalid.some(term => confluenceValue.includes(term));
    }



    renderCorrelationMatrix() {
        const container = document.getElementById('correlationMatrix');
        if (!container) {
            console.log('Container correlationMatrix non trouvé');
            return;
        }
        
        const { matrix, confluenceKeys } = this.generateCorrelationMatrix();
        const closedTrades = this.trades.filter(t => t.status === 'closed' && t.confluences);
        const totalTrades = closedTrades.length;
        
        let html = `<div class="correlation-info">
            <h3>🔗 Matrice de Corrélation ICT</h3>
            <p>📊 Analyse basée sur ${totalTrades} trades fermés avec confluences</p>
            <p>🎯 Pourcentage = Taux de réussite avec ces confluences combinées</p>
        </div>`;
        
        if (totalTrades === 0) {
            html += '<div class="no-data">📈 Créez des trades avec confluences pour voir la matrice de corrélation</div>';
        }
        
        html += '<div class="correlation-grid">';
        
        // Header row
        html += '<div class="correlation-cell header"></div>';
        confluenceKeys.forEach(conf => {
            html += `<div class="correlation-cell header">${conf.name}</div>`;
        });
        
        // Data rows
        confluenceKeys.forEach(conf1 => {
            html += `<div class="correlation-cell row-header">${conf1.name}</div>`;
            confluenceKeys.forEach(conf2 => {
                const value = totalTrades > 0 ? matrix[conf1.key][conf2.key] : 50;
                const cellClass = this.getCorrelationClass(value);
                const tooltip = conf1.key === conf2.key ? 
                    `${conf1.name}: ${value}% de réussite` : 
                    `${conf1.name} + ${conf2.name}: ${value}% de réussite`;
                html += `<div class="correlation-cell data ${cellClass}" title="${tooltip}">${value}%</div>`;
            });
        });
        
        html += '</div>';
        container.innerHTML = html;
        console.log('Matrice de corrélation mise à jour avec', totalTrades, 'trades');
    }

    getCorrelationClass(value) {
        if (value >= 80) return 'excellent';
        if (value >= 60) return 'good';
        if (value >= 40) return 'average';
        return 'poor';
    }

    updateGainsGauge() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const gainsValue = document.getElementById('gainsValue');
        const gainsPercent = document.getElementById('gainsPercent');
        
        if (gainsValue) {
            gainsValue.textContent = `$${totalPnL.toFixed(2)}`;
            gainsValue.className = totalPnL >= 0 ? 'positive' : 'negative';
        }
        if (gainsPercent) {
            const percent = this.settings.capital > 0 ? ((totalPnL / this.settings.capital) * 100).toFixed(1) : '0.0';
            gainsPercent.textContent = `${percent}%`;
            gainsPercent.className = totalPnL >= 0 ? 'positive' : 'negative';
        }
        
        // Mise à jour de la gauge visuelle
        const gauge = document.getElementById('gainsGauge');
        if (gauge) {
            const percentValue = Math.abs(parseFloat(gainsPercent?.textContent || '0'));
            const rotation = Math.min(percentValue * 1.8, 180); // Max 180 degrés
            gauge.style.background = totalPnL >= 0 ? 
                `conic-gradient(from 0deg, #4ecdc4 0deg ${rotation}deg, #2a2f3a ${rotation}deg 360deg)` :
                `conic-gradient(from 0deg, #ff6b6b 0deg ${rotation}deg, #2a2f3a ${rotation}deg 360deg)`;
        }
    }

    updateConfluencesChart() {
        const analysis = this.generateConfluenceAnalysis();
        
        // Mise à jour du graphique si disponible
        if (this.confluencesChart) {
            this.confluencesChart.data.datasets[0].data = [
                analysis.excellent, analysis.good, analysis.average, analysis.poor
            ];
            this.confluencesChart.update('none');
        }
        
        // Mise à jour de l'analyse textuelle
        const analysisDiv = document.getElementById('confluenceAnalysis');
        if (analysisDiv) {
            const total = analysis.excellent + analysis.good + analysis.average + analysis.poor;
            analysisDiv.innerHTML = `
                <h4>📊 Analyse des Confluences (${total} trades)</h4>
                <div class="analysis-item">
                    <span class="confluence-name">Excellentes (6-7 confluences)</span>
                    <span class="confluence-score score-excellent">${analysis.excellent}</span>
                </div>
                <div class="analysis-item">
                    <span class="confluence-name">Bonnes (4-5 confluences)</span>
                    <span class="confluence-score score-good">${analysis.good}</span>
                </div>
                <div class="analysis-item">
                    <span class="confluence-name">Moyennes (2-3 confluences)</span>
                    <span class="confluence-score score-average">${analysis.average}</span>
                </div>
                <div class="analysis-item">
                    <span class="confluence-name">Faibles (0-1 confluence)</span>
                    <span class="confluence-score score-poor">${analysis.poor}</span>
                </div>
            `;
        }
        
        console.log('Analyse des confluences mise à jour:', analysis);
    }

    generateConfluenceAnalysis() {
        const analysis = { excellent: 0, good: 0, average: 0, poor: 0 };
        
        if (this.trades.length === 0) {
            return analysis;
        }
        
        this.trades.forEach(trade => {
            const confluences = trade.confluences || {};
            const validConfluences = Object.values(confluences).filter(conf => 
                this.isValidConfluence(conf)
            );
            
            const score = validConfluences.length;
            if (score >= 6) analysis.excellent++;
            else if (score >= 4) analysis.good++;
            else if (score >= 2) analysis.average++;
            else analysis.poor++;
        });
        
        return analysis;
    }

    initCalendar() {
        this.currentDate = new Date();
        this.setupCalendarListeners();
        this.renderCalendar();
    }

    setupCalendarListeners() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) prevBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        
        if (nextBtn) nextBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });
    }

    renderCalendar() {
        const monthLabel = document.getElementById('monthLabel');
        const calendarGrid = document.getElementById('calendarGrid');
        
        if (!monthLabel || !calendarGrid) return;
        
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        monthLabel.textContent = `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        calendarGrid.innerHTML = '';
        
        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            
            const cell = this.createCalendarCell(cellDate);
            calendarGrid.appendChild(cell);
        }
        
        this.updateCalendarSummary();
    }

    createCalendarCell(date) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        
        const dateStr = date.toISOString().split('T')[0];
        const dayTrades = this.trades.filter(t => t.date === dateStr && t.status === 'closed');
        const dayPnL = dayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        
        if (date.getMonth() !== this.currentDate.getMonth()) {
            cell.classList.add('other-month');
        }
        
        if (dayPnL > 0) cell.classList.add('profit');
        else if (dayPnL < 0) cell.classList.add('loss');
        
        cell.innerHTML = `
            <div class="cell-date">${date.getDate()}</div>
            ${dayTrades.length > 0 ? `
                <div class="cell-pnl">$${dayPnL.toFixed(2)}</div>
                <div class="cell-count">${dayTrades.length} trade(s)</div>
            ` : ''}
        `;
        
        cell.addEventListener('click', () => this.showDayDetails(dateStr, dayTrades));
        
        return cell;
    }

    showDayDetails(date, trades) {
        if (trades.length === 0) return;
        
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        const totalPnL = trades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const winTrades = trades.filter(t => parseFloat(t.pnl || 0) > 0).length;
        const winRate = trades.length > 0 ? (winTrades / trades.length * 100).toFixed(1) : 0;
        const percentGain = ((totalPnL / this.settings.capital) * 100).toFixed(2);
        
        let tradesHtml = `
            <h2>📅 Trades du ${date}</h2>
            <div class="day-summary" style="background: rgba(0,212,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <div style="display: flex; justify-content: space-around; margin-bottom: 15px;">
                    <div><strong>Trades:</strong> ${trades.length}</div>
                    <div><strong>Winrate:</strong> ${winRate}%</div>
                    <div><strong>P&L:</strong> <span class="${totalPnL >= 0 ? 'positive' : 'negative'}">$${totalPnL.toFixed(2)}</span></div>
                    <div><strong>%:</strong> <span class="${totalPnL >= 0 ? 'positive' : 'negative'}">${percentGain}%</span></div>
                </div>
                <div class="share-buttons" style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn-info btn-small" onclick="dashboard.shareToX('${date}', ${totalPnL}, '${winRate}', '${percentGain}', ${trades.length})">📱 X (Twitter)</button>
                    <button class="btn-primary btn-small" onclick="dashboard.shareToFacebook('${date}', ${totalPnL}, '${winRate}', '${percentGain}', ${trades.length})">📘 Facebook</button>
                    <button class="btn-warning btn-small" onclick="dashboard.shareToInstagram('${date}', ${totalPnL}, '${winRate}', '${percentGain}', ${trades.length})">📸 Instagram</button>
                    <button class="btn-danger btn-small" onclick="dashboard.shareToTikTok('${date}', ${totalPnL}, '${winRate}', '${percentGain}', ${trades.length})">🎵 TikTok</button>
                </div>
            </div>
            <div class="trade-form">`;
        
        trades.forEach(trade => {
            const pnl = parseFloat(trade.pnl || 0);
            tradesHtml += `
                <div style="background: rgba(30,30,30,0.6); padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.1);">
                    <strong>${trade.currency}</strong> - ${trade.result}
                    <div>Entrée: ${trade.entryPoint} | SL: ${trade.stopLoss} | TP: ${trade.takeProfit}</div>
                    <div>Lot: ${trade.lotSize} | P&L: <span class="${pnl >= 0 ? 'positive' : 'negative'}">$${pnl.toFixed(2)}</span></div>
                </div>
            `;
        });
        
        tradesHtml += '<button class="btn-secondary" onclick="dashboard.closeModal()">Fermer</button></div>';
        
        modalContent.innerHTML = tradesHtml;
        this.showModal();
    }

    updateCalendar() {
        this.renderCalendar();
    }

    updateCalendarSummary() {
        const summaryDiv = document.getElementById('calendarSummary');
        if (!summaryDiv) return;
        
        const monthTrades = this.trades.filter(t => {
            if (!t.date) return false;
            const tradeDate = new Date(t.date);
            return tradeDate.getMonth() === this.currentDate.getMonth() && 
                   tradeDate.getFullYear() === this.currentDate.getFullYear() &&
                   t.status === 'closed';
        });
        
        const totalPnL = monthTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const winTrades = monthTrades.filter(t => parseFloat(t.pnl || 0) > 0).length;
        const winRate = monthTrades.length > 0 ? (winTrades / monthTrades.length * 100).toFixed(1) : '0.0';
        
        // Calculs des objectifs avec protection division par zéro
        const capital = this.settings.capital || 1000;
        const monthlyPercentage = ((totalPnL / capital) * 100).toFixed(2);
        const monthlyTarget = this.settings.monthlyTarget || 20;
        const monthlyProgress = monthlyTarget > 0 ? ((parseFloat(monthlyPercentage) / monthlyTarget) * 100).toFixed(1) : '0.0';
        
        // Calcul journalier (aujourd'hui)
        const today = this.getCurrentDate();
        const todayTrades = this.trades.filter(t => t.date === today && t.status === 'closed');
        const todayPnL = todayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const dailyPercentage = ((todayPnL / capital) * 100).toFixed(2);
        const dailyTarget = this.settings.dailyTarget || 2;
        const dailyProgress = dailyTarget > 0 ? ((parseFloat(dailyPercentage) / dailyTarget) * 100).toFixed(1) : '0.0';
        
        // Calcul annuel
        const yearTrades = this.trades.filter(t => {
            if (!t.date) return false;
            const tradeDate = new Date(t.date);
            return tradeDate.getFullYear() === this.currentDate.getFullYear() && t.status === 'closed';
        });
        const yearPnL = yearTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const yearlyPercentage = ((yearPnL / capital) * 100).toFixed(2);
        const yearlyTarget = this.settings.yearlyTarget || 100;
        const yearlyProgress = yearlyTarget > 0 ? ((parseFloat(yearlyPercentage) / yearlyTarget) * 100).toFixed(1) : '0.0';
        
        summaryDiv.innerHTML = `
            <div class="summary-section">
                <h3>📈 Performance du Mois</h3>
                <div class="summary-grid">
                    <div class="summary-card">
                        <h4>Trades Total</h4>
                        <div class="value">${monthTrades.length}</div>
                    </div>
                    <div class="summary-card ${totalPnL >= 0 ? 'profit' : 'loss'}">
                        <h4>P&L Total</h4>
                        <div class="value">$${totalPnL.toFixed(2)}</div>
                        <div class="sub-value">${monthlyPercentage}%</div>
                    </div>
                    <div class="summary-card ${parseFloat(winRate) >= 60 ? 'profit' : parseFloat(winRate) >= 40 ? '' : 'loss'}">
                        <h4>Winrate</h4>
                        <div class="value">${winRate}%</div>
                    </div>
                    <div class="summary-card profit">
                        <h4>Trades Gagnants</h4>
                        <div class="value">${winTrades}</div>
                    </div>
                </div>
            </div>
            
            <div class="summary-section">
                <h3>🎯 Suivi des Objectifs</h3>
                <div class="objectives-grid">
                    <div class="objective-card">
                        <h4>📅 Aujourd'hui</h4>
                        <div class="objective-progress">
                            <div class="progress-bar">
                                <div class="progress-fill ${parseFloat(dailyProgress) >= 100 ? 'completed' : ''}" style="width: ${Math.min(Math.max(parseFloat(dailyProgress), 0), 100)}%"></div>
                            </div>
                            <div class="progress-text">${dailyPercentage}% / ${dailyTarget}% (${dailyProgress}%)</div>
                            <div class="progress-trades">${todayTrades.length} trade(s) aujourd'hui</div>
                        </div>
                    </div>
                    
                    <div class="objective-card">
                        <h4>📆 Ce Mois</h4>
                        <div class="objective-progress">
                            <div class="progress-bar">
                                <div class="progress-fill ${parseFloat(monthlyProgress) >= 100 ? 'completed' : ''}" style="width: ${Math.min(Math.max(parseFloat(monthlyProgress), 0), 100)}%"></div>
                            </div>
                            <div class="progress-text">${monthlyPercentage}% / ${monthlyTarget}% (${monthlyProgress}%)</div>
                            <div class="progress-trades">${monthTrades.length} trade(s) ce mois</div>
                        </div>
                    </div>
                    
                    <div class="objective-card">
                        <h4>📇 Cette Année</h4>
                        <div class="objective-progress">
                            <div class="progress-bar">
                                <div class="progress-fill ${parseFloat(yearlyProgress) >= 100 ? 'completed' : ''}" style="width: ${Math.min(Math.max(parseFloat(yearlyProgress), 0), 100)}%"></div>
                            </div>
                            <div class="progress-text">${yearlyPercentage}% / ${yearlyTarget}% (${yearlyProgress}%)</div>
                            <div class="progress-trades">${yearTrades.length} trade(s) cette année</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Mettre à jour aussi la section du plan de trading
        this.updateTradingPlan(dailyProgress, dailyPercentage, dailyTarget, monthlyProgress, monthlyPercentage, monthlyTarget, yearlyProgress, yearlyPercentage, yearlyTarget);
    }

    updateTradingPlan(dailyProgress, dailyPercentage, dailyTarget, monthlyProgress, monthlyPercentage, monthlyTarget, yearlyProgress, yearlyPercentage, yearlyTarget) {
        // Mettre à jour les barres de progression dans la section plan de trading
        const dailyBar = document.getElementById('dailyProgressBar');
        const dailyText = document.getElementById('dailyProgressText');
        const monthlyBar = document.getElementById('monthlyProgressBar');
        const monthlyText = document.getElementById('monthlyProgressText');
        const yearlyBar = document.getElementById('yearlyProgressBar');
        const yearlyText = document.getElementById('yearlyProgressText');
        
        if (dailyBar && dailyText) {
            dailyBar.style.width = `${Math.min(Math.max(parseFloat(dailyProgress), 0), 100)}%`;
            dailyBar.className = `progress-fill ${parseFloat(dailyProgress) >= 100 ? 'completed' : ''}`;
            dailyText.textContent = `${dailyPercentage}% / ${dailyTarget}% (${dailyProgress}%)`;
        }
        
        if (monthlyBar && monthlyText) {
            monthlyBar.style.width = `${Math.min(Math.max(parseFloat(monthlyProgress), 0), 100)}%`;
            monthlyBar.className = `progress-fill ${parseFloat(monthlyProgress) >= 100 ? 'completed' : ''}`;
            monthlyText.textContent = `${monthlyPercentage}% / ${monthlyTarget}% (${monthlyProgress}%)`;
        }
        
        if (yearlyBar && yearlyText) {
            yearlyBar.style.width = `${Math.min(Math.max(parseFloat(yearlyProgress), 0), 100)}%`;
            yearlyBar.className = `progress-fill ${parseFloat(yearlyProgress) >= 100 ? 'completed' : ''}`;
            yearlyText.textContent = `${yearlyPercentage}% / ${yearlyTarget}% (${yearlyProgress}%)`;
        }
    }

    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    setupRealtimeSync() {
        if (!this.database) return;
        
        try {
            this.database.ref(`users/${this.autoSyncCode}`).on('value', (snapshot) => {
                if (this.syncInProgress) return;
                
                const data = snapshot.val();
                if (!data || !data.lastSync) return;
                
                const timeSinceLastLocalChange = Date.now() - (this.lastLocalChange || 0);
                if (timeSinceLastLocalChange < 5000) return;
                
                if (data.lastSync > this.lastSyncTime && data.deviceId !== this.deviceId) {
                    this.handleRemoteUpdate(data);
                }
            });
            
            setInterval(() => this.autoSyncToFirebase(), 60000);
            this.updateSyncStatus('🔄 Auto');
        } catch (error) {
            console.error('Erreur sync temps réel:', error);
            this.updateSyncStatus('❌ Erreur');
        }
    }

    handleRemoteUpdate(data) {
        console.log('Mise à jour reçue depuis un autre appareil');
        
        // Fusionner les données sans doublons
        this.mergeRemoteData(data);
        
        // Mettre à jour l'interface
        this.updateStats();
        this.renderTradesTable();
        this.updateCharts();
        this.updateCalendar();
        this.updateAccountSelector();
        
        this.lastSyncTime = data.lastSync;
        this.showNotification('🔄 Données synchronisées depuis un autre appareil');
    }

    mergeRemoteData(remoteData) {
        // Fusionner les comptes
        this.accounts = { ...this.accounts, ...remoteData.accounts };
        localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
        
        // Fusionner les trades pour chaque compte
        Object.keys(remoteData.trades || {}).forEach(accountId => {
            const localTrades = JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${accountId}`)) || [];
            const remoteTrades = remoteData.trades[accountId] || [];
            
            // Fusionner sans doublons basé sur l'ID unique
            const mergedTrades = this.mergeTrades(localTrades, remoteTrades);
            localStorage.setItem(`trades_${this.currentUser}_${accountId}`, JSON.stringify(mergedTrades));
            
            // Mettre à jour les trades du compte actuel
            if (accountId === this.currentAccount) {
                this.trades = mergedTrades;
            }
        });
        
        // Fusionner les paramètres
        Object.keys(remoteData.settings || {}).forEach(accountId => {
            const remoteSettings = remoteData.settings[accountId];
            if (remoteSettings) {
                localStorage.setItem(`settings_${this.currentUser}_${accountId}`, JSON.stringify(remoteSettings));
                if (accountId === this.currentAccount) {
                    this.settings = remoteSettings;
                }
            }
        });
    }

    mergeTrades(localTrades, remoteTrades) {
        const merged = [...localTrades];
        
        remoteTrades.forEach(remoteTrade => {
            // Vérifier si le trade existe déjà (par ID unique)
            const exists = merged.find(t => t.id === remoteTrade.id);
            if (!exists) {
                merged.push(remoteTrade);
            } else {
                // Mettre à jour si le trade distant est plus récent
                const localIndex = merged.findIndex(t => t.id === remoteTrade.id);
                if (remoteTrade.lastModified && (!exists.lastModified || remoteTrade.lastModified > exists.lastModified)) {
                    merged[localIndex] = remoteTrade;
                }
            }
        });
        
        return merged.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    async autoSyncToFirebase() {
        if (!this.database || this.syncInProgress) return;
        
        this.syncInProgress = true;
        
        try {
            const data = {
                accounts: this.accounts,
                trades: {},
                settings: {},
                lastSync: Date.now(),
                deviceId: this.deviceId
            };
            
            Object.keys(this.accounts).forEach(accountId => {
                data.trades[accountId] = JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${accountId}`)) || [];
                data.settings[accountId] = JSON.parse(localStorage.getItem(`settings_${this.currentUser}_${accountId}`)) || { capital: 1000, riskPerTrade: 2 };
            });
            
            await this.database.ref(`users/${this.autoSyncCode}`).set(data);
            this.lastSyncTime = data.lastSync;
            this.updateSyncStatus('✅ Sync');
        } catch (error) {
            console.error('Auto-sync échoué:', error);
            this.updateSyncStatus('❌ Erreur');
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

    async autoLoadFromFirebase() {
        if (!this.database) {
            console.log('Firebase non disponible, mode local');
            return;
        }
        
        try {
            this.updateSyncStatus('🔄 Chargement...');
            const snapshot = await this.database.ref(`users/${this.autoSyncCode}`).once('value');
            const data = snapshot.val();
            
            if (data && data.lastSync) {
                console.log('Chargement automatique Firebase');
                this.accounts = { ...this.accounts, ...data.accounts };
                
                Object.keys(data.trades || {}).forEach(accountId => {
                    const remoteTrades = data.trades[accountId] || [];
                    const localTrades = JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${accountId}`)) || [];
                    const mergedTrades = this.mergeTrades(localTrades, remoteTrades);
                    localStorage.setItem(`trades_${this.currentUser}_${accountId}`, JSON.stringify(mergedTrades));
                    if (accountId === this.currentAccount) {
                        this.trades = mergedTrades;
                    }
                });
                
                Object.keys(data.settings || {}).forEach(accountId => {
                    localStorage.setItem(`settings_${this.currentUser}_${accountId}`, JSON.stringify(data.settings[accountId]));
                    if (accountId === this.currentAccount) {
                        this.settings = data.settings[accountId] || this.settings;
                    }
                });
                
                localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
                this.lastSyncTime = data.lastSync;
                this.updateSyncStatus('✅ Chargé');
            } else {
                this.updateSyncStatus('🆕 Nouveau');
            }
        } catch (error) {
            console.log('Chargement Firebase échoué:', error);
            this.updateSyncStatus('📱 Local');
        }
    }

    generateTradingImage(date, totalPnL, winRate, percentGain, tradesCount) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Fond dégradé
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // Titre
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 36px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('📊 TRADING RESULTS', 400, 80);
        
        // Date
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Inter';
        ctx.fillText(date, 400, 120);
        
        // Stats principales
        const isProfit = totalPnL >= 0;
        ctx.fillStyle = isProfit ? '#4ecdc4' : '#ff6b6b';
        ctx.font = 'bold 48px Inter';
        ctx.fillText(`$${totalPnL.toFixed(2)}`, 400, 200);
        
        ctx.fillStyle = isProfit ? '#4ecdc4' : '#ff6b6b';
        ctx.font = 'bold 32px Inter';
        ctx.fillText(`${percentGain}%`, 400, 250);
        
        // Détails
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(`📈 Trades: ${tradesCount}`, 100, 350);
        ctx.fillText(`🎯 Winrate: ${winRate}%`, 100, 390);
        ctx.fillText(`💰 Capital Impact: ${percentGain}%`, 100, 430);
        ctx.fillText(`⚡ Status: ${isProfit ? 'PROFITABLE DAY' : 'LEARNING DAY'}`, 100, 470);
        
        // Signature
        ctx.fillStyle = '#00d4ff';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Generated by Dashboard KamKam', 400, 550);
        
        return canvas.toDataURL('image/png');
    }

    shareToX(date, totalPnL, winRate, percentGain, tradesCount) {
        const imageData = this.generateTradingImage(date, totalPnL, winRate, percentGain, tradesCount);
        const text = `📊 Trading Results ${date}\n💰 P&L: $${totalPnL.toFixed(2)} (${percentGain}%)\n🎯 Winrate: ${winRate}%\n📈 Trades: ${tradesCount}\n\n#Trading #Forex #TradingResults #DashboardKamKam #ICT`;
        
        // Télécharger l'image
        const link = document.createElement('a');
        link.download = `kamkam_trading_${date}.png`;
        link.href = imageData;
        link.click();
        
        // Ouvrir X avec le texte
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank');
        
        this.showNotification('Image téléchargée! Uploadez-la sur X avec le texte pré-rempli.');
    }

    shareToFacebook(date, totalPnL, winRate, percentGain, tradesCount) {
        const imageData = this.generateTradingImage(date, totalPnL, winRate, percentGain, tradesCount);
        const text = `🚀 Trading Results du ${date}\n\n💰 Résultat: $${totalPnL.toFixed(2)} (${percentGain}%)\n🎯 Taux de réussite: ${winRate}%\n📊 Nombre de trades: ${tradesCount}\n\n${totalPnL >= 0 ? '✅ Journée profitable!' : '📚 Journée d\'apprentissage!'}\n\n#Trading #Forex #TradingLife #Success #DashboardKamKam`;
        
        // Afficher modal de partage Facebook
        this.showFacebookShareModal(imageData, text, date);
    }

    showFacebookShareModal(imageData, text, date) {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <h2>📘 Partager sur Facebook</h2>
            <div class="trade-form">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${imageData}" style="max-width: 300px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                </div>
                
                <div class="form-group">
                    <label>Texte à copier-coller sur Facebook:</label>
                    <textarea id="facebookText" readonly style="height: 150px; font-size: 0.9em;">${text}</textarea>
                </div>
                
                <div style="background: rgba(0,212,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4>📝 Instructions:</h4>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Cliquez sur "Copier le texte" ci-dessous</li>
                        <li>Cliquez sur "Télécharger l'image"</li>
                        <li>Cliquez sur "Ouvrir Facebook"</li>
                        <li>Sur Facebook, créez un nouveau post</li>
                        <li>Collez le texte (Ctrl+V)</li>
                        <li>Ajoutez l'image téléchargée</li>
                        <li>Publiez!</li>
                    </ol>
                </div>
                
                <div class="form-buttons">
                    <button class="btn-primary" onclick="dashboard.copyFacebookText()">📋 Copier le texte</button>
                    <button class="btn-success" onclick="dashboard.downloadFacebookImage('${imageData}', '${date}')">📥 Télécharger l'image</button>
                    <button class="btn-info" onclick="window.open('https://www.facebook.com/', '_blank')">🌐 Ouvrir Facebook</button>
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Fermer</button>
                </div>
            </div>
        `;
        this.showModal();
    }

    copyFacebookText() {
        const textArea = document.getElementById('facebookText');
        if (textArea) {
            textArea.select();
            document.execCommand('copy');
            this.showNotification('✅ Texte copié dans le presse-papier!');
        }
    }

    downloadFacebookImage(imageData, date) {
        const link = document.createElement('a');
        link.download = `kamkam_trading_${date}.png`;
        link.href = imageData;
        link.click();
        this.showNotification('✅ Image téléchargée!');
    }

    shareToInstagram(date, totalPnL, winRate, percentGain, tradesCount) {
        const imageData = this.generateTradingImage(date, totalPnL, winRate, percentGain, tradesCount);
        
        // Télécharger l'image optimisée pour Instagram
        const link = document.createElement('a');
        link.download = `kamkam_trading_${date}_insta.png`;
        link.href = imageData;
        link.click();
        
        const caption = `📊 Trading Results ${date}\n\n💰 $${totalPnL.toFixed(2)} (${percentGain}%)\n🎯 ${winRate}% winrate\n📈 ${tradesCount} trades\n\n${totalPnL >= 0 ? '✅ Profitable day!' : '📚 Learning day!'}\n\n#trading #forex #tradingresults #success #money #profit #trader #lifestyle #motivation #goals #dashboardkamkam`;
        
        // Copier le caption
        navigator.clipboard.writeText(caption).then(() => {
            this.showNotification('Image téléchargée et caption copié! Ouvrez Instagram pour poster.');
        });
        
        // Optionnel: ouvrir Instagram web
        setTimeout(() => {
            window.open('https://www.instagram.com/', '_blank');
        }, 1000);
    }

    shareToTikTok(date, totalPnL, winRate, percentGain, tradesCount) {
        const imageData = this.generateTradingImage(date, totalPnL, winRate, percentGain, tradesCount);
        
        // Télécharger l'image
        const link = document.createElement('a');
        link.download = `kamkam_trading_${date}_tiktok.png`;
        link.href = imageData;
        link.click();
        
        const caption = `📊 Trading Results ${date} 💰$${totalPnL.toFixed(2)} (${percentGain}%) 🎯${winRate}% winrate 📈${tradesCount} trades ${totalPnL >= 0 ? '✅' : '📚'} #trading #forex #money #profit #trader #success #motivation #lifestyle #tradingresults #financialfreedom #dashboardkamkam`;
        
        // Copier le caption
        navigator.clipboard.writeText(caption).then(() => {
            this.showNotification('Image téléchargée et caption copié! Ouvrez TikTok pour créer votre vidéo.');
        });
        
        // Ouvrir TikTok web
        setTimeout(() => {
            window.open('https://www.tiktok.com/upload', '_blank');
        }, 1000);
    }

    showUserManagement() {
        alert('Gestion des utilisateurs disponible uniquement pour les administrateurs');
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
            
            // Re-attach close event
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

    updatePerformanceMetrics() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const winningTrades = closedTrades.filter(t => parseFloat(t.pnl || 0) > 0);
        const losingTrades = closedTrades.filter(t => parseFloat(t.pnl || 0) < 0);
        
        // Calculs avancés
        const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length * 100).toFixed(1) : '0.0';
        const avgWin = winningTrades.length > 0 ? (winningTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0) / winningTrades.length).toFixed(2) : '0.00';
        const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0) / losingTrades.length).toFixed(2) : '0.00';
        const profitFactor = parseFloat(avgLoss) > 0 ? (parseFloat(avgWin) / parseFloat(avgLoss)).toFixed(2) : '0.00';
        const maxDrawdown = this.calculateMaxDrawdown();
        const sharpeRatio = this.calculateSharpeRatio();
        
        // Mise à jour des éléments DOM
        const elements = {
            performanceTotal: document.getElementById('performanceTotal'),
            avgWinTrade: document.getElementById('avgWinTrade'),
            avgLossTrade: document.getElementById('avgLossTrade'),
            profitFactor: document.getElementById('profitFactor'),
            maxDrawdown: document.getElementById('maxDrawdown'),
            sharpeRatio: document.getElementById('sharpeRatio')
        };
        
        if (elements.performanceTotal) {
            const performancePercent = ((totalPnL / this.settings.capital) * 100).toFixed(2);
            elements.performanceTotal.innerHTML = `
                <div class="performance-card ${totalPnL >= 0 ? 'positive' : 'negative'}">
                    <h4>📊 Performance Totale</h4>
                    <div class="performance-value">$${totalPnL.toFixed(2)}</div>
                    <div class="performance-percent">${performancePercent}%</div>
                    <div class="performance-details">
                        <div>Trades: ${closedTrades.length}</div>
                        <div>Winrate: ${winRate}%</div>
                    </div>
                </div>
            `;
        }
        
        if (elements.avgWinTrade) {
            elements.avgWinTrade.innerHTML = `<span class="positive">$${avgWin}</span>`;
        }
        
        if (elements.avgLossTrade) {
            elements.avgLossTrade.innerHTML = `<span class="negative">$${avgLoss}</span>`;
        }
        
        if (elements.profitFactor) {
            const pfValue = parseFloat(profitFactor);
            elements.profitFactor.innerHTML = `<span class="${pfValue >= 1.5 ? 'positive' : pfValue >= 1.0 ? 'warning' : 'negative'}">${profitFactor}</span>`;
        }
        
        if (elements.maxDrawdown) {
            elements.maxDrawdown.innerHTML = `<span class="${maxDrawdown <= 10 ? 'positive' : maxDrawdown <= 20 ? 'warning' : 'negative'}">${maxDrawdown.toFixed(2)}%</span>`;
        }
        
        if (elements.sharpeRatio) {
            elements.sharpeRatio.innerHTML = `<span class="${sharpeRatio >= 1.0 ? 'positive' : sharpeRatio >= 0.5 ? 'warning' : 'negative'}">${sharpeRatio.toFixed(2)}</span>`;
        }
        
        console.log('Métriques de performance mises à jour');
    }

    updateCumulativePerformance() {
        const container = document.getElementById('cumulativePerformance');
        if (!container) {
            console.log('Container cumulativePerformance non trouvé');
            return;
        }
        
        const closedTrades = this.trades.filter(t => t.status === 'closed').sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (closedTrades.length === 0) {
            container.innerHTML = '<div class="no-data">❌ Aucun trade fermé pour afficher la performance cumulative</div>';
            return;
        }
        
        let cumulativePnL = 0;
        const performanceData = [];
        
        closedTrades.forEach((trade, index) => {
            cumulativePnL += parseFloat(trade.pnl || 0);
            const cumulativePercent = ((cumulativePnL / this.settings.capital) * 100).toFixed(2);
            performanceData.push({
                date: trade.date,
                pnl: cumulativePnL,
                percent: cumulativePercent,
                tradeNumber: index + 1
            });
        });
        
        // Générer le graphique en mode texte
        let html = `
            <h4>📈 Performance Cumulative</h4>
            <div class="cumulative-summary">
                <div class="summary-item">
                    <span>Capital Initial:</span>
                    <span>$${this.settings.capital.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span>Capital Actuel:</span>
                    <span class="${cumulativePnL >= 0 ? 'positive' : 'negative'}">$${(this.settings.capital + cumulativePnL).toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span>Gain/Perte Total:</span>
                    <span class="${cumulativePnL >= 0 ? 'positive' : 'negative'}">$${cumulativePnL.toFixed(2)} (${((cumulativePnL / this.settings.capital) * 100).toFixed(2)}%)</span>
                </div>
            </div>
            <div class="performance-chart">
        `;
        
        // Afficher les 10 derniers points de performance
        const recentData = performanceData.slice(-10);
        recentData.forEach((point, index) => {
            const isPositive = parseFloat(point.percent) >= 0;
            html += `
                <div class="performance-point ${isPositive ? 'positive' : 'negative'}">
                    <div class="point-date">${point.date}</div>
                    <div class="point-value">$${point.pnl.toFixed(2)}</div>
                    <div class="point-percent">${point.percent}%</div>
                    <div class="point-trade">Trade #${point.tradeNumber}</div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        console.log('Performance cumulative mise à jour avec', performanceData.length, 'points');
    }

    updateMonthlyPerformance() {
        const container = document.getElementById('monthlyPerformance');
        if (!container) {
            console.log('Container monthlyPerformance non trouvé');
            return;
        }
        
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        
        if (closedTrades.length === 0) {
            container.innerHTML = '<div class="no-data">❌ Aucun trade fermé pour afficher la performance mensuelle</div>';
            return;
        }
        
        // Grouper les trades par mois
        const monthlyData = {};
        closedTrades.forEach(trade => {
            if (!trade.date) return;
            const date = new Date(trade.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    trades: [],
                    pnl: 0,
                    wins: 0,
                    losses: 0
                };
            }
            
            monthlyData[monthKey].trades.push(trade);
            monthlyData[monthKey].pnl += parseFloat(trade.pnl || 0);
            if (parseFloat(trade.pnl || 0) > 0) {
                monthlyData[monthKey].wins++;
            } else if (parseFloat(trade.pnl || 0) < 0) {
                monthlyData[monthKey].losses++;
            }
        });
        
        // Trier par mois (plus récent en premier)
        const sortedMonths = Object.keys(monthlyData).sort().reverse();
        
        let html = '<h4>📅 Performance Mensuelle</h4><div class="monthly-grid">';
        
        sortedMonths.slice(0, 6).forEach(monthKey => { // Afficher les 6 derniers mois
            const data = monthlyData[monthKey];
            const winRate = data.trades.length > 0 ? ((data.wins / data.trades.length) * 100).toFixed(1) : '0.0';
            const monthPercent = ((data.pnl / this.settings.capital) * 100).toFixed(2);
            const [year, month] = monthKey.split('-');
            const monthName = new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            
            html += `
                <div class="monthly-card ${data.pnl >= 0 ? 'positive' : 'negative'}">
                    <h5>${monthName}</h5>
                    <div class="monthly-pnl">$${data.pnl.toFixed(2)}</div>
                    <div class="monthly-percent">${monthPercent}%</div>
                    <div class="monthly-details">
                        <div>Trades: ${data.trades.length}</div>
                        <div>Winrate: ${winRate}%</div>
                        <div>Wins: ${data.wins} | Losses: ${data.losses}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        console.log('Performance mensuelle mise à jour pour', sortedMonths.length, 'mois');
    }

    calculateMaxDrawdown() {
        const closedTrades = this.trades.filter(t => t.status === 'closed').sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (closedTrades.length === 0) return 0;
        
        let peak = this.settings.capital;
        let maxDrawdown = 0;
        let currentCapital = this.settings.capital;
        
        closedTrades.forEach(trade => {
            currentCapital += parseFloat(trade.pnl || 0);
            
            if (currentCapital > peak) {
                peak = currentCapital;
            }
            
            const drawdown = ((peak - currentCapital) / peak) * 100;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        });
        
        return maxDrawdown;
    }

    calculateSharpeRatio() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        
        if (closedTrades.length < 2) return 0;
        
        const returns = closedTrades.map(t => (parseFloat(t.pnl || 0) / this.settings.capital) * 100);
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
        const stdDev = Math.sqrt(variance);
        
        return stdDev > 0 ? avgReturn / stdDev : 0;
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new TradingDashboard();
});