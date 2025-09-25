// Script simplifié pour le dashboard
let dashboard = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation simple
    dashboard = {
        currentUser: 'trader_vip',
        currentAccount: 'compte1',
        trades: [],
        settings: { capital: 1000, riskPerTrade: 2 },
        accounts: {
            'compte1': { name: 'Compte Principal', capital: 1000 },
            'compte2': { name: 'Compte Démo', capital: 500 },
            'compte3': { name: 'Compte Swing', capital: 2000 }
        },

        init() {
            this.loadData();
            this.updateStats();
            this.renderTradesTable();
            this.initCalendar();
        },

        loadData() {
            try {
                const savedTrades = localStorage.getItem(`trades_${this.currentUser}_${this.currentAccount}`);
                if (savedTrades) this.trades = JSON.parse(savedTrades);
                
                const savedSettings = localStorage.getItem(`settings_${this.currentUser}_${this.currentAccount}`);
                if (savedSettings) this.settings = JSON.parse(savedSettings);
            } catch (error) {
                console.error('Erreur chargement:', error);
            }
        },

        saveData() {
            localStorage.setItem(`trades_${this.currentUser}_${this.currentAccount}`, JSON.stringify(this.trades));
            localStorage.setItem(`settings_${this.currentUser}_${this.currentAccount}`, JSON.stringify(this.settings));
        },

        updateStats() {
            const closedTrades = this.trades.filter(t => t.status === 'closed');
            const openTrades = this.trades.filter(t => t.status === 'open');
            const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
            const winRate = closedTrades.length > 0 ? 
                (closedTrades.filter(t => parseFloat(t.pnl || 0) > 0).length / closedTrades.length * 100).toFixed(1) : 0;
            
            const initialCapital = this.accounts[this.currentAccount]?.capital || this.settings.capital;
            const currentCapital = initialCapital + totalPnL;
            
            const elements = {
                totalTrades: document.getElementById('totalTrades'),
                openTrades: document.getElementById('openTrades'),
                totalPnL: document.getElementById('totalPnL'),
                winRate: document.getElementById('winRate'),
                capital: document.getElementById('capital')
            };
            
            if (elements.totalTrades) elements.totalTrades.textContent = this.trades.length;
            if (elements.openTrades) elements.openTrades.textContent = openTrades.length;
            if (elements.totalPnL) {
                elements.totalPnL.textContent = `$${totalPnL.toFixed(2)}`;
                elements.totalPnL.className = totalPnL >= 0 ? 'positive' : 'negative';
            }
            if (elements.winRate) elements.winRate.textContent = `${winRate}%`;
            if (elements.capital) {
                elements.capital.textContent = `$${currentCapital.toFixed(2)}`;
                elements.capital.className = totalPnL >= 0 ? 'positive' : 'negative';
            }
        },

        startNewTrade() {
            alert('Nouveau trade - Fonctionnalité en cours de développement');
        },

        showSettings() {
            const capital = prompt('Capital initial ($):', this.settings.capital);
            const risk = prompt('Risque par trade (%):', this.settings.riskPerTrade);
            
            if (capital && risk) {
                this.settings.capital = parseFloat(capital);
                this.settings.riskPerTrade = parseFloat(risk);
                this.accounts[this.currentAccount].capital = parseFloat(capital);
                this.saveData();
                this.updateStats();
                alert('Paramètres sauvegardés!');
            }
        },

        showCloseTradeModal() {
            const openTrades = this.trades.filter(t => t.status === 'open');
            if (openTrades.length === 0) {
                alert('Aucun trade ouvert à clôturer');
                return;
            }
            alert('Clôture trade - Fonctionnalité en cours de développement');
        },

        resetAllData() {
            if (confirm('⚠️ ATTENTION: Cette action supprimera TOUS vos trades et données. Êtes-vous sûr ?')) {
                this.trades = [];
                this.settings = { capital: 1000, riskPerTrade: 2 };
                this.accounts[this.currentAccount].capital = 1000;
                this.saveData();
                this.updateStats();
                this.renderTradesTable();
                this.initCalendar();
                alert('Toutes les données ont été supprimées');
            }
        },

        showManualCloseModal() {
            alert('Clôture manuelle - Fonctionnalité en cours de développement');
        },

        exportToExcel() {
            if (this.trades.length === 0) {
                alert('Aucun trade à exporter');
                return;
            }
            alert('Export Excel - Fonctionnalité en cours de développement');
        },

        addNewAccount() {
            const name = prompt('Nom du nouveau compte:');
            const capital = parseFloat(prompt('Capital initial ($):')) || 1000;
            
            if (name) {
                const accountId = 'compte' + (Object.keys(this.accounts).length + 1);
                this.accounts[accountId] = { name, capital };
                this.saveData();
                alert(`Compte "${name}" créé avec succès!`);
            }
        },

        deleteAccount() {
            if (Object.keys(this.accounts).length <= 1) {
                alert('Impossible de supprimer le dernier compte');
                return;
            }
            
            if (confirm(`Supprimer le compte "${this.accounts[this.currentAccount].name}" ?`)) {
                delete this.accounts[this.currentAccount];
                this.currentAccount = Object.keys(this.accounts)[0];
                this.loadData();
                alert('Compte supprimé');
            }
        },

        renderTradesTable() {
            const tbody = document.querySelector('#tradesTable tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (this.trades.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="10" style="text-align: center; color: rgba(255,255,255,0.6);">Aucun trade enregistré</td>';
                tbody.appendChild(row);
                return;
            }
            
            this.trades.slice(-10).reverse().forEach((trade) => {
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
                    <td>-</td>
                `;
                tbody.appendChild(row);
            });
        },

        initCalendar() {
            const calendarGrid = document.getElementById('calendarGrid');
            const monthYear = document.getElementById('monthYear');
            
            if (!calendarGrid || !monthYear) return;
            
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            
            monthYear.textContent = new Intl.DateTimeFormat('fr-FR', { 
                month: 'long', 
                year: 'numeric' 
            }).format(now);
            
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            calendarGrid.innerHTML = '';
            
            // Headers
            const dayHeaders = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            dayHeaders.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'calendar-day-header';
                dayHeader.textContent = day;
                calendarGrid.appendChild(dayHeader);
            });
            
            // Days
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
        },

        updateCalendarStats() {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            
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
            
            const elements = {
                monthPnL: document.getElementById('monthPnL'),
                monthWinRate: document.getElementById('monthWinRate'),
                yearPnL: document.getElementById('yearPnL'),
                yearWinRate: document.getElementById('yearWinRate')
            };
            
            if (elements.monthPnL) {
                elements.monthPnL.textContent = `$${monthPnL.toFixed(2)}`;
                elements.monthPnL.className = 'stat-value ' + (monthPnL >= 0 ? 'positive' : 'negative');
            }
            if (elements.monthWinRate) elements.monthWinRate.textContent = `${monthWinRate}%`;
            
            if (elements.yearPnL) {
                elements.yearPnL.textContent = `$${yearPnL.toFixed(2)}`;
                elements.yearPnL.className = 'stat-value ' + (yearPnL >= 0 ? 'positive' : 'negative');
            }
            if (elements.yearWinRate) elements.yearWinRate.textContent = `${yearWinRate}%`;
        }
    };

    // Event listeners directs
    const buttons = {
        newTradeBtn: () => dashboard.startNewTrade(),
        settingsBtn: () => dashboard.showSettings(),
        closeTradeBtn: () => dashboard.showCloseTradeModal(),
        resetBtn: () => dashboard.resetAllData(),
        manualCloseBtn: () => dashboard.showManualCloseModal(),
        exportBtn: () => dashboard.exportToExcel(),
        addAccountBtn: () => dashboard.addNewAccount(),
        deleteAccountBtn: () => dashboard.deleteAccount()
    };

    Object.keys(buttons).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', buttons[id]);
        }
    });

    // Initialisation
    dashboard.init();
    window.dashboard = dashboard;
});