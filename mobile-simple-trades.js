// Gestion simple des trades mobile
console.log('📱 Chargement gestion trades mobile...');

// Variables globales
window.mobileTradesData = [];

// Fonction pour sauvegarder un trade
function saveMobileTrade() {
    const pair = document.getElementById('tradePair')?.value || '';
    const type = document.getElementById('tradeType')?.value || '';
    const lot = document.getElementById('tradeLot')?.value || '';
    const entry = document.getElementById('tradeEntry')?.value || '';
    const sl = document.getElementById('tradeStopLoss')?.value || '';
    const tp = document.getElementById('tradeTakeProfit')?.value || '';
    
    console.log('📊 Valeurs récupérées:', { pair, type, lot, entry, sl, tp });
    
    if (!pair || !type || !lot || !entry) {
        alert(`Champs manquants: ${!pair ? 'Paire ' : ''}${!type ? 'Type ' : ''}${!lot ? 'Lot ' : ''}${!entry ? 'Entrée' : ''}`);
        return;
    }
    
    const trade = {
        id: Date.now(),
        pair, type, 
        lots: parseFloat(lot),
        entry: parseFloat(entry), 
        stopLoss: parseFloat(sl) || 0, 
        takeProfit: parseFloat(tp) || 0,
        pnl: 0,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        status: 'open'
    };
    
    window.mobileTradesData.push(trade);
    console.log('✅ Trade créé:', trade);
    console.log('📊 Total trades:', window.mobileTradesData.length);
    
    // Forcer l'affichage immédiatement
    setTimeout(() => {
        showMobileTradesList();
        console.log('🔄 Liste mise à jour');
    }, 100);
    
    closeMobileModal();
    alert('Trade créé avec succès!');
}

// Fonction pour afficher la liste des trades
function showMobileTradesList() {
    const tradesList = document.getElementById('mobileTradesList');
    console.log('📋 Affichage trades, container:', tradesList);
    console.log('📋 Nombre de trades:', window.mobileTradesData?.length || 0);
    
    if (!tradesList) {
        console.error('❌ Container mobileTradesList introuvable');
        return;
    }
    
    if (!window.mobileTradesData || window.mobileTradesData.length === 0) {
        tradesList.innerHTML = '<div class="no-trades">Aucun trade pour le moment</div>';
        console.log('📋 Affichage: aucun trade');
        return;
    }
    
    let html = '';
    window.mobileTradesData.forEach((trade, index) => {
        const isOpen = trade.status === 'open';
        const statusIcon = isOpen ? '🟡' : (trade.pnl >= 0 ? '🟢' : '🔴');
        const statusText = isOpen ? 'OUVERT' : `$${trade.pnl}`;
        
        html += `
            <div class="trade-item ${isOpen ? 'open-trade' : 'closed-trade'}">
                <div class="trade-header">
                    <span class="trade-pair">${trade.pair}</span>
                    <span class="trade-type ${trade.type.toLowerCase()}">${trade.type}</span>
                    <span class="trade-status ${isOpen ? 'open' : 'closed'}">${statusIcon} ${statusText}</span>
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
                            <button class="close-btn tp" onclick="closeTradeAs(${index}, 'tp')">TP</button>
                            <button class="close-btn sl" onclick="closeTradeAs(${index}, 'sl')">SL</button>
                            <button class="close-btn be" onclick="closeTradeAs(${index}, 'be')">BE</button>
                        ` : ''}
                        <button class="delete-btn" onclick="deleteTrade(${index})">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    tradesList.innerHTML = html;
    console.log('✅ HTML injecté dans la liste:', html.length, 'caractères');
}

// Fonction pour clôturer un trade
function closeTradeAs(index, type) {
    const trade = window.mobileTradesData[index];
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
    
    trade.pnl = Math.round(pnl * 100) / 100;
    trade.status = 'closed';
    trade.closeType = type;
    
    showMobileTradesList();
    
    const typeText = type === 'tp' ? 'Take Profit' : type === 'sl' ? 'Stop Loss' : 'Break Even';
    alert(`Trade clôturé en ${typeText}: $${trade.pnl}`);
}

// Fonction pour supprimer un trade
function deleteTrade(index) {
    if (confirm('Supprimer ce trade?')) {
        window.mobileTradesData.splice(index, 1);
        showMobileTradesList();
        alert('Trade supprimé!');
    }
}

// Fonction pour fermer la modal
function closeMobileModal() {
    document.getElementById('tradeModal').style.display = 'none';
    // Reset form
    document.getElementById('tradeForm').reset();
    document.getElementById('tradeEntry').value = '1.0000';
    document.getElementById('tradeStopLoss').value = '0.9950';
    document.getElementById('tradeTakeProfit').value = '1.0050';
}

// Exposer les fonctions globalement
window.saveMobileTrade = saveMobileTrade;
window.showMobileTradesList = showMobileTradesList;
window.closeTradeAs = closeTradeAs;
window.deleteTrade = deleteTrade;
window.closeMobileModal = closeMobileModal;

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation trades mobile...');
    setTimeout(() => {
        showMobileTradesList();
        console.log('🚀 Initialisation trades terminée');
    }, 1000);
});

console.log('✅ Gestion trades mobile chargée');