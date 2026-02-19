# Dashboard Insider Threat - Progetto InfoVis

**Corso**: Visualizzazione delle Informazioni  
**A.A.**: 2024/25

## Descrizione

Dashboard per visualizzare pattern anomali in dati di insider threat (minacce interne aziendali).

Dataset CERT r4.2 con 300 utenti e 670+ feature comportamentali.

## Tecnologie

- **JavaScript ES6+** - classi, async/await
- **D3.js v7** - scale, assi, transizioni, statistiche
- **HTML5 + CSS3** - Grid layout, SVG
- **DOM API** - manipolazione dinamica

## Visualizzazioni

Il progetto implementa **7 grafici** che coprono progressivamente i concetti del corso:

### 1. Histogram (univariata)
Distribuzione anomaly score con 20 bins - mostra outlier e normalità

### 2. Scatterplot (bivariata)
Relazione rank vs score, colore per insider/normale - verifica consistenza ranking

### 3. Scatter Colorato (trivariata)
After-hour vs score con encoding multipli:
- Posizione X/Y = afterhour activity vs anomaly score
- Colore = cluster (0-4)
- Dimensione cerchi = volume totale attività

### 4. Line Chart (temporale)  NUOVO
Evoluzione score medio per cluster nelle 8 settimane:
- 5 linee colorate (1 per cluster)
- Mostra trend temporali e escalation comportamentale
- Animazione stroke-dasharray

### 5. Parallel Coordinates (multivariata)  NUOVO
6 dimensioni simultanee per confrontare profili utente:
- anomaly_score, n_allact, n_afterhour, n_email, n_file, pagerank
- Sampling intelligente (max 200 utenti per performance)
- Colore per cluster, hover per dettagli

### 6. Radar Chart (multivariata)
Profili medi dei 5 cluster su 6 dimensioni normalizzate

### 7. Heatmap (multivariata)
Matrice correlazioni 11×11 tra feature comportamentali

## Interazioni

- **Filtri**: cluster, tipo utente, range score
- **Tooltip**: dettagli on-demand
- **Transizioni**: animazioni D3

## Avvio

Serve un server HTTP locale per CORS:

\`\`\`bash
python start_server.py
# oppure
python -m http.server 8000
\`\`\`

Aprire **http://localhost:8000**

## Documentazione

La documentazione estesa è stata raccolta nella cartella `_docs/` (tenuta fuori dal repo tramite `.gitignore`).

File principali:
- `_docs/DOCUMENTAZIONE_UNICA_PRESENTAZIONE.md` — testo unico “da presentazione” (contesto → task → spiegazione codice)
- `_docs/SCOPO_PROGRAMMA.md` — scopo + provenienza dataset + razionale
- `_docs/SPIEGAZIONE_COMPLETA.md` — walkthrough tecnico di come gira la dashboard
- `_docs/TASK_UTENTE_CONCRETI.md` — task pratici dell’analista (scenario)

## Struttura

```
progetto finale/
├── index.html                 # Dashboard principale
├── css/style.css              # Styling (372 righe)
├── js/
│   ├── config.js              # Configurazione globale
│   ├── data-loader.js         # Caricamento CSV (179 righe)
│   ├── univariate.js          # Histogram (107 righe)
│   ├── bivariate.js           # Scatter plots (122 righe)
│   ├── trivariate.js          # Scatter 3D encoded (145 righe)
│   ├── temporal.js            # Line chart ( 210 righe)
│   ├── parallel-coordinates.js # Parallel coords ( 190 righe)
│   ├── multivariate.js        # Radar + Heatmap (263 righe)
│   ├── interactions.js        # Filtri dinamici (170 righe)
│   └── main.js                # Inizializzazione (145 righe)
├── data/
│   ├── raw/
│   │   └── user_features_extended.csv
│   └── results/
│       ├── anomalies_extended.csv      # 2400 righe (300 user × 8 week)
│       ├── cluster_profiles.csv        # Per radar chart
│       └── correlation_matrix.csv      # Per heatmap
└── scripts/                   # Python preprocessing (non parte della webapp)
    ├── enrich_dataset.py
    └── analyze_temporal_data.py
```

**Totale JavaScript**: ~1530 righe (da ~1200 prima dell'aggiunta)
└── data/results/anomalies_extended.csv
\`\`\`

## Dataset

300 utenti × 670 feature: personality, attività, anomaly score, cluster, insider flag

## Note

- ~1200 righe JS totali
- Approccio accademico: graduale da uni a multivariata
- Codice commentato in italiano
