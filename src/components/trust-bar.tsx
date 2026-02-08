import { Shield, Lock, Globe, Cpu } from "lucide-react"

export function TrustBar() {
  return (
    <section className="relative py-12 border-t border-b border-white/5 bg-white/[0.01]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-white/25">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Open Protocol</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">DID-based Identity</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">REST API</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Machine-to-Machine</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Live on Production</span>
          </div>
        </div>
      </div>
    </section>
  )
}
