"use client"

import Image from "next/image"
import Link from "next/link"
import { Play, CheckCircle2, ArrowUpRight } from "lucide-react"

import processTimelineImage from "../../../assets/diagrams/adp-process-timeline.png"
import { MarketingPageShell } from "@/components/marketing-page-shell"
import { ScrollReveal } from "@/components/scroll-reveal"
import { TiltCard } from "@/components/tilt-card"
import { CopyBlock } from "@/components/copy-block"

const flowSteps = [
  "Register agent",
  "Create handshake session",
  "Discover providers",
  "Negotiate service intent",
  "Create transaction",
  "Update transaction status",
  "Record reputation",
]

const demoFeatures = [
  { title: "Protocol completeness", description: "The script walks through registration, session bootstrapping, discovery, negotiation, transaction creation, transaction updates, and reputation recording." },
  { title: "Developer onboarding", description: "It gives GitHub visitors a practical path to understand ADP v2 without having to reverse-engineer the API surface first." },
  { title: "Reference MVP flow", description: "The example mirrors the docs, examples guide, and repository diagrams so the protocol story stays consistent from README to local execution." },
]

export default function DemoPage() {
  return (
    <MarketingPageShell
      eyebrow="Developer Demo"
      title="Run the ADP v2 flow with a single curl script"
      description="The repository includes a developer-facing script at examples/adp-v2-demo.sh that demonstrates the full ADP v2 MVP lifecycle against a local server."
      actions={
        <>
          <a
            href="https://github.com/Bidz-nl/agentdiscovery.io/blob/main/examples/adp-v2-demo.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25 inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4" /> View script on GitHub
          </a>
          <a
            href="https://github.com/Bidz-nl/agentdiscovery.io/blob/main/examples/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 glass hover:bg-white/6 rounded-xl text-sm font-medium text-white/80 transition-all duration-300 inline-flex items-center gap-2"
          >
            Read examples guide <ArrowUpRight className="w-4 h-4" />
          </a>
        </>
      }
    >
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-start">
          <ScrollReveal direction="left">
            <div className="rounded-3xl overflow-hidden border-gradient">
              <div className="glass rounded-3xl overflow-hidden">
                <Image src={processTimelineImage} alt="ADP process timeline" className="w-full h-auto" priority />
              </div>
            </div>
          </ScrollReveal>
          <div className="grid gap-3">
            {flowSteps.map((step, index) => (
              <ScrollReveal key={step} delay={index * 0.06}>
                <div className="glass rounded-xl p-4 flex items-center gap-4 transition-all duration-300 hover:bg-white/5">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-linear-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                    {index + 1}
                  </div>
                  <h2 className="text-[15px] font-medium">{step}</h2>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500/40 ml-auto" />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
          <ScrollReveal direction="left">
            <div>
              <h2 className="text-2xl sm:text-4xl font-bold mb-4">How to run it</h2>
              <p className="text-white/40 text-lg leading-relaxed mb-6">
                Start the ADP app locally, then run the shell script. The demo uses example JSON bodies and placeholder variables like <code className="text-gradient font-mono text-sm">SESSION_ID</code>, <code className="text-gradient font-mono text-sm">TRANSACTION_ID</code>, and <code className="text-gradient font-mono text-sm">PROVIDER_DID</code>.
              </p>
              <CopyBlock
                label="Run ADP locally"
                code={`git clone https://github.com/Bidz-nl/agentdiscovery.io.git\ncd agentdiscovery.io\nnpm install && npm run dev\n\n# In a second terminal:\nbash examples/adp-v2-demo.sh`}
              />
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <div className="grid gap-4">
              <h3 className="text-xl font-semibold mb-1">What the script demonstrates</h3>
              {demoFeatures.map((feature, index) => (
                <TiltCard key={feature.title} className="rounded-2xl">
                  <div className="glass rounded-2xl p-6 transition-all duration-300">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {feature.title}
                    </h4>
                    <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
                  </div>
                </TiltCard>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-blue-500/3 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">Next step</h2>
            <p className="text-white/40 text-lg leading-relaxed mb-10">
              After running the shell demo, open the protocol docs to understand the route surface, response shapes, and lifecycle assumptions behind the script.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/docs"
                className="px-7 py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-blue-500/25"
              >
                Open docs hub
              </Link>
              <Link
                href="/protocol"
                className="px-7 py-3.5 glass hover:bg-white/6 rounded-xl text-sm font-medium text-white/70 transition-all duration-300"
              >
                Explore protocol →
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </MarketingPageShell>
  )
}
