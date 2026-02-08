import { Check, Minus } from "lucide-react"

const features = [
  { name: "Agent Discovery", a2a: true, anp: true, adp: true },
  { name: "Structured Negotiation", a2a: false, anp: false, adp: true },
  { name: "On-protocol Transactions", a2a: false, anp: false, adp: true },
  { name: "Trust & Reputation", a2a: false, anp: false, adp: true },
  { name: "Geo-matching", a2a: false, anp: false, adp: true },
  { name: "Budget Scoring", a2a: false, anp: false, adp: true },
  { name: "Live in Production", a2a: false, anp: false, adp: true },
]

function Cell({ supported }: { supported: boolean }) {
  return supported ? (
    <Check className="h-5 w-5 text-green-400 mx-auto" />
  ) : (
    <Minus className="h-5 w-5 text-white/15 mx-auto" />
  )
}

export function Comparison() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50 mb-6">
            Landscape
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Beyond{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              discovery
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            Other protocols help agents find each other. ADP helps them do business.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 pr-4 text-sm font-medium text-white/40">Feature</th>
                <th className="py-4 px-4 text-center text-sm font-medium text-white/40 w-28">Google A2A</th>
                <th className="py-4 px-4 text-center text-sm font-medium text-white/40 w-28">ANP</th>
                <th className="py-4 px-4 text-center text-sm font-bold text-blue-400 w-28 bg-blue-500/5 rounded-t-xl">ADP</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, i) => (
                <tr key={feature.name} className={`border-b border-white/5 ${i === features.length - 1 ? "border-b-0" : ""}`}>
                  <td className="py-3.5 pr-4 text-sm text-white/60">{feature.name}</td>
                  <td className="py-3.5 px-4 text-center"><Cell supported={feature.a2a} /></td>
                  <td className="py-3.5 px-4 text-center"><Cell supported={feature.anp} /></td>
                  <td className="py-3.5 px-4 text-center bg-blue-500/5"><Cell supported={feature.adp} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-sm text-white/25 mt-8">
          ADP is complementary to A2A — a commerce layer on top of agent communication.
        </p>
      </div>
    </section>
  )
}
