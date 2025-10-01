// Données historiques réelles des annonces économiques (saisies manuellement)
const HISTORICAL_DATA = {
    'USD': {
        'NFP': [],
        'CPI': [],
        'GDP': [],
        'RATE': []
    },
    'EUR': {
        'NFP': [],
        'CPI': [],
        'GDP': [],
        'RATE': []
    },
    'GBP': {
        'NFP': [],
        'CPI': [],
        'GDP': [],
        'RATE': []
    },
    'JPY': {
        'NFP': [],
        'CPI': [],
        'GDP': [],
        'RATE': []
    }
};

// Fonction pour ajouter une nouvelle donnée
function addHistoricalData(currency, announcement, result, consensus, previous) {
    const currentDate = new Date();
    const dateStr = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Calculer l'impact basé sur la surprise vs consensus
    const surprise = result - consensus;
    const momentum = (result - previous) / previous;
    const impact = (surprise * 0.1 + momentum * 0.05).toFixed(3);
    
    const newEntry = {
        date: dateStr,
        result: result,
        impact: parseFloat(impact)
    };
    
    // Ajouter à l'historique
    HISTORICAL_DATA[currency][announcement].push(newEntry);
    
    // Garder seulement les 12 derniers mois
    if (HISTORICAL_DATA[currency][announcement].length > 12) {
        HISTORICAL_DATA[currency][announcement].shift();
    }
    
    // Déclencher sauvegarde automatique
    if (typeof updateFirebaseStatus === 'function') {
        updateFirebaseStatus('🔄 Firebase: Sauvegarde...', false);
    }
    
    // Sauvegarder dans Firebase Realtime Database ET localStorage
    saveToFirebase();
    localStorage.setItem('historicalData', JSON.stringify(HISTORICAL_DATA));
}

// Fonction pour ajouter une donnée avec date personnalisée
function addHistoricalDataWithDate(currency, announcement, result, consensus, previous, customDate) {
    const dateStr = customDate.split('-')[0] + '-' + customDate.split('-')[1];
    
    const surprise = result - consensus;
    const momentum = (result - previous) / previous;
    const impact = (surprise * 0.1 + momentum * 0.05).toFixed(3);
    
    const newEntry = {
        date: dateStr,
        result: result,
        impact: parseFloat(impact)
    };
    
    HISTORICAL_DATA[currency][announcement].push(newEntry);
    
    if (typeof updateFirebaseStatus === 'function') {
        updateFirebaseStatus('🔄 Firebase: Sauvegarde...', false);
    }
    
    saveToFirebase();
    localStorage.setItem('historicalData', JSON.stringify(HISTORICAL_DATA));
}

// Sauvegarder dans Firebase Realtime Database
async function saveToFirebase() {
    try {
        // Vérifier que Firebase est prêt
        if (!window.firebaseDB || !window.dbRef || !window.dbSet) {
            console.log('🔄 Firebase pas encore prêt, sauvegarde locale seulement');
            if (typeof updateFirebaseStatus === 'function') {
                updateFirebaseStatus('🔴 Firebase: Non connecté', false);
            }
            return;
        }
        
        // Récupérer l'utilisateur connecté
        const firebaseUID = sessionStorage.getItem('firebaseUID');
        if (!firebaseUID) {
            if (typeof updateFirebaseStatus === 'function') {
                updateFirebaseStatus('🔴 Firebase: Non authentifié', false);
            }
            return;
        }
        
        // Sauvegarder les données
        const dataRef = window.dbRef(window.firebaseDB, `historicalData/${firebaseUID}`);
        await window.dbSet(dataRef, {
            data: HISTORICAL_DATA,
            lastUpdate: Date.now()
        });
        
        console.log('✅ Données sauvegardées dans Firebase Realtime');
        
        // Mettre à jour le statut
        if (typeof updateFirebaseStatus === 'function') {
            const now = new Date();
            updateFirebaseStatus(`🟢 Sauvegardé: ${now.toLocaleTimeString()}`, true);
        }
    } catch (error) {
        console.error('❌ Erreur sauvegarde Firebase:', error);
        if (typeof updateFirebaseStatus === 'function') {
            updateFirebaseStatus('🔴 Firebase: Erreur', false);
        }
    }
}

// Charger depuis Firebase Realtime Database
async function loadFromFirebase() {
    try {
        // Vérifier que Firebase est prêt
        if (!window.firebaseDB || !window.dbRef || !window.dbGet) {
            console.log('🔄 Firebase pas encore prêt');
            if (typeof updateFirebaseStatus === 'function') {
                updateFirebaseStatus('🔄 Firebase: Connexion...', false);
            }
            return false;
        }
        
        // Récupérer l'utilisateur connecté
        const firebaseUID = sessionStorage.getItem('firebaseUID');
        if (!firebaseUID) {
            if (typeof updateFirebaseStatus === 'function') {
                updateFirebaseStatus('🔴 Firebase: Non authentifié', false);
            }
            return false;
        }
        
        // Charger les données
        const dataRef = window.dbRef(window.firebaseDB, `historicalData/${firebaseUID}`);
        const snapshot = await window.dbGet(dataRef);
        
        if (snapshot.exists()) {
            const firebaseData = snapshot.val();
            Object.assign(HISTORICAL_DATA, firebaseData.data);
            console.log('✅ Données chargées depuis Firebase Realtime');
            
            // Afficher la dernière sauvegarde
            if (typeof updateFirebaseStatus === 'function' && firebaseData.lastUpdate) {
                const lastSave = new Date(firebaseData.lastUpdate);
                updateFirebaseStatus(`🟢 Dernière sync: ${lastSave.toLocaleTimeString()}`, true);
            }
            return true;
        } else {
            if (typeof updateFirebaseStatus === 'function') {
                updateFirebaseStatus('🟡 Firebase: Aucune donnée', true);
            }
        }
    } catch (error) {
        console.error('❌ Erreur chargement Firebase:', error);
        if (typeof updateFirebaseStatus === 'function') {
            updateFirebaseStatus('🔴 Firebase: Erreur', false);
        }
    }
    return false;
}

// Charger les données sauvegardées
async function loadHistoricalData() {
    // Essayer Firebase d'abord
    const firebaseLoaded = await loadFromFirebase();
    
    // Si Firebase échoue, utiliser localStorage
    if (!firebaseLoaded) {
        const saved = localStorage.getItem('historicalData');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(HISTORICAL_DATA, data);
            console.log('📱 Données chargées depuis localStorage');
            if (typeof updateFirebaseStatus === 'function') {
                updateFirebaseStatus('📱 Mode local', false);
            }
        } else {
            if (typeof updateFirebaseStatus === 'function') {
                updateFirebaseStatus('🆕 Nouvelles données', false);
            }
        }
    }
    
    // Démarrer la surveillance des modifications
    startAutoSaveWatcher();
}

// Surveiller les modifications pour déclencher la sauvegarde automatique
function startAutoSaveWatcher() {
    // Surveiller les changements dans les formulaires
    const forms = document.querySelectorAll('input, select, button');
    forms.forEach(element => {
        element.addEventListener('change', () => {
            setTimeout(() => {
                if (typeof triggerAutoSave === 'function') {
                    triggerAutoSave();
                }
            }, 1000); // Délai de 1 seconde pour éviter trop de sauvegardes
        });
    });
    
    // Sauvegarde périodique toutes les 5 minutes
    setInterval(() => {
        if (typeof triggerAutoSave === 'function') {
            triggerAutoSave();
        }
    }, 300000); // 5 minutes
}

// Fonction globale pour afficher l'historique
function updateHistoryChart() {
    const devise = document.getElementById('historyDevise')?.value || 'USD';
    const annonce = document.getElementById('historyAnnonce')?.value || 'NFP';
    const data = HISTORICAL_DATA[devise][annonce] || [];
    
    const chartContainer = document.getElementById('historyChart');
    if (!chartContainer) return;
    
    if (data.length === 0) {
        chartContainer.innerHTML = `
            <div class="no-data-message">
                <h4>📊 Aucune donnée historique</h4>
                <p>Commencez à saisir des données dans "Impact des Annonces Économiques" pour alimenter ce graphique.</p>
                <div class="data-info">
                    <div class="info-item">🔢 <strong>Étape 1:</strong> Saisissez les résultats réels</div>
                    <div class="info-item">📈 <strong>Étape 2:</strong> Cliquez sur "Analyser"</div>
                    <div class="info-item">💾 <strong>Étape 3:</strong> Les données sont automatiquement sauvegardées</div>
                    <div class="info-item">📊 <strong>Étape 4:</strong> Le graphique se met à jour en temps réel</div>
                </div>
            </div>
        `;
        return;
    }
    
    // Calculs statistiques
    const impacts = data.map(d => d.impact);
    const avgImpact = (impacts.reduce((a,b) => a+b, 0) / impacts.length).toFixed(3);
    const maxImpact = Math.max(...impacts).toFixed(3);
    const minImpact = Math.min(...impacts).toFixed(3);
    const volatility = Math.sqrt(impacts.reduce((a,b) => a + Math.pow(b - avgImpact, 2), 0) / impacts.length).toFixed(3);
    
    chartContainer.innerHTML = `
        <div class="beginner-guide">
            <h4>📊 Vos Données Réelles - ${data.length} mois d'historique</h4>
            <div class="guide-points">
                <div class="guide-item">🟢 <strong>Points verts :</strong> Impact positif (devise monte)</div>
                <div class="guide-item">🔴 <strong>Points rouges :</strong> Impact négatif (devise baisse)</div>
                <div class="guide-item">📈 <strong>Courbe :</strong> Tendance générale de vos données</div>
                <div class="guide-item">💾 <strong>Sauvegarde :</strong> Sync automatique Firebase</div>
            </div>
        </div>
        
        <div class="history-stats">
            <div class="stat-box">
                <span class="stat-icon">📊</span>
                <span class="stat-label">Impact Moyen</span>
                <span class="stat-value ${avgImpact > 0 ? 'positive' : 'negative'}">${avgImpact > 0 ? '+' : ''}${avgImpact}%</span>
                <span class="stat-help">Moyenne de vos ${data.length} analyses</span>
            </div>
            <div class="stat-box">
                <span class="stat-icon">⬆️</span>
                <span class="stat-label">Plus Fort Impact</span>
                <span class="stat-value positive">+${maxImpact}%</span>
                <span class="stat-help">Meilleur résultat enregistré</span>
            </div>
            <div class="stat-box">
                <span class="stat-icon">⬇️</span>
                <span class="stat-label">Plus Faible Impact</span>
                <span class="stat-value negative">${minImpact}%</span>
                <span class="stat-help">Pire résultat enregistré</span>
            </div>
            <div class="stat-box">
                <span class="stat-icon">🌊</span>
                <span class="stat-label">Volatilité</span>
                <span class="stat-value">±${volatility}%</span>
                <span class="stat-help">Variation typique observée</span>
            </div>
        </div>
        
        <div class="timeline-chart">
            <h4>📈 Évolution ${annonce} sur ${devise} - Vos Données Réelles</h4>
            <div class="chart-legend">
                <span class="legend-positive">📈 Impact Positif</span>
                <span class="legend-negative">📉 Impact Négatif</span>
                <span class="legend-line">━ Courbe</span>
            </div>
            <div class="line-chart">
                <svg width="100%" height="250" viewBox="0 0 800 250">
                    <defs>
                        <linearGradient id="positiveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#4ecdc4;stop-opacity:0.3" />
                            <stop offset="100%" style="stop-color:#4ecdc4;stop-opacity:0" />
                        </linearGradient>
                        <linearGradient id="negativeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:0" />
                            <stop offset="100%" style="stop-color:#ff6b6b;stop-opacity:0.3" />
                        </linearGradient>
                    </defs>
                    
                    <!-- Grille -->
                    ${Array.from({length: 6}, (_, i) => `
                        <line x1="50" y1="${40 + i * 30}" x2="750" y2="${40 + i * 30}" 
                              stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                    `).join('')}
                    
                    <!-- Ligne zéro -->
                    <line x1="50" y1="125" x2="750" y2="125" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                    
                    ${data.length > 1 ? `
                    <!-- Zone positive -->
                    <path d="M 50,125 ${data.map((item, index) => {
                        const x = 50 + (700 * index / (data.length - 1));
                        const y = 125 - (item.impact / Math.max(Math.abs(maxImpact), Math.abs(minImpact))) * 80;
                        return `L ${x},${Math.min(y, 125)}`;
                    }).join(' ')} L 750,125 Z" fill="url(#positiveGrad)"/>
                    
                    <!-- Zone négative -->
                    <path d="M 50,125 ${data.map((item, index) => {
                        const x = 50 + (700 * index / (data.length - 1));
                        const y = 125 - (item.impact / Math.max(Math.abs(maxImpact), Math.abs(minImpact))) * 80;
                        return `L ${x},${Math.max(y, 125)}`;
                    }).join(' ')} L 750,125 Z" fill="url(#negativeGrad)"/>
                    
                    <!-- Courbe principale -->
                    <path d="M ${data.map((item, index) => {
                        const x = 50 + (700 * index / (data.length - 1));
                        const y = 125 - (item.impact / Math.max(Math.abs(maxImpact), Math.abs(minImpact))) * 80;
                        return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
                    }).join(' ')}" 
                    stroke="#00d4ff" stroke-width="3" fill="none"/>
                    ` : ''}
                    
                    <!-- Points -->
                    ${data.map((item, index) => {
                        const x = data.length === 1 ? 400 : 50 + (700 * index / (data.length - 1));
                        const y = 125 - (item.impact / Math.max(Math.abs(maxImpact), Math.abs(minImpact))) * 80;
                        return `
                            <circle cx="${x}" cy="${y}" r="5" 
                                    fill="${item.impact > 0 ? '#4ecdc4' : '#ff6b6b'}" 
                                    stroke="white" stroke-width="2">
                                <title>📅 ${item.date} - 📊 ${item.result}% - 💹 ${item.impact > 0 ? '+' : ''}${item.impact}%</title>
                            </circle>
                            <text x="${x}" y="${y - 12}" text-anchor="middle" 
                                  fill="white" font-size="10" font-weight="bold">
                                ${item.impact > 0 ? '+' : ''}${item.impact}%
                            </text>
                            <text x="${x}" y="240" text-anchor="middle" 
                                  fill="rgba(255,255,255,0.7)" font-size="9" 
                                  transform="rotate(-45 ${x} 240)">
                                ${item.date}
                            </text>
                        `;
                    }).join('')}
                    
                    <!-- Labels Y -->
                    <text x="45" y="45" text-anchor="end" fill="white" font-size="12">+${maxImpact}%</text>
                    <text x="45" y="130" text-anchor="end" fill="white" font-size="12">0%</text>
                    <text x="45" y="210" text-anchor="end" fill="white" font-size="12">${minImpact}%</text>
                </svg>
            </div>
            
            <div class="chart-table">
                <h5>📋 Vos Données Saisies</h5>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>📅 Mois</th>
                            <th>📊 Résultat</th>
                            <th>💹 Impact</th>
                            <th>📈 Tendance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr class="${item.impact > 0 ? 'positive-row' : 'negative-row'}">
                                <td><strong>${item.date}</strong></td>
                                <td>${item.result}%</td>
                                <td class="impact-cell ${item.impact > 0 ? 'positive' : 'negative'}">
                                    ${item.impact > 0 ? '📈 +' : '📉 '}${Math.abs(item.impact)}%
                                </td>
                                <td>${item.impact > 0 ? '🟢 Hausse' : '🔴 Baisse'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="trend-analysis">
            <h5>🔮 Analyse de Vos Données</h5>
            <div class="simple-analysis">
                <div class="analysis-item">
                    <span class="analysis-icon">${avgImpact > 0 ? '📈' : '📉'}</span>
                    <span class="analysis-text"><strong>Tendance générale :</strong> ${avgImpact > 0 ? 'HAUSSIÈRE (vos données montrent souvent une hausse)' : 'BAISSIÈRE (vos données montrent souvent une baisse)'}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-icon">${volatility > 0.5 ? '🌊' : volatility > 0.3 ? '〰️' : '➖'}</span>
                    <span class="analysis-text"><strong>Stabilité :</strong> ${volatility > 0.5 ? 'TRÈS VOLATILE (gros mouvements dans vos données)' : volatility > 0.3 ? 'MODÉRÉMENT VOLATILE (mouvements moyens)' : 'PEU VOLATILE (petits mouvements)'}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-icon">🎯</span>
                    <span class="analysis-text"><strong>Prédiction :</strong> Basé sur vos ${data.length} analyses, la prochaine annonce ${annonce} devrait impacter ${devise} d'environ ${avgImpact}% (±${volatility}%)</span>
                </div>
            </div>
        </div>
    `;
}

// Attendre que Firebase soit initialisé
setTimeout(() => {
    loadHistoricalData();
}, 2000);