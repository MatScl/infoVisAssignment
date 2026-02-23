// bivariate.js - scatterplot per relazione tra 2 variabili
// Riferimento: 080-simple-visualization-strategies (relazioni bivariate)

class BivariateCharts {
    
    // scatterplot che mostra rank vs score
    static createScatterRankScore(data, containerId) {
        console.log('Creo scatterplot con', data.length, 'punti');
        
        // pulisco il container
        d3.select(`#${containerId}`).selectAll('*').remove();
        
        const margin = CONFIG.charts.margin;
        const width = CONFIG.charts.scatter.width - margin.left - margin.right;
        const height = CONFIG.charts.scatter.height - margin.top - margin.bottom;
        
        const svg = d3.select(`#${containerId}`)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // scale per x e y
        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.rank)])
            .range([0, width]);
        
        const y = d3.scaleLinear()
            .domain([d3.min(data, d => d.final_anomaly_score), 
                     d3.max(data, d => d.final_anomaly_score)])
            .nice()
            .range([height, 0]);
        
        const colorScale = d => d.insider === 1 ? CONFIG.colors.insider : CONFIG.colors.normal;
        
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
            .text('Rank (1 = più anomalo)');
        
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
            .data(data)
            .join('circle')
            .attr('class', d => `dot ${d.insider === 1 ? 'insider' : 'normal'}`)
            .attr('cx', d => x(d.rank))
            .attr('cy', d => y(d.final_anomaly_score))
            .attr('r', 0)
            .attr('fill', colorScale)
            .on('mouseover', function(event, d) {
                d3.select(this).attr('r', 8);
                tooltip.html(`
                    <strong>User ${d.user_id}</strong><br>
                    Rank: ${d.rank}<br>
                    Score: ${d.final_anomaly_score.toFixed(2)}<br>
                    Cluster: ${d.cluster}<br>
                    Tipo: ${d.insider === 1 ? 'Insider' : 'Normale'}
                `)
                .style('opacity', 1)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 20) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('r', 4);
                tooltip.style('opacity', 0);
            })
            .transition()
            .duration(CONFIG.transition.duration)
            .delay((d, i) => i * 5)
            .attr('r', 4);
        
        // Legenda
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 120}, 20)`);
        
        const legendData = [
            { label: 'Insider', color: CONFIG.colors.insider },
            { label: 'Normale', color: CONFIG.colors.normal }
        ];
        
        legend.selectAll('g')
            .data(legendData)
            .join('g')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`)
            .each(function(d) {
                const g = d3.select(this);
                g.append('circle')
                    .attr('r', 5)
                    .attr('fill', d.color);
                g.append('text')
                    .attr('x', 10)
                    .attr('y', 5)
                    .text(d.label);
            });
    }
}
