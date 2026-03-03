'use client'

import { X, Download, Zap } from 'lucide-react'
import { formatFileSize } from '@/lib/fontConverter'
import { useI18n } from '@/src/i18n/I18nProvider'

interface CompressionDialogProps {
  isOpen: boolean
  originalSize: number
  optimizedSize: number
  reductionPercent: number
  onDownloadOriginal: () => void
  onDownloadOptimized: () => void
  onClose: () => void
}

export default function CompressionDialog({
  isOpen,
  originalSize,
  optimizedSize,
  reductionPercent,
  onDownloadOriginal,
  onDownloadOptimized,
  onClose,
}: CompressionDialogProps) {
  const { t } = useI18n()
  if (!isOpen) return null

  const isUnder15KB = optimizedSize <= 15 * 1024

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-500" />
            {t('compressionTitle')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">{t('originalSize')}</span>
              <span className="font-medium text-white">{formatFileSize(originalSize)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">{t('optimizedSize')}</span>
              <span className={`font-medium ${isUnder15KB ? 'text-green-400' : 'text-orange-400'}`}>
                {formatFileSize(optimizedSize)}
              </span>
            </div>
            {reductionPercent > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-600">
                <span className="text-xs text-gray-400">
                  {t('reduction')} <strong className="text-green-400">{reductionPercent.toFixed(1)}%</strong>
                </span>
              </div>
            )}
          </div>

          {!isUnder15KB && (
            <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg">
              <p className="text-xs text-yellow-300">
                ⚠️ <strong>{t('noteOver15kbTitle')}</strong> {t('noteOver15kbText')}
              </p>
            </div>
          )}

          {isUnder15KB && (
            <div className="p-3 bg-green-900/50 border border-green-700 rounded-lg">
              <p className="text-xs text-green-300">
                ✓ {t('okUnder15kb')}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onDownloadOptimized}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('downloadOptimized')} {isUnder15KB && '(✓ < 15 KB)'}
          </button>
          <button
            onClick={onDownloadOriginal}
            className="w-full bg-gray-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('downloadOriginal')} ({formatFileSize(originalSize)})
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-500 transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
