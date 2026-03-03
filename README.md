# FontToSVG Exporter

Una Single Page Application (SPA) che permette di visualizzare un testo personalizzato con un font specifico e di esportarlo come file SVG vettoriale (path-based), garantendo che il file risultante sia indipendente dal font installato sul sistema del destinatario.

## 🚀 Tecnologie Utilizzate

- **Next.js 14** (App Router) - Framework React
- **TypeScript** - Tipizzazione statica
- **Tailwind CSS** - Styling moderno e responsive
- **opentype.js** - Conversione font-to-path
- **Lucide React** - Icone moderne

## 📋 Funzionalità

### Selezione Font
- **Font di Sistema**: Menu a tendina con font standard (Sans-serif, Serif, Monospace)
- **Custom Font**: Area drag-and-drop o upload per file `.ttf`, `.otf`, `.woff`, `.woff2`
- Anteprima immediata del font caricato

### Input Testo
- Campo di input testuale
- Limite di 20 caratteri con contatore visivo
- Anteprima in tempo reale

### Esportazione SVG
- Colore: Nero (#000000)
- Sfondo: Trasparente
- Generazione con tag `<path>` (vettorializzazione completa)
- Download immediato del file SVG

## 🛠️ Installazione

1. Installa le dipendenze:
```bash
npm install
```

2. Avvia il server di sviluppo:
```bash
npm run dev
```

3. Apri [http://localhost:3000](http://localhost:3000) nel browser

## 📦 Build per Produzione

```bash
npm run build
npm start
```

## 🎨 Caratteristiche UI/UX

- Layout centrato e minimale
- Area anteprima con griglia di background per enfatizzare la trasparenza
- Pannello controlli laterale
- Feedback visivo per successo/errore
- Design responsive e moderno

## 🔧 Note Tecniche

- Utilizza `FileReader` per leggere i file font come `ArrayBuffer`
- Parsing con `opentype.parse()` di opentype.js
- Generazione path con `font.getPath()` per ogni carattere
- Costruzione SVG con viewBox calcolato dinamicamente

## 📝 Licenza

MIT
