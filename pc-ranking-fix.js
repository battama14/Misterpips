// Fix classement PC uniquement
setTimeout(() => {
    if (window.showRankingNow && !window.location.href.includes('mobile')) {
        console.log('🏆 Lancement classement PC...');
        window.showRankingNow();
        
        // Relancer toutes les 30 secondes
        setInterval(() => {
            if (window.showRankingNow) {
                window.showRankingNow();
            }
        }, 30000);
    }
}, 3000);

console.log('🖥️ Fix classement PC chargé');