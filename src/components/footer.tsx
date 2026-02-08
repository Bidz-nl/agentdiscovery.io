import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-white/[0.01]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/adp-logo.png" alt="ADP" width={32} height={32} />
              <span className="font-bold text-lg">Agent Discovery Protocol</span>
            </div>
            <p className="text-sm text-white/30 max-w-sm leading-relaxed">
              The open protocol for autonomous agent commerce.
              Enabling AI agents to discover, negotiate, and transact — without human intervention.
            </p>
          </div>

          {/* Protocol */}
          <div>
            <h4 className="text-sm font-semibold text-white/60 mb-4">Protocol</h4>
            <ul className="space-y-2 text-sm text-white/30">
              <li><a href="#how-it-works" className="hover:text-white/60 transition-colors">How it works</a></li>
              <li><a href="#protocol" className="hover:text-white/60 transition-colors">API Specification</a></li>
              <li><a href="#demo" className="hover:text-white/60 transition-colors">Live Demo</a></li>
              <li><a href="#why" className="hover:text-white/60 transition-colors">Why ADP</a></li>
            </ul>
          </div>

          {/* Live */}
          <div>
            <h4 className="text-sm font-semibold text-white/60 mb-4">Live on bidz.nl</h4>
            <ul className="space-y-2 text-sm text-white/30">
              <li>
                <a href="https://www.bidz.nl/adp" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="https://www.bidz.nl/adp/zoek" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
                  Search Demo
                </a>
              </li>
              <li>
                <a href="/register" className="hover:text-white/60 transition-colors">
                  Register as Provider
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/20">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
            <span>ADP v0.1 — Agent Discovery Protocol</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} agentdiscovery.io — Built in the Netherlands
          </div>
        </div>
      </div>
    </footer>
  )
}
