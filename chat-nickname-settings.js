// Paramètres de pseudo dans le chat
class ChatNicknameSettings {
    constructor() {
        this.init();
    }

    init() {
        this.addNicknameSettingsToChat();
    }

    addNicknameSettingsToChat() {
        // Ajouter un bouton de paramètres de pseudo dans le chat
        const chatHeader = document.querySelector('.chat-header .chat-controls');
        if (chatHeader) {
            const nicknameBtn = document.createElement('button');
            nicknameBtn.id = 'nicknameSettingsBtn';
            nicknameBtn.className = 'chat-control-btn';
            nicknameBtn.title = 'Changer de pseudo';
            nicknameBtn.innerHTML = '👤';
            nicknameBtn.onclick = () => this.showNicknameModal();
            
            chatHeader.insertBefore(nicknameBtn, chatHeader.firstChild);
        }
    }

    showNicknameModal() {
        const currentNickname = window.nicknameManager.getNickname() || '';
        
        const modal = document.createElement('div');
        modal.className = 'nickname-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div class="nickname-modal-content" style="
                background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
                padding: 30px;
                border-radius: 15px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                border: 1px solid #00d4ff;
                box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
            ">
                <h3 style="color: #00d4ff; margin-bottom: 20px;">👤 Changer de pseudo</h3>
                <p style="color: #ccc; margin-bottom: 20px;">
                    Votre pseudo sera affiché dans le chat et le classement VIP
                </p>
                <input type="text" id="newNicknameInput" value="${currentNickname}" 
                       placeholder="Votre nouveau pseudo" 
                       style="
                           width: 100%;
                           padding: 12px;
                           border: 1px solid #444;
                           border-radius: 8px;
                           background: #333;
                           color: white;
                           font-size: 16px;
                           margin-bottom: 20px;
                       ">
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="saveNicknameBtn" style="
                        background: linear-gradient(135deg, #00d4ff, #5b86e5);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                    ">💾 Sauvegarder</button>
                    <button id="cancelNicknameBtn" style="
                        background: #666;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">❌ Annuler</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus sur l'input
        const input = modal.querySelector('#newNicknameInput');
        input.focus();
        input.select();

        // Événements
        modal.querySelector('#saveNicknameBtn').onclick = async () => {
            const newNickname = input.value.trim();
            if (newNickname && newNickname !== currentNickname) {
                const success = await window.nicknameManager.changeNickname(newNickname);
                if (success) {
                    this.showNotification('✅ Pseudo modifié avec succès !');
                    
                    // Mettre à jour le classement VIP
                    if (window.vipRanking) {
                        setTimeout(() => {
                            window.vipRanking.loadRanking();
                        }, 500);
                    }
                } else {
                    this.showNotification('❌ Erreur lors de la modification du pseudo');
                }
            }
            document.body.removeChild(modal);
        };

        modal.querySelector('#cancelNicknameBtn').onclick = () => {
            document.body.removeChild(modal);
        };

        // Fermer avec Escape
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        });

        // Sauvegarder avec Entrée
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                modal.querySelector('#saveNicknameBtn').click();
            }
        });

        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00d4ff, #5b86e5);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10001;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialiser les paramètres de pseudo du chat
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        new ChatNicknameSettings();
    }, 1000);
});