'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from '@/src/translations'

export type Language = 'it' | 'en'

type TranslationKey = keyof (typeof translations)['it']

type I18nContextValue = {
  lang: Language
  setLang: (lang: Language) => void
  mounted: boolean
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'gt7_logo_lang'

function format(template: string, params?: Record<string, string | number>) {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, p1) => {
    const v = params[p1]
    return v === undefined || v === null ? match : String(v)
  })
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('it')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (saved === 'it' || saved === 'en') {
      setLangState(saved)
      return
    }

    const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'it'
    setLangState(browserLang && browserLang.toLowerCase().startsWith('it') ? 'it' : 'en')
  }, [])

  const setLang = (next: Language) => {
    setLangState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  }

  const t = useMemo(() => {
    return (key: TranslationKey, params?: Record<string, string | number>) => {
      const dict = (mounted ? translations[lang] : translations.it) as Record<TranslationKey, string>
      const fallback = translations.it as Record<TranslationKey, string>
      const value = dict[key] ?? fallback[key]
      return format(value, params)
    }
  }, [lang, mounted])

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, mounted, t }), [lang, mounted, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export function LanguageToggle() {
  const { lang, setLang, mounted } = useI18n()

  if (!mounted) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as 'it' | 'en')}
        className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm font-medium hover:bg-gray-700 hover:border-gray-500 transition-colors shadow-lg cursor-pointer focus:outline-none"
      >
        <option value="it">IT</option>
        <option value="en">EN</option>
      </select>
    </div>
  )
}
