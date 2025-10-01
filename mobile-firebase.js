// Mobile Firebase - Version compatible SES
console.log('🔥 Mobile Firebase chargé');

var mobileFirebase = {
    db: null,
    auth: null,
    currentUser: null,
    isConnected: false
};

function initMobileFirebase() {
    console.log('🚀 Init Firebase mobile');
    
    // Attendre que Firebase soit disponible
    var attempts = 0;
    var maxAttempts = 50;
    
    var checkFirebase = setInterval(function() {
        attempts++;
        
        if (window.firebaseDB && window.firebaseAuth) {
            mobileFirebase.db = window.firebaseDB;
            mobileFirebase.auth = window.firebaseAuth;
            mobileFirebase.isConnected = true;
            
            // Récupérer l'utilisateur
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
        console.log('📱 Mode local - Firebase non disponible');
        loadMobileDataLocal();
        return;
    }
    
    try {
        var userRef = window.dbRef(mobileFirebase.db, 'dashboards/' + mobileFirebase.currentUser.uid);
        
        window.dbGet(userRef).then(function(snapshot) {
            if (snapshot.exists()) {
                var data = snapshot.val();
                mobileData.trades = data.trades || [];
                mobileData.settings = data.settings || { capital: 1000, riskPerTrade: 2 };
                mobileData.capital = mobileData.settings.capital || 1000;
                
                console.log('☁️ Données chargées depuis Firebase:', mobileData.trades.length, 'trades');
                updateMobileDisplay();
            } else {
                console.log('📱 Aucune donnée Firebase, utilisation des valeurs par défaut');
                loadMobileDataLocal();
            }
        }).catch(function(error) {
            console.error('❌ Erreur chargement Firebase:', error);
            loadMobileDataLocal();
        });
    } catch (error) {
        console.error('❌ Erreur Firebase:', error);
        loadMobileDataLocal();
    }
}

function saveMobileDataToFirebase() {
    if (!mobileFirebase.isConnected || !mobileFirebase.currentUser) {
        console.log('💾 Sauvegarde locale uniquement');
        saveMobileDataLocal();
        return;
    }
    
    try {
        var dataToSave = {
            trades: mobileData.trades,
            settings: {
                capital: mobileData.capital,
                riskPerTrade: mobileData.settings ? mobileData.settings.riskPerTrade : 2,
                dailyTarget: mobileData.settings ? mobileData.settings.dailyTarget : 1
            },
            lastUpdated: new Date().toISOString()
        };
        
        var userRef = window.dbRef(mobileFirebase.db, 'dashboards/' + mobileFirebase.currentUser.uid);
        
        window.dbSet(userRef, dataToSave).then(function() {
            console.log('☁️ Données sauvegardées sur Firebase');
            saveMobileDataLocal(); // Backup local
        }).catch(function(error) {
            console.error('❌ Erreur sauvegarde Firebase:', error);
            saveMobileDataLocal(); // Fallback local
        });
    } catch (error) {
        console.error('❌ Erreur Firebase:', error);
        saveMobileDataLocal();
    }
}

function loadMobileDataLocal() {
    try {
        var saved = localStorage.getItem('mobile_data_firebase');
        if (saved) {
            var data = JSON.parse(saved);
            mobileData.trades = data.trades || [];
            mobileData.settings = data.settings || { capital: 1000, riskPerTrade: 2 };
            mobileData.capital = data.settings ? data.settings.capital : 1000;
            console.log('📱 Données chargées depuis localStorage:', mobileData.trades.length, 'trades');
        }
    } catch (error) {
        console.error('❌ Erreur localStorage:', error);
    }
    updateMobileDisplay();
}

function saveMobileDataLocal() {
    try {
        var dataToSave = {
            trades: mobileData.trades,
            settings: {
                capital: mobileData.capital,
                riskPerTrade: mobileData.settings ? mobileData.settings.riskPerTrade : 2
            },
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('mobile_data_firebase', JSON.stringify(dataToSave));
        console.log('💾 Données sauvegardées en localStorage');
    } catch (error) {
        console.error('❌ Erreur sauvegarde localStorage:', error);
    }
}

function sendMobileChatMessage(message) {
    if (!mobileFirebase.isConnected || !mobileFirebase.currentUser) {
        console.log('💬 Chat non disponible - Firebase déconnecté');
        return;
    }
    
    try {
        var messagesRef = window.dbRef(mobileFirebase.db, 'vip_chat');
        var nickname = mobileFirebase.currentUser.email.split('@')[0] || 'Mobile User';
        
        var messageData = {
            userId: mobileFirebase.currentUser.uid,
            nickname: nickname,
            message: message,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0]
        };
        
        window.dbPush(messagesRef, messageData).then(function() {
            console.log('💬 Message envoyé au chat VIP');
            showMobileNotification('Message envoyé !');
        }).catch(function(error) {
            console.error('❌ Erreur envoi message:', error);
            showMobileNotification('Erreur envoi message');
        });
    } catch (error) {
        console.error('❌ Erreur chat:', error);
    }
}

function loadMobileChatMessages() {
    if (!mobileFirebase.isConnected) {
        return;
    }
    
    try {
        var messagesRef = window.dbRef(mobileFirebase.db, 'vip_chat');
        
        window.dbOnValue(messagesRef, function(snapshot) {
            if (snapshot.exists()) {
                var messages = snapshot.val();
                displayMobileChatMessages(messages);
            }
        });
    } catch (error) {
        console.error('❌ Erreur chargement chat:', error);
    }
}

function displayMobileChatMessages(messages) {
    var container = document.getElementById('mobileChatMessages');
    if (!container) return;
    
    var messageArray = [];
    for (var key in messages) {
        if (messages.hasOwnProperty(key)) {
            messageArray.push({
                id: key,
                userId: messages[key].userId,
                nickname: messages[key].nickname,
                message: messages[key].message,
                timestamp: messages[key].timestamp
            });
        }
    }
    
    // Trier par timestamp
    messageArray.sort(function(a, b) {
        return a.timestamp - b.timestamp;
    });
    
    // Prendre les 50 derniers messages
    var recentMessages = messageArray.slice(-50);
    
    var html = '';
    for (var i = 0; i < recentMessages.length; i++) {
        var msg = recentMessages[i];
        var isOwn = msg.userId === mobileFirebase.currentUser.uid;
        var time = new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
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

// Variables globales
var mobileData = {
    trades: [],
    capital: 1000,
    settings: {
        capital: 1000,
        riskPerTrade: 2,
        dailyTarget: 1
    }
};

function initMobileInterface() {
    console.log('🎨 Init interface mobile');
    
    // Menu
    var menuToggle = document.getElementById('menuToggle');
    var mobileMenu = document.getElementById('mobileMenu');
    var closeMenu = document.getElementById('closeMenu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.onclick = function() {
            mobileMenu.classList.add('open');
        };
    }
    
    if (closeMenu && mobileMenu) {
        closeMenu.onclick = function() {
            mobileMenu.classList.remove('open');
        };
    }
    
    // Boutons trade
    var newTradeBtn = document.getElementById('newTradeBtn');
    var addTradeBtn = document.getElementById('addTradeBtn');
    var closeTradeModal = document.getElementById('closeTradeModal');
    var saveMobileTradeBtn = document.getElementById('saveMobileTradeBtn');
    
    if (newTradeBtn) {
        newTradeBtn.onclick = function() {
            showMobileTradeModal();
        };
    }
    
    if (addTradeBtn) {
        addTradeBtn.onclick = function() {
            showMobileTradeModal();
        };
    }
    
    if (closeTradeModal) {
        closeTradeModal.onclick = function() {
            hideMobileTradeModal();
        };
    }
    
    if (saveMobileTradeBtn) {
        saveMobileTradeBtn.onclick = function() {
            saveMobileTrade();
        };
    }
    
    // Chat
    var mobileChatToggle = document.getElementById('mobileChatToggle');
    var mobileChatWindow = document.getElementById('mobileChatWindow');
    var closeMobileChat = document.getElementById('closeMobileChat');
    var sendMobileMessage = document.getElementById('sendMobileMessage');
    var mobileChatInput = document.getElementById('mobileChatInput');
    
    if (mobileChatToggle && mobileChatWindow) {
        mobileChatToggle.onclick = function() {
            mobileChatWindow.classList.toggle('show');
        };
    }
    
    if (closeMobileChat && mobileChatWindow) {
        closeMobileChat.onclick = function() {
            mobileChatWindow.classList.remove('show');
        };
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
    
    // Paramètres
    var saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.onclick = function() {
            saveMobileSettings();
        };
    }
    
    // Navigation bottom
    var navBtns = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < navBtns.length; i++) {
        navBtns[i].addEventListener('click', function(e) {
            e.preventDefault();
            
            // Retirer active de tous les boutons
            for (var j = 0; j < navBtns.length; j++) {
                navBtns[j].classList.remove('active');
            }
            
            // Ajouter active au bouton cliqué
            this.classList.add('active');
            
            // Déterminer la section à afficher
            var sectionId = 'dashboard';
            var iconText = this.querySelector('.nav-icon').textContent;
            
            if (iconText === '📈') sectionId = 'trades';
            else if (iconText === '📅') sectionId = 'calendar';
            else if (iconText === '🎯') sectionId = 'objectives';
            else if (iconText === '🏆') sectionId = 'ranking';
            
            showMobileSection(sectionId);
        });
    }
    
    // Charger le chat
    loadMobileChatMessages();
    
    console.log('✅ Interface mobile initialisée');
}

function showMobileTradeModal() {
    var modal = document.getElementById('mobileTradeModal');
    if (modal) {
        modal.classList.add('show');
    }
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
    var entryPoint = document.getElementById('mobileEntryPoint') ? parseFloat(document.getElementById('mobileEntryPoint').value) : 1.0000;
    var stopLoss = document.getElementById('mobileStopLoss') ? parseFloat(document.getElementById('mobileStopLoss').value) : 0.9950;
    var takeProfit = document.getElementById('mobileTakeProfit') ? parseFloat(document.getElementById('mobileTakeProfit').value) : 1.0050;
    var lotSize = document.getElementById('mobileLotSize') ? parseFloat(document.getElementById('mobileLotSize').value) : 0.1;
    
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

function saveMobileSettings() {
    var capital = document.getElementById('mobileCapitalInput') ? parseFloat(document.getElementById('mobileCapitalInput').value) : 1000;
    var risk = document.getElementById('mobileRiskInput') ? parseFloat(document.getElementById('mobileRiskInput').value) : 2;
    var dailyTarget = document.getElementById('mobileDailyTargetInput') ? parseFloat(document.getElementById('mobileDailyTargetInput').value) : 1;
    
    mobileData.capital = capital || 1000;
    mobileData.settings = {
        capital: capital || 1000,
        riskPerTrade: risk || 2,
        dailyTarget: dailyTarget || 1
    };
    
    saveMobileDataToFirebase();
    updateMobileDisplay();
    showMobileNotification('Paramètres sauvegardés !');
}

function updateMobileDisplay() {
    updateMobileStats();
    updateMobileTradesList();
    updateMobileObjectives();
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
    
    console.log('📊 Stats mises à jour:', { capital: currentCapital, winRate: winRate, pnl: totalPnL });
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
        
        if (trade.status === 'open') {
            html += '<div class="trade-actions">';
            html += '<button class="action-btn close" onclick="closeMobileTrade(\'' + trade.id + '\')">🔒 Clôturer</button>';
            html += '</div>';
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

function closeMobileTrade(tradeId) {
    var result = prompt('Résultat (TP/SL/BE):', 'TP');
    if (!result) return;
    
    for (var i = 0; i < mobileData.trades.length; i++) {
        if (mobileData.trades[i].id === tradeId) {
            var trade = mobileData.trades[i];
            trade.status = 'closed';
            trade.result = result.toUpperCase();
            trade.closeDate = new Date().toISOString();
            
            // Calcul P&L simple
            if (result.toUpperCase() === 'TP') {
                trade.pnl = Math.abs(trade.takeProfit - trade.entryPoint) * trade.lotSize * 100;
            } else if (result.toUpperCase() === 'SL') {
                trade.pnl = -Math.abs(trade.entryPoint - trade.stopLoss) * trade.lotSize * 100;
            } else {
                trade.pnl = 0;
            }
            
            break;
        }
    }
    
    saveMobileDataToFirebase();
    updateMobileDisplay();
    showMobileNotification('Trade clôturé en ' + result);
}

function showMobileNotification(message) {
    var notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: linear-gradient(45deg, #00d4ff, #5b86e5); color: white; padding: 15px 20px; border-radius: 25px; z-index: 9999; font-weight: bold; box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);';
    document.body.appendChild(notification);
    
    setTimeout(function() {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 2000);
}

function showMobileSection(sectionId) {
    console.log('🔄 Navigation vers section:', sectionId);
    
    // Masquer toutes les sections
    var sections = document.querySelectorAll('.section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.remove('active');
    }
    
    // Afficher la section demandée
    var targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('✅ Section affichée:', sectionId);
        
        // Charger le contenu spécifique à la section
        switch(sectionId) {
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
                updateMobileRanking();
                break;
            case 'settings':
                updateMobileSettings();
                break;
        }
    } else {
        console.error('❌ Section non trouvée:', sectionId);
    }
    
    // Fermer le menu mobile
    var mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.remove('open');
    }
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
    var lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    var startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    var html = '';
    
    // En-têtes des jours
    var dayHeaders = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    for (var i = 0; i < dayHeaders.length; i++) {
        html += '<div class="calendar-day-header">' + dayHeaders[i] + '</div>';
    }
    
    // Jours du calendrier
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

function updateMobileRanking() {
    var container = document.getElementById('mobileRankingList');
    if (!container) return;
    
    // Calculer le P&L de l'utilisateur actuel
    var closedTrades = mobileData.trades.filter(function(t) { return t.status === 'closed'; });
    var userPnL = closedTrades.reduce(function(sum, t) { return sum + (parseFloat(t.pnl) || 0); }, 0);
    
    // Classement démo avec l'utilisateur
    var rankings = [
        { name: 'Trader Pro', dailyPnL: 250.50, tradeCount: 8, userId: 'demo1' },
        { name: 'Expert FX', dailyPnL: 180.25, tradeCount: 5, userId: 'demo2' },
        { name: 'Vous', dailyPnL: userPnL, tradeCount: mobileData.trades.length, userId: mobileFirebase.currentUser ? mobileFirebase.currentUser.uid : 'current' },
        { name: 'Master Pips', dailyPnL: -45.30, tradeCount: 15, userId: 'demo3' }
    ];
    
    // Trier par P&L
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
    var capitalInput = document.getElementById('mobileCapitalInput');
    var riskInput = document.getElementById('mobileRiskInput');
    var dailyTargetInput = document.getElementById('mobileDailyTargetInput');
    
    if (capitalInput) capitalInput.value = mobileData.capital || 1000;
    if (riskInput) riskInput.value = mobileData.settings.riskPerTrade || 2;
    if (dailyTargetInput) dailyTargetInput.value = mobileData.settings.dailyTarget || 1;
}

// Fonctions globales
window.showSection = showMobileSection;
window.closeMobileTrade = closeMobileTrade;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM chargé, initialisation Firebase mobile...');
    setTimeout(function() {
        initMobileFirebase();
    }, 500);
});

console.log('✅ Mobile Firebase prêt');