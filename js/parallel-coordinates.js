// parallel-coordinates.js - coordinate parallele per dati multivariati
// ogni linea è un utente, ogni asse è una feature diversa
// Riferimento: 090-multivariate (tecniche per alta dimensionalità)

class ParallelCoordinates {
    constructor() {
        this.margin = { top: 50, right: 60, bottom: 30, left: 60 };
        // dimensioni da visualizzare sugli assi
        this.dimensioni = [
            { key: 'final_anomaly_score', label: 'Anomaly Score' },
            { key: 'n_allact',            label: 'Attività Tot.' },
            { key: 'n_afterhourallact',   label: 'After Hour' },
            { key: 'n_email',             label: 'Email' },
            { key: 'n_file',              label: 'File' },
            { key: 'rank',                label: 'Rank' }
        ];
    }
    // crea il grafico a coordinate parallele
    createParallelCoordinates(data, containerId) {
        const container = d3.select(`#${containerId}`);
        container.selectAll('*').remove();

        const width = container.node().getBoundingClientRect().width || 800;
        const height = 480;
        const w = width - this.margin.left - this.margin.right;
        const h = height - this.margin.top - this.margin.bottom;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // aggrego per user_id (media su tutte le settimane), 1 riga = 1 utente
        const byUser = d3.rollup(
            data,
            rows => ({
                user_id:              rows[0].user_id,
                cluster:              rows[0].cluster,
                insider:              rows[0].insider,
                final_anomaly_score:  d3.mean(rows, r => r.final_anomaly_score),
                n_allact:             d3.mean(rows, r => r.n_allact),
                n_afterhourallact:    d3.mean(rows, r => r.n_afterhourallact),
                n_email:              d3.mean(rows, r => r.n_email),
                n_file:               d3.mean(rows, r => r.n_file),
                rank:                 d3.mean(rows, r => r.rank),
            }),
            d => d.user_id
        );
        const utenti = Array.from(byUser.values());

        // campiono a max 200 utenti per leggibilità — con 300 linee è già denso
        const datiVisualizzati = utenti.length > 200
            ? utenti.sort(() => 0.5 - Math.random()).slice(0, 200)
            : utenti;

        // colori per cluster — stessa palette del resto della dashboard
        const colorScale = d3.scaleOrdinal()
            .domain([0, 1, 2, 3, 4])
            .range(CONFIG.colors.clusters);

        // scala x: posizione di ogni asse (una per dimensione)
        const x = d3.scalePoint()
            .domain(this.dimensioni.map(d => d.key))
            .range([0, w])
            .padding(0.2);

        // scala y separata per ogni dimensione (valori molto diversi tra loro)
        const scaleY = {};
        this.dimensioni.forEach(dim => {
            scaleY[dim.key] = d3.scaleLinear()
                .domain(d3.extent(utenti, d => d[dim.key]))
                .range([h, 0])
                .nice();
        });

        // generatore di linea per ogni utente
        const lineGen = d3.line()
            .defined(d => !isNaN(d[1]))
            .x(d => x(d[0]))
            .y(d => scaleY[d[0]](d[1]));

        // linee di sfondo grigie (context) — mostrano il pattern generale
        g.append('g')
            .attr('class', 'sfondo')
            .selectAll('path')
            .data(datiVisualizzati)
            .join('path')
            .attr('d', d => lineGen(this.dimensioni.map(dim => [dim.key, d[dim.key]])))
            .attr('fill', 'none')
            .attr('stroke', '#ddd')
            .attr('stroke-width', 1)
            .attr('opacity', 0.3);

        // linee colorate per cluster (focus)
        // uso attr('stroke', ...) inline invece di classe CSS per evitare
        // che il foglio di stile sovrascriva i colori del cluster
        g.append('g')
            .attr('class', 'primo-piano')
            .selectAll('path')
            .data(datiVisualizzati)
            .join('path')
            .attr('class', 'linea-parallela')
            .attr('d', d => lineGen(this.dimensioni.map(dim => [dim.key, d[dim.key]])))
            .attr('fill', 'none')
            .attr('stroke', d => colorScale(d.cluster))
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.6)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', 3)
                    .attr('opacity', 1)
                    .raise();  // porta in primo piano

                d3.select('body').append('div')
                    .attr('class', 'tooltip')
                    .style('opacity', 0)
                    .html(`
                        <strong>User ${d.user_id}</strong><br>
                        ${getClusterLabel(d.cluster)}<br>
                        Insider: ${d.insider === 1 ? 'Sì' : 'No'}<br>
                        Score: ${d.final_anomaly_score.toFixed(3)}<br>
                        Rank: ${d.rank}
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px')
                    .transition().duration(200).style('opacity', 0.95);
            })
            .on('mouseout', function() {
                d3.select(this).attr('stroke-width', 1.5).attr('opacity', 0.6);
                d3.selectAll('.tooltip').remove();
            });

        // assi verticali per ogni dimensione
        const assi = g.selectAll('.asse-dimensione')
            .data(this.dimensioni)
            .join('g')
            .attr('class', 'asse-dimensione')
            .attr('transform', d => `translate(${x(d.key)},0)`);

        assi.append('g')
            .each(function(d) {
                d3.select(this).call(d3.axisLeft(scaleY[d.key]).ticks(6));
            })
            .append('text')
            .attr('fill', '#000')
            .attr('text-anchor', 'middle')
            .attr('y', -12)
            .attr('font-weight', 'bold')
            .text(d => d.label);

        // nota informativa in basso
        svg.append('text')
            .attr('x', this.margin.left)
            .attr('y', height - 5)
            .style('font-size', '10px')
            .style('fill', '#888')
            .text(`${datiVisualizzati.length} utenti visualizzati${data.length > 200 ? ' (campionati)' : ''} su 6 dimensioni`);

        // legenda cluster
        const legenda = svg.append('g')
            .attr('transform', `translate(${width - this.margin.right - 80}, ${this.margin.top})`);

        [0, 1, 2, 3, 4].forEach((cluster, i) => {
            const riga = legenda.append('g')
                .attr('transform', `translate(0, ${i * 20})`);

            riga.append('line')
                .attr('x1', 0).attr('x2', 22)
                .attr('y1', 8).attr('y2', 8)
                .attr('stroke', colorScale(cluster))
                .attr('stroke-width', 2.5);

            riga.append('text')
                .attr('x', 27).attr('y', 12)
                .text(`C${cluster}`)
                .style('font-size', '11px')
                .style('font-weight', cluster === 4 ? '700' : '400')
                .style('fill', cluster === 4 ? '#e74c3c' : '#333');
        });
    }
}
