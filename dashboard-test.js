// Script de test pour le dashboard
console.log('=== DASHBOARD TEST SCRIPT ===');

// Test 1: Vérifier que les éléments HTML existent
function testHTMLElements() {
    console.log('Testing HTML elements...');
    
    const elements = [
        'newTradeBtn',
        'settingsBtn', 
        'closeTradeBtn',
        'resetBtn',
        'manualCloseBtn',
        'exportBtn',
        'calendarGrid',
        'monthYear',
        'prevMonth',
        'nextMonth'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ ${id} found`);
        } else {
            console.error(`❌ ${id} NOT found`);
        }
    });
}

// Test 2: Vérifier l'initialisation du dashboard
function testDashboardInit() {
    console.log('Testing dashboard initialization...');
    
    if (window.dashboard) {
        console.log('✅ Dashboard object exists');
        console.log('Dashboard methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.dashboard)));
    } else {
        console.error('❌ Dashboard object NOT found');
    }
}

// Test 3: Tester les boutons
function testButtons() {
    console.log('Testing buttons...');
    
    const newTradeBtn = document.getElementById('newTradeBtn');
    if (newTradeBtn) {
        console.log('✅ New Trade button found');
        console.log('Button onclick:', newTradeBtn.onclick);
        
        // Test du clic
        try {
            newTradeBtn.click();
            console.log('✅ Button click executed');
        } catch (error) {
            console.error('❌ Button click failed:', error);
        }
    }
}

// Exécuter les tests
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        testHTMLElements();
        testDashboardInit();
        testButtons();
    }, 1000);
});

// Test immédiat si DOM déjà chargé
if (document.readyState !== 'loading') {
    setTimeout(() => {
        testHTMLElements();
        testDashboardInit();
        testButtons();
    }, 1000);
}