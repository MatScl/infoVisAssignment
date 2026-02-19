#!/usr/bin/env python3
"""
Script per avviare un server HTTP locale per la dashboard InfoVis
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Aggiungi headers CORS per permettere caricamento CSV
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    # Cambia directory alla root del progetto
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("=" * 60)
    print("🚀 SERVER HTTP LOCALE - Dashboard InfoVis")
    print("=" * 60)
    print(f"\n📂 Directory: {os.getcwd()}")
    print(f"🌐 Porta: {PORT}")
    print(f"🔗 URL: http://localhost:{PORT}\n")
    
    # Verifica che il file CSV esista (quello effettivamente usato dalla dashboard)
    csv_path = "data/results/anomalies_temporal_v2.csv"
    if os.path.exists(csv_path):
        print(f"✅ Dataset trovato: {csv_path}")
    else:
        print(f"⚠️  ATTENZIONE: {csv_path} non trovato!")
        print("   La dashboard potrebbe non funzionare correttamente.\n")
    
    print("=" * 60)
    print("Premi CTRL+C per fermare il server")
    print("=" * 60)
    print()
    
    # Avvia server
    Handler = MyHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            # Apri browser automaticamente
            url = f"http://localhost:{PORT}"
            print(f"🌍 Apertura browser su {url}...\n")
            webbrowser.open(url)
            
            # Resta in ascolto
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n👋 Server fermato. Arrivederci!")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"\n❌ ERRORE: La porta {PORT} è già in uso!")
            print(f"   Prova a cambiare porta o chiudi l'altra applicazione.\n")
            sys.exit(1)
        else:
            raise

if __name__ == "__main__":
    main()
