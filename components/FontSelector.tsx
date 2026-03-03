'use client'

import { useState, useRef } from 'react'
import { Upload, X, Check, Type } from 'lucide-react'
import { FontData, loadFontFromBuffer, loadFontFromURL } from '@/lib/fontConverter'
import { useI18n } from '@/src/i18n/I18nProvider'

interface FontSelectorProps {
  onFontChange: (font: FontData | null) => void
  currentFont: FontData | null
}

// Font pre-caricati disponibili
const PRELOADED_FONTS = [
  {
    name: 'Audiowide',
    filename: 'Audiowide-Regular.ttf',
    displayName: 'Audiowide'
  },
  {
    name: 'Roboto', 
    filename: 'Roboto-VariableFont_wdth,wght.ttf',
    displayName: 'Roboto'
  },
  {
    name: 'Sedgwick Ave',
    filename: 'SedgwickAveDisplay-Regular.ttf', 
    displayName: 'Sedgwick Ave'
  }
]

export default function FontSelector({ onFontChange, currentFont }: FontSelectorProps) {
  const { t } = useI18n()
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)

    const files = Array.from(e.dataTransfer.files)
    const fontFile = files.find(file => 
      file.type === 'font/ttf' || 
      file.type === 'font/otf' || 
      file.type === 'font/woff' || 
      file.type === 'font/woff2' ||
      file.name.match(/\.(ttf|otf|woff|woff2)$/i)
    )

    if (fontFile) {
      handleFontFile(fontFile)
    } else {
      setError(t('supportsFormats'))
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setError(null)
      handleFontFile(file)
    }
  }

  const handleFontFile = async (file: File) => {
    try {
      setIsLoading(file.name)
      const buffer = await file.arrayBuffer()
      const fontData = await loadFontFromBuffer(buffer, file.name)
      onFontChange(fontData)
      setError(null)
    } catch (err) {
      setError('Errore nel caricamento del font. Assicurati che il file sia valido.')
      console.error('Font loading error:', err)
    } finally {
      setIsLoading(null)
    }
  }

  const handleRemoveFont = () => {
    onFontChange(null)
    setError(null)
  }

  const handlePreloadedFontSelect = async (fontInfo: typeof PRELOADED_FONTS[0]) => {
    try {
      setIsLoading(fontInfo.name)
      const fontData = await loadFontFromURL(`/fonts/${fontInfo.filename}`, fontInfo.name)
      onFontChange(fontData)
      setError(null)
    } catch (err) {
      setError(`Errore nel caricamento del font ${fontInfo.name}`)
      console.error('Preloaded font loading error:', err)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Font Pre-caricati */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t('preloadedFontsLabel')}
        </label>
        <select
          onChange={(e) => {
            const fontInfo = PRELOADED_FONTS.find(f => f.name === e.target.value)
            if (fontInfo) {
              handlePreloadedFontSelect(fontInfo)
            }
          }}
          value={currentFont?.name || ''}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none"
        >
          <option value="">{t('preloadedFontsPlaceholder')}</option>
          {PRELOADED_FONTS.map((fontInfo) => (
            <option 
              key={fontInfo.name} 
              value={fontInfo.name}
              style={{ fontFamily: `'${fontInfo.displayName}', sans-serif` }}
            >
              {fontInfo.displayName}
            </option>
          ))}
        </select>
        {isLoading && (
          <div className="mt-1 text-xs text-gray-400">{t('loadingFont')}</div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t('uploadFontLabel')}
        </label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-red-500 bg-red-900/20'
              : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
          }`}
        >
          {currentFont ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-green-400">
                <Check className="w-5 h-5" />
                <span className="font-medium text-white">{currentFont.name}</span>
              </div>
              <button
                onClick={handleRemoveFont}
                className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto"
              >
                <X className="w-4 h-4" />
                {t('removeFont')}
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-gray-500 mb-2" />
              <p className="text-sm text-gray-300 mb-2">
                {t('dragFontHere')}{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-red-400 hover:text-red-300 underline"
                >
                  {t('selectAFile')}
                </button>
              </p>
              <p className="text-xs text-gray-400 mb-2">
                {t('supportsFormats')}
              </p>
              <p className="text-xs text-gray-400">
                💡 <a 
                  href="https://www.dafont.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 underline"
                >
                  {t('findFontsOnDafont')}
                </a>
              </p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
