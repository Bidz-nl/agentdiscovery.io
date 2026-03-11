"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navLinks = [
  { href: "/protocol", label: "Protocol" },
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/demo", label: "Demo" },
  { href: "/docs", label: "Docs" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/8 to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Image src="/adp-logo.png" alt="ADP" width={32} height={32} className="relative z-10" />
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-white/90">ADP</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                pathname === link.href
                  ? "text-white bg-white/8 font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/4"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com/Bidz-nl/agentdiscovery.io"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-white/40 hover:text-white/80 transition-colors rounded-lg hover:bg-white/4"
            aria-label="GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          <Link
            href="/docs"
            className="px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            Read Docs
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden relative bg-[#030712]/95 backdrop-blur-2xl border-t border-white/5">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? "text-white bg-white/8 font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/4"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 pt-3 border-t border-white/5 flex flex-col gap-2">
              <a
                href="https://github.com/Bidz-nl/agentdiscovery.io"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/4 transition-colors"
              >
                GitHub ↗
              </a>
              <Link
                href="/docs"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-lg text-sm font-medium text-white text-center bg-linear-to-r from-blue-600 to-indigo-600"
              >
                Read Docs
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
