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
  textAlign?: 'left' | 'center' | 'right'
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
    textAlign = 'left',
    outlineMode = false,
    strokeWidth = 2,
    fillColor = '#ff0000',
    useTransparentFill = true,
  } = options

  if (!text || text.length === 0) {
    return createEmptySVG(color, backgroundColor)
  }

  // Gestione testo con più righe
  const lines = text.split('\n')
  const paths: Path[] = []
  let y = fontSize // Baseline per la prima riga
  let firstCharLeftBearing = 0

  // Calcola larghezza di ogni riga (per allineamento). Usiamo la stessa logica di avanzamento
  // usata poi per generare i path.
  const lineWidths = lines.map((line) => {
    let x = 0
    for (let i = 0; i < line.length; i++) {
      const glyph = font.charToGlyph(line[i])
      const advanceWidth = glyph.advanceWidth ? glyph.advanceWidth * (fontSize / font.unitsPerEm) : fontSize * 0.6
      x += advanceWidth + tracking
    }
    return x
  })

  const maxWidth = Math.max(0, ...lineWidths)
  const shouldAlign = lines.length > 1

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]

    let lineOffsetX = 0
    if (shouldAlign) {
      const lw = lineWidths[lineIndex] || 0
      if (textAlign === 'center') {
        lineOffsetX = (maxWidth - lw) / 2
      } else if (textAlign === 'right') {
        lineOffsetX = maxWidth - lw
      }
    }

    let x = 0
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const glyph = font.charToGlyph(char)

      // Per il primo carattere della prima riga, considera il leftSideBearing
      if (lineIndex === 0 && i === 0 && glyph.leftSideBearing !== undefined) {
        const leftBearing = glyph.leftSideBearing * (fontSize / font.unitsPerEm)
        firstCharLeftBearing = Math.min(0, leftBearing) // Solo se negativo
      }

      const path = glyph.getPath(lineOffsetX + x, y, fontSize)
      paths.push(path)

      const advanceWidth = glyph.advanceWidth ? glyph.advanceWidth * (fontSize / font.unitsPerEm) : fontSize * 0.6
      x += advanceWidth + tracking
    }

    // Vai alla riga successiva (se non è l'ultima)
    if (lineIndex < lines.length - 1) {
      y += fontSize * 1.2 // Spazio tra le righe (120% della dimensione del font)
    }
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
    maxX = maxWidth
    maxY = y + fontSize * 0.1
  }

  // Assicurati che il bounding box includa almeno l'origine e il leftSideBearing del primo carattere
  // e la fine del testo
  minX = Math.min(minX, 0, firstCharLeftBearing)
  minY = Math.min(minY, 0)
  maxX = Math.max(maxX, maxWidth) // Usa la larghezza massima calcolata
  maxY = Math.max(maxY, y + fontSize * 0.1) // y è l'ultima baseline, aggiungi spazio per caratteri bassi

  // Se applichiamo skewX sul path, il bounding box deve includere anche la trasformazione,
  // altrimenti il contenuto può venire tagliato ai bordi.
  if (skew !== 0) {
    const rad = (skew * Math.PI) / 180
    const t = Math.tan(rad)

    const candidates = [
      minX + t * minY,
      minX + t * maxY,
      maxX + t * minY,
      maxX + t * maxY,
    ]

    minX = Math.min(...candidates)
    maxX = Math.max(...candidates)
  }

  // Aggiungi padding controllato per ottimizzare lo spazio
  const padding = fontSize * 0.15 // Ridotto da 0.3 a 0.15 (15% invece di 30%)
  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2
  const viewBoxX = minX - padding
  const viewBoxY = minY - padding

  // Applica skew direttamente alle coordinate del path (flattening per GT7)
  if (skew !== 0) {
    combinedPath = applySkewToPathData(combinedPath, skew)
  }

  // Normalizza path data per GT7: comandi assoluti + rounding
  combinedPath = normalizePathDataForGt7(combinedPath, 2)
  
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="${viewBoxX} ${viewBoxY} ${width} ${height}">
  ${backgroundColor !== 'transparent' ? `<rect x="${viewBoxX}" y="${viewBoxY}" width="${width}" height="${height}" fill="${backgroundColor}"/>` : ''}
  <path d="${combinedPath.trim()}" ${pathAttributes}/>
</svg>`

  return svg
}

/**
 * Crea un SVG vuoto
 */
function createEmptySVG(color: string, backgroundColor: string): string {
  const width = 200
  const height = 100
  
  return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${width} ${height}">
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
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.rel = 'noopener'
  link.style.display = 'none'

  const supportsDownloadAttribute = 'download' in HTMLAnchorElement.prototype
  if (supportsDownloadAttribute) {
    link.download = filename
  }

  document.body.appendChild(link)

  try {
    link.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    )
  } finally {
    document.body.removeChild(link)
    // Su Firefox mobile, revocare subito l'object URL può interrompere il download.
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  // Fallback: se l'attributo download non è supportato, apri il file (l'utente potrà salvarlo)
  if (!supportsDownloadAttribute) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

/**
 * Normalizza path data per GT7: converte comandi relativi in assoluti e arrotonda decimali
 */
export function normalizePathDataForGt7(d: string, decimals: number): string {
  const tokens = tokenizePathData(d)
  let i = 0
  let cx = 0
  let cy = 0
  let sx = 0
  let sy = 0

  let prevCmd = ''
  let prevCubicX2 = 0
  let prevCubicY2 = 0
  let prevQuadX1 = 0
  let prevQuadY1 = 0

  const out: string[] = []
  const pushNum = (n: number) => {
    const p = Math.pow(10, decimals)
    const v = Math.round(n * p) / p
    out.push(Number.isFinite(v) ? String(v) : '0')
  }

  const nextNum = () => {
    const t = tokens[i++]
    return typeof t === 'number' ? t : 0
  }

  while (i < tokens.length) {
    const t = tokens[i++]
    if (typeof t !== 'string') continue
    const cmd = t
    const lower = cmd.toLowerCase()
    const isRel = cmd === lower

    if (lower === 'm') {
      const x = nextNum()
      const y = nextNum()
      cx = isRel ? cx + x : x
      cy = isRel ? cy + y : y
      sx = cx
      sy = cy
      out.push('M')
      pushNum(cx)
      pushNum(cy)
      while (i < tokens.length && typeof tokens[i] === 'number') {
        const lx = nextNum()
        const ly = nextNum()
        cx = isRel ? cx + lx : lx
        cy = isRel ? cy + ly : ly
        out.push('L')
        pushNum(cx)
        pushNum(cy)
      }
      continue
    }

    if (lower === 'z') {
      out.push('Z')
      cx = sx
      cy = sy
      prevCmd = 'Z'
      continue
    }

    if (lower === 'l') {
      out.push('L')
      while (i < tokens.length && typeof tokens[i] === 'number') {
        const x = nextNum()
        const y = nextNum()
        cx = isRel ? cx + x : x
        cy = isRel ? cy + y : y
        pushNum(cx)
        pushNum(cy)
      }
      prevCmd = 'L'
      continue
    }

    if (lower === 'h') {
      out.push('L')
      while (i < tokens.length && typeof tokens[i] === 'number') {
        const x = nextNum()
        cx = isRel ? cx + x : x
        pushNum(cx)
        pushNum(cy)
      }
      prevCmd = 'L'
      continue
    }

    if (lower === 'v') {
      out.push('L')
      while (i < tokens.length && typeof tokens[i] === 'number') {
        const y = nextNum()
        cy = isRel ? cy + y : y
        pushNum(cx)
        pushNum(cy)
      }
      prevCmd = 'L'
      continue
    }

    if (lower === 'c') {
      out.push('C')
      while (i < tokens.length && typeof tokens[i] === 'number') {
        const x1 = nextNum()
        const y1 = nextNum()
        const x2 = nextNum()
        const y2 = nextNum()
        const x = nextNum()
        const y = nextNum()

        const ax1 = isRel ? cx + x1 : x1
        const ay1 = isRel ? cy + y1 : y1
        const ax2 = isRel ? cx + x2 : x2
        const ay2 = isRel ? cy + y2 : y2
        cx = isRel ? cx + x : x
        cy = isRel ? cy + y : y

        pushNum(ax1)
        pushNum(ay1)
        pushNum(ax2)
        pushNum(ay2)
        pushNum(cx)
        pushNum(cy)

        prevCubicX2 = ax2
        prevCubicY2 = ay2
        prevCmd = 'C'
      }
      continue
    }

    if (lower === 's') {
      out.push('C')
      while (i < tokens.length && typeof tokens[i] === 'number') {
        const x2 = nextNum()
        const y2 = nextNum()
        const x = nextNum()
        const y = nextNum()

        const reflectedX1 = prevCmd === 'C' ? 2 * cx - prevCubicX2 : cx
        const reflectedY1 = prevCmd === 'C' ? 2 * cy - prevCubicY2 : cy

        const ax2 = isRel ? cx + x2 : x2
        const ay2 = isRel ? cy + y2 : y2
        cx = isRel ? cx + x : x
        cy = isRel ? cy + y : y

        pushNum(reflectedX1)
        pushNum(reflectedY1)
        pushNum(ax2)
        pushNum(ay2)
        pushNum(cx)
        pushNum(cy)

        prevCubicX2 = ax2
        prevCubicY2 = ay2
        prevCmd = 'C'
      }
      continue
    }

    if (lower === 'q') {
      out.push('Q')
      while (i < tokens.length && typeof tokens[i] === 'number') {
        const x1 = nextNum()
        const y1 = nextNum()
        const x = nextNum()
        const y = nextNum()

        const ax1 = isRel ? cx + x1 : x1
        const ay1 = isRel ? cy + y1 : y1
        cx = isRel ? cx + x : x
        cy = isRel ? cy + y : y

        pushNum(ax1)
        pushNum(ay1)
        pushNum(cx)
        pushNum(cy)

        prevQuadX1 = ax1
        prevQuadY1 = ay1
        prevCmd = 'Q'
      }
      continue
    }

    if (lower === 't') {
      out.push('Q')
      while (i < tokens.length && typeof tokens[i] === 'number') {
        const x = nextNum()
        const y = nextNum()

        const reflectedX1 = prevCmd === 'Q' ? 2 * cx - prevQuadX1 : cx
        const reflectedY1 = prevCmd === 'Q' ? 2 * cy - prevQuadY1 : cy

        cx = isRel ? cx + x : x
        cy = isRel ? cy + y : y

        pushNum(reflectedX1)
        pushNum(reflectedY1)
        pushNum(cx)
        pushNum(cy)

        prevQuadX1 = reflectedX1
        prevQuadY1 = reflectedY1
        prevCmd = 'Q'
      }
      continue
    }

    if (lower === 'a') {
      out.push('A')
      while (i < tokens.length && typeof tokens[i] === 'number') {
        const rx = nextNum()
        const ry = nextNum()
        const rot = nextNum()
        const laf = nextNum()
        const sf = nextNum()
        const x = nextNum()
        const y = nextNum()
        const ax = isRel ? cx + x : x
        const ay = isRel ? cy + y : y
        pushNum(rx)
        pushNum(ry)
        pushNum(rot)
        out.push(String(laf ? 1 : 0))
        out.push(String(sf ? 1 : 0))
        pushNum(ax)
        pushNum(ay)
        cx = ax
        cy = ay
        prevCmd = 'A'
      }
      continue
    }

    out.push(cmd.toUpperCase())
    while (i < tokens.length && typeof tokens[i] === 'number') {
      pushNum(nextNum())
    }
    prevCmd = cmd.toUpperCase()
  }

  return out.join(' ')
}

function tokenizePathData(d: string): Array<string | number> {
  const tokens: Array<string | number> = []
  const re = /([a-zA-Z])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(d)) !== null) {
    if (m[1]) tokens.push(m[1])
    else if (m[2]) tokens.push(Number(m[2]))
  }
  return tokens
}

/**
 * Applica skewX alle coordinate del path (flattening per GT7)
 */
function applySkewToPathData(d: string, skewDeg: number): string {
  const skewRad = (skewDeg * Math.PI) / 180
  const tan = Math.tan(skewRad)
  
  const tokens = tokenizePathData(d)
  let i = 0
  const out: string[] = []
  
  const nextNum = () => {
    const t = tokens[i++]
    return typeof t === 'number' ? t : 0
  }
  
  while (i < tokens.length) {
    const t = tokens[i++]
    if (typeof t !== 'string') continue
    const cmd = t
    const lower = cmd.toLowerCase()
    
    out.push(cmd)
    
    // Per ogni coppia di coordinate (x, y), applica skewX: x' = x + y * tan(skew)
    // Nota: alcuni comandi come A (arc) hanno parametri diversi, quindi gestiamo caso per caso
    if (lower === 'a') {
      // Arc: rx ry x-axis-rotation large-arc-flag sweep-flag x y
      while (i < tokens.length && typeof tokens[i] === 'number') {
        const rx = nextNum()
        const ry = nextNum()
        const rot = nextNum()
        const laf = nextNum()
        const sf = nextNum()
        const x = nextNum()
        const y = nextNum()
        const skewedX = x + y * tan
        out.push(String(rx.toFixed(2)))
        out.push(String(ry.toFixed(2)))
        out.push(String(rot.toFixed(2)))
        out.push(String(laf ? 1 : 0))
        out.push(String(sf ? 1 : 0))
        out.push(String(skewedX.toFixed(2)))
        out.push(String(y.toFixed(2)))
      }
    } else {
      // Per comandi standard (M, L, C, Q, S, T): coppie (x, y)
      while (i < tokens.length && typeof tokens[i] === 'number') {
        const x = nextNum()
        const y = nextNum()
        const skewedX = x + y * tan
        out.push(String(skewedX.toFixed(2)))
        out.push(String(y.toFixed(2)))
      }
    }
  }
  
  return out.join(' ')
}
