// Console mobile visible sur iPhone
let mobileConsole = null;

function createMobileConsole() {
    if (mobileConsole) return;
    
    mobileConsole = document.createElement('div');
    mobileConsole.id = 'mobileConsole';
    mobileConsole.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 200px;
        background: rgba(0,0,0,0.9);
        color: #00ff00;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        overflow-y: auto;
        z-index: 9999;
        border-top: 2px solid #00ff00;
        transform: translateY(100%);
        transition: transform 0.3s;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        border-bottom: 1px solid #333;
        padding-bottom: 5px;
    `;
    header.innerHTML = `
        <span>📱 Console Mobile</span>
        <button onclick="toggleMobileConsole()" style="background: #333; color: white; border: none; padding: 5px 10px; border-radius: 3px;">Hide</button>
    `;
    
    const content = document.createElement('div');
    content.id = 'mobileConsoleContent';
    content.style.cssText = 'height: 150px; overflow-y: auto;';
    
    mobileConsole.appendChild(header);
    mobileConsole.appendChild(content);
    document.body.appendChild(mobileConsole);
}

function logToMobile(message, type = 'log') {
    if (!mobileConsole) createMobileConsole();
    
    const content = document.getElementById('mobileConsoleContent');
    const time = new Date().toLocaleTimeString();
    const colors = {
        log: '#00ff00',
        error: '#ff0000',
        warn: '#ffff00',
        info: '#00ffff'
    };
    
    const logEntry = document.createElement('div');
    logEntry.style.color = colors[type] || '#00ff00';
    logEntry.innerHTML = `[${time}] ${message}`;
    
    content.appendChild(logEntry);
    content.scrollTop = content.scrollHeight;
    
    // Limiter à 50 entrées
    if (content.children.length > 50) {
        content.removeChild(content.firstChild);
    }
}

window.toggleMobileConsole = function() {
    if (!mobileConsole) createMobileConsole();
    
    const isVisible = mobileConsole.style.transform === 'translateY(0px)';
    mobileConsole.style.transform = isVisible ? 'translateY(100%)' : 'translateY(0px)';
};

// Remplacer console.log
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = function(...args) {
    originalLog.apply(console, args);
    logToMobile(args.join(' '), 'log');
};

console.error = function(...args) {
    originalError.apply(console, args);
    logToMobile(args.join(' '), 'error');
};

console.warn = function(...args) {
    originalWarn.apply(console, args);
    logToMobile(args.join(' '), 'warn');
};

// Bouton flottant pour ouvrir la console
function createConsoleToggle() {
    const toggle = document.createElement('div');
    toggle.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #00ff00;
        color: black;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        cursor: pointer;
        z-index: 10000;
        font-size: 20px;
    `;
    toggle.innerHTML = '📱';
    toggle.onclick = toggleMobileConsole;
    document.body.appendChild(toggle);
}

// Initialiser
document.addEventListener('DOMContentLoaded', () => {
    createMobileConsole();
    createConsoleToggle();
    logToMobile('📱 Console mobile initialisée');
});