import { optimize, type Config } from 'svgo'
import { normalizePathDataForGt7 } from './fontConverter'

/**
 * Definiamo i plugin separatamente per evitare errori di inferenza
 */
const plugins: any[] = [
  {
    name: 'preset-default',
    params: {
      overrides: {
        // SVGO v4: in overrides devono esserci solo plugin del preset-default.
        // Manteniamo qui solo ciò che ci serve davvero.
        convertPathData: {
          floatPrecision: 2,
          transformPrecision: 2,
          // Disabilita la conversione a comandi relativi per GT7
          makeArcs: {
            threshold: 2,
            tolerance: 0.5,
          },
          // Assicura che i comandi rimangano assoluti
          convertToL: true,
          convertToQ: true,
          convertToC: true,
        },
        cleanupNumericValues: {
          floatPrecision: 2,
        },
        // Disabilita completamente convertTransform per GT7
        convertTransform: false,
        // Disabilita collapsePaths che potrebbe unire path in modo problematico
        collapsePaths: false,
        // Disabilita mergePaths che potrebbe creare problemi
        mergePaths: false,
      },
    },
  },
  {
    name: 'removeViewBox',
    active: false,
  },
  // Plugin aggiuntivi per rimuovere data-name e altri attributi non necessari
  {
    name: 'removeAttrs',
    params: {
      attrs: '(data-name|data-.*|id|class)',
    },
  },
];

const svgoConfig: Config = {
  multipass: true,
  plugins: plugins,
}

export function optimizeSVG(svgContent: string): string {
  try {
    const result = optimize(svgContent, svgoConfig)
    
    // Check per SVGO v3+
    let optimized = 'data' in result ? result.data : svgContent
    
    // Post-processing GT7: assicura che version="1.1" sia presente
    if (!optimized.includes('version="1.1"')) {
      optimized = optimized.replace('<svg', '<svg version="1.1"')
    }
    
    // Rimuovi XML header se presente
    optimized = optimized.replace(/^<\?xml[^>]*\?>\s*/, '')
    
    // Post-processing GT7: normalizza di nuovo i path per garantire comandi assoluti
    // SVGO potrebbe reintrodirurre comandi relativi
    const pathMatch = optimized.match(/<path[^>]*d="([^"]*)"/)
    if (pathMatch && pathMatch[1]) {
      const normalizedPath = normalizePathDataForGt7(pathMatch[1], 2)
      optimized = optimized.replace(/d="[^"]*"/, `d="${normalizedPath}"`)
    }
    
    // Rimuovi eventuali transform attributes che SVGO potrebbe aver reintrodotti
    optimized = optimized.replace(/\s*transform="[^"]*"/g, '')
    
    return optimized
  } catch (error) {
    console.error('Errore ottimizzazione:', error)
    return svgContent 
  }
}

// ... resto della funzione optimizeSVGWithInfo rimane uguale
/**
 * DEVI AVERE "export" QUI DAVANTI!
 */
export function optimizeSVGWithInfo(svgContent: string) {
    // Verifichiamo che siamo in un ambiente con Blob (browser)
    const isBrowser = typeof window !== 'undefined';
    
    const originalSize = isBrowser 
      ? new Blob([svgContent], { type: 'image/svg+xml' }).size 
      : 0;
  
    const optimized = optimizeSVG(svgContent);
  
    const optimizedSize = isBrowser 
      ? new Blob([optimized], { type: 'image/svg+xml' }).size 
      : 0;
  
    const reduction = originalSize - optimizedSize;
    const reductionPercent = originalSize > 0 
      ? (reduction / originalSize) * 100 
      : 0;
  
    return {
      optimized,
      originalSize,
      optimizedSize,
      reduction,
      reductionPercent,
    };
  }