// Version mobile complète avec toutes les corrections
console.log('📱 Mobile complet chargé');

var mobileFirebase = {
    db: null,
    auth: null,
    currentUser: null,
    isConnected: false
};

var mobileData = {
    trades: [],
    capital: 1000,
    currentAccount: 'compte1',
    settings: {
        capital: 1000,
        riskPerTrade: 2,
        dailyTarget: 1,
        notifications: 'all',
        nickname: ''
    }
};

function initMobileFirebase() {
    console.log('🚀 Init Firebase mobile complet');
    
    var attempts = 0;
    var maxAttempts = 50;
    
    var checkFirebase = setInterval(function() {
        attempts++;
        
        if (window.firebaseDB && window.firebaseAuth) {
            mobileFirebase.db = window.firebaseDB;
            mobileFirebase.auth = window.firebaseAuth;
            mobileFirebase.isConnected = true;
            
            var firebaseUID = sessionStorage.getItem('firebaseUID');
            var userEmail = sessionStorage.getItem('userEmail');
            
            if (firebaseUID && userEmail) {
                mobileFirebase.currentUser = {
                    uid: firebaseUID,
                    email: userEmail
                };
                console.log('✅ Firebase mobile connecté:', userEmail);
                loadMobileDataFromFirebase();
            }
            
            clearInterval(checkFirebase);
            initMobileInterface();
        } else if (attempts >= maxAttempts) {
            console.log('⚠️ Firebase timeout, mode local');
            clearInterval(checkFirebase);
            initMobileInterface();
        }
    }, 100);
}

function loadMobileDataFromFirebase() {
    if (!mobileFirebase.isConnected || !mobileFirebase.currentUser) {
        loadMobileDataLocal();
        return;
    }
    
    try {
        var accountRef = window.dbRef(mobileFirebase.db, 'users/' + mobileFirebase.currentUser.uid + '/accounts/' + mobileData.currentAccount);
        
        window.dbGet(accountRef).then(function(snapshot) {
            if (snapshot.exists()) {
                var data = snapshot.val();
                mobileData.trades = data.trades || [];
                mobileData.capital = data.capital || 1000;
                mobileData.settings = Object.assign(mobileData.settings, data.settings || {});
                
                console.log('☁️ Données PC synchronisées vers mobile:', mobileData.trades.length, 'trades');
                updateMobileDisplay();
            } else {
                loadMobileDataLocal();
            }
        }).catch(function(error) {
            console.error('❌ Erreur sync:', error);
            loadMobileDataLocal();
        });
    } catch (error) {
        console.error('❌ Erreur Firebase:', error);
        loadMobileDataLocal();
    }
}

function saveMobileDataToFirebase() {
    if (!mobileFirebase.isConnected || !mobileFirebase.currentUser) {
        saveMobileDataLocal();
        return;
    }
    
    try {
        var dataToSave = {
            trades: mobileData.trades,
            capital: mobileData.capital,
            settings: mobileData.settings,
            lastUpdated: new Date().toISOString(),
            platform: 'mobile'
        };
        
        var accountRef = window.dbRef(mobileFirebase.db, 'users/' + mobileFirebase.currentUser.uid + '/accounts/' + mobileData.currentAccount);
        
        window.dbSet(accountRef, dataToSave).then(function() {
            console.log('☁️ Mobile synchronisé avec PC');
            saveMobileDataLocal();
        }).catch(function(error) {
            console.error('❌ Erreur sync:', error);
            saveMobileDataLocal();
        });
    } catch (error) {
        console.error('❌ Erreur Firebase:', error);
        saveMobileDataLocal();
    }
}

function loadMobileDataLocal() {
    try {
        var saved = localStorage.getItem('mobile_data_complete');
        if (saved) {
            var data = JSON.parse(saved);
            mobileData = Object.assign(mobileData, data);
        }
    } catch (error) {
        console.error('❌ Erreur localStorage:', error);
    }
    updateMobileDisplay();
}

function saveMobileDataLocal() {
    try {
        localStorage.setItem('mobile_data_complete', JSON.stringify(mobileData));
    } catch (error) {
        console.error('❌ Erreur sauvegarde locale:', error);
    }
}

function sendMobileChatMessage(message) {
    if (!mobileFirebase.isConnected || !mobileFirebase.currentUser) {
        showMobileNotification('Chat non disponible');
        return;
    }
    
    try {
        var messagesRef = window.dbRef(mobileFirebase.db, 'chat_messages');
        var nickname = mobileData.settings.nickname || mobileFirebase.currentUser.email.split('@')[0];
        
        var messageData = {
            userId: mobileFirebase.currentUser.uid,
            nickname: nickname,
            message: message,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            platform: 'mobile'
        };
        
        window.dbPush(messagesRef, messageData).then(function() {
            console.log('💬 Message mobile → PC envoyé');
            showMobileNotification('Message envoyé !');
        }).catch(function(error) {
            console.error('❌ Erreur chat:', error);
            showMobileNotification('Erreur envoi');
        });
    } catch (error) {
        console.error('❌ Erreur chat:', error);
    }
}

function loadMobileChatMessages() {
    if (!mobileFirebase.isConnected) return;
    
    try {
        var messagesRef = window.dbRef(mobileFirebase.db, 'chat_messages');
        
        window.dbOnValue(messagesRef, function(snapshot) {
            if (snapshot.exists()) {
                displayMobileChatMessages(snapshot.val());
            }
        });
    } catch (error) {
        console.error('❌ Erreur chat:', error);
    }
}

function displayMobileChatMessages(messages) {
    var container = document.getElementById('mobileChatMessages');
    if (!container) return;
    
    var messageArray = [];
    for (var key in messages) {
        if (messages.hasOwnProperty(key)) {
            messageArray.push(Object.assign({id: key}, messages[key]));
        }
    }
    
    messageArray.sort(function(a, b) { return a.timestamp - b.timestamp; });
    var recentMessages = messageArray.slice(-50);
    
    var html = '';
    for (var i = 0; i < recentMessages.length; i++) {
        var msg = recentMessages[i];
        var isOwn = msg.userId === mobileFirebase.currentUser.uid;
        var time = new Date(msg.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
        
        html += '<div class="chat-message ' + (isOwn ? 'own' : 'other') + '">';
        html += '<div class="message-header">';
        html += '<span class="message-nickname">' + msg.nickname + '</span>';
        html += '<span class="message-time">' + time + '</span>';
        html += '</div>';
        html += '<div class="message-content">' + msg.message + '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

function initMobileInterface() {
    console.log('🎨 Init interface mobile complète');
    
    var menuToggle = document.getElementById('menuToggle');
    var mobileMenu = document.getElementById('mobileMenu');
    var closeMenu = document.getElementById('closeMenu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.onclick = function() { mobileMenu.classList.add('open'); };
    }
    if (closeMenu && mobileMenu) {
        closeMenu.onclick = function() { mobileMenu.classList.remove('open'); };
    }
    
    var newTradeBtn = document.getElementById('newTradeBtn');
    var addTradeBtn = document.getElementById('addTradeBtn');
    var closeTradeModal = document.getElementById('closeTradeModal');
    var saveMobileTradeBtn = document.getElementById('saveMobileTradeBtn');
    
    if (newTradeBtn) newTradeBtn.onclick = showMobileTradeModal;
    if (addTradeBtn) addTradeBtn.onclick = showMobileTradeModal;
    if (closeTradeModal) closeTradeModal.onclick = hideMobileTradeModal;
    if (saveMobileTradeBtn) saveMobileTradeBtn.onclick = saveMobileTrade;
    
    var mobileChatToggle = document.getElementById('mobileChatToggle');
    var mobileChatWindow = document.getElementById('mobileChatWindow');
    var closeMobileChat = document.getElementById('closeMobileChat');
    var sendMobileMessage = document.getElementById('sendMobileMessage');
    var mobileChatInput = document.getElementById('mobileChatInput');
    
    if (mobileChatToggle && mobileChatWindow) {
        mobileChatToggle.onclick = function() { mobileChatWindow.classList.toggle('show'); };
    }
    if (closeMobileChat && mobileChatWindow) {
        closeMobileChat.onclick = function() { mobileChatWindow.classList.remove('show'); };
    }
    if (sendMobileMessage) {
        sendMobileMessage.onclick = function() {
            var input = document.getElementById('mobileChatInput');
            var message = input ? input.value.trim() : '';
            if (message) {
                sendMobileChatMessage(message);
                if (input) input.value = '';
            }
        };
    }
    if (mobileChatInput) {
        mobileChatInput.onkeypress = function(e) {
            if (e.key === 'Enter') {
                var message = this.value.trim();
                if (message) {
                    sendMobileChatMessage(message);
                    this.value = '';
                }
            }
        };
    }
    
    var saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) saveSettingsBtn.onclick = saveMobileSettings;
    
    var navBtns = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < navBtns.length; i++) {
        navBtns[i].addEventListener('click', function(e) {
            e.preventDefault();
            
            for (var j = 0; j < navBtns.length; j++) {
                navBtns[j].classList.remove('active');
            }
            this.classList.add('active');
            
            var iconText = this.querySelector('.nav-icon').textContent;
            var sectionId = 'dashboard';
            
            if (iconText === '📈') sectionId = 'trades';
            else if (iconText === '📅') sectionId = 'calendar';
            else if (iconText === '🎯') sectionId = 'objectives';
            else if (iconText === '🏆') sectionId = 'ranking';
            
            showMobileSection(sectionId);
        });
    }
    
    loadMobileChatMessages();
    console.log('✅ Interface mobile complète initialisée');
}

function showMobileSection(sectionId) {
    console.log('🔄 Navigation vers:', sectionId);
    
    var sections = document.querySelectorAll('.section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.remove('active');
    }
    
    var targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        switch(sectionId) {
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
                loadRealMobileRanking();
                break;
            case 'settings':
                updateMobileSettings();
                break;
        }
    }
    
    var mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) mobileMenu.classList.remove('open');
}

function showMobileTradeModal() {
    var modal = document.getElementById('mobileTradeModal');
    if (modal) modal.classList.add('show');
}

function hideMobileTradeModal() {
    var modal = document.getElementById('mobileTradeModal');
    if (modal) {
        modal.classList.remove('show');
        var form = document.getElementById('mobileTradeForm');
        if (form) form.reset();
    }
}

function saveMobileTrade() {
    var currency = document.getElementById('mobileCurrency') ? document.getElementById('mobileCurrency').value : 'EUR/USD';
    var entryPoint = document.getElementById('mobileEntryPoint') ? parseFloat(document.getElementById('mobileEntryPoint').value) : 0;
    var stopLoss = document.getElementById('mobileStopLoss') ? parseFloat(document.getElementById('mobileStopLoss').value) : 0;
    var takeProfit = document.getElementById('mobileTakeProfit') ? parseFloat(document.getElementById('mobileTakeProfit').value) : 0;
    var lotSize = document.getElementById('mobileLotSize') ? parseFloat(document.getElementById('mobileLotSize').value) : 0;
    
    if (!currency || !entryPoint || !stopLoss || !takeProfit || !lotSize) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    var trade = {
        id: mobileFirebase.currentUser ? mobileFirebase.currentUser.uid + '_' + Date.now() : 'mobile_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        currency: currency,
        entryPoint: entryPoint,
        stopLoss: stopLoss,
        takeProfit: takeProfit,
        lotSize: lotSize,
        riskPercent: mobileData.settings.riskPerTrade || 2,
        status: 'open',
        createdAt: Date.now(),
        pnl: 0
    };
    
    mobileData.trades.push(trade);
    saveMobileDataToFirebase();
    hideMobileTradeModal();
    updateMobileDisplay();
    showMobileNotification('Trade ajouté !');
}

function closeMobileTrade(tradeId) {
    var result = prompt('Résultat (TP/SL/BE):', 'TP');
    if (!result) return;
    
    for (var i = 0; i < mobileData.trades.length; i++) {
        if (mobileData.trades[i].id === tradeId) {
            var trade = mobileData.trades[i];
            trade.status = 'closed';
            trade.result = result.toUpperCase();
            trade.closeDate = new Date().toISOString();
            
            if (result.toUpperCase() === 'TP') {
                trade.closePrice = trade.takeProfit;
            } else if (result.toUpperCase() === 'SL') {
                trade.closePrice = trade.stopLoss;
            } else {
                trade.closePrice = trade.entryPoint;
            }
            
            var entryPoint = parseFloat(trade.entryPoint);
            var closePrice = parseFloat(trade.closePrice);
            var lotSize = parseFloat(trade.lotSize);
            var priceDiff = closePrice - entryPoint;
            var isLong = parseFloat(trade.takeProfit) > entryPoint;
            if (!isLong) priceDiff = -priceDiff;
            
            if (trade.currency === 'XAU/USD') {
                trade.pnl = priceDiff * lotSize * 100;
            } else if (trade.currency.includes('JPY')) {
                trade.pnl = priceDiff * lotSize * 1000;
            } else {
                trade.pnl = priceDiff * lotSize * 100000;
            }
            
            trade.pnl = parseFloat(trade.pnl.toFixed(2));
            break;
        }
    }
    
    saveMobileDataToFirebase();
    updateMobileDisplay();
    showMobileNotification('Trade clôturé en ' + result);
}

function editMobileTrade(tradeId) {
    for (var i = 0; i < mobileData.trades.length; i++) {
        if (mobileData.trades[i].id === tradeId) {
            var trade = mobileData.trades[i];
            var newEntry = prompt('Nouvelle entrée:', trade.entryPoint);
            var newSL = prompt('Nouveau Stop Loss:', trade.stopLoss);
            var newTP = prompt('Nouveau Take Profit:', trade.takeProfit);
            
            if (newEntry && newSL && newTP) {
                trade.entryPoint = parseFloat(newEntry);
                trade.stopLoss = parseFloat(newSL);
                trade.takeProfit = parseFloat(newTP);
                
                saveMobileDataToFirebase();
                updateMobileDisplay();
                showMobileNotification('Trade modifié !');
            }
            break;
        }
    }
}

function deleteMobileTrade(tradeId) {
    if (confirm('Supprimer ce trade ?')) {
        for (var i = 0; i < mobileData.trades.length; i++) {
            if (mobileData.trades[i].id === tradeId) {
                mobileData.trades.splice(i, 1);
                saveMobileDataToFirebase();
                updateMobileDisplay();
                showMobileNotification('Trade supprimé !');
                break;
            }
        }
    }
}

function saveMobileSettings() {
    var nickname = document.getElementById('mobileNicknameInput') ? document.getElementById('mobileNicknameInput').value : '';
    var capital = document.getElementById('mobileCapitalInput') ? parseFloat(document.getElementById('mobileCapitalInput').value) : 1000;
    var risk = document.getElementById('mobileRiskInput') ? parseFloat(document.getElementById('mobileRiskInput').value) : 2;
    var dailyTarget = document.getElementById('mobileDailyTargetInput') ? parseFloat(document.getElementById('mobileDailyTargetInput').value) : 1;
    var notifications = document.getElementById('mobileNotificationsInput') ? document.getElementById('mobileNotificationsInput').value : 'all';
    
    mobileData.capital = capital || 1000;
    mobileData.settings = {
        capital: capital || 1000,
        riskPerTrade: risk || 2,
        dailyTarget: dailyTarget || 1,
        notifications: notifications,
        nickname: nickname
    };
    
    if (nickname && mobileFirebase.currentUser) {
        var userRef = window.dbRef(mobileFirebase.db, 'users/' + mobileFirebase.currentUser.uid);
        window.dbSet(userRef, { nickname: nickname, isVIP: true });
    }
    
    saveMobileDataToFirebase();
    updateMobileDisplay();
    showMobileNotification('Paramètres sauvegardés !');
}

function updateMobileDisplay() {
    updateMobileStats();
    updateMobileTradesList();
    updateMobileObjectives();
    updateMobileCharts();
}

function updateMobileStats() {
    var closedTrades = mobileData.trades.filter(function(t) { return t.status === 'closed'; });
    var totalPnL = closedTrades.reduce(function(sum, t) { return sum + (parseFloat(t.pnl) || 0); }, 0);
    var winRate = closedTrades.length > 0 ? 
        (closedTrades.filter(function(t) { return (parseFloat(t.pnl) || 0) > 0; }).length / closedTrades.length * 100) : 0;
    var currentCapital = mobileData.capital + totalPnL;
    
    var capitalEl = document.getElementById('mobileCapital');
    var winRateEl = document.getElementById('mobileWinRate');
    var pnlEl = document.getElementById('mobilePnL');
    
    if (capitalEl) capitalEl.textContent = '$' + currentCapital.toFixed(2);
    if (winRateEl) winRateEl.textContent = winRate.toFixed(1) + '%';
    if (pnlEl) {
        pnlEl.textContent = '$' + totalPnL.toFixed(2);
        pnlEl.className = totalPnL >= 0 ? 'stat-value positive' : 'stat-value negative';
    }
}

function updateMobileTradesList() {
    var container = document.getElementById('mobileTradesList');
    if (!container) return;
    
    if (mobileData.trades.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;"><div style="font-size: 48px; margin-bottom: 20px;">📈</div><h3>Aucun trade</h3><p>Commencez par ajouter votre premier trade</p></div>';
        return;
    }
    
    var recentTrades = mobileData.trades.slice(-10).reverse();
    var html = '';
    
    for (var i = 0; i < recentTrades.length; i++) {
        var trade = recentTrades[i];
        var pnl = parseFloat(trade.pnl || 0);
        var pnlClass = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : '';
        
        html += '<div class="trade-card">';
        html += '<div class="trade-header">';
        html += '<span class="trade-pair">' + trade.currency + '</span>';
        html += '<span class="trade-status ' + trade.status + '">' + trade.status.toUpperCase() + '</span>';
        html += '</div>';
        html += '<div class="trade-details">';
        html += '<div class="trade-detail"><span class="trade-detail-label">Date:</span><span>' + trade.date + '</span></div>';
        html += '<div class="trade-detail"><span class="trade-detail-label">Entrée:</span><span>' + trade.entryPoint + '</span></div>';
        html += '<div class="trade-detail"><span class="trade-detail-label">Lot:</span><span>' + trade.lotSize + '</span></div>';
        html += '<div class="trade-detail"><span class="trade-detail-label">P&L:</span><span class="trade-pnl ' + pnlClass + '">$' + pnl.toFixed(2) + '</span></div>';
        html += '</div>';
        
        html += '<div class="trade-actions">';
        if (trade.status === 'open') {
            html += '<button class="action-btn close" onclick="closeMobileTrade(\'' + trade.id + '\')">🔒 Clôturer</button>';
        }
        html += '<button class="action-btn edit" onclick="editMobileTrade(\'' + trade.id + '\')">✏️ Modifier</button>';
        html += '<button class="action-btn delete" onclick="deleteMobileTrade(\'' + trade.id + '\')">🗑️ Supprimer</button>';
        html += '</div>';
        
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function updateMobileCharts() {
    initMobilePerformanceChart();
    initMobileWinRateChart();
}

function initMobilePerformanceChart() {
    var ctx = document.getElementById('mobilePerformanceChart');
    if (!ctx) return;
    
    var closedTrades = mobileData.trades.filter(function(t) { return t.status === 'closed'; });
    if (closedTrades.length === 0) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    
    var cumulativePnL = 0;
    var data = [];
    var labels = [];
    
    for (var i = 0; i < closedTrades.length; i++) {
        cumulativePnL += parseFloat(closedTrades[i].pnl || 0);
        data.push(cumulativePnL);
        labels.push('T' + (i + 1));
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
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

function initMobileWinRateChart() {
    var ctx = document.getElementById('mobileWinRateChart');
    if (!ctx) return;
    
    var closedTrades = mobileData.trades.filter(function(t) { return t.status === 'closed'; });
    if (closedTrades.length === 0) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    
    var wins = closedTrades.filter(function(t) { return (parseFloat(t.pnl) || 0) > 0; }).length;
    var losses = closedTrades.length - wins;
    
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

function updateMobileCalendar() {
    var container = document.getElementById('mobileCalendar');
    var monthYear = document.getElementById('monthYearMobile');
    
    if (!container || !monthYear) return;
    
    var currentDate = new Date();
    monthYear.textContent = currentDate.toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    var firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    var startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    var html = '';
    var dayHeaders = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    for (var i = 0; i < dayHeaders.length; i++) {
        html += '<div class="calendar-day-header">' + dayHeaders[i] + '</div>';
    }
    
    for (var i = 0; i < 42; i++) {
        var dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        
        var dateStr = dayDate.getFullYear() + '-' + 
            String(dayDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(dayDate.getDate()).padStart(2, '0');
        
        var dayTrades = mobileData.trades.filter(function(t) { 
            return t.date === dateStr && t.status === 'closed'; 
        });
        var dayPnL = dayTrades.reduce(function(sum, t) { 
            return sum + (parseFloat(t.pnl) || 0); 
        }, 0);
        
        var dayClass = 'calendar-day';
        if (dayDate.getMonth() !== currentDate.getMonth()) dayClass += ' other-month';
        if (dayTrades.length > 0) {
            dayClass += ' has-trades';
            if (dayPnL > 0) dayClass += ' profit-day';
            else if (dayPnL < 0) dayClass += ' loss-day';
        }
        
        html += '<div class="' + dayClass + '">';
        html += '<div class="calendar-date">' + dayDate.getDate() + '</div>';
        if (dayTrades.length > 0) {
            html += '<div class="calendar-pnl">$' + dayPnL.toFixed(0) + '</div>';
        }
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function updateMobileObjectives() {
    var closedTrades = mobileData.trades.filter(function(t) { return t.status === 'closed'; });
    var totalPnL = closedTrades.reduce(function(sum, t) { return sum + (parseFloat(t.pnl) || 0); }, 0);
    var currentCapital = mobileData.capital + totalPnL;
    
    var dailyTarget = (currentCapital * (mobileData.settings.dailyTarget || 1) / 100);
    var monthlyTarget = (currentCapital * ((mobileData.settings.dailyTarget || 1) * 20) / 100);
    
    var today = new Date().toISOString().split('T')[0];
    var todayTrades = mobileData.trades.filter(function(t) { return t.date === today && t.status === 'closed'; });
    var todayPnL = todayTrades.reduce(function(sum, t) { return sum + (parseFloat(t.pnl) || 0); }, 0);
    
    var dailyProgress = dailyTarget > 0 ? Math.min((todayPnL / dailyTarget) * 100, 100) : 0;
    
    var dailyTargetEl = document.getElementById('mobileDailyTarget');
    var monthlyTargetEl = document.getElementById('mobileMonthlyTarget');
    var dailyProgressEl = document.getElementById('mobileDailyProgress');
    var dailyPercentEl = document.getElementById('mobileDailyPercent');
    
    if (dailyTargetEl) dailyTargetEl.textContent = '$' + dailyTarget.toFixed(0);
    if (monthlyTargetEl) monthlyTargetEl.textContent = '$' + monthlyTarget.toFixed(0);
    if (dailyProgressEl) dailyProgressEl.style.width = dailyProgress + '%';
    if (dailyPercentEl) dailyPercentEl.textContent = dailyProgress.toFixed(1) + '%';
}

function loadRealMobileRanking() {
    var container = document.getElementById('mobileRankingList');
    if (!container) return;
    
    if (!mobileFirebase.isConnected) {
        updateMobileRanking();
        return;
    }
    
    try {
        var usersRef = window.dbRef(mobileFirebase.db, 'users');
        
        window.dbGet(usersRef).then(function(snapshot) {
            if (snapshot.exists()) {
                var users = snapshot.val();
                calculateRealRankings(users);
            } else {
                updateMobileRanking();
            }
        }).catch(function(error) {
            console.error('❌ Erreur classement:', error);
            updateMobileRanking();
        });
    } catch (error) {
        console.error('❌ Erreur Firebase ranking:', error);
        updateMobileRanking();
    }
}

function calculateRealRankings(users) {
    var today = new Date().toISOString().split('T')[0];
    var rankings = [];
    var processed = 0;
    var totalUsers = 0;
    
    for (var userId in users) {
        if (users[userId].isVIP) totalUsers++;
    }
    
    if (totalUsers === 0) {
        updateMobileRanking();
        return;
    }
    
    for (var userId in users) {
        if (users[userId].isVIP) {
            (function(uid, userData) {
                var accountRef = window.dbRef(mobileFirebase.db, 'users/' + uid + '/accounts/compte1');
                
                window.dbGet(accountRef).then(function(snapshot) {
                    var dailyPnL = 0;
                    var tradeCount = 0;
                    
                    if (snapshot.exists()) {
                        var accountData = snapshot.val();
                        if (accountData.trades) {
                            var todayTrades = accountData.trades.filter(function(t) {
                                return t.date === today && t.status === 'closed';
                            });
                            dailyPnL = todayTrades.reduce(function(sum, t) {
                                return sum + (parseFloat(t.pnl) || 0);
                            }, 0);
                            tradeCount = todayTrades.length;
                        }
                    }
                    
                    var displayName = userData.nickname || userData.email.split('@')[0] || 'Membre VIP';
                    rankings.push({
                        name: displayName,
                        dailyPnL: dailyPnL,
                        tradeCount: tradeCount,
                        userId: uid
                    });
                    
                    processed++;
                    if (processed === totalUsers) {
                        rankings.sort(function(a, b) { return b.dailyPnL - a.dailyPnL; });
                        displayRealRanking(rankings);
                    }
                }).catch(function(error) {
                    console.error('❌ Erreur user data:', error);
                    processed++;
                    if (processed === totalUsers) {
                        rankings.sort(function(a, b) { return b.dailyPnL - a.dailyPnL; });
                        displayRealRanking(rankings);
                    }
                });
            })(userId, users[userId]);
        }
    }
}

function displayRealRanking(rankings) {
    var container = document.getElementById('mobileRankingList');
    if (!container) return;
    
    var html = '';
    for (var i = 0; i < rankings.length; i++) {
        var trader = rankings[i];
        var isCurrentUser = trader.userId === (mobileFirebase.currentUser ? mobileFirebase.currentUser.uid : '');
        var pnlClass = trader.dailyPnL >= 0 ? 'positive' : 'negative';
        
        html += '<div class="ranking-item' + (isCurrentUser ? ' current-user' : '') + '">';
        html += '<div class="ranking-position">' + (i + 1) + '</div>';
        html += '<div class="ranking-info">';
        html += '<div class="ranking-name">' + trader.name + (isCurrentUser ? ' (Vous)' : '') + '</div>';
        html += '<div class="ranking-trades">' + trader.tradeCount + ' trades</div>';
        html += '</div>';
        html += '<div class="ranking-pnl ' + pnlClass + '">$' + trader.dailyPnL.toFixed(2) + '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function updateMobileRanking() {
    var container = document.getElementById('mobileRankingList');
    if (!container) return;
    
    var closedTrades = mobileData.trades.filter(function(t) { return t.status === 'closed'; });
    var userPnL = closedTrades.reduce(function(sum, t) { return sum + (parseFloat(t.pnl) || 0); }, 0);
    
    var rankings = [
        { name: 'Trader Pro', dailyPnL: 250.50, tradeCount: 8, userId: 'demo1' },
        { name: 'Expert FX', dailyPnL: 180.25, tradeCount: 5, userId: 'demo2' },
        { name: 'Vous', dailyPnL: userPnL, tradeCount: mobileData.trades.length, userId: mobileFirebase.currentUser ? mobileFirebase.currentUser.uid : 'current' },
        { name: 'Master Pips', dailyPnL: -45.30, tradeCount: 15, userId: 'demo3' }
    ];
    
    rankings.sort(function(a, b) { return b.dailyPnL - a.dailyPnL; });
    
    var html = '';
    for (var i = 0; i < rankings.length; i++) {
        var trader = rankings[i];
        var isCurrentUser = trader.name === 'Vous';
        var pnlClass = trader.dailyPnL >= 0 ? 'positive' : 'negative';
        
        html += '<div class="ranking-item' + (isCurrentUser ? ' current-user' : '') + '">';
        html += '<div class="ranking-position">' + (i + 1) + '</div>';
        html += '<div class="ranking-info">';
        html += '<div class="ranking-name">' + trader.name + '</div>';
        html += '<div class="ranking-trades">' + trader.tradeCount + ' trades</div>';
        html += '</div>';
        html += '<div class="ranking-pnl ' + pnlClass + '">$' + trader.dailyPnL.toFixed(2) + '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function updateMobileSettings() {
    var nicknameInput = document.getElementById('mobileNicknameInput');
    var capitalInput = document.getElementById('mobileCapitalInput');
    var riskInput = document.getElementById('mobileRiskInput');
    var dailyTargetInput = document.getElementById('mobileDailyTargetInput');
    var notificationsInput = document.getElementById('mobileNotificationsInput');
    
    if (nicknameInput) nicknameInput.value = mobileData.settings.nickname || '';
    if (capitalInput) capitalInput.value = mobileData.capital || 1000;
    if (riskInput) riskInput.value = mobileData.settings.riskPerTrade || 2;
    if (dailyTargetInput) dailyTargetInput.value = mobileData.settings.dailyTarget || 1;
    if (notificationsInput) notificationsInput.value = mobileData.settings.notifications || 'all';
}

function showMobileNotification(message) {
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
    
    try {
        var audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(function() {});
    } catch (e) {}
    
    var notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: linear-gradient(45deg, #00d4ff, #5b86e5); color: white; padding: 15px 20px; border-radius: 25px; z-index: 9999; font-weight: bold; box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4); animation: slideInBounce 0.5s ease;';
    document.body.appendChild(notification);
    
    setTimeout(function() {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

window.showSection = showMobileSection;
window.closeMobileTrade = closeMobileTrade;
window.editMobileTrade = editMobileTrade;
window.deleteMobileTrade = deleteMobileTrade;

document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM chargé, initialisation mobile complète...');
    setTimeout(function() {
        initMobileFirebase();
    }, 500);
});

console.log('✅ Mobile complet prêt');