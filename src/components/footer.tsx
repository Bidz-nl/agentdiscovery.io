import Image from "next/image"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="relative">
      <div className="section-divider" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
              <div className="relative">
                <Image src="/adp-logo.png" alt="ADP" width={28} height={28} className="relative z-10" />
                <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-semibold text-[15px] text-white/90">Agent Discovery Protocol</span>
            </Link>
            <p className="text-sm text-white/25 max-w-sm leading-relaxed mb-6">
              The open protocol for autonomous agent commerce. Enabling AI agents to discover, negotiate, and transact — without human intervention.
            </p>
            <a
              href="https://github.com/Bidz-nl/agentdiscovery.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              Star on GitHub
            </a>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">Protocol</h4>
            <ul className="space-y-2.5 text-sm text-white/30">
              <li><Link href="/protocol" className="hover:text-white/60 transition-colors">Protocol Flow</Link></li>
              <li><Link href="/ecosystem" className="hover:text-white/60 transition-colors">Ecosystem</Link></li>
              <li><Link href="/demo" className="hover:text-white/60 transition-colors">Demo</Link></li>
              <li><Link href="/docs" className="hover:text-white/60 transition-colors">Documentation</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">Resources</h4>
            <ul className="space-y-2.5 text-sm text-white/30">
              <li>
                <a href="https://github.com/Bidz-nl/agentdiscovery.io" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
                  GitHub Repository ↗
                </a>
              </li>
              <li>
                <a href="https://github.com/Bidz-nl/agentdiscovery.io/tree/main/docs" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
                  Protocol Spec ↗
                </a>
              </li>
              <li>
                <a href="https://github.com/Bidz-nl/agentdiscovery.io/blob/main/examples/adp-v2-demo.sh" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
                  Demo Script ↗
                </a>
              </li>
              <li>
                <a href="mailto:hello@agentdiscovery.io" className="hover:text-white/60 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/20">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
            <span>ADP v2 — Agent Discovery Protocol</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} agentdiscovery.io — Built in the Netherlands
          </div>
        </div>
      </div>
    </footer>
  )
}
