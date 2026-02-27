// interactions.js - gestisce i filtri
// Riferimento: 140-interaction (filtering, coordinated views)

class InteractionManager {
    constructor() {
        this.filters = {
            clusters: ['all'],
            insider: 'all',
            scoreMin: 0,
            scoreMax: 100
        };
    }
    
    init() {
        this.setupClusterFilter();
        this.setupInsiderFilter();
        this.setupScoreRange();
        this.setupResetButton();
    }
    
    // setup del filtro cluster (dropdown multi-selezione)
    setupClusterFilter() {
        const select = document.getElementById('cluster-filter');
        const clusters = window.dataLoader.getUniqueClusters();
        
        // aggiungo le opzioni per ogni cluster
        clusters.forEach(cluster => {
            const option = document.createElement('option');
            option.value = cluster;
            option.textContent = `Cluster ${cluster}`;
            select.appendChild(option);
        });
        
        // quando cambio la selezione applico i filtri
        select.addEventListener('change', (e) => {
            const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
            this.filters.clusters = selected;
            console.log('Cluster selezionati:', selected);
            this.applyFilters();
        });
    }
    
    // setup del filtro insider/normale
    setupInsiderFilter() {
        const select = document.getElementById('insider-filter');
        select.addEventListener('change', (e) => {
            this.filters.insider = e.target.value;
            console.log('Filtro insider:', e.target.value);
            this.applyFilters();
        });
    }
    
    // setup degli slider per il range di score
    setupScoreRange() {
        const minSlider = document.getElementById('score-min');
        const maxSlider = document.getElementById('score-max');
        const display = document.getElementById('score-display');
        
        // prendo il range reale dagli score (uso window per accedere alla variabile globale)
        const scores = window.dataLoader.data.map(d => d.final_anomaly_score);
        const minScore = d3.min(scores);
        const maxScore = d3.max(scores);
        
        minSlider.step = 'any';
        minSlider.min = minScore;
        minSlider.max = maxScore;
        minSlider.value = minScore;
        
        maxSlider.step = 'any';
        maxSlider.min = minScore;
        maxSlider.max = maxScore;
        maxSlider.value = maxScore;
        
        const updateDisplay = () => {
            const min = parseFloat(minSlider.value);
            const max = parseFloat(maxSlider.value);
            display.textContent = `${min.toFixed(2)} - ${max.toFixed(2)}`;
            this.filters.scoreMin = min;
            this.filters.scoreMax = max;
        };
        
        minSlider.addEventListener('input', () => {
            if (parseFloat(minSlider.value) > parseFloat(maxSlider.value)) {
                minSlider.value = maxSlider.value;
            }
            updateDisplay();
        });
        
        maxSlider.addEventListener('input', () => {
            if (parseFloat(maxSlider.value) < parseFloat(minSlider.value)) {
                maxSlider.value = minSlider.value;
            }
            updateDisplay();
        });
        
        minSlider.addEventListener('change', () => this.applyFilters());
        maxSlider.addEventListener('change', () => this.applyFilters());
        
        updateDisplay();
    }
    
    // Setup pulsante reset
    setupResetButton() {
        const resetBtn = document.getElementById('reset-filters');
        resetBtn.addEventListener('click', () => {
            this.resetFilters();
        });
    }
    
    // Applica filtri
    applyFilters() {
        console.log('Applicazione filtri:', this.filters);
        const filteredData = window.dataLoader.filterData(this.filters);
        this.updateAllCharts(filteredData);
    }
    
    // Reset filtri
    resetFilters() {
        document.getElementById('cluster-filter').selectedIndex = 0;
        document.getElementById('insider-filter').selectedIndex = 0;
        
        const scores = window.dataLoader.data.map(d => d.final_anomaly_score);
        document.getElementById('score-min').value = d3.min(scores);
        document.getElementById('score-max').value = d3.max(scores);
        
        this.filters = {
            clusters: ['all'],
            insider: 'all',
            scoreMin: d3.min(scores),
            scoreMax: d3.max(scores)
        };
        
        document.getElementById('score-display').textContent = 
            `${this.filters.scoreMin.toFixed(2)} - ${this.filters.scoreMax.toFixed(2)}`;
        
        this.applyFilters();
    }
    
    // Aggiorna tutti i grafici
    async updateAllCharts(data) {
        console.log('Aggiorno grafici con', data.length, 'utenti');
        
        // KPI cards
        renderKpiCards(data);
        
        // Univariate
        UnivariateCharts.createHistogram(data, 'istogramma');
        
        // Bivariate
        BivariateCharts.createScatterRankScore(data, 'scatter-rank-score');
        
        // Trivariate
        TrivariateCharts.createColoredScatter(data, 'scatter-multivariato');
        
        // Temporal
        const temporalCharts = new TemporalCharts();
        temporalCharts.createLineChart(data, 'grafico-temporale');
        
        // Parallel Coordinates
        const parallelCoords = new ParallelCoordinates();
        parallelCoords.createParallelCoordinates(data, 'coordinate-parallele');
        
        // Multivariate (ora async)
        await MultivariateCharts.createRadarChart(data, 'radar-cluster');
        await MultivariateCharts.createHeatmap(data, 'heatmap-cluster');
    }
}

// Istanza globale
const interactionManager = new InteractionManager();
