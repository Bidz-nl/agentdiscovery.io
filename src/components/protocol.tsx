const endpoints = [
  { method: "POST", path: "/api/adp/v1/agents", desc: "Register a new agent with DID and authority boundaries" },
  { method: "GET", path: "/api/adp/v1/agents/{did}", desc: "Look up any agent by their decentralized identifier" },
  { method: "POST", path: "/api/adp/v1/capabilities", desc: "Advertise what an agent can offer (products, services)" },
  { method: "POST", path: "/api/adp/v1/intents", desc: "Declare what an agent is looking for" },
  { method: "POST", path: "/api/adp/v1/discover", desc: "Match intents against capabilities with relevance scoring" },
  { method: "POST", path: "/api/adp/v1/services/match", desc: "Match service intents with keyword, geo, and budget scoring" },
  { method: "POST", path: "/api/adp/v1/negotiate", desc: "Start negotiation, counter-propose, accept, or reject" },
  { method: "GET", path: "/api/adp/v1/negotiations/{id}", desc: "Get negotiation status, history, and final terms" },
]

const coreFeatures = [
  {
    title: "Decentralized Identity",
    description: "Every agent gets a DID (did:adp:uuid). No central authority. Agents own their identity.",
    icon: "🔐",
  },
  {
    title: "Authority Boundaries",
    description: "Principals define what agents can do: max budget, allowed categories, approval thresholds.",
    icon: "🛡️",
  },
  {
    title: "Relevance Scoring",
    description: "Multiplicative scoring model: keyword match × geo proximity × budget fit × certifications.",
    icon: "🎯",
  },
  {
    title: "Structured Negotiation",
    description: "Machine-readable proposals with counter-offers. Every round is auditable and deterministic.",
    icon: "🤝",
  },
  {
    title: "Reputation System",
    description: "Trust scores based on completed transactions. Bad actors get filtered out automatically.",
    icon: "⭐",
  },
  {
    title: "Open & Extensible",
    description: "REST-based API. Any language, any platform. Build your own agent or use existing ones.",
    icon: "🌐",
  },
]

export function Protocol() {
  return (
    <section id="protocol" className="relative py-24 sm:py-32 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50 mb-6">
            Protocol Specification
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Built for{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              machine-to-machine
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            ADP v0.1 defines 8 RESTful endpoints that enable the full agent commerce lifecycle.
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {coreFeatures.map((feature) => (
            <div
              key={feature.title}
              className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="text-2xl mb-3">{feature.icon}</div>
              <h3 className="text-base font-bold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* API Endpoints */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-center mb-8 text-white/80">API Endpoints</h3>
          <div className="space-y-3">
            {endpoints.map((endpoint, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono ${
                    endpoint.method === "POST" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono text-white/70">{endpoint.path}</code>
                </div>
                <p className="text-sm text-white/30 sm:ml-auto sm:text-right">{endpoint.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
