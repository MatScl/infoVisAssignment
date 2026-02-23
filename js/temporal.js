// temporal.js - line chart per evoluzione temporale dello score per cluster
// mostra come cambia l'anomaly score medio settimana per settimana
// Riferimento: 080-simple-visualization-strategies (time series)

class TemporalCharts {
    constructor() {
        // margini del grafico
        this.margin = { top: 40, right: 120, bottom: 70, left: 60 };
    }

    // crea il line chart con una linea per ogni cluster
    createLineChart(data, containerId) {
        const container = d3.select(`#${containerId}`);
        container.selectAll('*').remove();

        // prendo la larghezza del contenitore per essere responsivo
        const width = container.node().getBoundingClientRect().width || 800;
        const height = 450;
        const w = width - this.margin.left - this.margin.right;
        const h = height - this.margin.top - this.margin.bottom;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // aggrego i dati per (cluster, week) → media dello score
        // d3.rollup restituisce una Map annidata: cluster → week → mean(score)
        const aggregato = d3.rollup(
            data,
            v => d3.mean(v, d => d.final_anomaly_score),
            d => +d.cluster,
            d => +d.week
        );

        console.log('Temporal chart - cluster aggregati:', aggregato.size);

        // converto la Map in array di oggetti {cluster, punti:[{week,score}]}
        const linee = [];
        aggregato.forEach((settimane, cluster) => {
            const punti = [];
            settimane.forEach((score, week) => {
                punti.push({ week, score });
            });
            punti.sort((a, b) => a.week - b.week);
            linee.push({ cluster, punti });
        });

        // scala x: settimane 1-8
        const x = d3.scaleLinear()
            .domain([1, 8])
            .range([0, w]);

        // scala y: da 0 al massimo score
        const y = d3.scaleLinear()
            .domain([0, d3.max(linee, d => d3.max(d.punti, p => p.score))])
            .nice()
            .range([h, 0]);

        // colori per cluster — stessa palette degli altri grafici
        const colorScale = d3.scaleOrdinal()
            .domain([0, 1, 2, 3, 4])
            .range(CONFIG.colors.clusters);

        // asse x con etichette settimane
        g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${h})`)
            .call(d3.axisBottom(x).ticks(8).tickFormat(d => `Sett. ${d}`))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-35)');

        // asse y
        g.append('g')
            .attr('class', 'axis y-axis')
            .call(d3.axisLeft(y));

        // etichetta asse x
        svg.append('text')
            .attr('class', 'axis-label')
            .attr('x', this.margin.left + w / 2)
            .attr('y', height - 5)
            .attr('text-anchor', 'middle')
            .text('Settimana');

        // etichetta asse y
        g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -h / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .text('Score Anomalia Medio');

        // generatore di linea con curva smooth (no artefatti agli estremi)
        const lineGen = d3.line()
            .x(d => x(d.week))
            .y(d => y(d.score))
            .curve(d3.curveMonotoneX);

        // disegno le linee
        const paths = g.selectAll('.linea-cluster')
            .data(linee)
            .join('path')
            .attr('class', 'linea-cluster')
            .attr('fill', 'none')
            .attr('stroke', d => colorScale(d.cluster))
            .attr('stroke-width', 2.5)
            .attr('d', d => lineGen(d.punti));

        // animazione: la linea si "disegna" da sinistra a destra
        paths.each(function() {
            const len = this.getTotalLength();
            d3.select(this)
                .attr('stroke-dasharray', `${len} ${len}`)
                .attr('stroke-dashoffset', len)
                .transition()
                .duration(1500)
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0);
        });

        // punti interattivi su ogni settimana
        linee.forEach(linea => {
            const punti = g.selectAll(`.punto-cluster-${linea.cluster}`)
                .data(linea.punti)
                .join('circle')
                .attr('class', `punto-cluster-${linea.cluster}`)
                .attr('cx', d => x(d.week))
                .attr('cy', d => y(d.score))
                .attr('r', 0)
                .attr('fill', colorScale(linea.cluster))
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5);

            // i punti appaiono dopo che la linea è finita di disegnarsi
            punti.transition()
                .delay(1500)
                .duration(400)
                .attr('r', 4);

            // tooltip al hover
            punti.on('mouseover', function(event, d) {
                d3.select(this).transition().duration(150).attr('r', 7);
                d3.select('body').append('div')
                    .attr('class', 'tooltip')
                    .style('opacity', 0)
                    .html(`
                        <strong>${getClusterLabel(linea.cluster)}</strong><br>
                        Settimana: ${d.week}<br>
                        Score medio: ${d.score.toFixed(3)}
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px')
                    .transition().duration(200).style('opacity', 0.95);
            })
            .on('mouseout', function() {
                d3.select(this).transition().duration(150).attr('r', 4);
                d3.selectAll('.tooltip').remove();
            });
        });

        // legenda con etichette descrittive
        const legenda = svg.append('g')
            .attr('transform', `translate(${width - this.margin.right + 5}, ${this.margin.top})`);

        linee.forEach((linea, i) => {
            const riga = legenda.append('g')
                .attr('transform', `translate(0, ${i * 25})`);

            riga.append('line')
                .attr('x1', 0).attr('x2', 22)
                .attr('y1', 10).attr('y2', 10)
                .attr('stroke', colorScale(linea.cluster))
                .attr('stroke-width', 2.5);

            riga.append('circle')
                .attr('cx', 11).attr('cy', 10).attr('r', 4)
                .attr('fill', colorScale(linea.cluster))
                .attr('stroke', '#fff').attr('stroke-width', 1.5);

            riga.append('text')
                .attr('x', 27).attr('y', 14)
                .style('font-size', '11px')
                .style('font-weight', linea.cluster === 4 ? '700' : '400')
                .style('fill', linea.cluster === 4 ? '#e74c3c' : '#333')
                .text(`C${linea.cluster}`);
        });
    }
}
