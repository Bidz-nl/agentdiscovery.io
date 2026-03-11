"use client"

import Image from "next/image"
import { FileText, BookOpen, Layers, Rocket, ArrowUpRight } from "lucide-react"

import architectureImage from "../../../assets/diagrams/adp-architecture.png"
import protocolFlowImage from "../../../assets/diagrams/adp-protocol-flow.png"
import { MarketingPageShell } from "@/components/marketing-page-shell"
import { ScrollReveal } from "@/components/scroll-reveal"
import { TiltCard } from "@/components/tilt-card"

const docLinks = [
  {
    title: "ADP v2 Overview",
    description: "High-level introduction to the protocol, its layers, route surface, and MVP boundaries.",
    href: "https://github.com/Bidz-nl/agentdiscovery.io/blob/main/docs/adp-v2-overview.md",
    icon: FileText,
    color: "from-blue-500 to-blue-600",
  },
  {
    title: "ADP v2 Specification",
    description: "Formal protocol-oriented specification covering terminology, flow, API surface, and lifecycle rules.",
    href: "https://github.com/Bidz-nl/agentdiscovery.io/blob/main/docs/adp-v2-spec.md",
    icon: BookOpen,
    color: "from-indigo-500 to-indigo-600",
  },
  {
    title: "ADP v2 Architecture",
    description: "Developer-facing architecture description of the identity, session, discovery, negotiation, transaction, and reputation layers.",
    href: "https://github.com/Bidz-nl/agentdiscovery.io/blob/main/docs/adp-v2-architecture.md",
    icon: Layers,
    color: "from-violet-500 to-violet-600",
  },
  {
    title: "ADP v2 Quickstart",
    description: "Local testing instructions and curl examples for the current reference implementation.",
    href: "https://github.com/Bidz-nl/agentdiscovery.io/blob/main/docs/adp-v2-quickstart.md",
    icon: Rocket,
    color: "from-cyan-500 to-cyan-600",
  },
]

const highlights = [
  { title: "Protocol first", description: "The docs reflect ADP v2 as a protocol lifecycle instead of a generic API showcase." },
  { title: "Developer ready", description: "Quickstart docs, curl demo script, governance files, and repository hygiene are all in place." },
  { title: "Linked to GitHub", description: "Every page in this hub points back to the source documents living in the public repository." },
]

export default function DocsPage() {
  return (
    <MarketingPageShell
      eyebrow="Documentation"
      title="Read the protocol, not just the pitch"
      description="The repository includes a protocol overview, formal specification, architecture note, quickstart, examples, and a full README with diagrams."
      actions={
        <a
          href="https://github.com/Bidz-nl/agentdiscovery.io/tree/main/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25 inline-flex items-center gap-2"
        >
          Open docs on GitHub <ArrowUpRight className="w-4 h-4" />
        </a>
      }
    >
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-start">
          <div className="grid gap-4">
            {docLinks.map((doc, index) => (
              <ScrollReveal key={doc.title} delay={index * 0.08}>
                <a
                  id={doc.title === "ADP v2 Quickstart" ? "quickstart" : undefined}
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group scroll-mt-40"
                >
                  <TiltCard className="rounded-2xl">
                    <div className="glass rounded-2xl p-6 transition-all duration-300 group-hover:border-white/15">
                      <div className="flex items-start gap-4">
                        <div className={`shrink-0 w-10 h-10 rounded-xl bg-linear-to-br ${doc.color} flex items-center justify-center shadow-lg`}>
                          <doc.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h2 className="text-lg font-semibold">{doc.title}</h2>
                            <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                          </div>
                          <p className="text-sm text-white/40 leading-relaxed">{doc.description}</p>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </a>
              </ScrollReveal>
            ))}
          </div>
          <div className="grid gap-6">
            <ScrollReveal direction="right">
              <div className="rounded-3xl overflow-hidden border-gradient">
                <div className="glass rounded-3xl overflow-hidden">
                  <Image src={protocolFlowImage} alt="ADP protocol flow" className="w-full h-auto" priority />
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={0.15}>
              <div className="rounded-3xl overflow-hidden border-gradient">
                <div className="glass rounded-3xl overflow-hidden">
                  <Image src={architectureImage} alt="ADP architecture" className="w-full h-auto" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-3 gap-6">
          {highlights.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 0.1}>
              <TiltCard className="rounded-2xl h-full">
                <div className="glass rounded-2xl p-7 h-full">
                  <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{item.description}</p>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </MarketingPageShell>
  )
}
