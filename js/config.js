// config.js - file con tutte le impostazioni
// ho messo tutto qui così se devo cambiare qualcosa lo trovo subito
// NOTA: ho provato a mettere più colori ma alcuni non funzionavano bene
// Riferimento: 060-color (color encoding per categorie)

const CONFIG = {
    // dimensioni dei grafici (margini e roba varia)
    charts: {
        margin: { top: 40, right: 30, bottom: 60, left: 60 },  // margini
        width: 600,   // larghezza base
        height: 400,  // altezza base
        
        // alcune dimensioni specifiche per certi grafici
        histogram: {
            width: 500,
            height: 300
        },
        scatter: {
            width: 600,
            height: 450
        },
        parallel: {
            width: 1200,  // questo è più largo
            height: 400
        },
        radar: {
            radius: 180  // raggio del radar chart
        }
    },
    
    // colori che uso
    colors: {
        primary: '#3498db',      // blu
        secondary: '#2ecc71',    // verde
        accent: '#e74c3c',       // rosso
        warning: '#f39c12',      // arancione
        clusters: d3.schemeCategory10,  // colori automatici di D3
        insider: '#e74c3c',      // rosso per gli insider
        normal: '#2ecc71',       // verde per normali
        gradient: ['#667eea', '#764ba2']  // gradiente sfondo
    },
    
    // feature che visualizzo nei grafici
    features: {
        // per il parallel coordinates (10 feature)
        parallel: [
            'O', 'C', 'E', 'A', 'N',  // big five personality
            'n_logon', 'n_email', 'n_http',
            'n_afterhourallact', 'final_anomaly_score'
        ],
        
        // per il radar chart (6 feature)
        radar: [
            'n_logon', 'n_usb', 'n_file',
            'n_email', 'n_http', 'n_afterhourallact'
        ],
        
        // per la heatmap delle correlazioni (11 feature)
        heatmap: [
            'O', 'C', 'E', 'A', 'N',
            'n_logon', 'n_email', 'n_http',
            'n_afterhourallact', 'final_anomaly_score',
            'cluster_distance'
        ]
    },
    
    // parametri per le animazioni
    transition: {
        duration: 750,  // millisecondi
        delay: 50       // ritardo tra elementi
    },
    
    // offset tooltip
    tooltip: {
        offset: { x: 10, y: -20 }  // così non copre il mouse
    }
};

// etichette in italiano per le feature (così si capisce meglio)
const FEATURE_LABELS = {
    'O': 'Apertura',
    'C': 'Coscienziosità',
    'E': 'Estroversione',
    'A': 'Amicalità',
    'N': 'Nevroticismo',
    'n_logon': 'Logon',
    'n_usb': 'USB',
    'n_file': 'File',
    'n_email': 'Email',
    'n_http': 'HTTP',
    'n_afterhourallact': 'After-hour',
    'n_allact': 'Attività Totali',
    'final_anomaly_score': 'Anomaly Score',
    'cluster': 'Cluster',
    'cluster_distance': 'Distanza Cluster',
    'rank': 'Rank',
    'insider': 'Insider',
    'user_id': 'User ID'
};

// funzione helper che ho fatto per prendere le etichette
function getLabel(key) {
    return FEATURE_LABELS[key] || key;  // se non trova la label usa la chiave
}

// Etichette descrittive per i cluster — basate sui dati reali
// Cluster 4: 15/60 utenti sono insider (25%) — il cluster più anomalo
// final_anomaly_score medio non è affidabile per C4 perché ha valori estremi negativi
// che abbassano la media; i pattern comportamentali spiegano il rischio
const CLUSTER_LABELS = {
    0: 'C0 · Poco attivi, low logon',
    1: 'C1 · Attività fuori orario',
    2: 'C2 · Alta intensità in orario',
    3: 'C3 · Attivi in orario, molti file',
    4: 'C4 · ⚠ Insider (25% del gruppo)'
};

function getClusterLabel(cluster) {
    return CLUSTER_LABELS[cluster] ?? `Cluster ${cluster}`;
}
