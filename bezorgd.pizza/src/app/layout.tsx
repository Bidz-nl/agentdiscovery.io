import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'bezorgd.pizza — Warm, lokaal en zonder gedoe',
  description: 'Vul je postcode in en ontdek welke lokale pizzeria vanavond warm bezorgt in jouw buurt.',
  verification: {
    google: 'XO32fMO93vyfProsVFVDTFfDIEH-YUijhcArZfBh1e0',
  },
  icons: {
    icon: [
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_io/favicon.ico' },
    ],
    apple: '/favicon_io/apple-touch-icon.png',
    other: [
      { rel: 'manifest', url: '/favicon_io/site.webmanifest' },
    ],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}
