// Fix final pour mobile - Navigation et fonctionnalités
document.addEventListener('DOMContentLoaded', function() {
    // Navigation sections
    function showSection(sectionId) {
        // Masquer toutes les sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Afficher la section demandée
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Mettre à jour la navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Fermer le menu mobile
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.remove('open');
        }
    }
    
    // Navigation bottom
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            showSection(section);
        });
    });
    
    // Menu mobile
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.add('open');
        });
    }
    
    if (closeMenu) {
        closeMenu.addEventListener('click', function() {
            mobileMenu.classList.remove('open');
        });
    }
    
    // Modal trade
    const newTradeBtn = document.getElementById('newTradeBtn');
    const addTradeBtn = document.getElementById('addTradeBtn');
    const tradeModal = document.getElementById('tradeModal');
    const closeTradeModal = document.getElementById('closeTradeModal');
    const cancelTradeBtn = document.getElementById('cancelTradeBtn');
    
    function openTradeModal() {
        if (tradeModal) {
            tradeModal.style.display = 'flex';
        }
    }
    
    function closeModal() {
        if (tradeModal) {
            tradeModal.style.display = 'none';
        }
    }
    
    if (newTradeBtn) {
        newTradeBtn.addEventListener('click', openTradeModal);
    }
    
    if (addTradeBtn) {
        addTradeBtn.addEventListener('click', openTradeModal);
    }
    
    if (closeTradeModal) {
        closeTradeModal.addEventListener('click', closeModal);
    }
    
    if (cancelTradeBtn) {
        cancelTradeBtn.addEventListener('click', closeModal);
    }
    
    // Fermer modal en cliquant à l'extérieur
    if (tradeModal) {
        tradeModal.addEventListener('click', function(e) {
            if (e.target === tradeModal) {
                closeModal();
            }
        });
    }
    
    // Form trade
    const tradeForm = document.getElementById('tradeForm');
    if (tradeForm) {
        tradeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const tradeData = {
                pair: document.getElementById('tradePair').value,
                type: document.getElementById('tradeType').value,
                lot: parseFloat(document.getElementById('tradeLot').value),
                entry: parseFloat(document.getElementById('tradeEntry').value),
                tp: parseFloat(document.getElementById('tradeTp').value) || null,
                sl: parseFloat(document.getElementById('tradeSl').value) || null,
                result: parseFloat(document.getElementById('tradeResult').value),
                status: 'closed'
            };
            
            // Ajouter le trade via le système unifié
            if (window.mobileUnifiedSync) {
                const success = await window.mobileUnifiedSync.addUnifiedTrade(tradeData);
                if (success) {
                    console.log('✅ Trade unifié ajouté');
                    // Actualiser l'affichage
                    if (window.userManager) {
                        window.userManager.loadUserData();
                    }
                }
            }
            
            // Fermer modal et reset form
            closeModal();
            tradeForm.reset();
        });
    }
    
    // Expose showSection globally
    window.showSection = showSection;
    
    console.log('✅ Mobile final fix initialisé');
});