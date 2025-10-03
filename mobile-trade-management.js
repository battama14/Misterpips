// Gestion des trades mobile avec clôture TP/SL/BE
function updateMobileTradesList() {
    const tradesList = document.getElementById('mobileTradesList');
    if (!tradesList) return;
    
    if (mobileTradesData.length === 0) {
        tradesList.innerHTML = '<div class="no-trades">Aucun trade pour le moment</div>';
        return;
    }
    
    let html = '';
    mobileTradesData.forEach((trade, index) => {
        const isOpen = trade.status === 'open';
        const profitClass = trade.pnl >= 0 ? 'profit' : 'loss';
        const statusIcon = isOpen ? '🟡' : (trade.pnl >= 0 ? '🟢' : '🔴');
        const statusText = isOpen ? 'OUVERT' : `$${trade.pnl}`;
        
        html += `
            <div class="trade-item ${isOpen ? 'open-trade' : 'closed-trade'}" data-index="${index}">
                <div class="trade-header">
                    <span class="trade-pair">${trade.pair}</span>
                    <span class="trade-type ${trade.type.toLowerCase()}">${trade.type}</span>
                    <span class="trade-status ${isOpen ? 'open' : profitClass}">${statusIcon} ${statusText}</span>
                </div>
                <div class="trade-details">
                    <div class="trade-info">
                        <span>Lots: ${trade.lots}</span>
                        <span>Entrée: ${trade.entry}</span>
                        <span>SL: ${trade.stopLoss}</span>
                        <span>TP: ${trade.takeProfit}</span>
                        <span>Date: ${trade.date}</span>
                    </div>
                    <div class="trade-actions">
                        ${isOpen ? `
                            <button class="close-btn tp" onclick="closeMobileTrade(${index}, 'tp')">TP</button>
                            <button class="close-btn sl" onclick="closeMobileTrade(${index}, 'sl')">SL</button>
                            <button class="close-btn be" onclick="closeMobileTrade(${index}, 'be')">BE</button>
                        ` : `
                            <button class="edit-btn" onclick="editMobileTrade(${index})">✏️</button>
                        `}
                        <button class="delete-btn" onclick="deleteMobileTrade(${index})">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    tradesList.innerHTML = html;
}

async function closeMobileTrade(index, type) {
    const trade = mobileTradesData[index];
    if (!trade || trade.status !== 'open') return;
    
    let pnl = 0;
    const lotValue = trade.lots * 100000;
    const pipValue = trade.pair.includes('JPY') ? 0.01 : 0.0001;
    
    switch(type) {
        case 'tp':
            if (trade.type === 'BUY') {
                pnl = (trade.takeProfit - trade.entry) * lotValue / pipValue;
            } else {
                pnl = (trade.entry - trade.takeProfit) * lotValue / pipValue;
            }
            break;
        case 'sl':
            if (trade.type === 'BUY') {
                pnl = (trade.stopLoss - trade.entry) * lotValue / pipValue;
            } else {
                pnl = (trade.entry - trade.stopLoss) * lotValue / pipValue;
            }
            break;
        case 'be':
            pnl = 0;
            break;
    }
    
    pnl = Math.round(pnl * 100) / 100;
    
    trade.pnl = pnl;
    trade.status = 'closed';
    trade.closeType = type;
    trade.closeTime = new Date().toLocaleTimeString();
    
    try {
        if (window.firebaseDB && trade.id) {
            const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
            await set(ref(window.firebaseDB, `users/mobile_user_fixed/accounts/compte1/trades/${trade.id}`), trade);
        }
        
        updateMobileTradesList();
        updateMobileStats();
        updateMobileCharts();
        updateMobileCalendar();
        
        const typeText = type === 'tp' ? 'Take Profit' : type === 'sl' ? 'Stop Loss' : 'Break Even';
        alert(`Trade clôturé en ${typeText}: $${pnl}`);
        
    } catch (error) {
        console.error('❌ Erreur clôture trade:', error);
        updateMobileTradesList();
        updateMobileStats();
        updateMobileCharts();
        updateMobileCalendar();
    }
}

function updateMobileCalendar() {
    const calendar = document.getElementById('mobileCalendar');
    if (!calendar) return;
    
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    document.getElementById('monthYearMobile').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '<div class="calendar-grid">';
    
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    dayNames.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTrades = mobileTradesData.filter(trade => trade.date === dateStr);
        const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
        
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const hasTrades = dayTrades.length > 0;
        
        let dayClass = 'calendar-day';
        if (isToday) dayClass += ' today';
        if (hasTrades) dayClass += totalPnL >= 0 ? ' profit-day' : ' loss-day';
        
        html += `
            <div class="${dayClass}">
                <div class="day-number">${day}</div>
                ${hasTrades ? `
                    <div class="day-trades">
                        <div class="trades-count">${dayTrades.length}</div>
                        <div class="day-pnl">$${totalPnL.toFixed(0)}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    html += '</div>';
    calendar.innerHTML = html;
}

// Exposer les fonctions
window.closeMobileTrade = closeMobileTrade;
window.updateMobileTradesList = updateMobileTradesList;
window.updateMobileCalendar = updateMobileCalendar;