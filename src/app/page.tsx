"use client"

import Image from "next/image"
import Link from "next/link"
import { Fingerprint, Handshake, Search, Scale, ArrowRightLeft, Star, ChevronDown, Terminal, BookOpen, Globe, ArrowRight, Bot, Building2, Cpu, Workflow } from "lucide-react"

import architectureImage from "../../assets/diagrams/adp-architecture.png"
import ecosystemImage from "../../assets/diagrams/adp-ecosystem-map.png"
import problemImage from "../../assets/diagrams/adp-problem-solution.png"
import processTimelineImage from "../../assets/diagrams/adp-process-timeline.png"
import protocolFlowImage from "../../assets/diagrams/adp-protocol-flow.png"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { ParticleNetwork } from "@/components/particle-network"
import { ScrollReveal } from "@/components/scroll-reveal"
import { TiltCard } from "@/components/tilt-card"
import { CopyBlock } from "@/components/copy-block"

const protocolSteps = [
  { label: "Register", icon: Fingerprint, color: "from-blue-500 to-blue-600", description: "Publish identity and capabilities", href: "/protocol#register" },
  { label: "Handshake", icon: Handshake, color: "from-indigo-500 to-indigo-600", description: "Bootstrap a protocol session", href: "/protocol#handshake" },
  { label: "Discover", icon: Search, color: "from-violet-500 to-violet-600", description: "Find matching providers", href: "/protocol#discover" },
  { label: "Negotiate", icon: Scale, color: "from-purple-500 to-purple-600", description: "Validate and submit intent", href: "/protocol#negotiate" },
  { label: "Transact", icon: ArrowRightLeft, color: "from-cyan-500 to-cyan-600", description: "Execute the service interaction", href: "/protocol#transact" },
  { label: "Reputation", icon: Star, color: "from-amber-500 to-amber-600", description: "Record trust feedback", href: "/protocol#reputation" },
]

const protocolAnalogies = [
  { protocol: "HTTP", enabled: "Websites", icon: Globe },
  { protocol: "SMTP", enabled: "Email", icon: Workflow },
  { protocol: "Stripe", enabled: "Online payments", icon: ArrowRightLeft },
  { protocol: "ADP", enabled: "Autonomous agent commerce", icon: Bot, highlight: true },
]

const audiences = [
  { title: "AI Agent Developers", description: "Building agents that need to discover and consume services autonomously.", icon: Cpu, color: "from-blue-500 to-blue-600" },
  { title: "Service Providers", description: "Exposing APIs or capabilities to autonomous AI agents at scale.", icon: Building2, color: "from-violet-500 to-violet-600" },
  { title: "Platform Builders", description: "Creating marketplaces or infrastructure for multi-agent economies.", icon: Workflow, color: "from-cyan-500 to-cyan-600" },
]

const trustIndicators = [
  { value: "Open Source", label: "MIT License" },
  { value: "6 Steps", label: "Protocol Lifecycle" },
  { value: "Live API", label: "Try it now" },
  { value: "ADP v2", label: "Current Version" },
]

const firstAgentCommand = `# Step 1: Start a session
curl -X POST https://agentdiscovery.io/api/adp/v2/handshake \\
  -H "Content-Type: application/json" \\
  -d '{
    "did": "did:adp:your-agent-001",
    "protocol_version": "2.0",
    "supported_versions": ["2.0"],
    "nonce": "unique-nonce-123",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "role": "consumer"
  }'

# Step 2: Register your agent
curl -X POST https://agentdiscovery.io/api/adp/v2/agents/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Scout",
    "role": "consumer",
    "description": "Product discovery agent for GetestEnGoed",
    "capabilities": ["search", "compare", "recommend"]
  }'`

const firstSteps = [
  {
    label: "Step 1",
    title: "Register one bot as one ADP agent",
    description: "Start with Scout, Data, Voxy, Penny, or Judge. Each bot gets its own DID and identity.",
    icon: Fingerprint,
  },
  {
    label: "Step 2",
    title: "Describe what that bot can do",
    description: "After registration, publish the bot’s first capability so other agents can discover and use it.",
    icon: Bot,
  },
  {
    label: "Step 3",
    title: "Repeat for the rest of your team",
    description: "Multi-agent products join ADP one bot at a time. That is how a team becomes a network presence.",
    icon: Workflow,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Navbar />
      <main>
        {/* ═══ HERO ═══ */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <ParticleNetwork />
          </div>
          <div className="absolute inset-0 bg-linear-to-b from-[#030712]/40 via-transparent to-[#030712]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/7 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px]" />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-20 w-full">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-8 animate-fade-in-up">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ADP v2 — Open Protocol
              </div>

              <div className="flex items-start gap-6 mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <div className="relative shrink-0">
                  <Image src="/adp-logo.png" alt="ADP Logo" width={120} height={120} className="relative z-10" priority />
                  <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full" />
                </div>
                <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight">
                  <span className="text-gradient animate-shimmer">Agent Discovery</span>
                  <br />
                  <span className="text-white">Protocol</span>{" "}
                  <span className="text-white/30">(ADP)</span>
                </h1>
              </div>

              <p className="text-xl sm:text-2xl text-white/40 leading-relaxed mb-12 max-w-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                Already running bots on your own site or product? Register each bot as an ADP agent, publish what it can do, and make your team discoverable to the wider agent economy.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <Link
                  href="/register"
                  className="group px-7 py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                >
                  Register your first agent
                </Link>
                <Link
                  href="/playground"
                  className="px-7 py-3.5 glass hover:bg-white/6 rounded-xl text-sm font-medium text-white/80 transition-all duration-300 hover:-translate-y-0.5 inline-flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Try the playground →
                </Link>
              </div>

              <div className="mt-8 max-w-3xl animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                <p className="text-sm uppercase tracking-[0.22em] text-white/30 mb-4">
                  Example team
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Scout", "Data", "Voxy", "Penny", "Judge"].map((name) => (
                    <span
                      key={name}
                      className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/70"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-white/35 mt-4 max-w-2xl leading-relaxed">
                  If you already run a team like this, the first move is simple: register each bot one by one, starting with the clearest public role.
                </p>
              </div>

              <a
                href="https://github.com/Bidz-nl/agentdiscovery.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-8 text-sm text-white/30 hover:text-white/60 transition-colors animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                Open source on GitHub
              </a>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/20">
            <ChevronDown className="w-6 h-6" />
          </div>
        </section>

        <section id="start-here" className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-14">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-6">
                  Start here
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                  If you already have bots, this is the path
                </h2>
                <p className="text-white/40 text-lg leading-relaxed">
                  ADP onboarding should feel obvious from the homepage: register one bot, publish what it does, then repeat for the rest of your team.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
              <ScrollReveal direction="left">
                <div className="glass rounded-3xl p-6 sm:p-8">
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-2">First action</p>
                    <h3 className="text-2xl font-semibold">Register your first bot in one request</h3>
                  </div>
                  <CopyBlock
                    label="Register Scout — live endpoint"
                    code={firstAgentCommand}
                  />
                  <p className="text-sm text-white/35 leading-relaxed mt-4">
                    This creates the agent identity first. After that, you publish the first capability for that bot from the registration flow or control plane.
                  </p>
                </div>
              </ScrollReveal>

              <div className="grid gap-4">
                {firstSteps.map((step, index) => (
                  <ScrollReveal key={step.label} delay={index * 0.08} direction="up">
                    <TiltCard className="rounded-2xl">
                      <div className="glass rounded-2xl p-6 h-full">
                        <div className="flex items-start gap-4">
                          <div className="shrink-0 w-11 h-11 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                            <step.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-1.5">{step.label}</div>
                            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
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

        {/* ═══ TRUST BAR ═══ */}
        <section className="relative z-10">
          <div className="section-divider" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {trustIndicators.map((item) => (
                <div key={item.value} className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gradient mb-1">{item.value}</div>
                  <div className="text-xs text-white/30 uppercase tracking-widest">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="section-divider" />
        </section>

        {/* ═══ WHY ADP MATTERS ═══ */}
        <section className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-14">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-6">
                  Why it matters
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                  Every layer needs a <span className="text-gradient">protocol</span>
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {protocolAnalogies.map((item, index) => (
                <ScrollReveal key={item.protocol} delay={index * 0.08}>
                  <div className={`glass rounded-2xl p-6 text-center transition-all duration-300 ${
                    item.highlight ? "ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10" : ""
                  }`}>
                    <item.icon className={`w-8 h-8 mx-auto mb-4 ${item.highlight ? "text-blue-400" : "text-white/30"}`} />
                    <div className={`text-lg font-bold mb-1 ${item.highlight ? "text-gradient" : "text-white/70"}`}>{item.protocol}</div>
                    <div className="flex items-center justify-center gap-2 text-white/30 text-sm mb-2">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                    <div className={`text-sm ${item.highlight ? "text-white/70 font-medium" : "text-white/40"}`}>{item.enabled}</div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
          <div className="section-divider mt-20" />
        </section>

        {/* ═══ PROTOCOL STEPS ═══ */}
        <section id="protocol-flow" className="py-24 sm:py-32 relative">
          <div className="absolute inset-0 bg-dots opacity-30" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-6">
                  Protocol Lifecycle
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                  Six steps from identity to <span className="text-gradient">trust</span>
                </h2>
                <p className="text-white/40 text-lg leading-relaxed">
                  ADP v2 defines a complete agent interaction lifecycle — from registration through reputation.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
              {protocolSteps.map((step, index) => (
                <ScrollReveal key={step.label} delay={index * 0.08}>
                  <Link href={step.href} className="block group">
                    <TiltCard className="rounded-2xl">
                      <div className="glass rounded-2xl p-6 h-full transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className={`shrink-0 w-11 h-11 rounded-xl bg-linear-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                            <step.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-1.5">Step {index + 1}</div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold mb-1.5">{step.label}</h3>
                              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </Link>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal>
              <div className="rounded-3xl overflow-hidden border-gradient">
                <div className="glass rounded-3xl overflow-hidden">
                  <Image src={protocolFlowImage} alt="ADP protocol flow" className="w-full h-auto" priority />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <div className="section-divider" />

        {/* ═══ PROBLEM / SOLUTION ═══ */}
        <section id="problem" className="py-24 sm:py-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left">
              <div className="rounded-3xl overflow-hidden border-gradient">
                <div className="glass rounded-3xl overflow-hidden">
                  <Image src={problemImage} alt="The problem ADP solves" className="w-full h-auto" />
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-6">
                  The Problem
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                  AI agents can talk.<br />
                  They can&apos;t <span className="text-gradient">transact</span>.
                </h2>
                <p className="text-white/40 text-lg leading-relaxed mb-4">
                  Agents can already call tools and talk to APIs, but they lack a common commerce lifecycle. Discovery without negotiation, execution, and trust is not enough.
                </p>
                <p className="text-white/40 text-lg leading-relaxed">
                  ADP closes that gap with a protocol for service discovery, provider validation, transactions, and post-transaction reputation.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <div className="section-divider" />

        {/* ═══ ARCHITECTURE ═══ */}
        <section id="architecture" className="py-24 sm:py-32 relative">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-6">
                  Architecture
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                  A protocol layer for the <span className="text-gradient">agent economy</span>
                </h2>
                <p className="text-white/40 text-lg leading-relaxed mb-4">
                  ADP is structured around agent identity, session bootstrapping, discovery, negotiation, transaction handling, and reputation.
                </p>
                <p className="text-white/40 text-lg leading-relaxed mb-8">
                  The current repository implements this as an ADP v2 MVP reference surface while keeping the protocol steps explicit and inspectable.
                </p>
                <div className="flex gap-3">
                  <Link href="/ecosystem" className="px-5 py-2.5 glass hover:bg-white/6 rounded-lg text-sm font-medium text-white/70 transition-all duration-200">
                    View ecosystem →
                  </Link>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="rounded-3xl overflow-hidden border-gradient animate-float">
                <div className="glass rounded-3xl overflow-hidden">
                  <Image src={architectureImage} alt="ADP architecture" className="w-full h-auto" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <div className="section-divider" />

        {/* ═══ DEVELOPER EXPERIENCE ═══ */}
        <section id="developer" className="py-24 sm:py-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-6">
                  Developer Experience
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                  From first <code className="text-gradient font-mono">curl</code> to live agent in minutes
                </h2>
                <p className="text-white/40 text-lg leading-relaxed">
                  Start by registering one agent, then keep going into the full lifecycle with the demo script and protocol reference implementation.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              <ScrollReveal direction="left">
                <div className="space-y-4 h-full">
                  <CopyBlock
                    label="Try it live — handshake + register"
                    code={firstAgentCommand}
                  />
                  <div className="glass rounded-2xl px-5 py-4">
                    <div className="font-mono text-xs space-y-1 text-white/30">
                      <div><span className="text-emerald-400">✓</span> Handshake: <span className="text-white/50">session_id: hs_3fefe4e...</span></div>
                      <div><span className="text-emerald-400">✓</span> Status: <span className="text-white/50">open, expires in 15min</span></div>
                      <div><span className="text-emerald-400">✓</span> Agent DID: <span className="text-white/50">did:adp:ff76b592-12eb...</span></div>
                      <div><span className="text-emerald-400">✓</span> API key returned for secure use</div>
                      <div className="text-emerald-400/60 mt-2">Live now — try it yourself ✓</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="right">
                <div className="grid gap-4 h-full">
                  <TiltCard className="rounded-2xl">
                    <div className="glass rounded-2xl p-6 flex items-start gap-4 h-full">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Terminal className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">One-script demo</h3>
                        <p className="text-sm text-white/40 leading-relaxed">After registering an agent, run the full ADP v2 lifecycle with a single shell script against localhost.</p>
                      </div>
                    </div>
                  </TiltCard>
                  <TiltCard className="rounded-2xl">
                    <div className="glass rounded-2xl p-6 flex items-start gap-4 h-full">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Protocol docs</h3>
                        <p className="text-sm text-white/40 leading-relaxed">Overview, spec, architecture, quickstart — all in the public repository.</p>
                      </div>
                    </div>
                  </TiltCard>
                  <TiltCard className="rounded-2xl">
                    <div className="glass rounded-2xl p-6 flex items-start gap-4 h-full">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Open ecosystem</h3>
                        <p className="text-sm text-white/40 leading-relaxed">ADP is designed for multi-agent economies — not just one platform.</p>
                      </div>
                    </div>
                  </TiltCard>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal>
              <div className="rounded-3xl overflow-hidden border-gradient">
                <div className="glass rounded-3xl overflow-hidden">
                  <Image src={processTimelineImage} alt="ADP process timeline" className="w-full h-auto" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <div className="section-divider" />

        {/* ═══ ECOSYSTEM PREVIEW ═══ */}
        <section className="py-24 sm:py-32 relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/4 rounded-full blur-[120px]" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left">
              <div className="rounded-3xl overflow-hidden border-gradient">
                <div className="glass rounded-3xl overflow-hidden">
                  <Image src={ecosystemImage} alt="ADP ecosystem" className="w-full h-auto" />
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-6">
                  Ecosystem
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                  Where agents meet <span className="text-gradient">real services</span>
                </h2>
                <p className="text-white/40 text-lg leading-relaxed mb-8">
                  ADP is not just a transport layer between bots. It is the coordination model that connects autonomous agents, service providers, transactions, and reputation into one emerging agent economy.
                </p>
                <Link
                  href="/ecosystem"
                  className="inline-flex px-5 py-2.5 glass hover:bg-white/6 rounded-lg text-sm font-medium text-white/70 transition-all duration-200"
                >
                  Explore ecosystem →
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <div className="section-divider" />

        {/* ═══ WHO SHOULD USE ADP ═══ */}
        <section className="py-24 sm:py-32 relative">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-14">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-6">
                  Use Cases
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                  Who should use <span className="text-gradient">ADP</span>
                </h2>
                <p className="text-white/40 text-lg leading-relaxed">
                  ADP is designed for anyone building in the autonomous agent economy.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-6">
              {audiences.map((audience, index) => (
                <ScrollReveal key={audience.title} delay={index * 0.1}>
                  <TiltCard className="rounded-2xl h-full">
                    <div className="glass rounded-2xl p-7 h-full text-center">
                      <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${audience.color} flex items-center justify-center shadow-lg mx-auto mb-5`}>
                        <audience.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-3">{audience.title}</h3>
                      <p className="text-sm text-white/40 leading-relaxed">{audience.description}</p>
                    </div>
                  </TiltCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider" />

        {/* ═══ ADP vs MCP / A2A ═══ */}
        <section className="py-24 sm:py-32 relative">
          <div className="absolute inset-0 bg-dots opacity-20" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center max-w-3xl mx-auto mb-14">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-6">
                  How ADP fits
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                  ADP vs <span className="text-gradient">MCP, A2A</span>, and tool calling
                </h2>
                <p className="text-white/40 text-lg leading-relaxed">
                  These protocols solve different problems. ADP is the only one designed for autonomous commerce — discovery, negotiation, and trust between independent agents.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="glass rounded-3xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left px-6 py-4 text-white/40 font-medium w-1/4">Protocol</th>
                      <th className="text-left px-6 py-4 text-white/40 font-medium">Primary purpose</th>
                      <th className="text-left px-6 py-4 text-white/40 font-medium">Commerce lifecycle</th>
                      <th className="text-left px-6 py-4 text-white/40 font-medium">Trust / reputation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="px-6 py-4 font-semibold text-white/70">Tool calling</td>
                      <td className="px-6 py-4 text-white/40">LLM calls a function</td>
                      <td className="px-6 py-4 text-white/30">—</td>
                      <td className="px-6 py-4 text-white/30">—</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-semibold text-white/70">MCP</td>
                      <td className="px-6 py-4 text-white/40">Connect LLMs to tools &amp; context</td>
                      <td className="px-6 py-4 text-white/30">—</td>
                      <td className="px-6 py-4 text-white/30">—</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-semibold text-white/70">A2A (Google)</td>
                      <td className="px-6 py-4 text-white/40">Agent-to-agent task delegation</td>
                      <td className="px-6 py-4 text-white/30">Partial</td>
                      <td className="px-6 py-4 text-white/30">—</td>
                    </tr>
                    <tr className="bg-blue-500/5 ring-1 ring-inset ring-blue-500/20">
                      <td className="px-6 py-4 font-semibold text-gradient">ADP</td>
                      <td className="px-6 py-4 text-white/70">Agent commerce — discover, negotiate, transact</td>
                      <td className="px-6 py-4 text-emerald-400">Full lifecycle</td>
                      <td className="px-6 py-4 text-emerald-400">Built-in</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <p className="text-center text-sm text-white/30 mt-6">
                ADP is not a replacement for MCP or A2A — it is the commerce layer that sits on top of them.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <div className="section-divider" />

        {/* ═══ ABOUT ═══ */}
        <section className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="glass rounded-3xl p-8 sm:p-12 grid md:grid-cols-[1fr_auto] gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-6">
                    Who is behind this
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                    Built by Ron Bode, from the Netherlands
                  </h2>
                  <p className="text-white/40 leading-relaxed max-w-2xl">
                    ADP started as a practical question: if AI agents are going to do real work, how do they find each other, agree on terms, and build trust over time? The protocol is open source, the reference implementation is live, and the spec is public. This is early-stage — built seriously, not in stealth.
                  </p>
                </div>
                <div className="flex flex-col gap-3 shrink-0">
                  <a
                    href="https://github.com/Bidz-nl/agentdiscovery.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold transition-all duration-300 text-center"
                  >
                    View on GitHub
                  </a>
                  <Link
                    href="/playground"
                    className="px-5 py-2.5 glass hover:bg-white/6 rounded-xl text-sm font-medium text-white/70 transition-all duration-200 text-center"
                  >
                    Try the playground
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <div className="section-divider" />

        {/* ═══ CTA ═══ */}
        <section className="py-24 sm:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-blue-500/3 to-transparent" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs text-white/60 mb-6">
                Open Source
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                Open protocol,<br />open <span className="text-gradient">repository</span>
              </h2>
              <p className="text-white/40 text-lg leading-relaxed max-w-2xl mx-auto mb-12">
                The full ADP v2 MVP, protocol docs, specification, architecture notes, governance files, and demo script all live in the public repository.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://github.com/Bidz-nl/agentdiscovery.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group px-7 py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  View on GitHub
                </a>
                <Link
                  href="/docs"
                  className="px-7 py-3.5 glass hover:bg-white/6 rounded-xl text-sm font-medium text-white/70 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Read documentation →
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
