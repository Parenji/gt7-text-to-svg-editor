import opentype, { Font, Path } from 'opentype.js'

export interface FontData {
  font: Font
  name: string
}

export interface SVGOptions {
  fontSize?: number
  color?: string
  backgroundColor?: string
  skew?: number
  tracking?: number
  outlineMode?: boolean
  strokeWidth?: number
  fillColor?: string
  useTransparentFill?: boolean
}

/**
 * Carica un font da un URL
 */
export async function loadFontFromURL(
  url: string,
  name: string = 'URL Font'
): Promise<FontData> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const buffer = await response.arrayBuffer()
    return loadFontFromBuffer(buffer, name)
  } catch (error) {
    throw new Error(`Failed to load font from URL: ${error}`)
  }
}

/**
 * Carica un font da un ArrayBuffer
 */
export async function loadFontFromBuffer(
  buffer: ArrayBuffer,
  name: string = 'Custom Font'
): Promise<FontData> {
  try {
    const font = opentype.parse(buffer)
    return { font, name }
  } catch (error) {
    throw new Error('Errore nel caricamento del font. Assicurati che il file sia valido.')
  }
}

/**
 * Converte il testo in SVG path usando opentype.js
 */
export function textToSVGPath(
  text: string,
  font: Font,
  options: SVGOptions = {}
): string {
  const {
    fontSize = 48,
    color = '#000000',
    backgroundColor = 'transparent',
    skew = 0,
    tracking = 0,
    outlineMode = false,
    strokeWidth = 2,
    fillColor = '#ff0000',
    useTransparentFill = true,
  } = options

  if (!text || text.length === 0) {
    return createEmptySVG(color, backgroundColor)
  }

  // Calcola il path per ogni carattere
  const paths: Path[] = []
  let x = 0
  const y = fontSize // Baseline
  let firstCharLeftBearing = 0

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const glyph = font.charToGlyph(char)
    
    // Per il primo carattere, considera il leftSideBearing (potrebbe essere negativo)
    if (i === 0 && glyph.leftSideBearing !== undefined) {
      const leftBearing = glyph.leftSideBearing * (fontSize / font.unitsPerEm)
      firstCharLeftBearing = Math.min(0, leftBearing) // Solo se negativo
    }
    
    const path = glyph.getPath(x, y, fontSize)
    paths.push(path)
    
    // Avanza la posizione x per il prossimo carattere
    const advanceWidth = glyph.advanceWidth ? glyph.advanceWidth * (fontSize / font.unitsPerEm) : fontSize * 0.6
    x += advanceWidth + tracking
  }

  // Combina tutti i path - usa toPathData() invece di toSVG() per ottenere solo i dati del path
  let combinedPath = ''
  paths.forEach((path) => {
    combinedPath += path.toPathData(2) + ' '
  })

  // Calcola il bounding box combinato
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  paths.forEach((path) => {
    const bbox = path.getBoundingBox()
    if (bbox.x1 !== undefined && bbox.y1 !== undefined && 
        bbox.x2 !== undefined && bbox.y2 !== undefined) {
      minX = Math.min(minX, bbox.x1)
      minY = Math.min(minY, bbox.y1)
      maxX = Math.max(maxX, bbox.x2)
      maxY = Math.max(maxY, bbox.y2)
    }
  })

  // Se non abbiamo un bounding box valido, usa valori di default
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    minX = 0
    minY = 0
    maxX = x
    maxY = fontSize
  }

  // Assicurati che il bounding box includa almeno l'origine e il leftSideBearing del primo carattere
  // e la fine del testo
  minX = Math.min(minX, 0, firstCharLeftBearing)
  minY = Math.min(minY, 0)
  maxX = Math.max(maxX, x)
  maxY = Math.max(maxY, fontSize * 1.2) // Aggiungi spazio extra per caratteri alti

  // Aggiungi padding generoso per evitare che i caratteri vengano tagliati
  const padding = fontSize * 0.3
  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2
  const viewBoxX = minX - padding
  const viewBoxY = minY - padding

  // Genera SVG
  const transform = skew !== 0 ? ` transform="skewX(${skew})"` : ''
  
  let pathAttributes = ''
  if (outlineMode) {
    if (useTransparentFill) {
      pathAttributes = `fill="none" stroke="${color}" stroke-width="${strokeWidth}"`
    } else {
      pathAttributes = `fill="${fillColor}" stroke="${color}" stroke-width="${strokeWidth}"`
    }
  } else {
    pathAttributes = `fill="${color}"`
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${width}" 
     height="${height}" 
     viewBox="${viewBoxX} ${viewBoxY} ${width} ${height}">
  ${backgroundColor !== 'transparent' ? `<rect x="${viewBoxX}" y="${viewBoxY}" width="${width}" height="${height}" fill="${backgroundColor}"/>` : ''}
  <path d="${combinedPath.trim()}"${transform} ${pathAttributes}/>
</svg>`

  return svg
}

/**
 * Crea un SVG vuoto
 */
function createEmptySVG(color: string, backgroundColor: string): string {
  const width = 200
  const height = 100
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${width}" 
     height="${height}" 
     viewBox="0 0 ${width} ${height}">
  ${backgroundColor !== 'transparent' ? `<rect width="${width}" height="${height}" fill="${backgroundColor}"/>` : ''}
</svg>`
}

/**
 * Calcola la dimensione del SVG in bytes
 */
export function getSVGSize(svgContent: string): number {
  return new Blob([svgContent], { type: 'image/svg+xml' }).size
}

/**
 * Formatta la dimensione in formato leggibile
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
}


/**
 * Scarica il SVG come file
 */
export function downloadSVG(svgContent: string, filename: string = 'export.svg'): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
