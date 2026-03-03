Progetto: GT7 Logo Designer - SVG Export Tool
1. Obiettivo del Progetto

Creare una Single Page Application (SPA) specializzata per Gran Turismo 7 che permetta ai giocatori di creare loghi personalizzati per le loro auto, visualizzando un testo con font specifici ed esportandolo come file SVG ottimizzato per i requisiti del gioco (sotto 15KB), garantendo compatibilità totale con il sistema di decalcomanie di GT7.
2. Stack Tecnologico Consigliato

    Framework: Next.js (App Router) o React + Vite.

    Styling: Tailwind CSS (per un'interfaccia pulita e moderna).

    Icone: Lucide-React.

    Gestione Font: Opentype.js (Fondamentale per convertire i glifi del font in tracciati SVG path).

3. Requisiti Funzionali
A. Selezione Font

    Font di Sistema: Un menu a tendina con una selezione di font standard (Sans-serif, Serif, Monospace).

    Custom Font: Un'area di drag-and-drop o un pulsante di upload che accetti file .ttf, .otf e .woff.

    Stato: Il font caricato deve essere applicato immediatamente all'anteprima.

B. Input Testo

    Campo di input testuale.

    Vincolo: Massimo 20 caratteri (con contatore visivo).

    Live Preview: L'anteprima si aggiorna in tempo reale mentre l'utente scrive.

C. Esportazione SVG

    Colore: Nero (#000000).

    Sfondo: Trasparente.

    Metodo di generazione: Il file SVG deve contenere tag <path> (vettorializzazione dei caratteri) e non tag <text>, per assicurare che la scritta appaia identica ovunque senza richiedere il font.

    Download: Pulsante "Export SVG" che triggera il download immediato.

4. Interfaccia Utente (UI UX)

    Layout: Centrato, stile "Tool" minimale (simile a un convertitore online moderno).

    Area Anteprima: Un box spazioso al centro con una griglia leggera di background (opzionale) per enfatizzare la trasparenza.

    Pannello Controlli: Posto lateralmente o sotto l'anteprima.

    Feedback: Notifica di successo al download o messaggio di errore se il file font non è valido.

5. Logica di Implementazione (Note Tecniche per l'AI)

    Caricamento Font: Utilizzare FileReader per leggere il file caricato come ArrayBuffer.

    Parsing: Passare l'ArrayBuffer a opentype.loadFromBuffer.

    Generazione Path: Usare il metodo font.getPath(text, x, y, fontSize) di opentype.js per ottenere i dati del tracciato.

    Costruzione File: Inserire i dati del path in una stringa template <svg>...</svg> con i viewBox calcolati correttamente in base alla lunghezza del testo.

6. Logica di Ottimizzazione (Integrazione SVGO)

* **Libreria:** Utilizzare `svgo` (versione 4.0.0+) per la pulizia e ottimizzazione del codice SVG generato.

* **Flusso di Ottimizzazione:**
    1. Generazione path tramite `opentype.js`.
    2. Creazione stringa SVG raw.
    3. Verifica dimensione file: se supera 15 KB, viene attivata l'ottimizzazione.
    4. Passaggio della stringa a `svgo.optimize` con configurazione personalizzata.
    5. Mostra dialogo all'utente con confronto dimensioni originale/ottimizzata.
    6. Download del risultato finale (originale o ottimizzato a scelta dell'utente).

* **Configurazione SVGO (`lib/svgOptimizer.ts`):**
    * `multipass: true` - Esegue più passaggi per massima compressione.
    * `floatPrecision: 2` - Precisione decimale impostata a 2 per bilanciare qualità e dimensione.
    * `removeViewBox: false` - Preserva il viewBox per mantenere le proporzioni corrette.
    * Plugin attivi:
        - Rimozione elementi non necessari (doctype, commenti, metadata, attributi vuoti).
        - Ottimizzazione path (merge, conversione trasformazioni).
        - Pulizia attributi e stili.
        - Conversione forme in path quando possibile.
        - Rimozione elementi nascosti e contenitori vuoti.

* **Componente CompressionDialog (`components/CompressionDialog.tsx`):**
    * Dialogo modale che mostra:
        - Dimensione file originale e ottimizzata.
        - Percentuale di riduzione ottenuta.
        - Indicatore visivo se il file ottimizzato è sotto i 15 KB (compatibile Gran Turismo 7).
        - Avviso se il file ottimizzato supera ancora i 15 KB.
    * Opzioni disponibili:
        - Scarica file ottimizzato (consigliato).
        - Scarica file originale (senza ottimizzazione).
        - Annulla operazione.

* **Funzioni Utilità (`lib/svgOptimizer.ts`):**
    * `optimizeSVG(svgContent: string): string` - Ottimizza un SVG e restituisce il risultato.
    * `optimizeSVGWithInfo(svgContent: string)` - Ottimizza e restituisce informazioni dettagliate sulla compressione (dimensioni, percentuale di riduzione).

* **Comportamento:**
    * Se il file SVG generato è già sotto i 15 KB, viene scaricato direttamente senza ottimizzazione.
    * Se supera i 15 KB, viene automaticamente ottimizzato e mostrato il dialogo con le opzioni.
    * L'utente può sempre scegliere di scaricare la versione originale o quella ottimizzata.
    * In caso di errore durante l'ottimizzazione, viene utilizzato il file originale.

    ---
## 7. Funzionalità Avanzate per il Mercato Professionale
* **Anteprima Testo:**
    * Background chiaro per garantire visibilità del font nero.
    * Anteprima sempre visibile con contrasto ottimale.
* **Controlli Colore:**
    * Selettore colore principale per fill/outline.
    * In Outline Mode: selettore colore outline + spessore stroke (1-10px).
    * Opzione riempimento trasparente o colore personalizzato.
* **Controlli Tipografici (collassabili):**
    * Pannello "Controlli Avanzati" nascosto di default, apribile con clic.
    * Slider "Skew" (Inclinazione): range -25deg / +25deg.
    * Slider "Tracking" (Spaziatura): range -5px / +50px.
    * Toggle "Outline Mode" con controlli colore dedicati.
    * Dimensione font fissa a 48px per ottimizzare dimensioni SVG.
* **Esportazione Pro:**
    * Il file deve chiamarsi `[testo]-logo.svg`.
    * Calcolo dinamico `getPaths().getBoundingBox()` per un viewBox perfetto.
    * SVGO deve rimuovere i `data-name` e gli ID ridondanti per garantire l'anonimato del codice sorgente.

## 8. Design System (Motorsport Aesthetic)
* **Tema:** Dark Mode obbligatoria (Sfondo #0a0a0a, Accenti #ff3e3e o Giallo Racing).
* **Font UI:** Usa un font Sans-Serif moderno (es. Inter o Geist).
* **Feedback visivo:** Al click su "Export", mostra un micro-feedback "Optimizing with SVGO..." prima del download.
* **Anteprima:** Area anteprima con background chiaro per contrasto ottimale con il testo scuro.
* **Branding:** Design orientato all'estetica motorsport/GT7 senza utilizzare marchi registrati o loghi ufficiali.