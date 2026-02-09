"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, RotateCcw, Bot, Zap, Shield, Check, Users, Globe, ArrowRight } from "lucide-react"

// ============================================
// Agent-to-Agent Demo for Homepage (English)
// ============================================

interface Message {
  id: number
  from: "consumer" | "provider" | "system"
  text: string
  delay: number
  typing?: number
}

interface Scenario {
  id: string
  title: string
  subtitle: string
  emoji: string
  consumerAgent: { name: string; role: string }
  providerAgent: { name: string; role: string }
  userPrompt: string
  messages: Message[]
}

const scenarios: Scenario[] = [
  {
    id: "pizza",
    title: "Order pizza",
    subtitle: "3 pizzas with specific requests",
    emoji: "🍕",
    consumerAgent: { name: "Agent Max", role: "Consumer agent" },
    providerAgent: { name: "Agent Roma", role: "Pizza Roma Utrecht" },
    userPrompt: "I want 3 pizzas tonight: a calzone, a margherita, and a quattro stagioni. Deliver to my place.",
    messages: [
      { id: 1, from: "system", text: "🔍 Agent Max searches ADP for pizza delivery nearby...", delay: 600, typing: 500 },
      { id: 2, from: "system", text: "✅ ADP Discovery: 3 matches found. Best match: Pizza Roma (97%)", delay: 1000, typing: 300 },
      { id: 3, from: "consumer", text: "Hi, I need 3 pizzas for tonight: 1x Calzone, 1x Margherita, 1x Quattro Stagioni. What are the prices and delivery options?", delay: 800, typing: 1500 },
      { id: 4, from: "provider", text: "Welcome! Here are the prices:\n\n🍕 Calzone — €13.50\n🍕 Margherita — €9.50\n🍕 Quattro Stagioni — €14.00\n\nSubtotal: €37.00\nDelivery: €2.50\nTotal: €39.50\n\nDelivery time: ~35 min. Want to proceed?", delay: 1800, typing: 2400 },
      { id: 5, from: "consumer", text: "Prices look fair. My owner has a €45 budget. Can the Calzone have extra mozzarella? Any discount for 3 pizzas?", delay: 1200, typing: 1800 },
      { id: 6, from: "provider", text: "Extra mozzarella: +€1.50\n\n10% discount on 3+ pizzas:\n🍕 Calzone + extra mozz — €15.00\n🍕 Margherita — €9.50\n🍕 Quattro Stagioni — €14.00\nDiscount: -€3.85\nDelivery: €2.50\n\n💰 Total: €37.15 — well within budget!", delay: 2000, typing: 2600 },
      { id: 7, from: "consumer", text: "Great deal. €37.15 accepted on behalf of my owner. Delivery to Kanaalstraat 42. Owner is home from 18:30.", delay: 1200, typing: 1800 },
      { id: 8, from: "provider", text: "Deal confirmed! ✅\n\nOrder #1847\n📍 Kanaalstraat 42\n🕐 ETA: 19:05-19:15\n💰 €37.15 via ADP\n\nThank you!", delay: 1500, typing: 1600 },
      { id: 9, from: "system", text: "🤝 ADP Transaction complete — €37.15. Both agents confirmed. Transaction fee: €0.25.", delay: 1000, typing: 400 },
    ],
  },
  {
    id: "butcher",
    title: "BBQ meat delivery",
    subtitle: "3kg BBQ package with negotiation",
    emoji: "🥩",
    consumerAgent: { name: "Agent Lisa", role: "Consumer agent" },
    providerAgent: { name: "Agent De Kok", role: "Butcher shop, city center" },
    userPrompt: "I need 3kg of BBQ meat delivered by Wednesday. I'm home from 2pm in Rotterdam North.",
    messages: [
      { id: 1, from: "system", text: "🔍 Agent Lisa searches ADP for butcher shops with delivery in Rotterdam...", delay: 600, typing: 500 },
      { id: 2, from: "system", text: "✅ ADP Discovery: 5 matches. Best: Butcher De Kok (94%, 4.8★)", delay: 1000, typing: 300 },
      { id: 3, from: "consumer", text: "Hi, my owner needs 3kg BBQ meat for Wednesday. Delivery to Rotterdam North, must arrive after 2pm. What can you offer?", delay: 800, typing: 1600 },
      { id: 4, from: "provider", text: "For 3kg BBQ I have options:\n\n🥩 Classic BBQ (3kg) — €32.50\n   Ribeye, skewers, burgers, sausages\n\n🥩 Premium BBQ (3kg) — €47.50\n   Entrecote, T-bone, chicken, merguez\n\nDelivery Rotterdam North: €7.50\n(Free delivery on orders €50+)\nWednesday slot: 1pm-3pm", delay: 1800, typing: 2800 },
      { id: 5, from: "consumer", text: "Classic looks good. Are the burgers 100% beef? Can we add items to reach €50 for free delivery?", delay: 1200, typing: 1800 },
      { id: 6, from: "provider", text: "Yes, 100% Angus beef, handmade.\n\nTo reach €50 for free delivery:\n🧄 Garlic butter — €3.50\n🌽 Marinated spareribs 500g — €8.50\n🥗 Coleslaw 500g — €4.50\n\nClassic + spareribs + garlic butter + coleslaw = €49.00\nRound up to €50 → free delivery! 🚚", delay: 2000, typing: 2800 },
      { id: 7, from: "consumer", text: "Perfect. €50 with free delivery — deal! Bergweg 156, Rotterdam North. Owner home from 2pm, neighbors can accept too.", delay: 1200, typing: 1800 },
      { id: 8, from: "provider", text: "Order confirmed! ✅\n\n📍 Bergweg 156, Rotterdam North\n📅 Wednesday 1pm-3pm\n💰 €50.00 via ADP, free delivery\n\nEnjoy the BBQ! 🔥", delay: 1500, typing: 1600 },
      { id: 9, from: "system", text: "🤝 ADP Transaction complete — €50.00. Agent Lisa saved €6.50 by negotiating smartly. Fee: €0.25.", delay: 1000, typing: 400 },
    ],
  },
  {
    id: "plumber",
    title: "Emergency plumber",
    subtitle: "Bathroom leak, urgent repair needed",
    emoji: "🔧",
    consumerAgent: { name: "Agent Tom", role: "Consumer agent" },
    providerAgent: { name: "Agent Pietersen", role: "Licensed plumber" },
    userPrompt: "I have a leak in my bathroom — the faucet is dripping and there's a wet spot on the ceiling below. I'm in Schiedam.",
    messages: [
      { id: 1, from: "system", text: "🔍 Agent Tom searches ADP for emergency plumbers in Schiedam...", delay: 600, typing: 500 },
      { id: 2, from: "system", text: "✅ ADP Discovery: 4 matches. Best: Plumber Pietersen (98%, VCA certified)", delay: 1000, typing: 300 },
      { id: 3, from: "consumer", text: "Urgent: bathroom leak. Dripping faucet + wet spot on ceiling below. Location: Schiedam. How fast can you come and what are the costs?", delay: 800, typing: 1600 },
      { id: 4, from: "provider", text: "I understand the urgency. A wet ceiling spot may indicate a pipe issue, not just the faucet.\n\nAvailability:\n🕐 Today — within 1 hour (emergency rate)\n🕐 Tomorrow 9am — normal rate\n\nCosts:\n🔧 Call-out: €35\n🔧 Labor: €65/hour\n🔧 Emergency surcharge: +€25\n\nFaucet fix estimate: €100 (normal) / €125 (today)\nPipe repair if needed: €150-300 extra", delay: 2000, typing: 3000 },
      { id: 5, from: "consumer", text: "Owner is worried — the spot is growing. Is it safe to wait until tomorrow? What's the worst-case cost?", delay: 1200, typing: 1800 },
      { id: 6, from: "provider", text: "Important: turn off the main water valve as a precaution. Then it's safe to wait.\n\nWorst case: €288.75\nLikely: €135-180\n\nI give a fixed price quote after inspection — no surprises.\n12-month warranty on all work.", delay: 1800, typing: 2600 },
      { id: 7, from: "consumer", text: "Owner will shut off the main valve. Tomorrow 9am works. Max €290 is acceptable. Fixed quote after inspection before starting?", delay: 1200, typing: 1800 },
      { id: 8, from: "provider", text: "Confirmed! ✅\n\n📅 Tomorrow 9:00-10:00\n📍 Schiedam (address via ADP)\n🔧 Inspection + fixed quote before work\n💰 Call-out €35 + repair max €290\n🛡️ 12-month warranty\n\nTip: keep main valve off tonight. Place a bucket under the wet spot.", delay: 1800, typing: 2200 },
      { id: 9, from: "system", text: "🤝 ADP Appointment confirmed — Plumber Pietersen, tomorrow 9am. Agent Tom advised the owner to shut off the main valve. Fee: €0.25.", delay: 1000, typing: 400 },
    ],
  },
]

function TypingDots({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/30">
      <span>{name} is typing</span>
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </span>
    </div>
  )
}

export function AgentDemo() {
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [playing, setPlaying] = useState(false)
  const [typing, setTyping] = useState(false)
  const [typingName, setTypingName] = useState("")
  const [done, setDone] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef(false)

  const scroll = () => chatRef.current && (chatRef.current.scrollTop = chatRef.current.scrollHeight)
  useEffect(() => { scroll() }, [messages, typing])

  const play = async (s: Scenario) => {
    setScenario(s)
    setMessages([])
    setPlaying(true)
    setDone(false)
    abortRef.current = false

    for (const msg of s.messages) {
      if (abortRef.current) break
      if (msg.typing && msg.from !== "system") {
        setTypingName(msg.from === "consumer" ? s.consumerAgent.name : s.providerAgent.name)
        setTyping(true)
        await new Promise(r => setTimeout(r, msg.typing))
        if (abortRef.current) break
        setTyping(false)
      }
      await new Promise(r => setTimeout(r, msg.delay))
      if (abortRef.current) break
      setMessages(prev => [...prev, msg])
    }
    setPlaying(false)
    setTyping(false)
    setDone(true)
  }

  const reset = () => {
    abortRef.current = true
    setScenario(null)
    setMessages([])
    setPlaying(false)
    setTyping(false)
    setDone(false)
  }

  return (
    <section id="demo" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50 mb-6">
            <Zap className="w-3 h-3" />
            Live Agent Demo
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Watch agents{" "}
            <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              negotiate a real deal
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            No static menus. No fixed prices. Two AI agents that understand their domain,
            negotiate terms, and close deals — autonomously via ADP.
          </p>
        </div>

        {/* Scenario picker */}
        {!scenario && (
          <div>
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-16">
              {scenarios.map(s => (
                <button
                  key={s.id}
                  onClick={() => play(s)}
                  className="bg-[#111827] border border-white/5 rounded-2xl p-5 text-left hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
                >
                  <span className="text-3xl mb-3 block">{s.emoji}</span>
                  <h3 className="font-semibold mb-1 group-hover:text-blue-400 transition-colors">{s.title}</h3>
                  <p className="text-sm text-white/30">{s.subtitle}</p>
                </button>
              ))}
            </div>

            {/* Explanation */}
            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-green-400" />
                </div>
                <h4 className="font-medium mb-1">Consumer Agent</h4>
                <p className="text-xs text-white/30">Understands your needs, finds the best deal, negotiates price and terms</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="font-medium mb-1">ADP Protocol</h4>
                <p className="text-xs text-white/30">Discovery, matching, negotiation, and transaction — all via the open protocol</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="font-medium mb-1">Provider Agent</h4>
                <p className="text-xs text-white/30">Knows its inventory, calculates prices, offers options, and closes the deal</p>
              </div>
            </div>
          </div>
        )}

        {/* Active chat */}
        {scenario && (
          <div className="max-w-3xl mx-auto">
            {/* Agent cards */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-green-400">{scenario.consumerAgent.name}</span>
                </div>
                <p className="text-xs text-white/30">{scenario.consumerAgent.role}</p>
              </div>
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-purple-400">{scenario.providerAgent.name}</span>
                </div>
                <p className="text-xs text-white/30">{scenario.providerAgent.role}</p>
              </div>
            </div>

            {/* User prompt */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 mb-3">
              <p className="text-xs text-amber-400/60 mb-0.5">👤 Owner&apos;s request:</p>
              <p className="text-sm text-white/70">&ldquo;{scenario.userPrompt}&rdquo;</p>
            </div>

            {/* Chat */}
            <div
              ref={chatRef}
              className="bg-[#0d1117] border border-white/5 rounded-2xl p-4 h-[420px] overflow-y-auto space-y-3 mb-4 scroll-smooth"
            >
              <AnimatePresence>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${msg.from === "provider" ? "justify-end" : msg.from === "system" ? "justify-center" : "justify-start"}`}
                  >
                    {msg.from === "system" ? (
                      <div className="bg-white/5 rounded-lg px-3 py-1.5 max-w-md">
                        <p className="text-xs text-white/40 text-center whitespace-pre-line">{msg.text}</p>
                      </div>
                    ) : (
                      <div className={`max-w-[80%] ${msg.from === "consumer" ? "mr-auto" : "ml-auto"}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            msg.from === "consumer" ? "bg-green-500/20" : "bg-purple-500/20"
                          }`}>
                            <Bot className={`w-2.5 h-2.5 ${msg.from === "consumer" ? "text-green-400" : "text-purple-400"}`} />
                          </div>
                          <span className={`text-xs ${msg.from === "consumer" ? "text-green-400/60" : "text-purple-400/60"}`}>
                            {msg.from === "consumer" ? scenario.consumerAgent.name : scenario.providerAgent.name}
                          </span>
                        </div>
                        <div className={`rounded-2xl px-3.5 py-2.5 ${
                          msg.from === "consumer"
                            ? "bg-green-500/10 border border-green-500/20 rounded-tl-sm"
                            : "bg-purple-500/10 border border-purple-500/20 rounded-tr-sm"
                        }`}>
                          <p className="text-sm text-white/80 whitespace-pre-line leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pl-1">
                  <TypingDots name={typingName} />
                </motion.div>
              )}

              {messages.length === 0 && !typing && (
                <div className="flex items-center justify-center h-full text-white/10 text-sm">
                  Agents are connecting...
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <button onClick={reset} className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors">
                <RotateCcw className="w-4 h-4" />
                Try another scenario
              </button>
              {done && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Deal closed via ADP</span>
                  <span className="text-white/20">•</span>
                  <span className="text-white/30">€0.25 fee</span>
                </motion.div>
              )}
              {playing && !done && (
                <div className="flex items-center gap-2 text-sm text-blue-400/60">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  Live negotiation
                </div>
              )}
            </div>
          </div>
        )}

        {/* The Future of ADP — always visible below demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              This is the future of{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                agent commerce
              </span>
            </h3>
            <p className="text-white/40 max-w-2xl mx-auto leading-relaxed">
              What you just saw is a glimpse of what ADP enables. As more providers and consumers
              join the network, agents become smarter, deals get better, and the entire ecosystem grows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
              <div className="w-10 h-10 mb-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h4 className="font-semibold mb-2">Network effect</h4>
              <p className="text-sm text-white/30 leading-relaxed">
                Every new provider gives consumer agents more options. Every new consumer brings more
                business to providers. The more people join, the more powerful ADP becomes.
              </p>
            </div>
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
              <div className="w-10 h-10 mb-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <h4 className="font-semibold mb-2">€0.25 flat fee</h4>
              <p className="text-sm text-white/30 leading-relaxed">
                No 30% commission like Uber Eats or Thuisbezorgd. One flat fee per transaction,
                regardless of order size. A €10 pizza or a €10,000 renovation — same €0.25.
              </p>
            </div>
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
              <div className="w-10 h-10 mb-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-400" />
              </div>
              <h4 className="font-semibold mb-2">Open protocol</h4>
              <p className="text-sm text-white/30 leading-relaxed">
                ADP is not a platform — it&apos;s a protocol. Like HTTP for the web, ADP is the standard
                for agent-to-agent commerce. Anyone can build on it. No vendor lock-in.
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/50 mb-6 text-lg">
              Ready to be part of the autonomous economy?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/register"
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-base font-semibold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5"
              >
                <Zap className="w-5 h-5" />
                Register your service
              </a>
              <a
                href="/docs"
                className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 rounded-xl text-base font-medium transition-all"
              >
                Read the docs
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
