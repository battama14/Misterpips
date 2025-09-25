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
        // Sync automatique à l'ouverture
        setTimeout(() => this.autoSyncToCloud(), 2000);
        
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

    showCloseTradeModal() {
        const openTrades = this.trades.filter(t => t.status === 'open');
        if (openTrades.length === 0) {
            alert('Aucun trade ouvert à clôturer');
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
        
        // Sync automatique
        this.autoSyncToCloud();
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
        this.closeModal();
        
        this.showNotification(`Trade ${trade.currency} clôturé en ${result}`);
        
        // Sync automatique
        this.autoSyncToCloud();
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
        
        // Sync automatique
        this.autoSyncToCloud();
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

    saveToStorage() {
        if (!this.currentUser) return;
        
        localStorage.setItem(`trades_${this.currentUser}_${this.currentAccount}`, JSON.stringify(this.trades));
        localStorage.setItem(`settings_${this.currentUser}_${this.currentAccount}`, JSON.stringify(this.settings));
        localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
        localStorage.setItem(`currentAccount_${this.currentUser}`, this.currentAccount);
        
        // Sauvegarder automatiquement dans Firebase
        this.saveUserData();
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
        this.autoSyncToCloud();
    }

    resetAllData() {
        if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données ?')) {
            this.trades = [];
            this.settings = { capital: 1000, riskPerTrade: 2 };
            this.saveToStorage();
            this.updateStats();
            this.renderTradesTable();
            this.showNotification('Données réinitialisées!');
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
        this.accounts[accountId] = { name, capital };
        localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
        this.updateAccountSelector();
        this.showNotification('Nouveau compte créé!');
    }

    deleteAccount() {
        if (Object.keys(this.accounts).length <= 1) {
            alert('Impossible de supprimer le dernier compte');
            return;
        }
        if (confirm(`Supprimer le compte ${this.accounts[this.currentAccount]?.name}?`)) {
            delete this.accounts[this.currentAccount];
            localStorage.removeItem(`trades_${this.currentUser}_${this.currentAccount}`);
            localStorage.removeItem(`settings_${this.currentUser}_${this.currentAccount}`);
            this.currentAccount = Object.keys(this.accounts)[0];
            localStorage.setItem(`currentAccount_${this.currentUser}`, this.currentAccount);
            localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
            this.updateAccountSelector();
            this.switchAccount(this.currentAccount);
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
        if (this.db && this.currentUser) {
            try {
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
            }
        }
    }

    showCloudSync() {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <h2>☁️ Synchronisation Cloud</h2>
            <div class="trade-form">
                <div class="form-group">
                    <label>Code de synchronisation:</label>
                    <input type="text" id="syncCode" placeholder="Entrez votre code" value="${this.getSyncCode()}">
                </div>
                <div class="form-buttons">
                    <button class="btn-primary" onclick="dashboard.uploadToFirebase()">📤 Sauvegarder</button>
                    <button class="btn-secondary" onclick="dashboard.downloadFromFirebase()">📥 Télécharger</button>
                    <button class="btn-info" onclick="dashboard.exportAllData()">💾 Export Local</button>
                    <button class="btn-warning" onclick="dashboard.importAllData()">📁 Import Local</button>
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
            alert('Firebase non disponible');
            return;
        }
        const syncCode = document.getElementById('syncCode')?.value || this.getSyncCode();
        const data = {
            accounts: this.accounts,
            trades: {},
            settings: {},
            lastSync: Date.now()
        };
        
        Object.keys(this.accounts).forEach(accountId => {
            data.trades[accountId] = JSON.parse(localStorage.getItem(`trades_${this.currentUser}_${accountId}`)) || [];
            data.settings[accountId] = JSON.parse(localStorage.getItem(`settings_${this.currentUser}_${accountId}`)) || { capital: 1000, riskPerTrade: 2 };
        });
        
        this.database.ref(`users/${syncCode}`).set(data)
            .then(() => {
                localStorage.setItem('syncCode', syncCode);
                this.showNotification('Données sauvegardées dans le cloud!');
                this.closeModal();
            })
            .catch(error => {
                alert('Erreur de sauvegarde: ' + error.message);
            });
    }

    downloadFromFirebase() {
        if (!this.database) {
            alert('Firebase non disponible');
            return;
        }
        const syncCode = document.getElementById('syncCode')?.value;
        if (!syncCode) {
            alert('Veuillez entrer un code de synchronisation');
            return;
        }
        
        this.database.ref(`users/${syncCode}`).once('value')
            .then(snapshot => {
                const data = snapshot.val();
                if (!data) {
                    alert('Aucune donnée trouvée pour ce code');
                    return;
                }
                
                this.accounts = data.accounts || this.accounts;
                Object.keys(data.trades || {}).forEach(accountId => {
                    localStorage.setItem(`trades_${this.currentUser}_${accountId}`, JSON.stringify(data.trades[accountId]));
                });
                Object.keys(data.settings || {}).forEach(accountId => {
                    localStorage.setItem(`settings_${this.currentUser}_${accountId}`, JSON.stringify(data.settings[accountId]));
                });
                
                localStorage.setItem(`accounts_${this.currentUser}`, JSON.stringify(this.accounts));
                localStorage.setItem('syncCode', syncCode);
                
                this.switchAccount(this.currentAccount);
                this.updateAccountSelector();
                this.showNotification('Données téléchargées du cloud!');
                this.closeModal();
            })
            .catch(error => {
                alert('Erreur de téléchargement: ' + error.message);
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
        // Gauge simple avec CSS
    }

    initConfluencesChart() {
        const ctx = document.getElementById('confluencesChart');
        if (!ctx) return;
        
        this.confluencesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Excellentes', 'Bonnes', 'Moyennes', 'Faibles'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#4ecdc4', '#00d4ff', '#ffc107', '#ff6b6b']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                }
            }
        });
    }

    updateCharts() {
        this.updateGainsGauge();
        this.updateConfluencesChart();
        this.renderCorrelationMatrix();
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
        const allTrades = this.trades.filter(t => t.confluences && Object.keys(t.confluences).length > 0);
        
        if (allTrades.length === 0) {
            // Matrice par défaut si pas de trades
            confluenceKeys.forEach(conf1 => {
                matrix[conf1.key] = {};
                confluenceKeys.forEach(conf2 => {
                    matrix[conf1.key][conf2.key] = conf1.key === conf2.key ? 100 : 0;
                });
            });
            return { matrix, confluenceKeys };
        }
        
        confluenceKeys.forEach(conf1 => {
            matrix[conf1.key] = {};
            confluenceKeys.forEach(conf2 => {
                if (conf1.key === conf2.key) {
                    matrix[conf1.key][conf2.key] = 100;
                } else {
                    // Trades avec les deux confluences valides
                    const bothValid = allTrades.filter(trade => {
                        const conf = trade.confluences || {};
                        return this.isValidConfluence(conf[conf1.key]) && this.isValidConfluence(conf[conf2.key]);
                    });
                    
                    // Trades gagnants avec les deux confluences
                    const bothValidWinning = bothValid.filter(trade => {
                        return trade.status === 'closed' && parseFloat(trade.pnl || 0) > 0;
                    });
                    
                    // Trades avec seulement la première confluence
                    const firstValid = allTrades.filter(trade => {
                        const conf = trade.confluences || {};
                        return this.isValidConfluence(conf[conf1.key]);
                    });
                    
                    // Calcul du pourcentage de réussite
                    if (bothValid.length > 0) {
                        const successRate = (bothValidWinning.length / bothValid.length) * 100;
                        matrix[conf1.key][conf2.key] = Math.round(successRate);
                    } else {
                        matrix[conf1.key][conf2.key] = 0;
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
        if (!container) return;
        
        const { matrix, confluenceKeys } = this.generateCorrelationMatrix();
        const totalTrades = this.trades.filter(t => t.confluences && Object.keys(t.confluences).length > 0).length;
        
        let html = `<div class="correlation-info">
            <p>📊 Analyse basée sur ${totalTrades} trades avec confluences validées</p>
            <p>🎯 Pourcentage = (Trades gagnants avec les 2 confluences) / (Total trades avec les 2 confluences)</p>
        </div>`;
        
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
                const value = matrix[conf1.key][conf2.key];
                const cellClass = this.getCorrelationClass(value);
                const tooltip = conf1.key === conf2.key ? 
                    `${conf1.name} (même confluence)` : 
                    `${conf1.name} + ${conf2.name}: ${value}% de réussite`;
                html += `<div class="correlation-cell data ${cellClass}" title="${tooltip}">${value}%</div>`;
            });
        });
        
        html += '</div>';
        container.innerHTML = html;
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
        
        if (gainsValue) gainsValue.textContent = `$${totalPnL.toFixed(2)}`;
        if (gainsPercent) {
            const percent = ((totalPnL / this.settings.capital) * 100).toFixed(1);
            gainsPercent.textContent = `${percent}%`;
        }
    }

    updateConfluencesChart() {
        if (!this.confluencesChart) return;
        
        const analysis = this.generateConfluenceAnalysis();
        this.confluencesChart.data.datasets[0].data = [
            analysis.excellent, analysis.good, analysis.average, analysis.poor
        ];
        this.confluencesChart.update();
        
        const analysisDiv = document.getElementById('confluenceAnalysis');
        if (analysisDiv) {
            analysisDiv.innerHTML = `
                <h4>📊 Analyse des Confluences</h4>
                <div class="analysis-item">
                    <span class="confluence-name">Excellentes</span>
                    <span class="confluence-score score-excellent">${analysis.excellent}</span>
                </div>
                <div class="analysis-item">
                    <span class="confluence-name">Bonnes</span>
                    <span class="confluence-score score-good">${analysis.good}</span>
                </div>
                <div class="analysis-item">
                    <span class="confluence-name">Moyennes</span>
                    <span class="confluence-score score-average">${analysis.average}</span>
                </div>
                <div class="analysis-item">
                    <span class="confluence-name">Faibles</span>
                    <span class="confluence-score score-poor">${analysis.poor}</span>
                </div>
            `;
        }
    }

    generateConfluenceAnalysis() {
        const analysis = { excellent: 0, good: 0, average: 0, poor: 0 };
        this.trades.forEach(trade => {
            const confluences = Object.values(trade.confluences || {});
            const score = confluences.length;
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
            const tradeDate = new Date(t.date);
            return tradeDate.getMonth() === this.currentDate.getMonth() && 
                   tradeDate.getFullYear() === this.currentDate.getFullYear() &&
                   t.status === 'closed';
        });
        
        const totalPnL = monthTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const winTrades = monthTrades.filter(t => parseFloat(t.pnl || 0) > 0).length;
        const winRate = monthTrades.length > 0 ? (winTrades / monthTrades.length * 100).toFixed(1) : 0;
        
        // Calculs des objectifs
        const monthlyPercentage = ((totalPnL / this.settings.capital) * 100).toFixed(2);
        const monthlyTarget = this.settings.monthlyTarget || 20;
        const monthlyProgress = ((parseFloat(monthlyPercentage) / monthlyTarget) * 100).toFixed(1);
        
        // Calcul journalier (aujourd'hui)
        const today = this.getCurrentDate();
        const todayTrades = this.trades.filter(t => t.date === today && t.status === 'closed');
        const todayPnL = todayTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const dailyPercentage = ((todayPnL / this.settings.capital) * 100).toFixed(2);
        const dailyTarget = this.settings.dailyTarget || 2;
        const dailyProgress = ((parseFloat(dailyPercentage) / dailyTarget) * 100).toFixed(1);
        
        // Calcul annuel
        const yearTrades = this.trades.filter(t => {
            const tradeDate = new Date(t.date);
            return tradeDate.getFullYear() === this.currentDate.getFullYear() && t.status === 'closed';
        });
        const yearPnL = yearTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const yearlyPercentage = ((yearPnL / this.settings.capital) * 100).toFixed(2);
        const yearlyTarget = this.settings.yearlyTarget || 100;
        const yearlyProgress = ((parseFloat(yearlyPercentage) / yearlyTarget) * 100).toFixed(1);
        
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
                    <div class="summary-card">
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
                                <div class="progress-fill ${parseFloat(dailyProgress) >= 100 ? 'completed' : ''}" style="width: ${Math.min(parseFloat(dailyProgress), 100)}%"></div>
                            </div>
                            <div class="progress-text">${dailyPercentage}% / ${dailyTarget}% (${dailyProgress}%)</div>
                        </div>
                    </div>
                    
                    <div class="objective-card">
                        <h4>📆 Ce Mois</h4>
                        <div class="objective-progress">
                            <div class="progress-bar">
                                <div class="progress-fill ${parseFloat(monthlyProgress) >= 100 ? 'completed' : ''}" style="width: ${Math.min(parseFloat(monthlyProgress), 100)}%"></div>
                            </div>
                            <div class="progress-text">${monthlyPercentage}% / ${monthlyTarget}% (${monthlyProgress}%)</div>
                        </div>
                    </div>
                    
                    <div class="objective-card">
                        <h4>📇 Cette Année</h4>
                        <div class="objective-progress">
                            <div class="progress-bar">
                                <div class="progress-fill ${parseFloat(yearlyProgress) >= 100 ? 'completed' : ''}" style="width: ${Math.min(parseFloat(yearlyProgress), 100)}%"></div>
                            </div>
                            <div class="progress-text">${yearlyPercentage}% / ${yearlyTarget}% (${yearlyProgress}%)</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
        
        const syncCode = localStorage.getItem('syncCode');
        if (!syncCode) return;
        
        // Écouter les changements en temps réel
        this.database.ref(`users/${syncCode}`).on('value', (snapshot) => {
            if (this.syncInProgress) return; // Éviter les boucles
            
            const data = snapshot.val();
            if (!data || !data.lastSync) return;
            
            // Vérifier si les données sont plus récentes
            if (data.lastSync > this.lastSyncTime && data.deviceId !== this.deviceId) {
                this.handleRemoteUpdate(data);
            }
        });
        
        // Sync automatique toutes les 30 secondes
        setInterval(() => {
            this.autoSyncToCloud();
        }, 30000);
        
        this.updateSyncStatus('🔄 Sync actif');
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

    autoSyncToCloud() {
        if (!this.database || this.syncInProgress) return;
        
        const syncCode = localStorage.getItem('syncCode');
        if (!syncCode) return;
        
        this.syncInProgress = true;
        
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
        
        this.database.ref(`users/${syncCode}`).set(data)
            .then(() => {
                this.lastSyncTime = data.lastSync;
                this.updateSyncStatus('✅ Syncé');
                setTimeout(() => this.updateSyncStatus('🔄 Sync actif'), 2000);
            })
            .catch(error => {
                console.error('Erreur de synchronisation:', error);
                this.updateSyncStatus('❌ Erreur sync');
            })
            .finally(() => {
                this.syncInProgress = false;
            });
    }

    updateSyncStatus(status) {
        const syncStatusElement = document.getElementById('syncStatus');
        if (syncStatusElement) {
            syncStatusElement.textContent = status;
            syncStatusElement.className = status.includes('✅') ? 'sync-success' : 
                                         status.includes('❌') ? 'sync-error' : 'sync-active';
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
}

// Initialisation
let dashboard;
window.dashboard = null;

document.addEventListener('DOMContentLoaded', function() {
    dashboard = new TradingDashboard();
    window.dashboard = dashboard;
});