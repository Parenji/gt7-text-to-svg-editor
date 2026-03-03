import { optimize, type Config, type PluginConfig } from 'svgo'

/**
 * Definiamo i plugin separatamente per evitare errori di inferenza
 */
const plugins: PluginConfig[] = [
  {
    name: 'preset-default',
    params: {
      overrides: {
        removeViewBox: false,
        convertPathData: {
          floatPrecision: 2,
          transformPrecision: 2,
        },
        cleanupNumericValues: {
          floatPrecision: 2,
        },
        convertTransform: {
          floatPrecision: 2,
          collapseIntoTransforms: true,
        },
        cleanupIds: true,
        removeDataUriImages: true,
        removeDesc: true,
        removeTitle: true,
        removeEditorsNSData: true,
        removeMetadata: true,
        removeUnknownsDefaults: true,
        removeUselessDefs: true,
        removeXMLNS: false,
        mergePaths: true,
        removeDimensions: true,
        cleanupAttrs: true,
        removeDoctype: true,
        removeXMLProcInst: true,
        removeComments: true,
        removeUselessStrokeAndFill: true,
        removeHiddenElems: true,
        removeEmptyText: true,
        removeEmptyAttrs: true,
        removeEmptyContainers: true,
        removeUnusedNS: true,
        cleanupIDs: true,
        removeRasterImages: true,
        mergeStyles: true,
        inlineStyles: true,
        minifyStyles: true,
        convertStyleToAttrs: true,
        convertColors: true,
        removeNonInheritableGroupAttrs: true,
        transformsWithOnePath: true,
        sortAttrs: true,
        removeTitleAndDesc: true,
      },
    },
  } as any,
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