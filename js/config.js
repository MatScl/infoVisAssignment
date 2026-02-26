const CONFIG = {
    charts: {
        margin: { top: 40, right: 30, bottom: 60, left: 60 },
        width: 600,
        height: 400,
        histogram: {
            width: 500,
            height: 300
        },
        scatter: {
            width: 600,
            height: 450
        },
        parallel: {
            width: 1200,
            height: 400
        },
        radar: {
            radius: 180
        }
    },

    colors: {
        primary: '#3498db',
        secondary: '#2ecc71',
        accent: '#e74c3c',
        warning: '#f39c12',
        clusters: d3.schemeCategory10,
        insider: '#e74c3c',
        normal: '#2ecc71',
        gradient: ['#667eea', '#764ba2']
    },

    features: {
        parallel: [
            'O', 'C', 'E', 'A', 'N',
            'n_logon', 'n_email', 'n_http',
            'n_afterhourallact', 'final_anomaly_score'
        ],
        radar: [
            'n_logon', 'n_usb', 'n_file',
            'n_email', 'n_http', 'n_afterhourallact'
        ],
        heatmap: [
            'O', 'C', 'E', 'A', 'N',
            'n_logon', 'n_email', 'n_http',
            'n_afterhourallact', 'final_anomaly_score',
            'cluster_distance'
        ]
    },

    transition: {
        duration: 750,
        delay: 50
    },

    tooltip: {
        offset: { x: 10, y: -20 }
    }
};

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

function getLabel(key) {
    return FEATURE_LABELS[key] || key;
}

// Cluster 4: 15/60 utenti sono insider (25%) — il cluster più anomalo.
// L'anomaly score medio di C4 è fuorviante per via di valori estremi negativi;
// i pattern comportamentali (after-hour, USB, file) sono l'indicatore reale.
const CLUSTER_LABELS = {
    0: 'C0 · Poco attivi, low logon',
    1: 'C1 · Attività fuori orario',
    2: 'C2 · Alta intensità in orario',
    3: 'C3 · Attivi in orario, molti file',
    4: 'C4 · Insider (25% del gruppo)'
};

function getClusterLabel(cluster) {
    return CLUSTER_LABELS[cluster] ?? `Cluster ${cluster}`;
}
