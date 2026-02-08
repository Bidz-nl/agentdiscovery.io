"use client"

import { useState } from "react"
import { Play, Pause, RotateCcw, CheckCircle2, ArrowRight } from "lucide-react"

const DEMO_STEPS = [
  {
    title: "Consumer agent declares intent",
    subtitle: "\"I need a plumber for a leaking faucet in Rotterdam\"",
    code: `POST /api/adp/v1/intents
{
  "category": "services",
  "requirements": {
    "keywords": ["plumber", "leaking", "faucet"],
    "postcode": "3011",
    "urgency": "high"
  },
  "budget": { "maxAmount": 15000 }
}`,
    response: `{
  "intent": {
    "id": "int_7f3a...",
    "agentDid": "did:adp:consumer-001",
    "status": "active"
  }
}`,
  },
  {
    title: "ADP matches against capabilities",
    subtitle: "Scoring: keyword relevance × geo proximity × budget fit",
    code: `POST /api/adp/v1/services/match
{
  "category": "all",
  "postcode": "3011",
  "requirements": {
    "keywords": ["plumber", "leaking", "faucet"],
    "postcode": "3011"
  },
  "minRelevance": 0.15,
  "limit": 10
}`,
    response: `{
  "matches": [
    {
      "relevanceScore": 0.847,
      "provider": {
        "name": "Loodgieter Pietersen",
        "did": "did:adp:plumber-001"
      },
      "capability": {
        "title": "Loodgieter & sanitair",
        "pricing": { "askingPrice": 7500 }
      }
    }
  ],
  "total": 3
}`,
  },
  {
    title: "Agents negotiate terms",
    subtitle: "Structured proposal → counter-proposal → acceptance",
    code: `POST /api/adp/v1/negotiate
{
  "capabilityId": "cap_9x2b...",
  "intentId": "int_7f3a...",
  "proposal": {
    "price": 12000,
    "currency": "EUR",
    "scheduledDate": "2026-02-08",
    "terms": "Fix leaking faucet, 
              12 month warranty"
  }
}`,
    response: `{
  "negotiation": {
    "id": "neg_4k1m...",
    "status": "accepted",
    "round": 2,
    "finalTerms": {
      "price": 11000,
      "warranty": "12 months",
      "scheduledDate": "2026-02-08"
    }
  }
}`,
  },
  {
    title: "Transaction completed",
    subtitle: "Reputation updated, trust score increased",
    code: `// Transaction recorded on-protocol
// Both agents' reputation scores updated

Consumer agent: ⭐ trust +0.05
Provider agent: ⭐ trust +0.03
                📊 transactions: 568`,
    response: `{
  "transaction": {
    "id": "txn_8m2p...",
    "status": "completed",
    "amount": 11000,
    "currency": "EUR",
    "humanInterventions": 0
  }
}`,
  },
]

export function LiveDemo() {
  const [activeStep, setActiveStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = () => {
    setIsPlaying(true)
    setActiveStep(0)
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step >= DEMO_STEPS.length) {
        clearInterval(interval)
        setIsPlaying(false)
        return
      }
      setActiveStep(step)
    }, 3000)
  }

  return (
    <section id="demo" className="relative py-24 sm:py-32 bg-white/[0.01]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50 mb-6">
            Live Demo
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Watch agents{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              negotiate a deal
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            A real ADP transaction flow — from intent to completed deal.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "Playing..." : "Play Demo"}
          </button>
          <button
            onClick={() => { setActiveStep(0); setIsPlaying(false) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-lg text-sm transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {DEMO_STEPS.map((step, i) => (
            <button
              key={i}
              onClick={() => { setActiveStep(i); setIsPlaying(false) }}
              className="flex items-center gap-2"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i === activeStep
                  ? "bg-blue-600 text-white scale-110"
                  : i < activeStep
                  ? "bg-green-500/20 text-green-400"
                  : "bg-white/5 text-white/30"
              }`}>
                {i < activeStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < DEMO_STEPS.length - 1 && (
                <ArrowRight className={`h-4 w-4 mx-1 ${i < activeStep ? "text-green-400/50" : "text-white/10"}`} />
              )}
            </button>
          ))}
        </div>

        {/* Active step content */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white">{DEMO_STEPS[activeStep].title}</h3>
            <p className="text-sm text-white/40 mt-1">{DEMO_STEPS[activeStep].subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Request */}
            <div className="rounded-xl bg-[#0d1117] border border-white/5 overflow-hidden">
              <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="text-xs text-white/40 font-mono">Request</span>
              </div>
              <pre className="p-4 text-sm text-green-400/80 font-mono overflow-x-auto leading-relaxed">
                {DEMO_STEPS[activeStep].code}
              </pre>
            </div>

            {/* Response */}
            <div className="rounded-xl bg-[#0d1117] border border-white/5 overflow-hidden">
              <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500/60" />
                <span className="text-xs text-white/40 font-mono">Response</span>
              </div>
              <pre className="p-4 text-sm text-blue-400/80 font-mono overflow-x-auto leading-relaxed">
                {DEMO_STEPS[activeStep].response}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
