// Corrections pour le chat - Emojis, fichiers et problème mobile

// Améliorer le panneau d'emojis
function createEmojiPanel() {
    const emojiCategories = {
        'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
        'Trading': ['📈', '📉', '💰', '💵', '💴', '💶', '💷', '🏦', '💳', '💎', '🚀', '🎯', '🔥', '💯', '⚡', '🌟', '✨', '💪', '👑', '🏆', '🥇', '🎉', '🎊'],
        'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '👏', '🙌', '👐', '🤲', '🤜', '🤛', '✊', '👊', '🤚'],
        'Objects': ['📱', '💻', '⌨️', '🖥️', '🖨️', '📞', '☎️', '📠', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️']
    };

    const panel = document.createElement('div');
    panel.id = 'emojiPanel';
    panel.className = 'emoji-panel';
    
    let panelHTML = '<div class="emoji-header"><h4>Emojis</h4><button class="emoji-close">✕</button></div>';
    
    Object.entries(emojiCategories).forEach(([category, emojis]) => {
        panelHTML += `<div class="emoji-category">
            <h5>${category}</h5>
            <div class="emoji-grid">`;
        
        emojis.forEach(emoji => {
            panelHTML += `<button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`;
        });
        
        panelHTML += '</div></div>';
    });
    
    panel.innerHTML = panelHTML;
    return panel;
}

// Améliorer la gestion des fichiers
function createFileUploadPanel() {
    const panel = document.createElement('div');
    panel.id = 'filePanel';
    panel.className = 'file-panel';
    
    panel.innerHTML = `
        <div class="file-header">
            <h4>📎 Partager un fichier</h4>
            <button class="file-close">✕</button>
        </div>
        <div class="file-options">
            <button class="file-option" data-type="image">
                <span class="file-icon">🖼️</span>
                <span class="file-label">Image</span>
                <span class="file-desc">JPG, PNG, GIF (max 5MB)</span>
            </button>
            <button class="file-option" data-type="document">
                <span class="file-icon">📄</span>
                <span class="file-label">Document</span>
                <span class="file-desc">PDF, DOC, TXT (max 10MB)</span>
            </button>
            <button class="file-option" data-type="any">
                <span class="file-icon">📁</span>
                <span class="file-label">Autre fichier</span>
                <span class="file-desc">Tous types (max 5MB)</span>
            </button>
        </div>
    `;
    
    return panel;
}

// Corriger le problème mobile du clavier
function fixMobileKeyboardIssue() {
    const chatInput = document.getElementById('chatInput');
    const chatWindow = document.getElementById('chatWindow');
    const sendBtn = document.getElementById('sendBtn');
    
    if (!chatInput || !chatWindow || !sendBtn) return;
    
    let isKeyboardOpen = false;
    let originalHeight = window.innerHeight;
    
    // Détecter l'ouverture/fermeture du clavier
    window.addEventListener('resize', () => {
        const currentHeight = window.innerHeight;
        const heightDiff = originalHeight - currentHeight;
        
        if (heightDiff > 150) { // Clavier ouvert
            if (!isKeyboardOpen) {
                isKeyboardOpen = true;
                chatWindow.classList.add('keyboard-open');
                
                // Maintenir le focus et empêcher la fermeture
                setTimeout(() => {
                    chatInput.focus();
                }, 100);
            }
        } else { // Clavier fermé
            if (isKeyboardOpen) {
                isKeyboardOpen = false;
                chatWindow.classList.remove('keyboard-open');
            }
        }
    });
    
    // Empêcher la fermeture du chat lors du clic sur envoyer
    sendBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Envoyer le message
        if (window.iMessageChat) {
            window.iMessageChat.sendMessage();
        }
        
        // Maintenir le focus
        setTimeout(() => {
            chatInput.focus();
        }, 50);
    });
    
    // Améliorer la gestion du focus
    chatInput.addEventListener('focus', () => {
        setTimeout(() => {
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }, 300);
    });
    
    // Empêcher la fermeture accidentelle
    chatInput.addEventListener('blur', (e) => {
        // Si le blur est causé par un clic sur le bouton d'envoi, ne pas fermer
        if (e.relatedTarget === sendBtn) {
            setTimeout(() => {
                chatInput.focus();
            }, 50);
        }
    });
}

// Fonction globale pour les emojis
function showEmojiPanel() {
    let panel = document.getElementById('emojiPanel');
    
    if (panel) {
        panel.remove();
        return;
    }
    
    panel = createEmojiPanel();
    document.body.appendChild(panel);
    
    // Positionner le panneau
    const emojiBtn = document.getElementById('emojiBtn');
    if (emojiBtn) {
        const rect = emojiBtn.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
        panel.style.left = rect.left + 'px';
        
        // Ajuster si hors écran
        setTimeout(() => {
            const panelRect = panel.getBoundingClientRect();
            if (panelRect.right > window.innerWidth) {
                panel.style.left = (window.innerWidth - panelRect.width - 10) + 'px';
            }
            if (panelRect.top < 0) {
                panel.style.bottom = '10px';
            }
        }, 10);
    }
    
    // Gestionnaires d'événements
    panel.querySelector('.emoji-close').addEventListener('click', () => {
        panel.remove();
    });
    
    panel.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const emoji = btn.dataset.emoji;
            const input = document.getElementById('chatInput');
            if (input) {
                input.value += emoji;
                input.focus();
                // Déclencher l'événement input pour mettre à jour l'UI
                input.dispatchEvent(new Event('input'));
            }
            panel.remove();
        });
    });
    
    // Fermer en cliquant à l'extérieur
    setTimeout(() => {
        document.addEventListener('click', function closePanel(e) {
            if (!panel.contains(e.target) && e.target.id !== 'emojiBtn') {
                panel.remove();
                document.removeEventListener('click', closePanel);
            }
        });
    }, 100);
}

// Améliorer les emojis dans le chat existant
if (window.iMessageChat) {
    // Remplacer la fonction toggleEmojiPanel
    window.iMessageChat.toggleEmojiPanel = showEmojiPanel;
} else {
    showEmojiPanel();
}
    
    // Remplacer la fonction handleFileAttachment
    window.iMessageChat.handleFileAttachment = function() {
        let panel = document.getElementById('filePanel');
        
        if (panel) {
            panel.remove();
            return;
        }
        
        panel = createFileUploadPanel();
        document.body.appendChild(panel);
        
        // Positionner le panneau
        const attachBtn = document.getElementById('attachBtn');
        const rect = attachBtn.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
        panel.style.left = rect.left + 'px';
        
        // Gestionnaires d'événements
        panel.querySelector('.file-close').addEventListener('click', () => {
            panel.remove();
        });
        
        panel.querySelectorAll('.file-option').forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.type;
                this.openFileSelector(type);
                panel.remove();
            });
        });
        
        // Fermer en cliquant à l'extérieur
        setTimeout(() => {
            document.addEventListener('click', function closePanel(e) {
                if (!panel.contains(e.target) && e.target !== attachBtn) {
                    panel.remove();
                    document.removeEventListener('click', closePanel);
                }
            });
        }, 100);
    };
    
    // Nouvelle fonction pour ouvrir le sélecteur de fichiers
    window.iMessageChat.openFileSelector = function(type) {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        
        switch(type) {
            case 'image':
                input.accept = 'image/*';
                break;
            case 'document':
                input.accept = '.pdf,.doc,.docx,.txt,.rtf';
                break;
            case 'any':
            default:
                input.accept = '*/*';
                break;
        }
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const maxSize = type === 'document' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    alert(`Fichier trop volumineux (max ${maxSize / (1024 * 1024)}MB)`);
                    return;
                }
                this.sendFileMessage(file);
            }
            input.remove();
        };
        
        document.body.appendChild(input);
        input.click();
    };
}

// Styles CSS pour les nouveaux panneaux
const chatFixesStyles = document.createElement('style');
chatFixesStyles.textContent = `
    .emoji-panel, .file-panel {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 1px solid rgba(0, 212, 255, 0.3);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        z-index: 10001 !important;
        max-width: 320px;
        max-height: 400px;
        overflow-y: auto;
        backdrop-filter: blur(10px);
        position: fixed !important;
    }
    
    .emoji-header, .file-header {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 212, 255, 0.1);
    }
    
    .emoji-header h4, .file-header h4 {
        margin: 0;
        color: #00d4ff;
        font-size: 14px;
    }
    
    .emoji-close, .file-close {
        background: none;
        border: none;
        color: #fff;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.2s;
    }
    
    .emoji-close:hover, .file-close:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .emoji-category {
        padding: 8px 12px;
    }
    
    .emoji-category h5 {
        margin: 0 0 8px 0;
        color: #888;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .emoji-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 4px;
    }
    
    .emoji-btn {
        background: none;
        border: none;
        font-size: 18px;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        aspect-ratio: 1;
    }
    
    .emoji-btn:hover {
        background: rgba(0, 212, 255, 0.2);
        transform: scale(1.2);
    }
    
    .file-options {
        padding: 12px;
    }
    
    .file-option {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 12px;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        color: white;
    }
    
    .file-option:hover {
        background: rgba(0, 212, 255, 0.1);
        border-color: rgba(0, 212, 255, 0.3);
        transform: translateY(-1px);
    }
    
    .file-icon {
        font-size: 24px;
        margin-right: 12px;
    }
    
    .file-label {
        font-weight: bold;
        margin-bottom: 2px;
    }
    
    .file-desc {
        font-size: 11px;
        color: #888;
        margin-left: auto;
    }
    
    /* Corrections mobile pour le clavier */
    .chat-window.keyboard-open {
        height: calc(100vh - 60px) !important;
        bottom: 0 !important;
    }
    
    .chat-window.keyboard-open .chat-input-area {
        position: sticky;
        bottom: 0;
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        z-index: 100;
    }
    
    .chat-window.keyboard-open .chat-messages {
        padding-bottom: 80px;
    }
    
    /* Améliorer le bouton d'envoi sur mobile */
    @media (max-width: 768px) {
        .send-btn {
            min-width: 44px !important;
            min-height: 44px !important;
            touch-action: manipulation;
        }
        
        .chat-input {
            font-size: 16px !important; /* Empêche le zoom sur iOS */
        }
        
        .input-container {
            padding: 8px 12px;
        }
        
        .emoji-panel, .file-panel {
            position: fixed !important;
            bottom: 80px !important;
            left: 10px !important;
            right: 10px !important;
            max-width: none !important;
        }
    }
    
    /* Animation pour les panneaux */
    .emoji-panel, .file-panel {
        animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(chatFixesStyles);

// Initialiser les boutons emoji
function initEmojiButtons() {
    const emojiBtn = document.getElementById('emojiBtn');
    if (emojiBtn) {
        emojiBtn.removeEventListener('click', showEmojiPanel); // Éviter les doublons
        emojiBtn.addEventListener('click', showEmojiPanel);
        console.log('😀 Bouton emoji initialisé');
    }
}

// Appliquer les corrections au chargement
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        fixMobileKeyboardIssue();
        initEmojiButtons();
        console.log('🔧 Corrections chat appliquées - Emojis, fichiers et mobile');
    }, 1000);
    
    // Réessayer plusieurs fois pour s'assurer que le bouton existe
    const retryInit = setInterval(() => {
        const emojiBtn = document.getElementById('emojiBtn');
        if (emojiBtn && !emojiBtn.hasAttribute('data-emoji-init')) {
            emojiBtn.setAttribute('data-emoji-init', 'true');
            emojiBtn.addEventListener('click', showEmojiPanel);
            console.log('😀 Bouton emoji initialisé (retry)');
            clearInterval(retryInit);
        }
    }, 500);
    
    // Arrêter les tentatives après 10 secondes
    setTimeout(() => clearInterval(retryInit), 10000);
});

// Appliquer les corrections si le chat existe déjà
if (window.iMessageChat) {
    fixMobileKeyboardIssue();
    initEmojiButtons();
    console.log('🔧 Corrections chat appliquées immédiatement');
}

// Observer pour détecter quand le chat est créé
const chatObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
                const emojiBtn = node.querySelector ? node.querySelector('#emojiBtn') : 
                                 (node.id === 'emojiBtn' ? node : null);
                if (emojiBtn && !emojiBtn.hasAttribute('data-emoji-init')) {
                    emojiBtn.setAttribute('data-emoji-init', 'true');
                    emojiBtn.addEventListener('click', showEmojiPanel);
                    console.log('😀 Bouton emoji détecté et initialisé');
                }
            }
        });
    });
});

// Observer le body pour détecter l'ajout du chat
chatObserver.observe(document.body, {
    childList: true,
    subtree: true
});