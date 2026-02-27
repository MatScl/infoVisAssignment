// trivariate.js - grafici con 3 variabili
// scatter con colore (cluster) e dimensione (attività)
// Riferimento: 090-multivariate (encoding multipli per alta dimensionalità)

class TrivariateCharts {
    
    // scatterplot con 3 encoding: x, y, colore, dimensione
    static createColoredScatter(data, containerId) {
        // Aggrega per utente: media delle variabili continue, insider e cluster fissi
        const byUser = d3.rollup(
            data,
            rows => ({
                user_id: rows[0].user_id,
                n_afterhourallact: d3.mean(rows, r => r.n_afterhourallact),
                final_anomaly_score: d3.mean(rows, r => r.final_anomaly_score),
                n_allact: d3.mean(rows, r => r.n_allact),
                cluster: rows[0].cluster,
                insider: rows[0].insider,
            }),
            d => d.user_id
        );
    const aggData = Array.from(byUser.values());
    // Sposta la forzatura a intero PRIMA della creazione della colorScale
    aggData.forEach(d => d.cluster = Math.round(+d.cluster));

    // DEBUG: stampa i valori di cluster e la domain della colorScale
    setTimeout(() => {
      console.log('DEBUG cluster values:', aggData.map(d => d.cluster));
      const domain = [...new Set(aggData.map(d => d.cluster))].sort();
      console.log('DEBUG colorScale domain:', domain);
      // La colorScale vera viene creata qui sotto, dopo la forzatura
      // quindi ora la domain sarà corretta
    }, 0);
        
        const margin = { top: 40, right: 150, bottom: 60, left: 60 };
        const container = d3.select(`#${containerId}`);
        container.selectAll('*').remove();
        const containerWidth = Math.min(
            container.node().getBoundingClientRect().width || CONFIG.charts.parallel.width,
            CONFIG.charts.parallel.width
        );
        const width = containerWidth - margin.left - margin.right;
        const height = CONFIG.charts.scatter.height - margin.top - margin.bottom;
        
        const svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Scale
        const x = d3.scaleLinear()
            .domain(d3.extent(aggData, d => d.n_afterhourallact))
            .nice()
            .range([0, width]);
        
        const y = d3.scaleLinear()
            .domain(d3.extent(aggData, d => d.final_anomaly_score))
            .nice()
            .range([height, 0]);
        
        // La colorScale ora viene creata DOPO la forzatura a intero
        const colorScale = d3.scaleOrdinal()
            .domain([...new Set(aggData.map(d => d.cluster))].sort())
            .range(CONFIG.colors.clusters);
        
        const sizeScale = d3.scaleSqrt()
            .domain(d3.extent(aggData, d => d.n_allact))
            .range([3, 15]);
        
        // Assi
        svg.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));
        
        svg.append('g')
            .attr('class', 'axis y-axis')
            .call(d3.axisLeft(y));
        
        // Label
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('x', width / 2)
            .attr('y', height + 40)
            .attr('text-anchor', 'middle')
            .text('Attività After-Hour');
        
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .text('Anomaly Score');
        
        // Tooltip
        const tooltip = d3.select('body').append('div').attr('class', 'tooltip');
        
        // Points
        svg.selectAll('.dot')
            .data(aggData)
            .join('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(d.n_afterhourallact))
            .attr('cy', d => y(d.final_anomaly_score))
            .attr('r', 0)
            .attr('fill', d => {
                const color = colorScale(d.cluster);
                console.log('DEBUG fill', {cluster: d.cluster, color});
                return color;
            })
            .attr('opacity', 0.7)
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', 2)
                    .attr('opacity', 1);
                
                tooltip.html(`
                    <strong>User ${d.user_id}</strong><br>
                    After-hour medio: ${d.n_afterhourallact.toFixed(1)}<br>
                    Score medio: ${d.final_anomaly_score.toFixed(2)}<br>
                    Cluster: ${d.cluster}<br>
                    Tot. Attività media: ${d.n_allact.toFixed(0)}<br>
                    Tipo: ${d.insider === 1 ? '⚠ Insider' : 'Normale'}
                `)
                .style('opacity', 1)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 20) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('stroke-width', 1)
                    .attr('opacity', 0.7);
                tooltip.style('opacity', 0);
            })
            .transition()
            .duration(CONFIG.transition.duration)
            .delay((d, i) => i * 3)
            .attr('r', d => sizeScale(d.n_allact));
        
        // Legenda Cluster
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width + 20}, 0)`);
        
        const clusters = [...new Set(aggData.map(d => d.cluster))].sort();
        
        legend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('font-weight', 'bold')
            .text('Cluster');
        
        legend.selectAll('.legend-item')
            .data(clusters)
            .join('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20 + 20})`)
            .each(function(d) {
                const g = d3.select(this);
                g.append('circle')
                    .attr('r', 6)
                    .attr('fill', colorScale(d));
                g.append('text')
                    .attr('x', 12)
                    .attr('y', 4)
                    .attr('font-size', '12px')
                    .text(`Cluster ${d}`);
            });
        
        // Legenda dimensione
        legend.append('text')
            .attr('x', 0)
            .attr('y', clusters.length * 20 + 40)
            .attr('font-weight', 'bold')
            .text('Dimensione');
        
        const sizeValues = [
            d3.min(aggData, d => d.n_allact),
            d3.mean(aggData, d => d.n_allact),
            d3.max(aggData, d => d.n_allact)
        ];
        
        legend.selectAll('.size-legend')
            .data(sizeValues)
            .join('g')
            .attr('class', 'size-legend')
            .attr('transform', (d, i) => `translate(0, ${clusters.length * 20 + 60 + i * 25})`)
            .each(function(d) {
                const g = d3.select(this);
                g.append('circle')
                    .attr('r', sizeScale(d))
                    .attr('fill', 'gray')
                    .attr('opacity', 0.5);
                g.append('text')
                    .attr('x', 20)
                    .attr('y', 4)
                    .attr('font-size', '11px')
                    .text(d.toFixed(0));
            });
    }
}
