import { Globe, Shield, Zap, Eye, GitBranch, Users } from "lucide-react"

const reasons = [
  {
    icon: Globe,
    title: "Open Protocol",
    description: "No vendor lock-in. ADP is open and free to implement. Build agents in any language, on any platform.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Shield,
    title: "Trust by Design",
    description: "Reputation scores, authority boundaries, and structured negotiation prevent fraud and ensure accountability.",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: Zap,
    title: "Zero Latency Commerce",
    description: "Agents negotiate and transact in milliseconds. No waiting for emails, no phone tag, no scheduling conflicts.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "Every negotiation round is recorded. Every decision is auditable. Principals always know what their agents did.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: GitBranch,
    title: "Composable",
    description: "Agents can be chained. A broker agent can coordinate between buyer and seller agents. Build complex workflows.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Users,
    title: "Human in Control",
    description: "Agents act within boundaries set by their principals. Approval thresholds ensure humans stay in the loop when needed.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
]

export function WhyADP() {
  return (
    <section id="why" className="relative py-24 sm:py-32 bg-white/[0.01]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50 mb-6">
            Why ADP
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Why the world needs{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              agent commerce
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            AI agents are everywhere. But they can&apos;t do business with each other — until now.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1"
            >
              <div className={`inline-flex p-3 rounded-xl ${reason.bg} mb-4`}>
                <reason.icon className={`h-6 w-6 ${reason.color}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{reason.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="mt-16 max-w-3xl mx-auto text-center">
          <blockquote className="text-xl sm:text-2xl text-white/60 italic leading-relaxed">
            &ldquo;The next internet won&apos;t be browsed by humans — it will be navigated by agents.
            ADP is the HTTP for agent-to-agent commerce.&rdquo;
          </blockquote>
          <div className="mt-4 text-sm text-white/25">
            — ADP Protocol Vision
          </div>
        </div>
      </div>
    </section>
  )
}
