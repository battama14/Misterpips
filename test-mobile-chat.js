// Test Chat Mobile - Diagnostic
console.log('🧪 Test Chat Mobile démarré...');

function testMobileChat() {
    console.log('=== DIAGNOSTIC CHAT MOBILE ===');
    
    // 1. Vérifier les éléments DOM
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    console.log('📋 Éléments DOM:');
    console.log('- chatMessages:', chatMessages ? '✅ Trouvé' : '❌ Manquant');
    console.log('- chatInput:', chatInput ? '✅ Trouvé' : '❌ Manquant');
    console.log('- sendBtn:', sendBtn ? '✅ Trouvé' : '❌ Manquant');
    
    if (chatMessages) {
        console.log('- Container style:', window.getComputedStyle(chatMessages).display);
        console.log('- Container height:', window.getComputedStyle(chatMessages).height);
        console.log('- Messages count:', chatMessages.children.length);
    }
    
    // 2. Vérifier Firebase
    console.log('🔥 Firebase:');
    console.log('- firebaseDB:', window.firebaseDB ? '✅ Connecté' : '❌ Non connecté');
    console.log('- dbRef:', window.dbRef ? '✅ Disponible' : '❌ Manquant');
    console.log('- push:', window.push ? '✅ Disponible' : '❌ Manquant');
    console.log('- onValue:', window.onValue ? '✅ Disponible' : '❌ Manquant');
    
    // 3. Vérifier les données utilisateur
    console.log('👤 Utilisateur:');
    console.log('- UID:', sessionStorage.getItem('firebaseUID') || 'Non défini');
    console.log('- Email:', sessionStorage.getItem('userEmail') || 'Non défini');
    console.log('- Nickname:', sessionStorage.getItem('userNickname') || 'Non défini');
    
    // 4. Test d'envoi de message
    if (chatMessages && window.mobileChatFix) {
        console.log('📤 Test envoi message...');
        
        const testMessage = {
            id: 'test_' + Date.now(),
            userId: 'test_user',
            nickname: 'Test Bot',
            message: '🧪 Message de test - ' + new Date().toLocaleTimeString(),
            timestamp: Date.now(),
            type: 'text'
        };
        
        window.mobileChatFix.displayMessage(testMessage, false);
        console.log('✅ Message de test ajouté');
    }
    
    // 5. Vérifier les styles CSS
    console.log('🎨 Styles CSS:');
    if (chatMessages) {
        const styles = window.getComputedStyle(chatMessages);
        console.log('- Display:', styles.display);
        console.log('- Visibility:', styles.visibility);
        console.log('- Opacity:', styles.opacity);
        console.log('- Height:', styles.height);
        console.log('- Overflow-Y:', styles.overflowY);
    }
    
    console.log('=== FIN DIAGNOSTIC ===');
}

// Fonction pour ajouter un message de test
function addTestMessage() {
    if (window.mobileChatFix) {
        const testMsg = {
            id: 'manual_test_' + Date.now(),
            userId: 'test_user',
            nickname: 'Test Manual',
            message: '✋ Message de test manuel - ' + new Date().toLocaleTimeString(),
            timestamp: Date.now(),
            type: 'text'
        };
        
        window.mobileChatFix.displayMessage(testMsg, false);
        console.log('✅ Message de test manuel ajouté');
    } else {
        console.log('❌ mobileChatFix non disponible');
    }
}

// Fonction pour vider le chat
function clearChat() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
        console.log('🧹 Chat vidé');
    }
}

// Fonction pour activer le mode debug
function enableDebugMode() {
    document.body.classList.add('debug-chat');
    console.log('🐛 Mode debug activé - bordures visibles');
}

// Exposer les fonctions globalement
window.testMobileChat = testMobileChat;
window.addTestMessage = addTestMessage;
window.clearChat = clearChat;
window.enableDebugMode = enableDebugMode;

// Test automatique après chargement
setTimeout(() => {
    testMobileChat();
}, 5000);

console.log('🧪 Fonctions de test disponibles:');
console.log('- testMobileChat() : Diagnostic complet');
console.log('- addTestMessage() : Ajouter un message de test');
console.log('- clearChat() : Vider le chat');
console.log('- enableDebugMode() : Activer les bordures de debug');