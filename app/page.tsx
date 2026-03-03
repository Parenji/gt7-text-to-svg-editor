'use client'

import { useState, useMemo } from 'react'
import { Download, AlertCircle, FileText, ChevronDown, ChevronUp, Palette, ExternalLink, Instagram, Heart } from 'lucide-react'
import FontSelector from '@/components/FontSelector'
import Preview from '@/components/Preview'
import CompressionDialog from '@/components/CompressionDialog'
import { FontData, textToSVGPath, downloadSVG, getSVGSize, formatFileSize } from '@/lib/fontConverter'
import { optimizeSVGWithInfo } from '@/lib/svgOptimizer'
import { useI18n, LanguageToggle } from '@/src/i18n/I18nProvider'

export default function Home() {
  const { t, lang } = useI18n()
  const [text, setText] = useState('')
  const [font, setFont] = useState<FontData | null>(null)
  const [skew, setSkew] = useState(0)
  const [tracking, setTracking] = useState(0)
  const [outlineMode, setOutlineMode] = useState(false)
  const [mainColor, setMainColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [fillColor, setFillColor] = useState('#ff0000')
  const [useTransparentFill, setUseTransparentFill] = useState(true)
  const [showAdvancedControls, setShowAdvancedControls] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [showCompressionDialog, setShowCompressionDialog] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSVG: string
    optimizedSVG: string
    originalSize: number
    optimizedSize: number
    reductionPercent: number
    filename: string
  } | null>(null)
  const [downloadFeedback, setDownloadFeedback] = useState(false)
  const [showSupport, setShowSupport] = useState(false)

  const MAX_LENGTH = 20

  // Calcola il peso del SVG in tempo reale
  const svgSize = useMemo(() => {
    if (!text || !font) return 0
    try {
      const svgContent = textToSVGPath(text, font.font, {
        fontSize: 48,
        color: mainColor,
        backgroundColor: 'transparent',
        skew,
        tracking,
        outlineMode,
        strokeWidth,
        fillColor,
        useTransparentFill,
      })
      return getSVGSize(svgContent)
    } catch {
      return 0
    }
  }, [text, font, skew, tracking, outlineMode, mainColor, strokeWidth, fillColor, useTransparentFill])

  // Ottimizzazione SVGO in tempo reale
  const optimizedSvg = useMemo(() => {
    if (!text || !font) return null
    try {
      const svgContent = textToSVGPath(text, font.font, {
        fontSize: 48,
        color: mainColor,
        backgroundColor: 'transparent',
        skew,
        tracking,
        outlineMode,
        strokeWidth,
        fillColor,
        useTransparentFill,
      })
      return optimizeSVGWithInfo(svgContent)
    } catch {
      return null
    }
  }, [text, font, skew, tracking, outlineMode, mainColor, strokeWidth, fillColor, useTransparentFill])

  const handleExport = () => {
    if (!text || text.trim().length === 0) {
      setExportError(t('previewNeedText'))
      return
    }

    if (!font) {
      setExportError(t('previewNeedFont'))
      return
    }

    try {
      setIsOptimizing(true)
      setExportError(null)
      
      const svgContent = textToSVGPath(text, font.font, {
        fontSize: 48,
        color: mainColor,
        backgroundColor: 'transparent',
        skew,
        tracking,
        outlineMode,
        strokeWidth,
        fillColor,
        useTransparentFill,
      })

      // Pro export filename: [testo]-logo.svg
      const cleanText = text.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      const filename = `${cleanText}-logo.svg`
      const size = getSVGSize(svgContent)
      const sizeKB = size / 1024

      // Simula un piccolo delay per mostrare il feedback "Optimizing..."
      setTimeout(() => {
        // Se il file supera i 15KB, mostra il dialogo di ottimizzazione
        if (sizeKB > 15) {
          const optimization = optimizeSVGWithInfo(svgContent)
          setCompressionInfo({
            originalSVG: svgContent,
            optimizedSVG: optimization.optimized,
            originalSize: optimization.originalSize,
            optimizedSize: optimization.optimizedSize,
            reductionPercent: optimization.reductionPercent,
            filename,
          })
          setShowCompressionDialog(true)
        } else {
          // File già sotto i 15KB, scarica direttamente
          downloadSVG(svgContent, filename)
          setExportSuccess(true)
          setTimeout(() => setExportSuccess(false), 3000)
        }
        setIsOptimizing(false)
      }, 500)
    } catch (error) {
      setIsOptimizing(false)
      setExportError(
        error instanceof Error ? error.message : t('exportErrorGeneric')
      )
      setExportSuccess(false)
    }
  }

  const handleDownloadOriginal = () => {
    if (compressionInfo) {
      downloadSVG(compressionInfo.originalSVG, compressionInfo.filename)
      setShowCompressionDialog(false)
      setCompressionInfo(null)
      setExportError(null)
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    }
  }

  const handleDownloadOptimized = () => {
    if (compressionInfo) {
      downloadSVG(
        compressionInfo.optimizedSVG,
        compressionInfo.filename.replace('.svg', '-optimized.svg')
      )
      setShowCompressionDialog(false)
      setCompressionInfo(null)
      setExportError(null)
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    }
  }

  const handleCloseCompressionDialog = () => {
    setShowCompressionDialog(false)
    setCompressionInfo(null)
  }

  const handleDownload = () => {
    if (!optimizedSvg) return

    // Download automatico del file ottimizzato
    const cleanText = text.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    const filename = `${cleanText}-logo.svg`
    downloadSVG(optimizedSvg.optimized, filename)

    // Mostra sezione supporto (senza feedback temporaneo)
    setShowSupport(true)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t('appTitle')}</h1>
          <p className="text-gray-400">{t('appSubtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pannello Controlli */}
          <div className="space-y-6">
            {/* Input Testo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('textLabel')} ({text.length}/{MAX_LENGTH})
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => {
                  const newText = e.target.value.slice(0, MAX_LENGTH)
                  setText(newText)
                }}
                maxLength={MAX_LENGTH}
                placeholder={t('textPlaceholder')}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none text-white text-lg placeholder-gray-500"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>{t('maxChars', { max: MAX_LENGTH })}</span>
                <span className={text.length === MAX_LENGTH ? 'text-red-400' : ''}>
                  {text.length}/{MAX_LENGTH}
                </span>
              </div>
            </div>

            {/* Selezione Font */}
            <FontSelector onFontChange={setFont} currentFont={font} />

            {/* Controlli Colore */}
            <div className="space-y-4">
              {/* Colore Principale */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {outlineMode ? t('colorLabelOutline') : t('colorLabelText')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={mainColor}
                    onChange={(e) => setMainColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer bg-gray-700 border border-gray-600"
                  />
                  <input
                    type="text"
                    value={mainColor}
                    onChange={(e) => setMainColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none text-white text-sm"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            {/* Controlli Tipografici Avanzati */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <button
                onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700 transition-colors"
              >
                <h3 className="text-sm font-semibold text-gray-300">{t('advancedControls')}</h3>
                {showAdvancedControls ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              {showAdvancedControls && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Outline Mode */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">
                      {t('outlineMode')}
                    </label>
                    <button
                      onClick={() => setOutlineMode(!outlineMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        outlineMode ? 'bg-red-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          outlineMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Controlli Outline (visibili solo in outline mode) */}
                  {outlineMode && (
                    <>
                      {/* Spessore Stroke */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {t('outlineThickness', { px: strokeWidth })}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={strokeWidth}
                          onChange={(e) => setStrokeWidth(Number(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>1px</span>
                          <span>10px</span>
                        </div>
                      </div>

                      {/* Colore Riempimento */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-300">
                            {t('fill')}
                          </label>
                          <button
                            onClick={() => setUseTransparentFill(!useTransparentFill)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              !useTransparentFill ? 'bg-red-600' : 'bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                !useTransparentFill ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        {!useTransparentFill && (
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={fillColor}
                              onChange={(e) => setFillColor(e.target.value)}
                              className="w-10 h-10 rounded cursor-pointer bg-gray-700 border border-gray-600"
                            />
                            <input
                              type="text"
                              value={fillColor}
                              onChange={(e) => setFillColor(e.target.value)}
                              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                              placeholder="#000000"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Skew */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('skew', { deg: skew })}
                    </label>
                    <input
                      type="range"
                      min="-25"
                      max="25"
                      value={skew}
                      onChange={(e) => setSkew(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>-25°</span>
                      <span>0°</span>
                      <span>+25°</span>
                    </div>
                  </div>

                  {/* Tracking */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('tracking', { px: tracking })}
                    </label>
                    <input
                      type="range"
                      min="-5"
                      max="50"
                      value={tracking}
                      onChange={(e) => setTracking(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>-5px</span>
                      <span>0px</span>
                      <span>+50px</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pulsante Export */}
            <button
              onClick={handleExport}
              disabled={!text || !font || isOptimizing}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 hidden"
            >
              {isOptimizing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('optimizing')}
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  {t('exportSvg')}
                </>
              )}
            </button>

            {/* Visualizzazione Peso SVG Ottimizzato */}
            {optimizedSvg && (
              <div className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg text-sm border border-gray-700">
                <div className="flex items-center gap-2 text-gray-300">
                  <FileText className="w-4 h-4" />
                  <span>{t('svgSize')}</span>
                </div>
                <span className={`font-medium ${optimizedSvg.optimizedSize > 15000 ? 'text-red-400' : 'text-green-400'}`}>
                  {optimizedSvg.optimizedSize > 15000 
                    ? t('tooLargeForGt7', { size: (optimizedSvg.optimizedSize / 1024).toFixed(1) })
                    : t('readyForGt7', { size: (optimizedSvg.optimizedSize / 1024).toFixed(1) })
                  }
                </span>
              </div>
            )}

            {/* Pulsante Download */}
            {optimizedSvg && (
              <div className="space-y-2">
                <button
                  onClick={handleDownload}
                  disabled={optimizedSvg.optimizedSize > 15000}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  {t('exportSvg')}
                </button>
                {optimizedSvg.optimizedSize > 15000 && (
                  <p className="text-xs text-red-400 text-center">
                    {t('tooLargeForGt7', { size: (optimizedSvg.optimizedSize / 1024).toFixed(1) })}
                  </p>
                )}
              </div>
            )}

            {/* Sezione Supporto Post-Download */}
            {showSupport && (
              <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700 animate-fade-in">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-green-400 font-medium mb-2">
                      {t('downloadSuccess')}
                    </p>
                    <p className="text-gray-300 text-sm mb-3">
                      {t('fileReadyText')}
                    </p>
                    <a
                      href={`https://www.gran-turismo.com/${lang}/gt7/user/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('gt7LinkText')}
                    </a>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4">
                    <p className="text-gray-300 text-sm mb-3">
                      {t('supportMessage')}
                    </p>
                    <div className="flex justify-center gap-3">
                      <a
                        href="https://www.instagram.com/parenji_gt7/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm"
                      >
                        <Instagram className="w-4 h-4" />
                        {t('supportInstagram')}
                      </a>
                      <a
                        href="https://www.paypal.me/lorenzoparenti"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm"
                      >
                        <Heart className="w-4 h-4" />
                        {t('supportDonate')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            
            {exportError && (
              <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{exportError}</p>
              </div>
            )}

            {exportSuccess && (
              <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-green-900/90 border border-green-700 rounded-lg shadow-lg">
                <p className="text-sm text-green-400 font-medium">
                  {t('exportSuccess')}
                </p>
              </div>
            )}
          </div>

          {/* Dialogo Ottimizzazione */}
          {compressionInfo && (
            <CompressionDialog
              isOpen={showCompressionDialog}
              originalSize={compressionInfo.originalSize}
              optimizedSize={compressionInfo.optimizedSize}
              reductionPercent={compressionInfo.reductionPercent}
              onDownloadOriginal={handleDownloadOriginal}
              onDownloadOptimized={handleDownloadOptimized}
              onClose={handleCloseCompressionDialog}
            />
          )}

          {/* Area Anteprima */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-300">{t('previewTitle')}</h2>
            <Preview 
              text={text} 
              font={font} 
              fontSize={48}
              skew={skew}
              tracking={tracking}
              outlineMode={outlineMode}
              mainColor={mainColor}
              strokeWidth={strokeWidth}
              fillColor={fillColor}
              useTransparentFill={useTransparentFill}
            />
            
            {font && (
              <div className="text-sm text-gray-400 bg-gray-800 p-4 rounded-lg border border-gray-700">
                <p><strong>Font:</strong> {font.name}</p>
                <p><strong>{t('textLabel')}:</strong> {text || t('emptyText')}</p>
                <p><strong>Dimensione:</strong> 48px</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
