// Fix simple pour les emojis PC
console.log('🔧 Chargement fix emojis simple...');

// Emojis de base
const quickEmojis = ['😀','😂','❤️','👍','🔥','💯','🚀','💰','📈','🎯','😎','🤑','💪','🏆','✨','⚡','🌟','🎉','👑','💎'];

// Créer le panneau simple
function createSimpleEmojiPanel() {
    const panel = document.createElement('div');
    panel.id = 'simpleEmojiPanel';
    panel.style.cssText = `
        position: fixed;
        background: #1a1a2e;
        border: 2px solid #00d4ff;
        border-radius: 10px;
        padding: 15px;
        z-index: 99999;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.8);
    `;
    
    quickEmojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.textContent = emoji;
        btn.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            padding: 8px;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.2s;
        `;
        btn.onmouseover = () => btn.style.background = 'rgba(0,212,255,0.3)';
        btn.onmouseout = () => btn.style.background = 'none';
        btn.onclick = () => {
            const input = document.getElementById('chatInput');
            if (input) {
                input.value += emoji;
                input.focus();
                input.dispatchEvent(new Event('input'));
            }
            panel.remove();
        };
        panel.appendChild(btn);
    });
    
    return panel;
}

// Fonction principale
function showSimpleEmojis() {
    // Supprimer panneau existant
    const existing = document.getElementById('simpleEmojiPanel');
    if (existing) {
        existing.remove();
        return;
    }
    
    const panel = createSimpleEmojiPanel();
    document.body.appendChild(panel);
    
    // Positionner près du bouton emoji
    const emojiBtn = document.getElementById('emojiBtn');
    if (emojiBtn) {
        const rect = emojiBtn.getBoundingClientRect();
        panel.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
        panel.style.right = (window.innerWidth - rect.right) + 'px';
    } else {
        panel.style.bottom = '100px';
        panel.style.right = '20px';
    }
    
    // Fermer en cliquant ailleurs
    setTimeout(() => {
        document.addEventListener('click', function closePanel(e) {
            if (!panel.contains(e.target) && e.target.id !== 'emojiBtn') {
                panel.remove();
                document.removeEventListener('click', closePanel);
            }
        });
    }, 100);
}

// Attacher au bouton emoji - méthode brutale
function attachEmojiButton() {
    const emojiBtn = document.getElementById('emojiBtn');
    if (emojiBtn) {
        // Supprimer tous les anciens listeners
        emojiBtn.onclick = null;
        emojiBtn.removeAttribute('onclick');
        
        // Supprimer l'ancienne fonction du chat
        if (window.iMessageChat && window.iMessageChat.toggleEmojiPanel) {
            window.iMessageChat.toggleEmojiPanel = () => {};
        }
        
        // Ajouter le nouveau listener en premier
        emojiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showSimpleEmojis();
        }, true); // Capture phase
        
        console.log('✅ Bouton emoji attaché');
        return true;
    }
    return false;
}

// Essayer d'attacher immédiatement
if (attachEmojiButton()) {
    console.log('✅ Emoji fix appliqué immédiatement');
} else {
    // Réessayer toutes les 500ms
    const interval = setInterval(() => {
        if (attachEmojiButton()) {
            clearInterval(interval);
            console.log('✅ Emoji fix appliqué avec délai');
        }
    }, 500);
    
    // Arrêter après 10 secondes
    setTimeout(() => clearInterval(interval), 10000);
}

// Observer pour nouveaux éléments
const observer = new MutationObserver(() => {
    const emojiBtn = document.getElementById('emojiBtn');
    if (emojiBtn && !emojiBtn.hasAttribute('data-simple-emoji')) {
        emojiBtn.setAttribute('data-simple-emoji', 'true');
        attachEmojiButton();
    }
});

observer.observe(document.body, { childList: true, subtree: true });

console.log('🎭 Fix emojis simple chargé');