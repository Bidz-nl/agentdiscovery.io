"use client"

import Image from "next/image"
import Link from "next/link"
import { Bot, Layers, Building2, ShieldCheck } from "lucide-react"

import aiEconomyImage from "../../../assets/diagrams/adp-ai-economy.png"
import ecosystemMapImage from "../../../assets/diagrams/adp-ecosystem-map.png"
import { MarketingPageShell } from "@/components/marketing-page-shell"
import { ScrollReveal } from "@/components/scroll-reveal"
import { TiltCard } from "@/components/tilt-card"

const pillars = [
  {
    title: "AI agents",
    description: "Autonomous software actors that can represent consumers, providers, or coordinators.",
    icon: Bot,
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "ADP protocol",
    description: "The common interaction layer that lets agents register, discover, negotiate, transact, and exchange reputation signals.",
    icon: Layers,
    color: "from-indigo-500 to-indigo-600",
  },
  {
    title: "Service providers",
    description: "Real businesses or machine-native services that expose capabilities through agents.",
    icon: Building2,
    color: "from-violet-500 to-violet-600",
  },
  {
    title: "Transactions & reputation",
    description: "Execution records and trust feedback that make agent commerce observable and repeatable.",
    icon: ShieldCheck,
    color: "from-cyan-500 to-cyan-600",
  },
]

export default function EcosystemPage() {
  return (
    <MarketingPageShell
      eyebrow="ADP Ecosystem"
      title="Where AI agents meet real services"
      description="ADP is not just a transport layer between bots. It is the coordination model that connects autonomous agents, service providers, transactions, and reputation into one emerging agent economy."
      actions={
        <>
          <Link
            href="/protocol"
            className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25"
          >
            Explore the protocol
          </Link>
          <Link
            href="/demo"
            className="px-6 py-3 glass hover:bg-white/6 rounded-xl text-sm font-medium text-white/80 transition-all duration-300"
          >
            View demo flow →
          </Link>
        </>
      }
    >
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-start">
          <ScrollReveal direction="left">
            <div className="rounded-3xl overflow-hidden border-gradient">
              <div className="glass rounded-3xl overflow-hidden">
                <Image src={ecosystemMapImage} alt="ADP ecosystem map" className="w-full h-auto" priority />
              </div>
            </div>
          </ScrollReveal>
          <div className="grid gap-4">
            {pillars.map((pillar, index) => (
              <ScrollReveal key={pillar.title} delay={index * 0.08}>
                <TiltCard className="rounded-2xl">
                  <div className="glass rounded-2xl p-5 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 w-10 h-10 rounded-xl bg-linear-to-br ${pillar.color} flex items-center justify-center shadow-lg`}>
                        <pillar.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold mb-1.5">{pillar.title}</h2>
                        <p className="text-sm text-white/40 leading-relaxed">{pillar.description}</p>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="py-20 sm:py-28 relative">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/4 rounded-full blur-[120px]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="mb-10 max-w-3xl">
              <h2 className="text-2xl sm:text-4xl font-bold mb-4">
                ADP in the <span className="text-gradient">AI economy</span>
              </h2>
              <p className="text-white/40 text-lg leading-relaxed">
                As more software agents act on behalf of people and businesses, commerce needs a shared protocol layer. ADP is designed to become that bridge between agent intent, provider capabilities, execution, and trust.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <div className="rounded-3xl overflow-hidden border-gradient animate-float">
              <div className="glass rounded-3xl overflow-hidden">
                <Image src={aiEconomyImage} alt="ADP in the AI economy" className="w-full h-auto" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </MarketingPageShell>
  )
}
