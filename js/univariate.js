// univariate.js - istogramma per distribuzione anomaly score
// Riferimento: 080-simple-visualization-strategies (distribuzione univariata)

class UnivariateCharts {
    
    // funzione per creare l'istogramma
    static createHistogram(data, containerId) {
        // pulisco il contenitore prima di disegnare
        d3.select(`#${containerId}`).selectAll('*').remove();
        
        // dimensioni del grafico
        const margin = CONFIG.charts.margin;
        const width = CONFIG.charts.histogram.width - margin.left - margin.right;
        const height = CONFIG.charts.histogram.height - margin.top - margin.bottom;
        
        // creo l'SVG
        const svg = d3.select(`#${containerId}`)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // prendo solo gli anomaly score
        const scores = data.map(d => d.final_anomaly_score);
        
        // creo i bin per l'istogramma (20 bin)
        const bins = d3.bin()
            .domain(d3.extent(scores))
            .thresholds(20)(scores);
        
        // scale per x e y
        const x = d3.scaleLinear()
            .domain([bins[0].x0, bins[bins.length - 1].x1])
            .range([0, width]);
        
        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .nice()
            .range([height, 0]);
        
        // assi x e y
        const xAxis = d3.axisBottom(x).ticks(10);
        const yAxis = d3.axisLeft(y);
        
        // disegno asse x
        svg.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis);
        
        // disegno asse y
        svg.append('g')
            .attr('class', 'axis y-axis')
            .call(yAxis);
        
        // etichette degli assi
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('x', width / 2)
            .attr('y', height + 40)
            .attr('text-anchor', 'middle')
            .text('Anomaly Score');
        
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .text('Frequenza');
        
        // tooltip per mostrare info quando passo col mouse
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip');
        
        // disegno le barre dell'istogramma
        svg.selectAll('.bar')
            .data(bins)
            .join('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.x0) + 1)
            .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 2))
            .attr('y', height)  // parto dal basso
            .attr('height', 0)  // altezza zero per l'animazione
            .on('mouseover', function(event, d) {
                // cambio colore quando ci passo sopra
                d3.select(this).style('fill', CONFIG.colors.accent);
                // mostro tooltip
                tooltip.html(`Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)}<br>Count: ${d.length}`)
                    .style('opacity', 1)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 20) + 'px');
            })
            .on('mouseout', function() {
                // torno al colore originale
                d3.select(this).style('fill', CONFIG.colors.primary);
                tooltip.style('opacity', 0);
            })
            // animazione delle barre che crescono
            .transition()
            .duration(CONFIG.transition.duration)
            .attr('y', d => y(d.length))
            .attr('height', d => height - y(d.length));
    }
}
