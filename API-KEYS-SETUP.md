# 🔑 Configuration des Clés API Gratuites

## Système Multi-API pour Prix Forex en Temps Réel

### 📊 APIs Disponibles (Toutes Gratuites)

#### 1. ExchangeRate-API ⭐ RECOMMANDÉE
- **Limite**: Illimitée
- **Inscription**: Aucune
- **URL**: https://exchangerate-api.com
- **Avantages**: Pas de clé requise, données fiables
- **Utilisation**: API principale par défaut

#### 2. Fixer.io
- **Limite**: 100 requêtes/mois
- **Inscription**: https://fixer.io/signup/free
- **Configuration**: 
  ```javascript
  // Dans multi-api-forex.js ligne 15
  key: 'VOTRE_CLE_FIXER'
  ```

#### 3. CurrencyAPI
- **Limite**: 300 requêtes/mois  
- **Inscription**: https://currencyapi.com/signup/free
- **Configuration**:
  ```javascript
  // Dans multi-api-forex.js ligne 22
  key: 'VOTRE_CLE_CURRENCY'
  ```

#### 4. Alpha Vantage (Backup)
- **Limite**: 25 requêtes/jour
- **Inscription**: https://www.alphavantage.co/support/#api-key
- **Configuration**:
  ```javascript
  // Dans multi-api-forex.js ligne 29
  key: 'VOTRE_CLE_ALPHA'
  ```

### ⚡ Configuration Rapide (2 minutes)

1. **Ouvrir le fichier**: `multi-api-forex.js`

2. **Remplacer les clés** (lignes 15, 22, 29):
   ```javascript
   key: 'YOUR_FIXER_KEY',     // → 'abc123def456'
   key: 'YOUR_CURRENCY_KEY',  // → 'xyz789uvw012'  
   key: 'YOUR_ALPHA_KEY',     // → 'mno345pqr678'
   ```

3. **Sauvegarder** et actualiser la page

### 🔄 Fonctionnement Automatique

- **Fréquence**: Mise à jour toutes les 2 minutes
- **Fallback**: Si une API échoue, passage automatique à la suivante
- **Offline**: Données de fallback réalistes si toutes les APIs échouent
- **Adaptation**: Fréquence réduite en cas d'échecs répétés

### 📈 Avantages du Système Multi-API

✅ **Fiabilité**: 4 sources de données  
✅ **Rapidité**: 2 minutes entre les mises à jour  
✅ **Gratuit**: Toutes les APIs sont gratuites  
✅ **Automatique**: Fallback sans intervention  
✅ **Résilience**: Fonctionne même si 3 APIs sur 4 échouent  

### 🎯 Recommandation

**Pour un usage optimal**:
1. Laisser ExchangeRate-API comme principale (pas de clé requise)
2. Configurer Fixer.io comme backup (100 req/mois)
3. Ajouter CurrencyAPI pour plus de fiabilité (300 req/mois)
4. Alpha Vantage en dernier recours (25 req/jour)

### 🔧 Dépannage

**Problème**: Pas de données affichées
**Solution**: Vérifier la console (F12) pour les erreurs d'API

**Problème**: Données qui ne se mettent pas à jour
**Solution**: Vérifier les limites de requêtes des APIs

**Problème**: Erreur "API Key manquante"
**Solution**: Remplacer 'YOUR_API_KEY' par votre vraie clé

### 📊 Monitoring

Le système affiche en temps réel:
- API actuellement utilisée
- Fréquence de mise à jour
- Dernière mise à jour réussie
- Statut de connexion

---
*Système créé pour garantir des données forex fiables 24/7* 🚀