import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider, LanguageToggle } from '@/src/i18n/I18nProvider'

export const metadata: Metadata = {
  title: 'GT7 Logo Designer',
  description: 'Crea loghi SVG ottimizzati per Gran Turismo 7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-900">
        <I18nProvider>
          <LanguageToggle />
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
