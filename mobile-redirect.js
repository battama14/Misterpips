// Redirection automatique mobile vers mobile-dashboard2.html
(function() {
    // Vérifier si on est sur mobile et pas déjà sur la bonne page
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                    (window.innerWidth <= 768 && window.innerHeight <= 1024);
    
    const currentPage = window.location.pathname.split('/').pop();
    
    // Si on est sur mobile et sur vip-space.html, rediriger vers mobile-dashboard2.html
    if (isMobile && currentPage === 'vip-space.html') {
        console.log('📱 Redirection mobile détectée vers mobile-dashboard2.html');
        window.location.replace('mobile-dashboard2.html');
    }
    
    // Si on est sur desktop et sur mobile-dashboard2.html, rediriger vers vip-space.html
    if (!isMobile && currentPage === 'mobile-dashboard2.html') {
        console.log('💻 Redirection desktop détectée vers vip-space.html');
        window.location.replace('vip-space.html');
    }
})();