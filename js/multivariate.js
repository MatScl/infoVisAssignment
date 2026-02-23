// multivariate.js - grafici multivariati (radar chart e heatmap)
// Riferimento: 090-multivariate (tecniche per alta dimensionalità)

class MultivariateCharts {
    
    // Radar Chart per profili cluster
    static async createRadarChart(data, containerId) {
        const container = d3.select(`#${containerId}`);
        
        // Rimuovi solo gli elementi vecchi, non l'SVG (per transizioni smooth)
        const existingSvg = container.select('svg');
        if (!existingSvg.empty()) {
            existingSvg.selectAll('.radar-area').remove();
            existingSvg.selectAll('[class^="radar-point-"]').remove();
            existingSvg.selectAll('.legend').remove();
        } else {
            container.selectAll('*').remove();
        }
        
        const margin = { top: 60, right: 60, bottom: 60, left: 60 };
        const width = 500;
        const height = 500;
        const radius = Math.min(width, height) / 2 - 80;
        
        let svg;
        if (existingSvg.empty()) {
            svg = container
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', `translate(${width/2 + margin.left}, ${height/2 + margin.top})`);
            
            // Crea struttura statica solo la prima volta
            const features = CONFIG.features.radar;
            const numAxes = features.length;
            const angleSlice = (Math.PI * 2) / numAxes;
            
            // Griglia circolare
            const levels = 5;
            for (let level = 1; level <= levels; level++) {
                const levelRadius = radius * (level / levels);
                svg.append('circle')
                    .attr('class', 'radar-grid')
                    .attr('r', levelRadius)
                    .attr('fill', 'none')
                    .attr('stroke', '#CDCDCD')
                    .attr('stroke-width', 0.5);
            }
            
            // Etichetta min/max sull'asse verticale (primo asse)
            svg.append('text')
                .attr('class', 'radar-grid-label')
                .attr('x', 5).attr('y', -radius)
                .attr('font-size', '9px').attr('fill', '#999')
                .text('alto');
            svg.append('text')
                .attr('class', 'radar-grid-label')
                .attr('x', 5).attr('y', -radius / 5)
                .attr('font-size', '9px').attr('fill', '#999')
                .text('basso');
            
            // Assi
            const axis = svg.selectAll('.radar-axis')
                .data(features)
                .join('g')
                .attr('class', 'radar-axis');
            
            axis.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
                .attr('y2', (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
                .attr('stroke', 'gray')
                .attr('stroke-width', 1);
            
            axis.append('text')
                .attr('class', 'axis-label')
                .attr('text-anchor', 'middle')
                .attr('x', (d, i) => radius * 1.15 * Math.cos(angleSlice * i - Math.PI / 2))
                .attr('y', (d, i) => radius * 1.15 * Math.sin(angleSlice * i - Math.PI / 2))
                .text(d => getLabel(d))
                .style('font-size', '12px')
                .style('font-weight', 'bold');
        } else {
            svg = existingSvg.select('g');
        }
        
        const features = CONFIG.features.radar;
        const numAxes = features.length;
        const angleSlice = (Math.PI * 2) / numAxes;
        const rScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, radius]);
        
        // Carica profili cluster dal CSV (uso v2 per forzare reload)
        const clusterProfiles = await d3.csv('data/results/cluster_profiles_v2.csv');
        const clusterMeans = clusterProfiles.map(d => ({
            cluster: +d.cluster || +d[''] || 0,  // gestisce sia "cluster" che indice
            ...Object.fromEntries(features.map(f => [f, +d[f] || 0]))
        }));
        
        // Normalizza [0, 1] usando il range dei cluster stessi per ogni feature,
        // così le differenze tra cluster occupano tutto il range visivo del radar.
        // Un padding del 10% evita che i valori tocchino centro o bordo.
        const PADDING = 0.10;
        const normalized = clusterMeans.map(cluster => {
            const norm = { cluster: cluster.cluster };
            features.forEach(feature => {
                // extent calcolato sui valori dei cluster (non del dataset grezzo)
                const extent = d3.extent(clusterMeans, d => d[feature]);
                const span = extent[1] - extent[0];
                // se tutti i cluster hanno lo stesso valore evita divisione per 0
                if (span === 0) {
                    norm[feature] = 0.5;
                } else {
                    const raw = (cluster[feature] - extent[0]) / span;
                    // rimappa in [PADDING, 1-PADDING] per visibilità
                    norm[feature] = PADDING + raw * (1 - 2 * PADDING);
                }
            });
            return norm;
        });
        
        // Color scale
        const colorScale = d3.scaleOrdinal()
            .domain(normalized.map(d => d.cluster))
            .range(CONFIG.colors.clusters);
        
        // Funzione per generare path
        const radarLine = d3.lineRadial()
            .radius(d => rScale(d.value))
            .angle((d, i) => i * angleSlice)
            .curve(d3.curveLinearClosed);
        
        // Disegna radar per ogni cluster con transizioni
        const radarPaths = svg.selectAll('.radar-area')
            .data(normalized, d => d.cluster);
        
        // EXIT: rimuovi path vecchi con fade out
        radarPaths.exit()
            .transition()
            .duration(CONFIG.transition.duration)
            .style('opacity', 0)
            .remove();
        
        // ENTER: aggiungi nuovi path con fade in
        const radarEnter = radarPaths.enter()
            .append('path')
            .attr('class', 'radar-area')
            .style('fill', d => colorScale(d.cluster))
            .style('fill-opacity', 0)
            .style('stroke', d => colorScale(d.cluster))
            .style('stroke-width', 2);
        
        // UPDATE + ENTER: anima i path verso le nuove posizioni
        radarPaths.merge(radarEnter)
            .datum(d => features.map(f => ({ value: d[f] })))
            .transition()
            .duration(CONFIG.transition.duration)
            .attr('d', radarLine)
            .style('fill-opacity', 0.2);
        
        // Punti per ogni cluster
        normalized.forEach(cluster => {
            const values = features.map(f => ({ value: cluster[f] }));
            
            const points = svg.selectAll(`.radar-point-${cluster.cluster}`)
                .data(values);
            
            // EXIT
            points.exit()
                .transition()
                .duration(CONFIG.transition.duration)
                .attr('r', 0)
                .remove();
            
            // ENTER
            const pointsEnter = points.enter()
                .append('circle')
                .attr('class', `radar-point-${cluster.cluster}`)
                .attr('r', 0)
                .style('fill', colorScale(cluster.cluster));
            
            // UPDATE + ENTER
            points.merge(pointsEnter)
                .transition()
                .duration(CONFIG.transition.duration)
                .attr('cx', (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
                .attr('cy', (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
                .attr('r', 3);
        });
        
        // Legenda con etichette descrittive
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${radius + 20}, -${radius})`);
        
        legend.selectAll('g')
            .data(normalized)
            .join('g')
            .attr('transform', (d, i) => `translate(0, ${i * 22})`)
            .each(function(d) {
                const g = d3.select(this);
                g.append('rect')
                    .attr('width', 14)
                    .attr('height', 14)
                    .attr('rx', 3)
                    .attr('fill', colorScale(d.cluster))
                    .attr('opacity', 0.85);
                g.append('text')
                    .attr('x', 20)
                    .attr('y', 11)
                    .text(getClusterLabel(d.cluster))
                    .style('font-size', '11px')
                    .style('font-weight', d.cluster === 4 ? '700' : '400')
                    .style('fill', d.cluster === 4 ? '#e74c3c' : '#333');
            });
    }
    
    // Heatmap profili cluster (cluster × feature)
    static async createHeatmap(data, containerId) {
        d3.select(`#${containerId}`).selectAll('*').remove();
        
        const margin = { top: 80, right: 30, bottom: 120, left: 180 };
        const cellSize = 60;
        
        // Feature da mostrare
        const features = [
            'final_anomaly_score',
            'n_allact',
            'n_afterhourallact', 
            'n_email',
            'n_file',
            'n_logon'
        ];
        
        // Carica profili cluster dal CSV
        const clusterProfiles = await d3.csv('data/results/cluster_profiles_v2.csv');
        const clusterData = clusterProfiles.map(d => ({
            cluster: +d.cluster || +d[''] || 0,
            ...Object.fromEntries(features.map(f => [f, +d[f] || 0]))
        }));
        
        // Calcola min/max per ogni feature per normalizzazione
        const featureExtents = {};
        features.forEach(f => {
            const values = clusterData.map(c => c[f]);
            featureExtents[f] = d3.extent(values);
        });
        
        // Normalizza valori [0, 1] per colore
        const normalizedData = [];
        clusterData.forEach(cluster => {
            features.forEach(feature => {
                const [min, max] = featureExtents[feature];
                const normalized = max !== min ? (cluster[feature] - min) / (max - min) : 0.5;
                normalizedData.push({
                    cluster: cluster.cluster,
                    feature: feature,
                    value: cluster[feature],
                    normalized: normalized
                });
            });
        });
        
        const width = cellSize * features.length;
        const height = cellSize * clusterData.length;
        
        const svg = d3.select(`#${containerId}`)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Scale
        const x = d3.scaleBand()
            .domain(features)
            .range([0, width])
            .padding(0.05);
        
        const y = d3.scaleBand()
            .domain(clusterData.map(d => getClusterLabel(d.cluster)))
            .range([0, height])
            .padding(0.05);
        
        // Scala colore: rosso (basso) → giallo → verde (alto)
        const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
            .domain([0, 1]);
        
        // Tooltip
        const tooltip = d3.select('body').append('div').attr('class', 'tooltip');
        
        // Celle
        svg.selectAll('rect')
            .data(normalizedData)
            .join('rect')
            .attr('x', d => x(d.feature))
            .attr('y', d => y(getClusterLabel(d.cluster)))
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .attr('fill', d => colorScale(d.normalized))
            .attr('stroke', d => d.cluster === 4 ? '#e74c3c' : '#fff')
            .attr('stroke-width', d => d.cluster === 4 ? 2 : 1.5)
            .on('mouseover', function(event, d) {
                d3.select(this).attr('stroke', '#000').attr('stroke-width', 3);
                tooltip.html(`
                    <strong>${getClusterLabel(d.cluster)}</strong><br>
                    ${getLabel(d.feature)}: <strong>${d.value.toFixed(3)}</strong><br>
                    Posizione relativa: ${(d.normalized * 100).toFixed(0)}°%
                `)
                .style('opacity', 1)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 20) + 'px');
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke', d.cluster === 4 ? '#e74c3c' : '#fff')
                    .attr('stroke-width', d.cluster === 4 ? 2 : 1.5);
                tooltip.style('opacity', 0);
            });
        
        // Label X (feature)
        svg.selectAll('.label-x')
            .data(features)
            .join('text')
            .attr('class', 'label-x')
            .attr('x', d => x(d) + x.bandwidth() / 2)
            .attr('y', height + 15)
            .attr('text-anchor', 'end')
            .attr('transform', d => `rotate(-45, ${x(d) + x.bandwidth() / 2}, ${height + 15})`)
            .text(d => getLabel(d))
            .style('font-size', '12px')
            .style('font-weight', 'bold');
        
        // Label Y (cluster)
        svg.selectAll('.label-y')
            .data(clusterData)
            .join('text')
            .attr('class', 'label-y')
            .attr('x', -10)
            .attr('y', d => y(getClusterLabel(d.cluster)) + y.bandwidth() / 2)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .text(d => getClusterLabel(d.cluster))
            .style('font-size', '11px')
            .style('font-weight', d => d.cluster === 4 ? '700' : '500')
            .style('fill', d => d.cluster === 4 ? '#e74c3c' : '#333');
        
        // Titolo
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -50)
            .attr('text-anchor', 'middle')
            .text('Profili Cluster per Feature (normalizzati)')
            .style('font-size', '14px')
            .style('font-weight', 'bold');
        
        // Legenda colore
        const legendWidth = 200;
        const legendHeight = 15;
        const legend = svg.append('g')
            .attr('transform', `translate(${width - legendWidth - 20}, -40)`);
        
        const legendScale = d3.scaleLinear()
            .domain([0, legendWidth])
            .range([0, 1]);
        
        legend.selectAll('rect')
            .data(d3.range(legendWidth))
            .join('rect')
            .attr('x', d => d)
            .attr('y', 0)
            .attr('width', 1)
            .attr('height', legendHeight)
            .attr('fill', d => colorScale(legendScale(d)));
        
        legend.append('text')
            .attr('x', 0)
            .attr('y', -5)
            .text('Basso')
            .style('font-size', '10px');
        
        legend.append('text')
            .attr('x', legendWidth)
            .attr('y', -5)
            .attr('text-anchor', 'end')
            .text('Alto')
            .style('font-size', '10px');
    }
}
