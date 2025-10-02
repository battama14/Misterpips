// Fix pour tous les boutons mobiles
class MobileButtonsFix {
    constructor() {
        this.setupAllButtons();
    }

    setupAllButtons() {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                this.fixAllButtons();
            }, 1000);
        });
    }

    fixAllButtons() {
        console.log('🔧 Correction des boutons mobiles...');

        // 1. Menu hamburger
        this.fixMenuButtons();
        
        // 2. Navigation
        this.fixNavigationButtons();
        
        // 3. Boutons de trades
        this.fixTradeButtons();
        
        // 4. Calendrier
        this.fixCalendarButtons();
        
        // 5. Chat
        this.fixChatButtons();
        
        // 6. Modal
        this.fixModalButtons();
        
        // 7. Paramètres
        this.fixSettingsButtons();

        console.log('✅ Tous les boutons mobiles corrigés');
    }

    fixMenuButtons() {
        const menuToggle = document.getElementById('menuToggle');
        const closeMenu = document.getElementById('closeMenu');
        const mobileMenu = document.getElementById('mobileMenu');

        if (menuToggle) {
            menuToggle.onclick = (e) => {
                e.preventDefault();
                mobileMenu?.classList.add('open');
            };
        }

        if (closeMenu) {
            closeMenu.onclick = (e) => {
                e.preventDefault();
                mobileMenu?.classList.remove('open');
            };
        }
    }

    fixNavigationButtons() {
        // Navigation bottom
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const section = btn.getAttribute('ontouchend')?.match(/'([^']+)'/)?.[1];
            if (section) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    this.showSection(section);
                };
            }
        });

        // Menu links
        document.querySelectorAll('.menu-list a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const section = href.substring(1);
                link.onclick = (e) => {
                    e.preventDefault();
                    this.showSection(section);
                    document.getElementById('mobileMenu')?.classList.remove('open');
                };
            }
        });
    }

    fixTradeButtons() {
        // Boutons nouveau trade
        const newTradeBtn = document.getElementById('newTradeBtn');
        const addTradeBtn = document.getElementById('addTradeBtn');

        if (newTradeBtn) {
            newTradeBtn.onclick = (e) => {
                e.preventDefault();
                window.mobileDashboard?.showTradeModal();
            };
        }

        if (addTradeBtn) {
            addTradeBtn.onclick = (e) => {
                e.preventDefault();
                window.mobileDashboard?.showTradeModal();
            };
        }
    }

    fixCalendarButtons() {
        const prevBtn = document.getElementById('prevMonthMobile');
        const nextBtn = document.getElementById('nextMonthMobile');

        if (prevBtn) {
            prevBtn.onclick = (e) => {
                e.preventDefault();
                if (window.mobileDashboard) {
                    window.mobileDashboard.currentMonth--;
                    if (window.mobileDashboard.currentMonth < 0) {
                        window.mobileDashboard.currentMonth = 11;
                        window.mobileDashboard.currentYear--;
                    }
                    window.mobileDashboard.renderCalendar();
                }
            };
        }

        if (nextBtn) {
            nextBtn.onclick = (e) => {
                e.preventDefault();
                if (window.mobileDashboard) {
                    window.mobileDashboard.currentMonth++;
                    if (window.mobileDashboard.currentMonth > 11) {
                        window.mobileDashboard.currentMonth = 0;
                        window.mobileDashboard.currentYear++;
                    }
                    window.mobileDashboard.renderCalendar();
                }
            };
        }
    }

    fixChatButtons() {
        const chatToggle = document.getElementById('chatToggle');
        const chatWindow = document.getElementById('chatWindow');

        if (chatToggle) {
            chatToggle.onclick = (e) => {
                e.preventDefault();
                chatWindow?.classList.toggle('show');
            };
        }

        // Fermer chat
        const closeChat = document.querySelector('.chat-header .close-btn');
        if (closeChat) {
            closeChat.onclick = (e) => {
                e.preventDefault();
                chatWindow?.classList.remove('show');
            };
        }

        // Send message
        const sendBtn = document.querySelector('.send-btn');
        if (sendBtn) {
            sendBtn.onclick = (e) => {
                e.preventDefault();
                window.mobileDashboard?.sendChatMessage();
            };
        }

        // Emoji button
        const emojiBtn = document.querySelector('.emoji-btn');
        if (emojiBtn) {
            emojiBtn.onclick = (e) => {
                e.preventDefault();
                const panel = document.getElementById('mobileEmojiPanel');
                if (panel) {
                    const isVisible = panel.style.display === 'block';
                    panel.style.display = isVisible ? 'none' : 'block';
                }
            };
        }
    }

    fixModalButtons() {
        const modal = document.getElementById('tradeModal');
        const closeModalBtn = document.querySelector('#tradeModal .close-btn');
        const saveTradeBtn = document.querySelector('.form-actions .primary-btn');

        if (closeModalBtn) {
            closeModalBtn.onclick = (e) => {
                e.preventDefault();
                modal?.classList.remove('show');
            };
        }

        if (saveTradeBtn) {
            saveTradeBtn.onclick = (e) => {
                e.preventDefault();
                window.mobileDashboard?.saveTrade();
            };
        }
    }

    fixSettingsButtons() {
        const saveSettingsBtn = document.querySelector('.settings-list .primary-btn');
        
        if (saveSettingsBtn) {
            saveSettingsBtn.onclick = (e) => {
                e.preventDefault();
                window.mobileDashboard?.saveSettings();
            };
        }
    }

    showSection(sectionName) {
        console.log('📱 Affichage section:', sectionName);
        
        // Masquer toutes les sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        
        // Afficher la section demandée
        const section = document.getElementById(sectionName);
        if (section) {
            section.classList.add('active');
        }
        
        // Activer le bouton de navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const btnSection = btn.getAttribute('ontouchend')?.match(/'([^']+)'/)?.[1];
            if (btnSection === sectionName) {
                btn.classList.add('active');
            }
        });
        
        // Charger les données spécifiques
        if (sectionName === 'ranking') {
            window.mobileRankingFix?.loadStableRanking();
        } else if (sectionName === 'calendar') {
            window.mobileDashboard?.renderCalendar();
        }
    }
}

// Fonctions globales pour compatibilité
window.showSection = function(sectionName) {
    window.mobileButtonsFix?.showSection(sectionName);
};

window.toggleMobileChat = function() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow?.classList.toggle('show');
};

window.toggleEmojiPanel = function() {
    const panel = document.getElementById('mobileEmojiPanel');
    if (panel) {
        const isVisible = panel.style.display === 'block';
        panel.style.display = isVisible ? 'none' : 'block';
    }
};

window.insertEmoji = function(emoji) {
    const input = document.getElementById('mobileMessageInput');
    if (input) {
        input.value += emoji;
        input.focus();
    }
    const panel = document.getElementById('mobileEmojiPanel');
    if (panel) panel.style.display = 'none';
};

window.sendMobileMessage = function() {
    window.mobileDashboard?.sendChatMessage();
};

window.closeMobileModal = function() {
    const modal = document.getElementById('tradeModal');
    modal?.classList.remove('show');
};

window.saveMobileTrade = function() {
    window.mobileDashboard?.saveTrade();
};

// Initialisation
window.mobileButtonsFix = new MobileButtonsFix();