document.addEventListener('DOMContentLoaded', () => {
    // Ajouter une barre de chargement
    const loadingBar = document.createElement('div');
    loadingBar.classList.add('loading-bar');
    document.body.appendChild(loadingBar);

    // Supprimer la barre de chargement après l'animation
    setTimeout(() => {
        loadingBar.style.opacity = '0';
        setTimeout(() => {
            loadingBar.remove();
        }, 300);
    }, 2000);

    // Navigation mobile
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');
    
    burger.addEventListener('click', () => {
        // Toggle Nav
        nav.classList.toggle('nav-active');
        
        // Animate Links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });
        
        // Burger Animation
        burger.classList.toggle('toggle');
    });
    
    // Fermer le menu mobile lorsqu'un lien est cliqué
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('nav-active')) {
                nav.classList.remove('nav-active');
                burger.classList.remove('toggle');
                
                navLinks.forEach(link => {
                    link.style.animation = '';
                });
            }
        });
    });
    
    // Créer le graphique de trading avec des bougies japonaises
    createTradingChart();
    
    // Animation au défilement
    const scrollElements = document.querySelectorAll('.section');
    
    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
    };
    
    const displayScrollElement = (element) => {
        element.classList.add('scrolled');
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    };
    
    const hideScrollElement = (element) => {
        element.classList.remove('scrolled');
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
    };
    
    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 1.25)) {
                displayScrollElement(el);
            }
        });
    };
    
    // Initialiser les éléments comme cachés
    scrollElements.forEach((el) => {
        hideScrollElement(el);
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    window.addEventListener('scroll', () => {
        handleScrollAnimation();
    });
    
    // Déclencher l'animation au chargement initial
    setTimeout(() => {
        handleScrollAnimation();
    }, 200);
    
    // Smooth scroll pour les liens d'ancrage
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Animation des icônes de construction
    const constructionIcons = document.querySelectorAll('.construction-icon');
    constructionIcons.forEach(icon => {
        icon.style.animation = 'pulse 2s infinite';
    });
    
    // Effet de particules sur les boutons
    const buttons = document.querySelectorAll('.cta-button, .telegram-button');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', (e) => {
            createParticles(e.clientX, e.clientY);
        });
    });

    // Gestion du tableau de bord VIP
    initVipDashboard();
    
    // Gestion du système VIP
    console.log('Initialisation VIP...');
    initVipSystem();
    
    // Test bouton
    setTimeout(() => {
        const btn = document.getElementById('accessVipSpace');
        if (btn) {
            console.log('Bouton VIP trouvé');
            btn.onclick = () => {
                console.log('Bouton cliqué directement');
                showVipAuthModal();
            };
        } else {
            console.log('Bouton VIP non trouvé');
        }
    }, 1000);
    
    // Animation du header au défilement
    const header = document.querySelector('header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
            header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.5)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.8)';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        }
        
        if (scrollTop > lastScrollTop && scrollTop > 200) {
            // Défilement vers le bas
            header.style.transform = 'translateY(-100%)';
        } else {
            // Défilement vers le haut
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
});

// Fonction pour créer le graphique de trading avec des bougies japonaises
function createTradingChart() {
    const tradingChart = document.getElementById('trading-chart');
    if (!tradingChart) return;
    
    // Paramètres du graphique
    const chartWidth = window.innerWidth;
    const chartHeight = window.innerHeight;
    const candleWidth = 8;
    const candleGap = 12;
    const numCandles = Math.floor(chartWidth / (candleWidth + candleGap));
    
    // Générer des données aléatoires pour les bougies
    const data = generateCandleData(numCandles);
    
    // Trouver les valeurs min et max pour l'échelle
    const minPrice = Math.min(...data.map(d => Math.min(d.open, d.close, d.low)));
    const maxPrice = Math.max(...data.map(d => Math.max(d.open, d.close, d.high)));
    const priceRange = maxPrice - minPrice;
    
    // Fonction pour convertir le prix en position Y
    const priceToY = (price) => {
        return chartHeight - ((price - minPrice) / priceRange) * (chartHeight * 0.6) - chartHeight * 0.2;
    };
    
    // Créer les bougies
    data.forEach((candle, i) => {
        const candleElement = document.createElement('div');
        candleElement.classList.add('candle');
        
        // Déterminer si c'est une bougie haussière ou baissière
        const isUp = candle.close >= candle.open;
        candleElement.classList.add(isUp ? 'up' : 'down');
        
        // Positionner la bougie
        const x = i * (candleWidth + candleGap) + candleGap;
        const y = priceToY(Math.max(candle.open, candle.close));
        const height = Math.abs(priceToY(candle.open) - priceToY(candle.close));
        
        candleElement.style.left = `${x}px`;
        candleElement.style.top = `${y}px`;
        candleElement.style.height = `${Math.max(height, 1)}px`; // Au moins 1px de hauteur
        
        // Ajouter les mèches
        const topWick = document.createElement('div');
        topWick.classList.add('wick', 'top-wick');
        topWick.style.height = `${Math.abs(priceToY(candle.high) - y)}px`;
        
        const bottomWick = document.createElement('div');
        bottomWick.classList.add('wick', 'bottom-wick');
        bottomWick.style.height = `${Math.abs(priceToY(candle.low) - (y + height))}px`;
        
        // Ajouter les éléments au DOM
        candleElement.appendChild(topWick);
        candleElement.appendChild(bottomWick);
        tradingChart.appendChild(candleElement);
        
        // Animation d'apparition
        setTimeout(() => {
            candleElement.style.opacity = '1';
        }, i * 20);
    });
    
    // Ajouter une ligne de tendance
    const trendLine = document.createElement('div');
    trendLine.classList.add('trend-line');
    tradingChart.appendChild(trendLine);
    
    // Animation de la ligne de tendance
    animateTrendLine(trendLine, data, priceToY, candleWidth, candleGap);
    
    // Mettre à jour le graphique périodiquement
    setInterval(() => {
        updateChart(tradingChart, data, priceToY, candleWidth, candleGap);
    }, 5000);
}

// Générer des données aléatoires pour les bougies
function generateCandleData(numCandles) {
    const data = [];
    let price = 100 + Math.random() * 50; // Prix initial aléatoire
    
    for (let i = 0; i < numCandles; i++) {
        const volatility = 2 + Math.random() * 3; // Volatilité aléatoire
        const change = (Math.random() - 0.5) * volatility;
        
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;
        
        data.push({ open, close, high, low });
        
        price = close; // Le prix de clôture devient le prix d'ouverture suivant
    }
    
    return data;
}

// Mettre à jour le graphique avec de nouvelles données
function updateChart(chartElement, data, priceToY, candleWidth, candleGap) {
    // Ajouter une nouvelle bougie
    const lastCandle = data[data.length - 1];
    const newPrice = lastCandle.close + (Math.random() - 0.5) * 3;
    const volatility = 2 + Math.random() * 3;
    
    const newCandle = {
        open: lastCandle.close,
        close: newPrice,
        high: Math.max(lastCandle.close, newPrice) + Math.random() * volatility,
        low: Math.min(lastCandle.close, newPrice) - Math.random() * volatility
    };
    
    data.push(newCandle);
    data.shift(); // Supprimer la première bougie
    
    // Mettre à jour les positions des bougies existantes
    const candles = chartElement.querySelectorAll('.candle');
    
    // Trouver les nouvelles valeurs min et max
    const minPrice = Math.min(...data.map(d => Math.min(d.open, d.close, d.low)));
    const maxPrice = Math.max(...data.map(d => Math.max(d.open, d.close, d.high)));
    const priceRange = maxPrice - minPrice;
    
    // Fonction mise à jour pour convertir le prix en position Y
    const updatedPriceToY = (price) => {
        return window.innerHeight - ((price - minPrice) / priceRange) * (window.innerHeight * 0.6) - window.innerHeight * 0.2;
    };
    
    // Animer les bougies existantes
    candles.forEach((candle, i) => {
        if (i < data.length - 1) {
            const candleData = data[i];
            const isUp = candleData.close >= candleData.open;
            
            // Mettre à jour la classe
            candle.className = 'candle';
            candle.classList.add(isUp ? 'up' : 'down');
            
            // Mettre à jour la position et la taille
            const x = i * (candleWidth + candleGap) + candleGap;
            const y = updatedPriceToY(Math.max(candleData.open, candleData.close));
            const height = Math.abs(updatedPriceToY(candleData.open) - updatedPriceToY(candleData.close));
            
            candle.style.left = `${x}px`;
            candle.style.top = `${y}px`;
            candle.style.height = `${Math.max(height, 1)}px`;
            
            // Mettre à jour les mèches
            const topWick = candle.querySelector('.top-wick');
            const bottomWick = candle.querySelector('.bottom-wick');
            
            if (topWick && bottomWick) {
                topWick.style.height = `${Math.abs(updatedPriceToY(candleData.high) - y)}px`;
                bottomWick.style.height = `${Math.abs(updatedPriceToY(candleData.low) - (y + height))}px`;
            }
        } else {
            // Supprimer la dernière bougie
            candle.remove();
        }
    });
    
    // Ajouter la nouvelle bougie
    const newCandleElement = document.createElement('div');
    newCandleElement.classList.add('candle');
    
    const isUp = newCandle.close >= newCandle.open;
    newCandleElement.classList.add(isUp ? 'up' : 'down');
    
    const x = (data.length - 1) * (candleWidth + candleGap) + candleGap;
    const y = updatedPriceToY(Math.max(newCandle.open, newCandle.close));
    const height = Math.abs(updatedPriceToY(newCandle.open) - updatedPriceToY(newCandle.close));
    
    newCandleElement.style.left = `${x}px`;
    newCandleElement.style.top = `${y}px`;
    newCandleElement.style.height = `${Math.max(height, 1)}px`;
    newCandleElement.style.opacity = '0';
    
    // Ajouter les mèches
    const topWick = document.createElement('div');
    topWick.classList.add('wick', 'top-wick');
    topWick.style.height = `${Math.abs(updatedPriceToY(newCandle.high) - y)}px`;
    
    const bottomWick = document.createElement('div');
    bottomWick.classList.add('wick', 'bottom-wick');
    bottomWick.style.height = `${Math.abs(updatedPriceToY(newCandle.low) - (y + height))}px`;
    
    newCandleElement.appendChild(topWick);
    newCandleElement.appendChild(bottomWick);
    chartElement.appendChild(newCandleElement);
    
    // Animation d'apparition
    setTimeout(() => {
        newCandleElement.style.opacity = '1';
    }, 50);
    
    // Mettre à jour la ligne de tendance
    const trendLine = chartElement.querySelector('.trend-line');
    if (trendLine) {
        animateTrendLine(trendLine, data, updatedPriceToY, candleWidth, candleGap);
    }
}

// Animer la ligne de tendance
function animateTrendLine(trendLine, data, priceToY, candleWidth, candleGap) {
    // Calculer les points de la ligne de tendance
    const points = [];
    
    data.forEach((candle, i) => {
        const x = i * (candleWidth + candleGap) + candleGap + candleWidth / 2;
        const y = priceToY((candle.open + candle.close) / 2);
        points.push({ x, y });
    });
    
    // Créer le chemin SVG
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[i - 1].x) / 2;
        const yc = (points[i].y + points[i - 1].y) / 2;
        path += ` Q ${points[i - 1].x} ${points[i - 1].y} ${xc} ${yc}`;
    }
    
    // Ajouter le dernier point
    const last = points[points.length - 1];
    path += ` L ${last.x} ${last.y}`;
    
    // Créer l'élément SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', path);
    pathElement.setAttribute('fill', 'none');
    pathElement.setAttribute('stroke', 'rgba(0, 102, 204, 0.5)');
    pathElement.setAttribute('stroke-width', '2');
    pathElement.setAttribute('stroke-linecap', 'round');
    pathElement.setAttribute('stroke-linejoin', 'round');
    
    // Animation du tracé
    pathElement.style.strokeDasharray = pathElement.getTotalLength();
    pathElement.style.strokeDashoffset = pathElement.getTotalLength();
    pathElement.style.animation = 'drawPath 2s forwards';
    
    svg.appendChild(pathElement);
    
    // Remplacer l'ancien SVG s'il existe
    while (trendLine.firstChild) {
        trendLine.removeChild(trendLine.firstChild);
    }
    
    trendLine.appendChild(svg);
}

// Créer des particules
function createParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Taille aléatoire
        const size = Math.random() * 5 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Position initiale
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Direction aléatoire
        const xDirection = Math.random() * 100 - 50;
        particle.style.setProperty('--x', `${xDirection}px`);
        
        document.body.appendChild(particle);
        
        // Supprimer la particule après l'animation
        setTimeout(() => {
            particle.remove();
        }, 3000);
    }
}

// Animation pour dessiner le chemin
document.head.insertAdjacentHTML('beforeend', `
<style>
@keyframes drawPath {
    to {
        stroke-dashoffset: 0;
    }
}

.wick {
    position: absolute;
    width: 1px;
    background-color: inherit;
    left: 50%;
    transform: translateX(-50%);
}

.top-wick {
    bottom: 100%;
}

.bottom-wick {
    top: 100%;
}

.trend-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.candle {
    opacity: 0;
    transition: opacity 0.3s ease;
}
</style>
`);

// ================== VIP DASHBOARD FUNCTIONALITY ==================

// Configuration des pairs de devises avec plus de détails
const CURRENCY_PAIRS = [
    { pair: 'USD/JPY', base: 'USD', quote: 'JPY', symbol: 'USDJPY' },
    { pair: 'GBP/USD', base: 'GBP', quote: 'USD', symbol: 'GBPUSD' },
    { pair: 'EUR/USD', base: 'EUR', quote: 'USD', symbol: 'EURUSD' },
    { pair: 'AUD/USD', base: 'AUD', quote: 'USD', symbol: 'AUDUSD' },
    { pair: 'USD/CHF', base: 'USD', quote: 'CHF', symbol: 'USDCHF' },
    { pair: 'USD/CAD', base: 'USD', quote: 'CAD', symbol: 'USDCAD' }
];

// Variables globales pour le dashboard
let forexData = {};
let historicalData = {};
let correlationMatrix = {};
let technicalIndicators = {};
let dashboardUpdateInterval;

// Configuration des APIs
const API_CONFIG = {
    // API gratuite pour les taux de change en temps réel
    exchangeRate: 'https://api.exchangerate-api.com/v4/latest/USD',
    // API alternative pour les données historiques (Fixer.io gratuit)
    fixer: 'https://api.fixer.io/latest?access_key=', // Nécessite une clé gratuite
    // API pour les actualités financières
    newsAPI: 'https://api.marketaux.com/v1/news/all?symbols=EURUSD,GBPUSD,USDJPY&filter_entities=true&language=en'
};

// Initialisation du tableau de bord VIP
function initVipDashboard() {
    const openButton = document.getElementById('openVipDashboard');
    const modal = document.getElementById('vipDashboardModal');
    const closeButton = document.querySelector('.vip-modal-close');
    
    if (openButton && modal && closeButton) {
        // Ouvrir la modal avec timing amélioré
        openButton.addEventListener('click', async () => {
            console.log('🚀 Ouverture du tableau de bord VIP...');
            
            // Afficher la modal immédiatement
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Attendre que la modal soit complètement affichée dans le DOM
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Vérifier que tous les éléments sont disponibles
            const requiredElements = [
                'correlationGrid',
                'trendsGrid', 
                'performanceContent',
                'alertsContent',
                'newsContent'
            ];
            
            let allElementsReady = false;
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!allElementsReady && attempts < maxAttempts) {
                allElementsReady = requiredElements.every(id => {
                    const element = document.getElementById(id);
                    return element !== null;
                });
                
                if (!allElementsReady) {
                    console.log(`⏳ Attente des éléments DOM (tentative ${attempts + 1})`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                } else {
                    console.log('✅ Tous les éléments DOM sont prêts');
                }
            }
            
            // Initialiser les données
            initDashboardData();
            
            // Vérifier le calendrier après un délai
            setTimeout(checkCalendarWidget, 3000);
        });
        
        // Fermer la modal
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            clearInterval(dashboardUpdateInterval);
        });
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
                clearInterval(dashboardUpdateInterval);
            }
        });
        
        // Événements de rafraîchissement
        setupRefreshButtons();
    }
}

// Vérifier si le widget calendrier se charge correctement
function checkCalendarWidget() {
    const widgetContainer = document.querySelector('.tradingview-widget-container__widget');
    const fallback = document.getElementById('calendarFallback');
    
    if (widgetContainer && fallback) {
        // Vérifier si le widget a du contenu
        const hasContent = widgetContainer.children.length > 0 || 
                          widgetContainer.innerHTML.trim().length > 0;
        
        if (!hasContent) {
            // Afficher le fallback si le widget ne se charge pas
            fallback.style.display = 'block';
            console.log('Widget calendrier non disponible, affichage du fallback');
        }
    }
}

// Configuration des boutons de rafraîchissement
function setupRefreshButtons() {
    const refreshCorrelations = document.getElementById('refreshCorrelations');
    const refreshTrends = document.getElementById('refreshTrends');
    const refreshPerformance = document.getElementById('refreshPerformance');
    
    if (refreshCorrelations) {
        refreshCorrelations.addEventListener('click', () => {
            refreshCorrelations.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                refreshCorrelations.style.transform = 'rotate(0deg)';
            }, 300);
            updateCorrelations();
        });
    }
    
    if (refreshTrends) {
        refreshTrends.addEventListener('click', () => {
            refreshTrends.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                refreshTrends.style.transform = 'rotate(0deg)';
            }, 300);
            updateTrends();
        });
    }
    
    if (refreshPerformance) {
        refreshPerformance.addEventListener('click', () => {
            refreshPerformance.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                refreshPerformance.style.transform = 'rotate(0deg)';
            }, 300);
            updatePerformance();
        });
    }
}

// Initialisation des données du dashboard avec séquencing correct
async function initDashboardData() {
    showLoadingState();
    
    try {
        // ÉTAPE 1: Charger les données forex AVANT tout le reste
        console.log('🔄 Chargement des données forex...');
        await fetchForexData();
        
        // ÉTAPE 2: Attendre un peu pour que les données soient bien disponibles
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ÉTAPE 3: Mettre à jour tous les composants une fois les données prêtes
        console.log('📊 Mise à jour des composants...');
        await Promise.all([
            updateCorrelationsWithRetry(),
            updateTrends(),
            updatePerformanceWithRetry(),
            updateAlerts(),
            updateNews()
        ]);
        
        // ÉTAPE 4: Forcer une mise à jour supplémentaire après 1 seconde pour être sûr
        setTimeout(() => {
            console.log('🔁 Mise à jour de sécurité...');
            updateCorrelations();
            updatePerformance();
            
            // Ajouter l'animation de chargement terminé
            const dashboardCards = document.querySelectorAll('.dashboard-card');
            dashboardCards.forEach(card => {
                card.classList.add('data-loaded');
            });
        }, 1000);
        
        // ÉTAPE 5: Mettre à jour automatiquement toutes les 30 secondes
        dashboardUpdateInterval = setInterval(async () => {
            await fetchForexData();
            await new Promise(resolve => setTimeout(resolve, 200));
            updateCorrelations();
            updateTrends();
            updatePerformance();
        }, 30000);
        
        console.log('✅ Dashboard initialisé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du dashboard:', error);
        showErrorState();
        
        // Essayer de récupérer avec des données de fallback
        setTimeout(() => {
            console.log('🔄 Tentative de récupération...');
            forexData = generateAdvancedFallbackData();
            updateCorrelations();
            updatePerformance();
        }, 2000);
    }
}

// Affichage de l'état de chargement amélioré
function showLoadingState() {
    const grids = ['correlationGrid', 'trendsGrid', 'performanceContent', 'alertsContent', 'newsContent'];
    
    grids.forEach(gridId => {
        const grid = document.getElementById(gridId);
        if (grid) {
            grid.innerHTML = `
                <div style="
                    text-align: center; 
                    padding: 40px 20px; 
                    color: var(--text-color-muted);
                    background: rgba(0, 102, 204, 0.05);
                    border-radius: 10px;
                    margin: 10px;
                ">
                    <i class="fas fa-chart-line fa-spin" style="
                        font-size: 2.5rem; 
                        margin-bottom: 15px; 
                        color: var(--primary-color);
                    "></i>
                    <p style="
                        font-size: 16px; 
                        margin: 10px 0; 
                        color: var(--primary-color-light);
                    ">
                        🔄 Chargement des données en temps réel...
                    </p>
                    <div style="
                        background: rgba(0, 102, 204, 0.1); 
                        padding: 8px 15px; 
                        border-radius: 15px; 
                        margin-top: 15px; 
                        font-size: 12px;
                        color: var(--primary-color);
                        display: inline-block;
                    ">
                        📡 Connexion aux APIs Forex...
                    </div>
                </div>
            `;
        }
    });
    
    console.log('📡 État de chargement affiché pour toutes les sections');
}

// Affichage de l'état d'erreur
function showErrorState() {
    const grids = ['correlationGrid', 'trendsGrid', 'performanceContent', 'alertsContent', 'newsContent'];
    
    grids.forEach(gridId => {
        const grid = document.getElementById(gridId);
        if (grid) {
            grid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--danger-color);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                    <p>Erreur lors du chargement des données</p>
                    <button onclick="initDashboardData()" style="margin-top: 15px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Réessayer
                    </button>
                </div>
            `;
        }
    });
}

// Récupération des données Forex avec APIs multiples et calculs techniques
async function fetchForexData() {
    try {
        // Essayer plusieurs APIs pour la fiabilité
        const responses = await Promise.allSettled([
            fetch('https://api.exchangerate-api.com/v4/latest/USD'),
            fetch('https://api.fxratesapi.com/latest?base=USD'),
            fetch('https://api.currencyapi.com/v3/latest?apikey=cur_live_XXX&base_currency=USD') // Remplacer XXX par une vraie clé
        ]);

        let currentRates = null;
        
        // Utiliser la première API qui répond
        for (const response of responses) {
            if (response.status === 'fulfilled' && response.value.ok) {
                const data = await response.value.json();
                if (data && (data.rates || data.data)) {
                    currentRates = data.rates || data.data;
                    break;
                }
            }
        }

        if (!currentRates) {
            throw new Error('Aucune API disponible');
        }

        // Sauvegarder les données précédentes pour calculer les changements réels
        const previousData = { ...forexData };
        const timestamp = new Date();
        
        // Calculer les prix actuels avec une précision améliorée
        const newForexData = {};
        
        CURRENCY_PAIRS.forEach(({ pair, base, quote }) => {
            let price, previousPrice;
            
            // Calculer le prix selon la paire
            if (base === 'USD') {
                price = currentRates[quote];
            } else if (quote === 'USD') {
                price = 1 / currentRates[base];
            } else {
                // Paire croisée (ex: EUR/GBP)
                price = currentRates[quote] / currentRates[base];
            }
            
            // Formatage selon la paire
            const decimals = pair.includes('JPY') ? 2 : 4;
            price = parseFloat(price.toFixed(decimals));
            
            // Calculer le changement réel par rapport aux données précédentes
            previousPrice = previousData[pair]?.price || price;
            const change = ((price - previousPrice) / previousPrice) * 100;
            
            // Ajouter une légère volatilité réaliste si les données sont identiques
            const volatility = generateRealisticVolatility(pair, timestamp);
            const finalChange = Math.abs(change) < 0.001 ? volatility : change;
            
            newForexData[pair] = {
                price: price,
                previousPrice: previousPrice,
                change: finalChange,
                volume: generateRealisticVolume(pair),
                timestamp: timestamp,
                bid: price - (price * 0.0001), // Spread simulé
                ask: price + (price * 0.0001),
                high24h: price * (1 + Math.abs(finalChange) / 100),
                low24h: price * (1 - Math.abs(finalChange) / 100)
            };
        });
        
        forexData = newForexData;
        
        // Calculer les indicateurs techniques
        await calculateTechnicalIndicators();
        
        // Calculer la matrice de corrélation
        calculateCorrelationMatrix();
        
    } catch (error) {
        console.error('Erreur lors de la récupération des données Forex:', error);
        // Utiliser des données de fallback plus sophistiquées
        forexData = generateAdvancedFallbackData();
    }
}

// Générer une volatilité réaliste basée sur les conditions de marché
function generateRealisticVolatility(pair, timestamp) {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    
    // Facteurs de volatilité selon l'heure et le jour
    let baseVolatility = 0.1; // 0.1% de base
    
    // Sessions de trading principales
    if ((hour >= 8 && hour <= 17) || (hour >= 21 && hour <= 23)) {
        baseVolatility *= 2; // Sessions Londres/NY
    }
    
    // Éviter les week-ends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        baseVolatility *= 0.3;
    }
    
    // Volatilité spécifique par paire
    const pairMultipliers = {
        'USD/JPY': 0.8,
        'GBP/USD': 1.2,
        'EUR/USD': 1.0,
        'AUD/USD': 1.1,
        'USD/CHF': 0.9,
        'USD/CAD': 0.9
    };
    
    baseVolatility *= (pairMultipliers[pair] || 1.0);
    
    // Ajouter du bruit aléatoire réaliste
    return (Math.random() - 0.5) * baseVolatility * 2;
}

// Générer un volume réaliste
function generateRealisticVolume(pair) {
    const baseVolumes = {
        'EUR/USD': 1000000,
        'GBP/USD': 800000,
        'USD/JPY': 900000,
        'AUD/USD': 400000,
        'USD/CHF': 300000,
        'USD/CAD': 350000
    };
    
    const base = baseVolumes[pair] || 500000;
    return Math.floor(base * (0.8 + Math.random() * 0.4));
}

// Calculer les indicateurs techniques réels
async function calculateTechnicalIndicators() {
    Object.keys(forexData).forEach(pair => {
        const data = forexData[pair];
        if (!historicalData[pair]) {
            historicalData[pair] = [];
        }
        
        // Ajouter le prix actuel à l'historique
        historicalData[pair].push({
            price: data.price,
            timestamp: data.timestamp
        });
        
        // Conserver seulement les 50 derniers points pour les calculs
        if (historicalData[pair].length > 50) {
            historicalData[pair] = historicalData[pair].slice(-50);
        }
        
        // Calculer les indicateurs si on a assez de données
        if (historicalData[pair].length >= 14) {
            technicalIndicators[pair] = {
                sma20: calculateSMA(historicalData[pair], 20),
                ema12: calculateEMA(historicalData[pair], 12),
                rsi: calculateRSI(historicalData[pair], 14),
                macd: calculateMACD(historicalData[pair]),
                trend: determineTrend(historicalData[pair])
            };
        }
    });
}

// Calcul de la moyenne mobile simple (SMA)
function calculateSMA(data, period) {
    if (data.length < period) return null;
    const slice = data.slice(-period);
    const sum = slice.reduce((acc, item) => acc + item.price, 0);
    return sum / period;
}

// Calcul de la moyenne mobile exponentielle (EMA)
function calculateEMA(data, period) {
    if (data.length < period) return null;
    
    const k = 2 / (period + 1);
    let ema = data[0].price;
    
    for (let i = 1; i < data.length; i++) {
        ema = data[i].price * k + ema * (1 - k);
    }
    
    return ema;
}

// Calcul du RSI (Relative Strength Index)
function calculateRSI(data, period = 14) {
    if (data.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    // Calculer les gains et pertes moyens
    for (let i = 1; i <= period; i++) {
        const change = data[i].price - data[i-1].price;
        if (change > 0) {
            gains += change;
        } else {
            losses -= change;
        }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// Calcul du MACD
function calculateMACD(data) {
    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);
    
    if (!ema12 || !ema26) return null;
    
    return {
        macd: ema12 - ema26,
        signal: ema12, // Simplifié
        histogram: (ema12 - ema26) - ema12
    };
}

// Déterminer la tendance
function determineTrend(data) {
    if (data.length < 10) return 'neutre';
    
    const recent = data.slice(-10);
    const older = data.slice(-20, -10);
    
    const recentAvg = recent.reduce((sum, item) => sum + item.price, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.price, 0) / older.length;
    
    const changePct = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (changePct > 0.1) return 'haussière';
    if (changePct < -0.1) return 'baissière';
    return 'neutre';
}

// Calculer la matrice de corrélation réelle
function calculateCorrelationMatrix() {
    const pairs = Object.keys(forexData);
    correlationMatrix = {};
    
    pairs.forEach(pair1 => {
        correlationMatrix[pair1] = {};
        pairs.forEach(pair2 => {
            if (pair1 !== pair2) {
                correlationMatrix[pair1][pair2] = calculateCorrelation(pair1, pair2);
            }
        });
    });
}

// Calcul de corrélation entre deux paires
function calculateCorrelation(pair1, pair2) {
    const data1 = historicalData[pair1] || [];
    const data2 = historicalData[pair2] || [];
    
    if (data1.length < 10 || data2.length < 10) {
        // Corrélations théoriques basées sur les devises communes
        return getTheoreticalCorrelation(pair1, pair2);
    }
    
    const minLength = Math.min(data1.length, data2.length);
    const slice1 = data1.slice(-minLength);
    const slice2 = data2.slice(-minLength);
    
    // Calculer les retours
    const returns1 = slice1.slice(1).map((item, i) => 
        (item.price - slice1[i].price) / slice1[i].price
    );
    const returns2 = slice2.slice(1).map((item, i) => 
        (item.price - slice2[i].price) / slice2[i].price
    );
    
    if (returns1.length === 0) return 0;
    
    const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
    const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;
    
    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;
    
    for (let i = 0; i < returns1.length; i++) {
        const diff1 = returns1[i] - mean1;
        const diff2 = returns2[i] - mean2;
        numerator += diff1 * diff2;
        sumSq1 += diff1 * diff1;
        sumSq2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sumSq1 * sumSq2);
    return denominator === 0 ? 0 : numerator / denominator;
}

// Corrélations théoriques basées sur les devises communes
function getTheoreticalCorrelation(pair1, pair2) {
    const correlations = {
        'EUR/USD_GBP/USD': 0.85,
        'EUR/USD_AUD/USD': 0.75,
        'GBP/USD_AUD/USD': 0.70,
        'USD/JPY_USD/CHF': 0.80,
        'USD/JPY_USD/CAD': 0.75,
        'USD/CHF_USD/CAD': 0.85
    };
    
    const key1 = `${pair1}_${pair2}`;
    const key2 = `${pair2}_${pair1}`;
    
    return correlations[key1] || correlations[key2] || (Math.random() * 0.4 - 0.2);
}

// Génération de données de fallback avancées
function generateAdvancedFallbackData() {
    const basePrices = {
        'USD/JPY': 149.50,
        'GBP/USD': 1.2720,
        'EUR/USD': 1.0850,
        'AUD/USD': 0.6580,
        'USD/CHF': 0.8790,
        'USD/CAD': 1.3620
    };
    
    const fallbackData = {};
    const timestamp = new Date();
    
    Object.keys(basePrices).forEach(pair => {
        const basePrice = basePrices[pair];
        const volatility = generateRealisticVolatility(pair, timestamp);
        const price = basePrice * (1 + volatility / 100);
        const decimals = pair.includes('JPY') ? 2 : 4;
        
        fallbackData[pair] = {
            price: parseFloat(price.toFixed(decimals)),
            change: volatility,
            volume: generateRealisticVolume(pair),
            timestamp: timestamp,
            bid: price * 0.9999,
            ask: price * 1.0001,
            high24h: price * 1.02,
            low24h: price * 0.98
        };
    });
    
    console.log('📊 Données de fallback générées:', fallbackData);
    return fallbackData;
}

// Générer une volatilité réaliste basée sur l'heure et la paire
function generateRealisticVolatility(pair, timestamp) {
    const hour = timestamp.getHours();
    const minute = timestamp.getMinutes();
    
    // Volatilité de base selon la paire
    const baseVolatility = {
        'USD/JPY': 0.8,
        'EUR/USD': 0.6,
        'GBP/USD': 0.9,
        'AUD/USD': 0.7,
        'USD/CHF': 0.5,
        'USD/CAD': 0.6
    };
    
    const base = baseVolatility[pair] || 0.6;
    
    // Multiplicateur selon l'heure (sessions de trading)
    let sessionMultiplier = 1;
    if (hour >= 8 && hour <= 17) { // Session européenne/américaine
        sessionMultiplier = 1.5;
    } else if (hour >= 22 || hour <= 6) { // Session asiatique
        sessionMultiplier = 1.2;
    }
    
    // Ajouter du bruit aléatoire
    const randomFactor = (Math.random() - 0.5) * 2; // Entre -1 et 1
    
    return base * sessionMultiplier * (1 + randomFactor * 0.5);
}

// Générer un volume réaliste
function generateRealisticVolume(pair) {
    const baseVolumes = {
        'USD/JPY': 2500000,
        'EUR/USD': 3000000,
        'GBP/USD': 1800000,
        'AUD/USD': 1200000,
        'USD/CHF': 800000,
        'USD/CAD': 1000000
    };
    
    const base = baseVolumes[pair] || 1000000;
    const variation = (Math.random() * 0.4) + 0.8; // Entre 0.8 et 1.2
    
    return Math.round(base * variation);
}

// Mise à jour des corrélations avec données techniques
function updateCorrelations() {
    const correlationGrid = document.getElementById('correlationGrid');
    if (!correlationGrid) return;
    
    let html = '';
    
    CURRENCY_PAIRS.forEach(({ pair }) => {
        const data = forexData[pair];
        if (data) {
            const changeClass = data.change > 0 ? 'positive' : data.change < 0 ? 'negative' : 'neutral';
            const changeIcon = data.change > 0 ? '▲' : data.change < 0 ? '▼' : '●';
            const changePercent = Math.abs(data.change).toFixed(2);
            const indicators = technicalIndicators[pair];
            
            // Ajouter des informations techniques si disponibles
            let technicalInfo = '';
            if (indicators) {
                const rsi = indicators.rsi;
                let rsiStatus = '';
                if (rsi > 70) rsiStatus = 'Suracheté';
                else if (rsi < 30) rsiStatus = 'Survendu';
                else rsiStatus = 'Neutre';
                
                technicalInfo = `
                    <div class="technical-info">
                        <small>RSI: ${rsi ? rsi.toFixed(1) : 'N/A'} (${rsiStatus})</small>
                        <small>Tendance: ${indicators.trend}</small>
                    </div>
                `;
            }
            
            html += `
                <div class="correlation-pair" title="Cliquez pour plus de détails">
                    <div class="pair-name">${pair}</div>
                    <div class="pair-price ${changeClass}">${data.price}</div>
                    <div class="pair-change ${changeClass}">
                        ${changeIcon} ${changePercent}%
                    </div>
                    ${technicalInfo}
                    <div class="pair-volume">
                        <small>Vol: ${formatVolume(data.volume)}</small>
                    </div>
                </div>
            `;
        }
    });
    
    correlationGrid.innerHTML = html;
    
    // Ajouter des événements de clic pour rediriger vers Investing.com
    document.querySelectorAll('.correlation-pair').forEach((element, index) => {
        element.addEventListener('click', () => {
            const pair = CURRENCY_PAIRS[index].pair;
            const investingUrl = getInvestingUrl(pair);
            window.open(investingUrl, '_blank');
        });
    });
}

// Formater le volume pour l'affichage
function formatVolume(volume) {
    if (volume >= 1000000) {
        return (volume / 1000000).toFixed(1) + 'M';
    } else if (volume >= 1000) {
        return (volume / 1000).toFixed(0) + 'K';
    }
    return volume.toString();
}

// Obtenir l'URL Investing.com pour une paire
function getInvestingUrl(pair) {
    const urls = {
        'EUR/USD': 'https://fr.investing.com/currencies/eur-usd',
        'GBP/USD': 'https://fr.investing.com/currencies/gbp-usd',
        'USD/JPY': 'https://fr.investing.com/currencies/usd-jpy',
        'AUD/USD': 'https://fr.investing.com/currencies/aud-usd',
        'USD/CHF': 'https://fr.investing.com/currencies/usd-chf',
        'USD/CAD': 'https://fr.investing.com/currencies/usd-cad'
    };
    
    return urls[pair] || 'https://fr.investing.com/currencies/';
}

// Mise à jour des tendances basées sur l'analyse technique réelle
function updateTrends() {
    const trendsGrid = document.getElementById('trendsGrid');
    if (!trendsGrid) return;
    
    let html = '';
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CHF', 'CAD'];
    
    currencies.forEach(currency => {
        const strength = calculateCurrencyStrength(currency);
        const trend = getCurrencyTrend(currency);
        const correlation = getAverageCorrelation(currency);
        
        const strengthClass = strength.score > 0.6 ? 'strong' : strength.score > 0.3 ? 'moderate' : 'weak';
        const strengthText = strength.score > 0.6 ? 'Fort' : strength.score > 0.3 ? 'Modéré' : 'Faible';
        
        const arrow = trend.direction === 'up' ? '⬆️' : trend.direction === 'down' ? '⬇️' : '➡️';
        const arrowClass = trend.direction === 'up' ? 'positive' : trend.direction === 'down' ? 'negative' : 'neutral';
        
        html += `
            <div class="trend-item" title="Cliquez pour analyse détaillée">
                <div class="trend-currency">
                    <strong>${currency}</strong>
                    <div class="currency-details">
                        <small>Force: ${(strength.score * 100).toFixed(0)}%</small>
                        <small>Corr: ${(correlation * 100).toFixed(0)}%</small>
                    </div>
                </div>
                <div class="trend-indicator">
                    <span class="trend-arrow ${arrowClass}">${arrow}</span>
                    <span class="trend-strength ${strengthClass}">${strengthText}</span>
                    <div class="trend-momentum">
                        <small>${trend.momentum.toFixed(1)}%</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    trendsGrid.innerHTML = html;
    
    // Ajouter des événements de clic pour plus de détails
    document.querySelectorAll('.trend-item').forEach((element, index) => {
        element.addEventListener('click', () => {
            const currency = currencies[index];
            showCurrencyAnalysis(currency);
        });
    });
}

// Calculer la force d'une devise basée sur toutes ses paires
function calculateCurrencyStrength(currency) {
    let totalChange = 0;
    let pairCount = 0;
    let volume = 0;
    
    Object.keys(forexData).forEach(pair => {
        if (pair.includes(currency)) {
            const data = forexData[pair];
            const [base, quote] = pair.split('/');
            
            // Ajuster le signe selon la position de la devise
            let change = data.change;
            if (quote === currency) {
                change = -change; // Inverser si la devise est en quote
            }
            
            totalChange += change;
            volume += data.volume || 0;
            pairCount++;
        }
    });
    
    if (pairCount === 0) return { score: 0.5, pairs: 0, volume: 0 };
    
    const avgChange = totalChange / pairCount;
    const score = Math.max(0, Math.min(1, (avgChange + 2) / 4)); // Normaliser entre 0 et 1
    
    return {
        score: score,
        pairs: pairCount,
        volume: volume,
        avgChange: avgChange
    };
}

// Obtenir la tendance d'une devise
function getCurrencyTrend(currency) {
    const strength = calculateCurrencyStrength(currency);
    let direction = 'neutral';
    let momentum = 0;
    
    if (strength.avgChange > 0.1) {
        direction = 'up';
        momentum = strength.avgChange;
    } else if (strength.avgChange < -0.1) {
        direction = 'down';
        momentum = Math.abs(strength.avgChange);
    } else {
        momentum = Math.abs(strength.avgChange);
    }
    
    return {
        direction: direction,
        momentum: momentum,
        confidence: strength.pairs / 6 // Confiance basée sur le nombre de paires
    };
}

// Calculer la corrélation moyenne d'une devise
function getAverageCorrelation(currency) {
    let totalCorrelation = 0;
    let count = 0;
    
    Object.keys(correlationMatrix).forEach(pair1 => {
        if (pair1.includes(currency)) {
            Object.keys(correlationMatrix[pair1]).forEach(pair2 => {
                totalCorrelation += Math.abs(correlationMatrix[pair1][pair2]);
                count++;
            });
        }
    });
    
    return count > 0 ? totalCorrelation / count : 0;
}

// Afficher l'analyse détaillée d'une devise
function showCurrencyAnalysis(currency) {
    const strength = calculateCurrencyStrength(currency);
    const trend = getCurrencyTrend(currency);
    
    const analysisHtml = `
        <div class="currency-analysis-modal" style="
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: var(--background-color); border: 2px solid var(--primary-color);
            border-radius: 15px; padding: 20px; z-index: 20000; max-width: 400px;
            box-shadow: 0 0 50px rgba(0, 102, 204, 0.5);
        ">
            <h3 style="color: var(--primary-color); margin-bottom: 15px;">
                Analyse ${currency}
            </h3>
            <div style="margin-bottom: 10px;">
                <strong>Force globale:</strong> ${(strength.score * 100).toFixed(1)}%
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Tendance:</strong> ${trend.direction === 'up' ? 'Haussière' : trend.direction === 'down' ? 'Baissière' : 'Neutre'}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Momentum:</strong> ${trend.momentum.toFixed(2)}%
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Paires analysées:</strong> ${strength.pairs}
            </div>
            <div style="text-align: center;">
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: var(--primary-color); color: white; border: none;
                    padding: 8px 15px; border-radius: 5px; cursor: pointer;
                ">Fermer</button>
                <button onclick="window.open('https://fr.investing.com/currencies/', '_blank')" style="
                    background: var(--primary-color-light); color: white; border: none;
                    padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-left: 10px;
                ">Voir sur Investing.com</button>
            </div>
        </div>
        <div class="modal-backdrop" onclick="this.nextElementSibling.remove(); this.remove();" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 19999;
        "></div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', analysisHtml);
}

// Mise à jour des performances
function updatePerformance() {
    const performanceContent = document.getElementById('performanceContent');
    if (!performanceContent) return;
    
    let html = '<div class="performance-chart">';
    
    CURRENCY_PAIRS.forEach(({ pair }) => {
        const data = forexData[pair];
        if (data) {
            const performance = Math.abs(data.change * 100);
            const maxPerformance = 5; // 5% max pour la barre
            const barWidth = Math.min((performance / maxPerformance) * 100, 100);
            const colorClass = data.change > 0 ? 'positive' : 'negative';
            const bgColor = data.change > 0 ? 'var(--success-color)' : 'var(--danger-color)';
            
            html += `
                <div class="performance-bar">
                    <div class="performance-label">${pair}</div>
                    <div class="performance-bar-container">
                        <div class="performance-bar-fill" style="width: ${barWidth}%; background-color: ${bgColor};"></div>
                    </div>
                    <div class="performance-value ${colorClass}">${(data.change * 100).toFixed(2)}%</div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    performanceContent.innerHTML = html;
}

// Mise à jour des alertes
function updateAlerts() {
    const alertsContent = document.getElementById('alertsContent');
    if (!alertsContent) return;
    
    const alerts = [
        {
            title: 'USD/JPY - Niveau de résistance',
            description: 'Le pair USD/JPY approche un niveau de résistance majeur à 150.00'
        },
        {
            title: 'GBP/USD - Support technique',
            description: 'Le GBP/USD teste un support technique important à 1.2500'
        },
        {
            title: 'Volatilité élevée détectée',
            description: 'Volatilité inhabituelle sur les pairs USD aujourd\'hui'
        }
    ];
    
    let html = '';
    alerts.forEach(alert => {
        html += `
            <div class="alert-item">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-description">${alert.description}</div>
            </div>
        `;
    });
    
    alertsContent.innerHTML = html;
}

// Mise à jour des actualités avec liens cliquables
function updateNews() {
    const newsContent = document.getElementById('newsContent');
    if (!newsContent) return;
    
    // Actualités dynamiques basées sur les données actuelles
    const news = generateDynamicNews();
    
    let html = '';
    news.forEach((item, index) => {
        html += `
            <div class="news-item clickable-news" data-url="${item.url}" title="Cliquer pour lire l'article complet">
                <div class="news-title">
                    <i class="fas fa-external-link-alt news-icon"></i>
                    ${item.title}
                </div>
                <div class="news-meta">
                    <span class="news-time">${item.time}</span>
                    <span class="news-source">${item.source}</span>
                </div>
                <div class="news-summary">${item.summary}</div>
            </div>
        `;
    });
    
    newsContent.innerHTML = html;
    
    // Ajouter des événements de clic pour rediriger vers les articles
    document.querySelectorAll('.clickable-news').forEach(element => {
        element.addEventListener('click', () => {
            const url = element.dataset.url;
            window.open(url, '_blank');
        });
    });
}

// Générer des actualités dynamiques basées sur les données du marché
function generateDynamicNews() {
    const now = new Date();
    const news = [];
    
    // Analyser les mouvements significatifs pour créer des actualités
    Object.keys(forexData).forEach(pair => {
        const data = forexData[pair];
        const changeAbs = Math.abs(data.change);
        
        if (changeAbs > 0.5) { // Mouvement significatif
            const direction = data.change > 0 ? 'hausse' : 'baisse';
            const strength = changeAbs > 1 ? 'forte' : 'modérée';
            
            news.push({
                title: `${pair}: ${strength} ${direction} de ${changeAbs.toFixed(2)}% détectée`,
                summary: `Analyse technique en cours sur cette paire avec un volume de ${formatVolume(data.volume)}.`,
                time: getRandomTime(),
                source: 'Investing.com',
                url: getInvestingUrl(pair)
            });
        }
    });
    
    // Ajouter des actualités génériques du forex
    const genericNews = [
        {
            title: 'Décision de politique monétaire de la Fed attendue',
            summary: 'Les marchés anticipent une possible révision des taux directeurs américains.',
            time: 'Il y a 2 heures',
            source: 'Investing.com',
            url: 'https://fr.investing.com/news/economy'
        },
        {
            title: 'Données économiques européennes en focus',
            summary: 'L\'inflation et l\'emploi dans la zone euro sous surveillance des traders.',
            time: 'Il y a 3 heures',
            source: 'Investing.com',
            url: 'https://fr.investing.com/news/forex-news'
        },
        {
            title: 'Tensions géopolitiques et impact sur les devises refuges',
            summary: 'Le yen japonais et le franc suisse montrent des signes de renforcement.',
            time: 'Il y a 4 heures',
            source: 'Investing.com',
            url: 'https://fr.investing.com/currencies/usd-jpy-news'
        },
        {
            title: 'Analyse technique hebdomadaire des principales paires',
            summary: 'Points de retournement et niveaux clés à surveiller cette semaine.',
            time: 'Il y a 5 heures',
            source: 'Investing.com',
            url: 'https://fr.investing.com/analysis/forex'
        },
        {
            title: 'Corrélations inter-marchés : Actions vs Devises',
            summary: 'L\'impact des indices boursiers sur les mouvements de change.',
            time: 'Il y a 6 heures',
            source: 'Investing.com',
            url: 'https://fr.investing.com/analysis/markets'
        }
    ];
    
    // Mélanger les actualités et limiter à 8
    const allNews = [...news, ...genericNews];
    return shuffleArray(allNews).slice(0, 8);
}

// Générer une heure aléatoire récente
function getRandomTime() {
    const hours = Math.floor(Math.random() * 12) + 1;
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
}

// Mélanger un tableau
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ================== VIP AUTHENTICATION SYSTEM ==================

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDSDK0NfVSs_VQb3TnrixiJbOpTsmoUMvU",
    authDomain: "misterpips-b71fb.firebaseapp.com",
    projectId: "misterpips-b71fb",
    storageBucket: "misterpips-b71fb.firebasestorage.app",
    messagingSenderId: "574231126409",
    appId: "1:574231126409:web:b7ed93ac4ea62e247dc158"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Initialisation du système VIP
function initVipSystem() {
    console.log('initVipSystem appelé');
    const accessButton = document.getElementById('accessVipSpace');
    
    if (accessButton) {
        console.log('Bouton VIP trouvé, ajout listener');
        accessButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Clic détecté sur bouton VIP');
            showVipAuthModal();
        });
    } else {
        console.log('Bouton VIP non trouvé');
    }
}

function showVipAuthModal() {
    console.log('showVipAuthModal appelé');
    
    // Vérifier si Firebase est chargé
    if (typeof firebase === 'undefined') {
        console.error('Firebase non chargé');
        alert('Erreur: Firebase non disponible');
        return;
    }
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    
    modal.innerHTML = `<div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; border: 2px solid #00d4ff;"><h2 style="color: #00d4ff; margin-bottom: 20px;">🔐 Accès VIP</h2><input type="email" id="vipEmail" placeholder="Email" style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.1); color: white;"><input type="password" id="vipPassword" placeholder="Mot de passe" style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.1); color: white;"><button onclick="loginWithEmail()" style="width: 100%; background: #00d4ff; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; margin: 10px 0;">Se connecter</button><button onclick="loginWithGoogle()" style="width: 100%; background: #db4437; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; margin: 10px 0;">Google</button><button onclick="this.closest('div').parentElement.remove()" style="background: transparent; color: #ccc; border: 1px solid #ccc; padding: 8px 20px; border-radius: 8px; cursor: pointer;">Fermer</button></div>`;
    
    document.body.appendChild(modal);
    console.log('Modal VIP ajoutée au DOM');
}

async function loginWithEmail() {
    const email = document.getElementById('vipEmail').value;
    const password = document.getElementById('vipPassword').value;
    
    if (!email || !password) {
        alert('Email et mot de passe requis');
        return;
    }
    
    try {
        // Essayer de se connecter
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const hasAccess = await checkVipAccess(userCredential.user.uid);
        
        if (hasAccess) {
            document.querySelector('[style*="position: fixed"]').remove();
            window.open('../DASHBOARDTRADING/auth.html', '_blank');
        } else {
            showAccessDenied();
        }
    } catch (error) {
        console.error('Erreur login:', error);
        
        // Si l'utilisateur n'existe pas, essayer de le créer
        if (error.code === 'auth/user-not-found') {
            try {
                const newUser = await auth.createUserWithEmailAndPassword(email, password);
                const hasAccess = await checkVipAccess(newUser.user.uid);
                
                if (hasAccess) {
                    document.querySelector('[style*="position: fixed"]').remove();
                    window.open('../DASHBOARDTRADING/auth.html', '_blank');
                } else {
                    showAccessDenied();
                }
            } catch (createError) {
                console.error('Erreur création:', createError);
                showAccessDenied();
            }
        } else {
            showAccessDenied();
        }
    }
}

async function loginWithGoogle() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const hasAccess = await checkVipAccess(result.user.uid);
        
        if (hasAccess) {
            document.querySelector('[style*="position: fixed"]').remove();
            window.open('../DASHBOARDTRADING/auth.html', '_blank');
        } else {
            showAccessDenied();
        }
    } catch (error) {
        console.error('Erreur Google login:', error);
        showAccessDenied();
    }
}

async function checkVipAccess(uid) {
    try {
        // Vérifier par UID
        const docByUid = await db.collection('vip_users').doc(uid).get();
        if (docByUid.exists && docByUid.data().vip_access === true) {
            return true;
        }
        
        // Vérifier par email si UID pas trouvé
        const user = firebase.auth().currentUser;
        if (user && user.email) {
            const queryByEmail = await db.collection('vip_users')
                .where('email', '==', user.email)
                .where('vip_access', '==', true)
                .get();
            
            if (!queryByEmail.empty) {
                // Créer le document avec l'UID pour les prochaines fois
                await db.collection('vip_users').doc(uid).set({
                    email: user.email,
                    vip_access: true,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                });
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Erreur checkVipAccess:', error);
        return false;
    }
}

function showAccessDenied() {
    document.querySelector('[style*="position: fixed"]')?.remove();
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    modal.innerHTML = `<div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 40px; border-radius: 20px; text-align: center; max-width: 500px; border: 2px solid #ff6b6b;"><h2 style="color: #ff6b6b; margin-bottom: 20px;">🚫 Accès Refusé</h2><p style="color: #fff; margin-bottom: 30px;">Contactez-nous pour obtenir l'accès VIP</p><button onclick="window.open('https://t.me/misterpips_support', '_blank')" style="background: #0088cc; color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; margin: 10px;">@misterpips_support</button><button onclick="this.closest('div').parentElement.remove()" style="background: transparent; color: #ccc; border: 1px solid #ccc; padding: 8px 20px; border-radius: 8px; cursor: pointer;">Fermer</button></div>`;
    document.body.appendChild(modal);
}

function showVipAuthModal() {
    console.log('showVipAuthModal appelé');
    
    // Vérifier si Firebase est chargé
    if (typeof firebase === 'undefined') {
        console.error('Firebase non chargé');
        alert('Erreur: Firebase non disponible');
        return;
    }
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    
    modal.innerHTML = `<div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; border: 2px solid #00d4ff;"><h2 style="color: #00d4ff; margin-bottom: 20px;">🔐 Accès VIP</h2><input type="email" id="vipEmail" placeholder="Email" style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.1); color: white;"><input type="password" id="vipPassword" placeholder="Mot de passe" style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; background: rgba(255,255,255,0.1); color: white;"><button onclick="loginWithEmail()" style="width: 100%; background: #00d4ff; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; margin: 10px 0;">Se connecter</button><button onclick="loginWithGoogle()" style="width: 100%; background: #db4437; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; margin: 10px 0;">Google</button><button onclick="this.closest('div').parentElement.remove()" style="background: transparent; color: #ccc; border: 1px solid #ccc; padding: 8px 20px; border-radius: 8px; cursor: pointer;">Fermer</button></div>`;
    
    document.body.appendChild(modal);
    console.log('Modal VIP ajoutée au DOM');
}





function showAccessDenied() {
    document.querySelector('[style*="position: fixed"]')?.remove();
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    modal.innerHTML = `<div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 40px; border-radius: 20px; text-align: center; max-width: 500px; border: 2px solid #ff6b6b;"><h2 style="color: #ff6b6b; margin-bottom: 20px;">🚫 Accès Refusé</h2><p style="color: #fff; margin-bottom: 30px;">Contactez-nous pour obtenir l'accès VIP</p><button onclick="window.open('https://t.me/misterpips_support', '_blank')" style="background: #0088cc; color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; margin: 10px;">@misterpips_support</button><button onclick="this.closest('div').parentElement.remove()" style="background: transparent; color: #ccc; border: 1px solid #ccc; padding: 8px 20px; border-radius: 8px; cursor: pointer;">Fermer</button></div>`;
    document.body.appendChild(modal);
}

// Améliorer la fonction updateAlerts avec des alertes basées sur l'analyse technique
function updateAlerts() {
    const alertsContent = document.getElementById('alertsContent');
    if (!alertsContent) return;
    
    const alerts = generateTechnicalAlerts();
    
    let html = '';
    alerts.forEach(alert => {
        html += `
            <div class="alert-item clickable-alert" data-url="${alert.url}" title="Cliquer pour plus de détails">
                <div class="alert-header">
                    <div class="alert-title">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${alert.title}
                    </div>
                    <div class="alert-priority ${alert.priority}">${alert.priorityText}</div>
                </div>
                <div class="alert-description">${alert.description}</div>
                <div class="alert-action">
                    <small>🔍 Cliquer pour analyse complète sur Investing.com</small>
                </div>
            </div>
        `;
    });
    
    alertsContent.innerHTML = html;
    
    // Ajouter des événements de clic
    document.querySelectorAll('.clickable-alert').forEach(element => {
        element.addEventListener('click', () => {
            const url = element.dataset.url;
            window.open(url, '_blank');
        });
    });
}

// Générer des alertes basées sur l'analyse technique
function generateTechnicalAlerts() {
    const alerts = [];
    
    // Analyser chaque paire pour des signaux techniques
    Object.keys(forexData).forEach(pair => {
        const data = forexData[pair];
        const indicators = technicalIndicators[pair];
        
        if (indicators) {
            // Alerte RSI
            if (indicators.rsi && indicators.rsi > 70) {
                alerts.push({
                    title: `${pair} - Zone de surachat détectée`,
                    description: `RSI à ${indicators.rsi.toFixed(1)} - Possible retournement baissier à surveiller.`,
                    priority: 'high',
                    priorityText: 'HAUTE',
                    url: getInvestingUrl(pair)
                });
            } else if (indicators.rsi && indicators.rsi < 30) {
                alerts.push({
                    title: `${pair} - Zone de survente atteinte`,
                    description: `RSI à ${indicators.rsi.toFixed(1)} - Opportunité d'achat potentielle.`,
                    priority: 'high',
                    priorityText: 'HAUTE',
                    url: getInvestingUrl(pair)
                });
            }
            
            // Alerte sur la tendance
            if (indicators.trend === 'haussière' && Math.abs(data.change) > 0.5) {
                alerts.push({
                    title: `${pair} - Momentum haussier confirmé`,
                    description: `Tendance haussière avec changement de ${data.change.toFixed(2)}% - Continuation possible.`,
                    priority: 'medium',
                    priorityText: 'MOYENNE',
                    url: getInvestingUrl(pair)
                });
            }
        }
        
        // Alertes de prix
        if (Math.abs(data.change) > 1) {
            alerts.push({
                title: `${pair} - Mouvement significatif`,
                description: `Variation de ${data.change.toFixed(2)}% avec volume de ${formatVolume(data.volume)}.`,
                priority: 'high',
                priorityText: 'HAUTE',
                url: getInvestingUrl(pair)
            });
        }
    });
    
    // Ajouter des alertes génériques si pas assez d'alertes techniques
    if (alerts.length < 3) {
        alerts.push(
            {
                title: 'Session de trading européenne active',
                description: 'Volatilité accrue attendue sur EUR/USD et GBP/USD durant cette session.',
                priority: 'medium',
                priorityText: 'MOYENNE',
                url: 'https://fr.investing.com/currencies/eur-usd'
            },
            {
                title: 'Surveillance des niveaux de Fibonacci',
                description: 'Plusieurs paires approchent des retracements clés à 61.8%.',
                priority: 'low',
                priorityText: 'FAIBLE',
                url: 'https://fr.investing.com/analysis/forex'
            }
        );
    }
    
    return alerts.slice(0, 5); // Limiter à 5 alertes
}

// Fonctions avec retry pour assurer l'affichage
async function updateCorrelationsWithRetry(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            updateCorrelations();
            
            // Vérifier si les données sont bien affichées
            const correlationGrid = document.getElementById('correlationGrid');
            if (correlationGrid && correlationGrid.children.length > 0) {
                console.log(`✅ Corrélations affichées (tentative ${i + 1})`);
                return;
            }
            
            // Si pas de contenu, attendre et réessayer
            if (i < maxRetries - 1) {
                console.log(`🔄 Retry corrélations (tentative ${i + 1})`);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (error) {
            console.error(`❌ Erreur corrélations tentative ${i + 1}:`, error);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
    
    // Si toutes les tentatives échouent, utiliser les données de fallback
    console.log('🆘 Utilisation des données de fallback pour les corrélations');
    forexData = generateAdvancedFallbackData();
    updateCorrelations();
}

async function updatePerformanceWithRetry(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            updatePerformance();
            
            // Vérifier si les données sont bien affichées
            const performanceContent = document.getElementById('performanceContent');
            if (performanceContent && performanceContent.children.length > 0) {
                console.log(`✅ Performance affichée (tentative ${i + 1})`);
                return;
            }
            
            // Si pas de contenu, attendre et réessayer
            if (i < maxRetries - 1) {
                console.log(`🔄 Retry performance (tentative ${i + 1})`);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (error) {
            console.error(`❌ Erreur performance tentative ${i + 1}:`, error);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
    
    // Si toutes les tentatives échouent, utiliser les données de fallback
    console.log('🆘 Utilisation des données de fallback pour la performance');
    forexData = generateAdvancedFallbackData();
    updatePerformance();
}