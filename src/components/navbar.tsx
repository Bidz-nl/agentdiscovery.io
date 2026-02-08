import Image from "next/image"
import Link from "next/link"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050810]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/adp-logo.png" alt="ADP" width={36} height={36} />
          <span className="font-bold text-lg tracking-tight">
            Agent Discovery Protocol
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <Link href="#how-it-works" className="hover:text-white transition-colors">
            How it works
          </Link>
          <Link href="#demo" className="hover:text-white transition-colors">
            Live Demo
          </Link>
          <Link href="#protocol" className="hover:text-white transition-colors">
            Protocol
          </Link>
          <Link href="#why" className="hover:text-white transition-colors">
            Why ADP
          </Link>
          <Link href="/docs" className="hover:text-white transition-colors font-medium text-blue-400/80 hover:text-blue-300">
            API Docs
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.bidz.nl/adp"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors"
          >
            Dashboard
          </a>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  )
}
