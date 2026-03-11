import type { ReactNode } from "react"

import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"

export function MarketingPageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Navbar />
      <main className="pt-24">
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-violet-500/4 rounded-full blur-[100px]" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-6">
                {eyebrow}
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">{title}</h1>
              <p className="text-lg sm:text-xl text-white/40 leading-relaxed max-w-2xl">{description}</p>
              {actions ? <div className="mt-10 flex flex-wrap items-center gap-4">{actions}</div> : null}
            </div>
          </div>
          <div className="section-divider" />
        </section>
        {children}
      </main>
      <Footer />
    </div>
  )
}
