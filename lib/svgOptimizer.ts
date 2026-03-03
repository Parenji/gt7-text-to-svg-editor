import { optimize, type Config } from 'svgo'

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
        },
        cleanupNumericValues: {
          floatPrecision: 2,
        },
        convertTransform: {
          floatPrecision: 2,
        },
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
    if ('data' in result) {
      return result.data
    }
    
    return svgContent 
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