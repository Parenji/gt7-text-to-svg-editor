'use client'

import { FontData, textToSVGPath } from '@/lib/fontConverter'
import { useMemo } from 'react'
import { useI18n } from '@/src/i18n/I18nProvider'

interface PreviewProps {
  text: string
  font: FontData | null
  fontSize: number
  skew?: number
  tracking?: number
  outlineMode?: boolean
  mainColor?: string
  strokeWidth?: number
  fillColor?: string
  useTransparentFill?: boolean
}

export default function Preview({ 
  text, 
  font, 
  fontSize, 
  skew = 0, 
  tracking = 0, 
  outlineMode = false,
  mainColor = '#000000',
  strokeWidth = 2,
  fillColor = '#ff0000',
  useTransparentFill = true
}: PreviewProps) {
  const { t } = useI18n()
  const svgContent = useMemo(() => {
    if (!font || !text) {
      return null
    }

    try {
      return textToSVGPath(text, font.font, {
        fontSize,
        color: mainColor,
        backgroundColor: 'transparent',
        skew,
        tracking,
        outlineMode,
        strokeWidth,
        fillColor,
        useTransparentFill,
      })
    } catch (error) {
      console.error('Errore nella generazione dell\'anteprima:', error)
      return null
    }
  }, [text, font, fontSize, skew, tracking, outlineMode, mainColor, strokeWidth, fillColor, useTransparentFill])

  return (
    <div className="relative bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm h-64 flex items-center justify-center">
      {/* Griglia di background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      
      {svgContent ? (
        <div
          className="relative w-full h-full flex items-center justify-center p-6 overflow-hidden"
          dangerouslySetInnerHTML={{ __html: svgContent.replace(/<\?xml[^>]*\?>/, '').replace(/width="[^"]*"/, '').replace(/height="[^"]*"/, '').replace(/<svg/, '<svg style="max-width: 100%; max-height: 100%; width: auto; height: auto;"') }}
        />
      ) : (
        <div className="relative text-gray-400 text-center">
          <p className="text-lg">{t('previewEmptyTitle')}</p>
          <p className="text-sm mt-2">
            {!font ? t('previewNeedFont') : !text ? t('previewNeedText') : ''}
          </p>
        </div>
      )}
    </div>
  )
}
