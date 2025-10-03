// Mobile Dashboard JavaScript
let performanceChart = null;
let winRateChart = null;

// Initialisation des graphiques
function initMobileCharts() {
    // Graphique de performance
    const perfCtx = document.getElementById('mobilePerformanceChart');
    if (perfCtx) {
        performanceChart = new Chart(perfCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'P&L Cumulé',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#ccc', font: { size: 10 } }
                    }
                }
            }
        });
    }

    // Graphique taux de réussite
    const winCtx = document.getElementById('mobileWinRateChart');
    if (winCtx) {
        winRateChart = new Chart(winCtx, {
            type: 'doughnut',
            data: {
                labels: ['Gagnants', 'Perdants'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#28a745', '#dc3545'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ccc', font: { size: 10 } }
                    }
                }
            }
        });
    }
}

// Mise à jour des statistiques
function updateMobileStats(trades) {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.status === 'closed' && parseFloat(t.pnl) > 0).length;
    const losingTrades = trades.filter(t => t.status === 'closed' && parseFloat(t.pnl) < 0).length;
    const totalProfit = trades.reduce((sum, t) => sum + (t.status === 'closed' ? parseFloat(t.pnl) : 0), 0);
    const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;

    // Mise à jour des éléments
    document.getElementById('totalTrades').textContent = totalTrades;
    document.getElementById('winningTrades').textContent = winningTrades;
    document.getElementById('losingTrades').textContent = losingTrades;
    document.getElementById('totalProfit').textContent = `$${totalProfit.toFixed(2)}`;
    
    // Header stats
    document.getElementById('mobileWinRate').textContent = `${winRate}%`;
    document.getElementById('mobilePnL').textContent = `$${totalProfit.toFixed(2)}`;

    // Mise à jour des graphiques
    updateMobileCharts(trades, winningTrades, losingTrades);
}

// Mise à jour des graphiques
function updateMobileCharts(trades, winning, losing) {
    // Performance chart
    if (performanceChart) {
        const closedTrades = trades.filter(t => t.status === 'closed').sort((a, b) => new Date(a.date) - new Date(b.date));
        let cumulative = 0;
        const labels = [];
        const data = [];

        closedTrades.forEach((trade, index) => {
            cumulative += parseFloat(trade.pnl);
            labels.push(`T${index + 1}`);
            data.push(cumulative);
        });

        performanceChart.data.labels = labels;
        performanceChart.data.datasets[0].data = data;
        performanceChart.update();
    }

    // Win rate chart
    if (winRateChart) {
        winRateChart.data.datasets[0].data = [winning, losing];
        winRateChart.update();
    }
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initMobileCharts, 500);
});