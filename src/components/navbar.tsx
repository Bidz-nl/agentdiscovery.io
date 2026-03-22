"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAgentStore } from "@/app/app/lib/agent-store"

const navLinks = [
  { href: "/protocol", label: "Protocol" },
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/demo", label: "Demo" },
  { href: "/docs", label: "Docs" },
  { href: "https://github.com/Bidz-nl/agentdiscovery.io", label: "GitHub", external: true },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { appSession, name: botName, role } = useAgentStore()
  const hasSession = Boolean(appSession.apiKey)
  const botDestination = role === "consumer" ? "/app/consumer" : "/app/provider"

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
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            const LinkComponent = link.external ? 'a' : Link
            const linkProps = link.external 
              ? { href: link.href, target: "_blank", rel: "noopener noreferrer" }
              : { href: link.href }
            
            return (
              <LinkComponent
                key={link.href}
                {...linkProps}
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? "text-white bg-white/8 font-medium"
                    : "text-white/50 hover:text-white/80 hover:bg-white/4"
                }`}
              >
                {link.label}
              </LinkComponent>
            )
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {hasSession ? (
            <Link
              href={botDestination}
              className="px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg transition-all duration-200 shadow-lg shadow-green-500/20"
            >
              {botName ? `${botName} →` : "Your bot →"}
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="px-3 py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                Register a bot
              </Link>
              <Link
                href="/app/restore"
                className="px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
              >
                Go to your bot →
              </Link>
            </>
          )}
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
              {hasSession ? (
                <Link
                  href={botDestination}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-white text-center bg-linear-to-r from-green-600 to-emerald-600"
                >
                  {botName ? `${botName} →` : "Your bot →"}
                </Link>
              ) : (
                <>
                  <Link
                    href="/app/restore"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-white text-center bg-linear-to-r from-blue-600 to-indigo-600"
                  >
                    Go to your bot →
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm text-white/60 text-center hover:text-white transition-colors"
                  >
                    No bot yet? Register one
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
