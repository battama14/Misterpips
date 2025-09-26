# Configuration API pour Planning Forex

## API Alpha Vantage (Gratuite)

### 1. Obtenir une clé API gratuite
1. Allez sur : https://www.alphavantage.co/support/#api-key
2. Inscrivez-vous gratuitement
3. Récupérez votre clé API

### 2. Configuration
Dans `planning-forex.html`, ligne 348, remplacez :
```javascript
const API_KEY = 'demo'; // Remplacer par votre clé Alpha Vantage gratuite
```

Par :
```javascript
const API_KEY = 'VOTRE_CLE_API_ICI';
```

### 3. Limites de l'API gratuite
- 5 appels par minute
- 500 appels par jour
- Données en temps réel avec léger délai

### 4. Alternative : API Fixer.io
Si Alpha Vantage ne fonctionne pas, vous pouvez utiliser Fixer.io :
1. Inscription gratuite : https://fixer.io/
2. 100 requêtes/mois gratuites
3. Remplacer l'URL dans le code

### 5. Mode Démonstration
Sans clé API, le système utilise des données de démonstration réalistes mais statiques.

## Fonctionnalités avec API réelle :
✅ Prix en temps réel (EUR/USD, GBP/USD, USD/JPY, AUD/USD)
✅ Corrélations calculées sur données réelles
✅ Tendances basées sur mouvements de prix réels
✅ Mise à jour automatique toutes les 5 minutes
✅ Affichage des variations de prix

## Sans API :
⚠️ Données de démonstration réalistes mais fixes
⚠️ Pas de mise à jour en temps réel