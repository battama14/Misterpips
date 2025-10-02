// Helper pour récupérer la date locale du système
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Exposer globalement
window.getTodayDate = getTodayDate;

console.log('📅 Date helper chargé - Date du jour:', getTodayDate());