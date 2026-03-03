declare module 'opentype.js' {
  export interface Font {
    unitsPerEm: number
    charToGlyph(char: string): Glyph
  }

  export interface Glyph {
    advanceWidth?: number
    leftSideBearing?: number
    getPath(x: number, y: number, fontSize: number): Path
  }

  export interface Path {
    getBoundingBox(): BoundingBox
    toPathData(decimalPlaces?: number): string
    toSVG(decimalPlaces?: number): string
  }

  export interface BoundingBox {
    x1?: number
    y1?: number
    x2?: number
    y2?: number
  }

  function parse(buffer: ArrayBuffer): Font
  function load(url: string, callback: (err: any, font: Font) => void): void
  function loadFromBuffer(buffer: ArrayBuffer): Font

  const opentype: {
    parse(buffer: ArrayBuffer): Font
    load(url: string, callback: (err: any, font: Font) => void): void
    loadFromBuffer(buffer: ArrayBuffer): Font
  }

  export default opentype
}
