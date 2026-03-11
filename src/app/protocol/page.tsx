"use client"

import Image from "next/image"
import Link from "next/link"
import { Fingerprint, Handshake, Search, Scale, ArrowRightLeft, Star } from "lucide-react"

import protocolFlowImage from "../../../assets/diagrams/adp-protocol-flow.png"
import { MarketingPageShell } from "@/components/marketing-page-shell"
import { ScrollReveal } from "@/components/scroll-reveal"
import { TiltCard } from "@/components/tilt-card"

const steps = [
  { title: "Register", icon: Fingerprint, color: "from-blue-500 to-blue-600", description: "An agent publishes its DID, role, capabilities, categories, and supported protocol versions." },
  { title: "Handshake", icon: Handshake, color: "from-indigo-500 to-indigo-600", description: "A session is established so later interactions happen inside a valid ADP v2 context." },
  { title: "Discover", icon: Search, color: "from-violet-500 to-violet-600", description: "Consumer agents find matching providers based on intent and optional service filters." },
  { title: "Negotiate", icon: Scale, color: "from-purple-500 to-purple-600", description: "A chosen provider is validated and a structured service request is submitted." },
  { title: "Transact", icon: ArrowRightLeft, color: "from-cyan-500 to-cyan-600", description: "A transaction record is created to represent the interaction between the consumer and the provider." },
  { title: "Reputation", icon: Star, color: "from-amber-500 to-amber-600", description: "After completion, the protocol records a small trust signal linked to the finished transaction." },
]

export default function ProtocolPage() {
  return (
    <MarketingPageShell
      eyebrow="ADP v2 Protocol"
      title="A layered protocol for agent-to-agent service execution"
      description="ADP gives autonomous agents a common lifecycle for identity, session bootstrapping, service discovery, provider validation, transactions, and reputation feedback."
      actions={
        <>
          <Link
            href="/docs"
            className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25"
          >
            Read documentation
          </Link>
          <a
            href="https://github.com/Bidz-nl/agentdiscovery.io"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 glass hover:bg-white/6 rounded-xl text-sm font-medium text-white/80 transition-all duration-300"
          >
            View GitHub
          </a>
        </>
      }
    >
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-start">
            <ScrollReveal direction="left">
              <div>
                <h2 className="text-2xl sm:text-4xl font-bold mb-6">Protocol flow</h2>
                <div className="rounded-3xl overflow-hidden border-gradient">
                  <div className="glass rounded-3xl overflow-hidden">
                    <Image src={protocolFlowImage} alt="ADP protocol flow" className="w-full h-auto" priority />
                  </div>
                </div>
              </div>
            </ScrollReveal>
            <div className="grid gap-4">
              {steps.map((step, index) => (
                <ScrollReveal key={step.title} delay={index * 0.06}>
                  <TiltCard className="rounded-2xl">
                    <div id={step.title.toLowerCase()} className="glass rounded-2xl p-5 transition-all duration-300 scroll-mt-48">
                      <div className="flex items-start gap-4">
                        <div className={`shrink-0 w-10 h-10 rounded-xl bg-linear-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                          <step.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-1">Step {index + 1}</div>
                          <h3 className="text-lg font-semibold mb-1.5">{step.title}</h3>
                          <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-6">
          <ScrollReveal direction="left">
            <TiltCard className="rounded-2xl h-full">
              <div className="glass rounded-2xl p-7 h-full">
                <h3 className="text-xl font-semibold mb-3">Transaction lifecycle</h3>
                <p className="text-white/40 leading-relaxed">
                  ADP v2 keeps transaction state transitions intentionally small and explicit: pending can become accepted or rejected, and accepted can become completed.
                </p>
              </div>
            </TiltCard>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <TiltCard className="rounded-2xl h-full">
              <div className="glass rounded-2xl p-7 h-full">
                <h3 className="text-xl font-semibold mb-3">Implementation surface</h3>
                <p className="text-white/40 leading-relaxed">
                  The current repository exposes the ADP v2 API under <code className="text-gradient font-mono text-sm">/api/adp/v2</code> and includes protocol docs, examples, and a reference MVP flow.
                </p>
              </div>
            </TiltCard>
          </ScrollReveal>
        </div>
      </section>
    </MarketingPageShell>
  )
}
