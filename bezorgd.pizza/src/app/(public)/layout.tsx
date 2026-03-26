import Image from 'next/image'
import Link from 'next/link'

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fffaf4]">
      <header className="sticky top-0 z-40 border-b border-orange-100 bg-[#fffaf4]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/favicon_io/android-chrome-192x192.png"
              alt="bezorgd.pizza logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-base font-bold tracking-tight text-[#2f160c]">bezorgd.pizza</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/restaurants"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#6a3c24] transition hover:bg-orange-100 sm:inline-flex"
            >
              Restaurants
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-[#7a3413] shadow-sm transition hover:bg-[#fff6ec]"
            >
              Restaurant inloggen
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-orange-100 bg-[#fff4e8] py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Image
                src="/favicon_io/android-chrome-192x192.png"
                alt="bezorgd.pizza logo"
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="text-sm font-semibold text-[#2f160c]">bezorgd.pizza</span>
            </div>
            <p className="text-sm text-[#8a5b42]">Warm, lokaal en zonder gedoe pizza bestellen.</p>
            <Link
              href="/login"
              className="text-sm font-medium text-[#7a3413] transition hover:underline"
            >
              Inloggen als restaurant →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
