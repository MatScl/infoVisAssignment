# Dashboard Insider Threat Detection
Corso: Visualizzazione delle Informazioni — A.A. 2024/25

Dashboard interattiva per l'analisi di comportamenti anomali su dati aziendali simulati (CERT r4.2). Costruita con D3.js v7, senza framework, senza backend.

---

## Avvio rapido

```bash
python -m http.server 8000
```
Apri il browser su `http://localhost:8000`

---

## Il progetto

Punto di arrivo di una pipeline che parte da **Sistemi Intelligenti per Internet**: lì vengono rilevate le anomalie con Isolation Forest e K-Means, qui quelle anomalie diventano esplorabili visivamente.

**Dataset:** CERT Insider Threat Dataset r4.2 — 300 utenti × 8 settimane = 2400 righe. 15 insider reali distribuiti in 5 cluster comportamentali.

---

## Struttura

```
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js
│   ├── data-loader.js
│   ├── univariate.js
│   ├── bivariate.js
│   ├── trivariate.js
│   ├── temporal.js
│   ├── parallel-coordinates.js
│   ├── multivariate.js
│   ├── interactions.js
│   └── main.js
├── data/
│   └── results/
└── start_server.py
```

---

## Visualizzazioni

| Grafico | Task | Tecnica D3 |
|---------|------|------------|
| Istogramma | Distribuzione score anomalia | `d3.bin()` |
| Scatter rank vs score | Identificare outlier | `scaleLinear` + colore insider |
| Scatter trivariato | 4 variabili simultanee | `scaleSqrt` per area cerchi |
| Line chart | Evoluzione temporale per cluster | `d3.rollup` + `curveMonotoneX` |
| Parallel coordinates | Outlier multidimensionali | `scalePoint` + scale Y indipendenti |
| Radar chart | Profili medi per cluster | `d3.lineRadial` + normalizzazione locale |
| Heatmap | Matrice cluster × feature | `scaleBand` + `interpolateRdYlGn` |

---

## Interazioni

Tutti i grafici sono coordinati — ogni filtro si propaga immediatamente a tutte le visualizzazioni:

- **Cluster** — multi-select (C0 … C4)
- **Tipo utente** — tutti / solo insider / solo normali
- **Score range** — doppio slider sui valori reali
- **Reset** — ripristina tutto

---

## Stack tecnico

- D3.js v7 (CDN)
- JavaScript ES6 — classi separate per ogni grafico
- CSS Grid — sidebar 280px + griglia grafici
- Python HTTP server — necessario per CORS con `d3.csv`
