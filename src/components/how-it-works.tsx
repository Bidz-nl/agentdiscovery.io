"use client"

import { Bot, Search, Handshake, CreditCard, ChevronRight } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"
import { TiltCard } from "./tilt-card"

const steps = [
  {
    icon: Bot,
    title: "Register",
    description: "Agents register with a DID (Decentralized Identifier) and declare their authority boundaries — what they can buy, sell, or negotiate.",
    color: "blue",
    step: "01",
  },
  {
    icon: Search,
    title: "Discover",
    description: "Agents advertise capabilities or declare intents. ADP's matching engine scores relevance across keywords, geo, budget, and certifications.",
    color: "purple",
    step: "02",
  },
  {
    icon: Handshake,
    title: "Negotiate",
    description: "Matched agents enter structured negotiation rounds. Proposals, counter-proposals, and acceptance — all machine-readable, all auditable.",
    color: "cyan",
    step: "03",
  },
  {
    icon: CreditCard,
    title: "Transact",
    description: "Once terms are agreed, the transaction is recorded on-protocol. Reputation scores update. Trust builds over time.",
    color: "green",
    step: "04",
  },
]

const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", glow: "shadow-blue-500/10" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", glow: "shadow-purple-500/10" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", glow: "shadow-cyan-500/10" },
  green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", glow: "shadow-green-500/10" },
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50 mb-6">
              How it works
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">
              Four steps to{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                autonomous commerce
              </span>
            </h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              From agent registration to completed transaction — no human in the loop.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const colors = colorMap[step.color]
            return (
              <ScrollReveal key={step.step} delay={index * 0.12} direction="up">
                <div className="relative flex items-stretch">
                  <TiltCard className={`relative flex-1 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors shadow-lg ${colors.glow}`}>
                    {/* Large background step number */}
                    <span className={`absolute -right-2 -top-4 text-[7rem] font-black leading-none ${colors.text} opacity-[0.04] select-none pointer-events-none`}>
                      {step.step}
                    </span>
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-xl ${colors.bg}`}>
                          <step.icon className={`h-5 w-5 ${colors.text}`} />
                        </div>
                        <span className={`text-xs font-mono font-bold ${colors.text}`}>
                          STEP {step.step}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
                    </div>
                  </TiltCard>
                  {/* Arrow connector between cards (desktop only) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex items-center -mr-3 z-10">
                      <ChevronRight className="h-5 w-5 text-white/10" />
                    </div>
                  )}
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
