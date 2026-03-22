import './globals.css'

export const metadata = {
  title: 'bezorgd.pizza',
  description: 'Warm, lokaal en no-nonsense pizza bestellen.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}
