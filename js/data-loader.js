// data-loader.js - qui carico i dati dal CSV
// Riferimento: 030-data-model (tipi di dati, dataset tabellare)
// Uso d3.csv() come visto in 130-hands-on-d3-js

class DataLoader {
    constructor() {
        this.data = null;  // tutti i dati
        this.filteredData = null;  // dati filtrati
    }
    
    // funzione per caricare i dati dal CSV
    async loadData() {
        try {
            console.log('Sto caricando i dati...');
            
            // carico il file CSV con D3 (uso v2 per forzare reload)
            const data = await d3.csv('data/results/anomalies_temporal_v2.csv');
            
            // devo convertire i numeri perché D3 legge tutto come stringhe
            this.data = data.map(d => {
                const row = {};
                
                // converto i campi numerici
                for (let key in d) {
                    // questi li lascio come stringhe
                    if (key === 'user_id' || key === 'role' || key === 'b_unit' || 
                        key === 'f_unit' || key === 'dept' || key === 'team' || 
                        key === 'ITAdmin' || key === 'timestamp') {
                        row[key] = d[key];
                    } 
                    // questi li converto a numero intero
                    else if (key === 'insider' || key === 'cluster' || key === 'week') {
                        row[key] = +d[key];
                    } 
                    // per il resto provo a convertire
                    else {
                        const num = +d[key];
                        row[key] = isNaN(num) ? d[key] : num;  // se non è un numero lo lascio stringa
                    }
                }
                
                return row;
            });
            
            // all'inizio i dati filtrati sono uguali a tutti i dati
            this.filteredData = [...this.data];
            
            console.log('Dati caricati! Totale righe:', this.data.length);
            console.log('Utenti unici:', new Set(this.data.map(d => d.user_id)).size);
            console.log('Cluster trovati:', [...new Set(this.data.map(d => d.cluster))].sort());
            console.log('Week trovate:', [...new Set(this.data.map(d => d.week))].sort());
            console.log('Sample primo record:', this.data[0]);  // stampo il primo per vedere se va
            
            return this.data;
            
        } catch (error) {
            console.error('ERRORE nel caricamento dati:', error);
            throw error;
        }
    }
    
    // calcola le statistiche sui dati filtrati (solo quelle basilari)
    getStats() {
        if (!this.filteredData) return null;
        
        const insiderCount = this.filteredData.filter(d => d.insider === 1).length;
        const scores = this.filteredData.map(d => d.final_anomaly_score);
        
        return {
            totalUsers: this.filteredData.length,
            insiderCount: insiderCount,
            avgScore: d3.mean(scores).toFixed(2),
            maxScore: d3.max(scores).toFixed(2)
        };
    }
    
    // questa funzione filtra i dati in base ai filtri selezionati
    filterData(filters) {
        this.filteredData = this.data.filter(d => {
            // filtro per cluster
            if (filters.clusters && filters.clusters.length > 0 && 
                !filters.clusters.includes('all')) {
                if (!filters.clusters.includes(d.cluster.toString())) {
                    return false;  // escludi questo elemento
                }
            }
            
            // filtro insider/normale
            if (filters.insider !== 'all') {
                if (d.insider !== +filters.insider) {
                    return false;
                }
            }
            
            // filtro range score (minimo)
            if (filters.scoreMin !== undefined && d.final_anomaly_score < filters.scoreMin) {
                return false;
            }
            // filtro range score (massimo)
            if (filters.scoreMax !== undefined && d.final_anomaly_score > filters.scoreMax) {
                return false;
            }
            
            return true;  // questo elemento passa tutti i filtri
        });
        
        console.log('Filtrati:', this.filteredData.length, 'su', this.data.length, 'utenti');
        return this.filteredData;
    }
    
    // prende la lista dei cluster unici (per popolare il filtro)
    getUniqueClusters() {
        if (!this.data) return [];
        // uso Set per avere valori unici
        return [...new Set(this.data.map(d => d.cluster))].sort((a, b) => a - b);
    }
    
    // calcola la matrice di correlazione semplice
    calculateCorrelation(features) {
        if (!this.filteredData || this.filteredData.length === 0) return [];
        
        const matrix = [];
        
        for (let i = 0; i < features.length; i++) {
            for (let j = 0; j < features.length; j++) {
                const values1 = this.filteredData.map(d => d[features[i]]);
                const values2 = this.filteredData.map(d => d[features[j]]);
                
                // uso funzione D3 per calcolare correlazione
                // formula: cov(x,y) / (stddev(x) * stddev(y))
                const mean1 = d3.mean(values1);
                const mean2 = d3.mean(values2);
                const dev1 = d3.deviation(values1);
                const dev2 = d3.deviation(values2);
                
                let corr = 0;
                if (dev1 && dev2) {
                    let cov = 0;
                    for (let k = 0; k < values1.length; k++) {
                        cov += (values1[k] - mean1) * (values2[k] - mean2);
                    }
                    cov /= values1.length;
                    corr = cov / (dev1 * dev2);
                }
                
                matrix.push({
                    x: features[i],
                    y: features[j],
                    value: corr
                });
            }
        }
        
        return matrix;
    }
    
    // calcola le medie per ogni cluster (serve per il radar chart)
    getClusterMeans(features) {
        if (!this.filteredData) return [];
        
        const clusters = this.getUniqueClusters();
        let means = [];
        
        clusters.forEach(cluster => {
            const clusterData = this.filteredData.filter(d => d.cluster === cluster);
            let mean = { cluster: cluster };
            
            features.forEach(feature => {
                const values = clusterData.map(d => d[feature]);
                mean[feature] = d3.mean(values);
            });
            
            means.push(mean);
        });
        
        return means;
    }
}

// Istanza globale
const dataLoader = new DataLoader();
