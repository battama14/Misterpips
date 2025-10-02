// Fix viewport mobile pour éviter le défilement horizontal
document.addEventListener('DOMContentLoaded', function() {
    // Forcer la largeur à 100vw
    document.body.style.width = '100vw';
    document.body.style.maxWidth = '100vw';
    document.body.style.overflowX = 'hidden';
    
    // Empêcher le zoom sur les inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(function(input) {
        input.style.fontSize = '16px';
    });
    
    // Ajuster le viewport si nécessaire
    let viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0');
    }
    
    console.log('✅ Viewport mobile fixé');
});