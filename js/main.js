// main.js - script principale che fa partire tutto
// Riferimento: 110-web-dev (JavaScript, DOM API, async/await)

// istanze globali (accessibili tramite window)
window.dataLoader = new DataLoader();
window.interactionManager = new InteractionManager();

// questa è la funzione che parte all'inizio
async function init() {
    try {
        console.log('Inizio a caricare la dashboard...');
        
        // mostro il loading
        showLoading();
        
        // carico i dati dal CSV
        console.log('Caricamento dati in corso...');
        await window.dataLoader.loadData();
        
        console.log('Dati caricati OK!');
        
        // inizializzo i filtri e i controlli
        console.log('Inizializzo i filtri...');
        window.interactionManager.init();
        
        // disegno tutti i grafici
        console.log('Disegno i grafici...');
        console.log('Dati disponibili:', window.dataLoader.filteredData?.length);
        console.log('Sample primo dato:', window.dataLoader.filteredData?.[0]);
        await renderInitialCharts();
        
        // nascondo il loading
        hideLoading();
        
        console.log('Dashboard pronta!');
        
    } catch (error) {
        console.error('ERRORE durante inizializzazione:', error);
        showError(error);
    }
}

// funzione che disegna tutti i grafici la prima volta
async function renderInitialCharts() {
    const data = window.dataLoader.filteredData;
    
    console.log('Creo KPI cards...');
    renderKpiCards(data);
    
    console.log('Creo histogram...');
    UnivariateCharts.createHistogram(data, 'istogramma');
    
    console.log('Creo scatter...');
    BivariateCharts.createScatterRankScore(data, 'scatter-rank-score');
    
    console.log('Creo scatter colorato...');
    TrivariateCharts.createColoredScatter(data, 'scatter-multivariato');
    
    console.log('Creo line chart temporale...');
    const temporalCharts = new TemporalCharts();
    temporalCharts.createLineChart(data, 'grafico-temporale');
    
    console.log('Creo parallel coordinates...');
    const parallelCoords = new ParallelCoordinates();
    parallelCoords.createParallelCoordinates(data, 'coordinate-parallele');
    
    console.log('Creo radar chart...');
    await MultivariateCharts.createRadarChart(data, 'radar-cluster');
    
    console.log('Creo heatmap...');
    await MultivariateCharts.createHeatmap(data, 'heatmap-cluster');
    
    console.log('Grafici pronti!');
}

// mostra il simbolo di loading
function showLoading() {
    // aggiungo un overlay di loading invece di cancellare tutto
    const main = document.querySelector('.viz-container');
    if (main) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-overlay';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-size: 24px;
            color: #3498db;
        `;
        loadingDiv.innerHTML = '<div>Caricamento dati...</div>';
        document.body.appendChild(loadingDiv);
    }
}

// nasconde il loading
function hideLoading() {
    const loadingDiv = document.getElementById('loading-overlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// mostra errore se qualcosa va storto
function showError(error) {
    const main = document.querySelector('.viz-container');
    if (main) {
        main.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #e74c3c;">
                <h2>ERRORE!</h2>
                <p>Qualcosa è andato storto durante il caricamento:</p>
                <pre style="background: #f8f9fa; padding: 20px; border-radius: 5px; text-align: left; max-width: 600px; margin: 20px auto;">
${error.message}

Controlla:
- Il file CSV deve essere in data/results/
- Stai usando un server locale? (non file://)
- Il formato del CSV è corretto?


e usa un server locale! Prova:

    python -m http.server 8000

Poi apri: http://localhost:8000
                </pre>
            </div>
        `;
    }
}

// quando la pagina è caricata parte l'init
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM caricato, parto con init...');
    init();
});

// ---- KPI Cards ----
// mostra 4 card con statistiche chiave in cima alla dashboard
function renderKpiCards(data) {
    const container = document.getElementById('schede-kpi');
    if (!container) return;
    container.innerHTML = '';  // pulisco

    // calcolo metriche (uso Set per contare utenti unici, non righe temporali)
    const uniqueUsers   = new Set(data.map(d => d.user_id)).size;
    const insiderCount  = new Set(data.filter(d => d.insider === 1).map(d => d.user_id)).size;
    const scores        = data.map(d => d.final_anomaly_score);
    const avgScore      = d3.mean(scores);
    const maxScore      = d3.max(scores);

    const kpis = [
        { label: 'Utenti totali',    value: uniqueUsers,                                   color: '#3498db' },
        { label: 'Insider rilevati', value: insiderCount,                                  color: '#e74c3c' },
        { label: 'Score medio',      value: avgScore != null ? avgScore.toFixed(2) : '—',  color: '#f39c12' },
        { label: 'Score massimo',    value: maxScore != null ? maxScore.toFixed(2) : '—',  color: '#8e44ad' }
    ];

    kpis.forEach(kpi => {
        const card = document.createElement('div');
        card.className = 'kpi-card';
        card.style.borderTop = `4px solid ${kpi.color}`;
        card.innerHTML = `
            <div class="kpi-value" style="color:${kpi.color}">${kpi.value}</div>
            <div class="kpi-label">${kpi.label}</div>
        `;
        container.appendChild(card);
    });
}

// (uso un timeout per non chiamarlo troppo spesso)
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        console.log('Finestra ridimensionata, aggiorno grafici...');
        if (window.dataLoader.filteredData) {
            window.interactionManager.updateAllCharts(window.dataLoader.filteredData);
        }
    }, 500);  // aspetto mezzo secondo
});

// funzione di debug che posso chiamare dalla console del browser
// basta scrivere: debugInfo()
window.debugInfo = () => {
    console.log('=== INFO DEBUG ===');
    console.log('Dati caricati:', window.dataLoader.data?.length || 0);
    console.log('Dati filtrati:', window.dataLoader.filteredData?.length || 0);
    console.log('Filtri attivi:', window.interactionManager.filters);
    console.log('Cluster disponibili:', window.dataLoader.getUniqueClusters());
    console.log('Statistiche:', window.dataLoader.getStats());
};
