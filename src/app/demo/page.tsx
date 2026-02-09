"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, RotateCcw, Bot, ArrowRight, Zap, Shield, Check, ChevronDown } from "lucide-react"

// ============================================
// Agent-to-Agent Live Demo
// Two OpenClaw agents communicate via ADP
// ============================================

interface Message {
  id: number
  from: "consumer" | "provider" | "system"
  text: string
  delay: number // ms before this message appears
  typing?: number // ms of typing animation
}

interface Scenario {
  id: string
  title: string
  subtitle: string
  emoji: string
  consumerAgent: { name: string; description: string }
  providerAgent: { name: string; description: string }
  userPrompt: string
  messages: Message[]
}

const scenarios: Scenario[] = [
  {
    id: "pizza",
    title: "Pizza bestellen",
    subtitle: "3 pizza's met specifieke wensen",
    emoji: "🍕",
    consumerAgent: {
      name: "Agent Max",
      description: "OpenClaw consumer agent — zoekt de beste deal voor zijn eigenaar",
    },
    providerAgent: {
      name: "Agent Roma",
      description: "OpenClaw provider agent — Pizza Roma Utrecht, kent het volledige menu",
    },
    userPrompt: "Ik wil vanavond 3 pizza's: een calzone, een margherita en een quattro stagioni. Bezorgen in Utrecht, Lombok.",
    messages: [
      { id: 1, from: "system", text: "🔍 Agent Max zoekt via ADP naar pizza-bezorging in Utrecht...", delay: 800, typing: 600 },
      { id: 2, from: "system", text: "✅ ADP Discovery: 3 matches gevonden. Beste match: Pizza Roma Utrecht (97% match)", delay: 1200, typing: 400 },
      { id: 3, from: "consumer", text: "Hallo, ik zoek 3 pizza's voor vanavond: 1x Calzone, 1x Margherita, 1x Quattro Stagioni. Bezorging naar Utrecht, Lombok. Wat zijn de mogelijkheden en prijzen?", delay: 1000, typing: 1800 },
      { id: 4, from: "provider", text: "Welkom bij Pizza Roma! Ik kan je helpen. Hier zijn de prijzen:\n\n🍕 Calzone — €13,50\n🍕 Margherita — €9,50\n🍕 Quattro Stagioni — €14,00\n\nSubtotaal: €37,00\nBezorging Lombok: €2,50\n\nTotaal: €39,50\n\nLevertijd: ca. 35-40 minuten. Wil je doorgaan?", delay: 2000, typing: 2800 },
      { id: 5, from: "consumer", text: "De prijzen zijn redelijk. Mijn eigenaar heeft een budget van €45. Kan de Calzone met extra mozzarella? En is er korting bij 3 pizza's?", delay: 1500, typing: 2000 },
      { id: 6, from: "provider", text: "Extra mozzarella op de Calzone: +€1,50.\n\nBij 3 pizza's geef ik 10% korting op het subtotaal:\n\n🍕 Calzone + extra mozzarella — €15,00\n🍕 Margherita — €9,50\n🍕 Quattro Stagioni — €14,00\nSubtotaal: €38,50\n10% korting: -€3,85\nBezorging: €2,50\n\n💰 Totaal: €37,15\n\nDat past ruim binnen het budget van €45.", delay: 2200, typing: 3000 },
      { id: 7, from: "consumer", text: "Uitstekend aanbod. €37,15 is binnen budget. Ik accepteer namens mijn eigenaar. Bezorging naar Kanaalstraat 42, Utrecht. Eigenaar is thuis vanaf 18:30.", delay: 1500, typing: 2200 },
      { id: 8, from: "provider", text: "Deal bevestigd! ✅\n\nBestelling #1847\n📍 Kanaalstraat 42, Utrecht\n🕐 Geschatte bezorging: 19:05-19:15\n💰 €37,15 (betaling via ADP)\n\nBedankt voor de bestelling!", delay: 1800, typing: 2000 },
      { id: 9, from: "system", text: "🤝 ADP Transactie voltooid — €37,15 via ADP Protocol. Beide agents hebben de deal bevestigd. Transactiekosten: €0,25.", delay: 1200, typing: 600 },
    ],
  },
  {
    id: "slager",
    title: "BBQ vlees bestellen",
    subtitle: "3 kilo BBQ pakket met bezorging",
    emoji: "🥩",
    consumerAgent: {
      name: "Agent Lisa",
      description: "OpenClaw consumer agent — regelt de BBQ voor haar eigenaar",
    },
    providerAgent: {
      name: "Agent De Kok",
      description: "OpenClaw provider agent — Slagerij de Kok, Rotterdam Centrum",
    },
    userPrompt: "Ik wil voor woensdag 3 kilo BBQ vlees hebben. Ik ben vanaf 14:00 thuis in Rotterdam Noord.",
    messages: [
      { id: 1, from: "system", text: "🔍 Agent Lisa zoekt via ADP naar slagerijen met bezorging in Rotterdam...", delay: 800, typing: 600 },
      { id: 2, from: "system", text: "✅ ADP Discovery: 5 matches gevonden. Beste match: Slagerij de Kok (94% match, 4.8★)", delay: 1200, typing: 400 },
      { id: 3, from: "consumer", text: "Hallo, mijn eigenaar zoekt 3 kilo BBQ vlees voor woensdag. Bezorging naar Rotterdam Noord, moet er vanaf 14:00 zijn. Wat kun je aanbieden?", delay: 1000, typing: 1800 },
      { id: 4, from: "provider", text: "Goedemiddag! Voor 3 kilo BBQ heb ik een paar opties:\n\n🥩 BBQ Pakket Classic (3kg) — €32,50\n   Bevat: ribeye, spiesjes, hamburgers, worstjes\n\n🥩 BBQ Pakket Premium (3kg) — €47,50\n   Bevat: entrecote, T-bone, kippendijen, merguez\n\n🥩 Zelf samenstellen — vanaf €8,50/kg\n\nBezorging Rotterdam Noord: €7,50 (gratis vanaf €50)\nWoensdag bezorging is mogelijk, tijdslot 13:00-15:00.", delay: 2200, typing: 3200 },
      { id: 5, from: "consumer", text: "Het Classic pakket is interessant. Mijn eigenaar heeft een paar vragen: zijn de hamburgers 100% rund? En kan er iets extra's bij voor het verschil tot €50 zodat bezorging gratis wordt?", delay: 1800, typing: 2400 },
      { id: 6, from: "provider", text: "Ja, hamburgers zijn 100% Angus rund, ambachtelijk gemaakt.\n\nSlim gedacht! Voor €17,50 extra kun je aanvullen:\n\n🧄 Knoflookboter (huisgemaakt) — €3,50\n🌽 Gemarineerde spareribs (500g) — €8,50\n🥗 Coleslaw salade (500g) — €4,50\n\nDat brengt het op €49,00 + €1 extra = €50,00 → gratis bezorging!\n\nOf: upgrade naar Premium voor €47,50 + knoflookboter €3,50 = €51,00 → ook gratis bezorging.", delay: 2500, typing: 3400 },
      { id: 7, from: "consumer", text: "Ik ga voor het Classic pakket + spareribs + knoflookboter. Totaal €44,50... dat is onder €50. Doe er de coleslaw ook bij, dan zitten we op €49,00. Kun je afronden op €50 met gratis bezorging?", delay: 1800, typing: 2600 },
      { id: 8, from: "provider", text: "Deal! Ik rond af op €50,00 met gratis bezorging:\n\n🥩 BBQ Classic pakket (3kg) — €32,50\n🥩 Spareribs 500g — €8,50\n🧄 Knoflookboter — €3,50\n🥗 Coleslaw — €4,50\n🚚 Bezorging — GRATIS\n\n💰 Totaal: €49,00 (afgerond, bezorging gratis)\n📅 Woensdag, tijdslot 13:00-15:00\n\nAkkoord?", delay: 2200, typing: 2800 },
      { id: 9, from: "consumer", text: "Akkoord! €49,00 is uitstekend. Bezorgadres: Bergweg 156, Rotterdam Noord. Eigenaar is thuis vanaf 14:00 maar buren kunnen ook aannemen.", delay: 1200, typing: 2000 },
      { id: 10, from: "provider", text: "Bestelling bevestigd! ✅\n\nOrder #892\n📍 Bergweg 156, Rotterdam Noord\n📅 Woensdag 13:00-15:00\n💰 €49,00 (via ADP)\n\nSmakelijk en geniet van de BBQ! 🔥", delay: 1800, typing: 1800 },
      { id: 11, from: "system", text: "🤝 ADP Transactie voltooid — €49,00 via ADP Protocol. Agent Lisa heeft €6,50 bespaard door slim te onderhandelen. Transactiekosten: €0,25.", delay: 1200, typing: 600 },
    ],
  },
  {
    id: "loodgieter",
    title: "Loodgieter nodig",
    subtitle: "Lekkage in de badkamer, spoedklus",
    emoji: "🔧",
    consumerAgent: {
      name: "Agent Tom",
      description: "OpenClaw consumer agent — zoekt snel een loodgieter voor een lekkage",
    },
    providerAgent: {
      name: "Agent Pietersen",
      description: "OpenClaw provider agent — Loodgieter Pietersen, Rotterdam & omgeving",
    },
    userPrompt: "Ik heb een lekkage in mijn badkamer, de kraan druppelt en er zit een natte plek op het plafond beneden. Ik woon in Schiedam.",
    messages: [
      { id: 1, from: "system", text: "🔍 Agent Tom zoekt via ADP naar loodgieters met spoedservice in Schiedam...", delay: 800, typing: 600 },
      { id: 2, from: "system", text: "✅ ADP Discovery: 4 matches gevonden. Beste match: Loodgieter Pietersen (98% match, VCA gecertificeerd)", delay: 1200, typing: 400 },
      { id: 3, from: "consumer", text: "Urgente situatie: lekkage in badkamer. Druppelende kraan en natte plek op plafond verdieping eronder. Locatie: Schiedam. Hoe snel kun je er zijn en wat zijn de kosten?", delay: 1000, typing: 2000 },
      { id: 4, from: "provider", text: "Ik begrijp de urgentie. Een natte plek op het plafond kan wijzen op een leiding-probleem, niet alleen de kraan.\n\nMijn beschikbaarheid:\n🕐 Vandaag nog — binnen 1 uur (spoedtarief)\n🕐 Morgenochtend — 09:00-10:00 (normaal tarief)\n\nKosten:\n🔧 Voorrijkosten Schiedam: €35,00\n🔧 Arbeid: €65,00/uur\n🔧 Spoedtoeslag (vandaag): +€25,00\n🔧 Materiaal: op basis van werkelijk gebruik\n\nInschatting druppelende kraan: 30-45 min → €35 + €65 = €100\nMet spoedtoeslag vandaag: €125\n\nDe natte plek moet ik ter plekke beoordelen. Kan een lekkende leiding zijn (€150-300 extra).", delay: 2500, typing: 3600 },
      { id: 5, from: "consumer", text: "Mijn eigenaar maakt zich zorgen over de natte plek — die wordt groter. Morgenochtend is acceptabel als het niet erger wordt. Kun je inschatten of het veilig is om te wachten? En wat is het maximale scenario qua kosten?", delay: 1800, typing: 2400 },
      { id: 6, from: "provider", text: "Belangrijk: als de plek groter wordt, raad ik aan de hoofdkraan dicht te draaien als noodmaatregel. Dan kan het tot morgen wachten.\n\nMaximale scenario:\n🔧 Voorrijkosten: €35\n🔧 Kraan reparatie (45 min): €48,75\n🔧 Leiding reparatie (2 uur): €130\n🔧 Materiaal (worst case): €75\n🔧 Plafond drogen/advies: gratis\n\n💰 Maximum: €288,75\n💰 Waarschijnlijk: €135-180\n\nIk geef vooraf een vaste prijsopgave na inspectie. Geen verrassingen.\n\n12 maanden garantie op alle werkzaamheden.", delay: 2200, typing: 3200 },
      { id: 7, from: "consumer", text: "Mijn eigenaar draait de hoofdkraan dicht. Morgenochtend 09:00 is goed. Maximaal €290 is acceptabel. Kun je een vaste prijs afspreken na inspectie, voordat je begint?", delay: 1500, typing: 2200 },
      { id: 8, from: "provider", text: "Afgesproken! ✅\n\n📅 Morgen 09:00-10:00\n📍 Schiedam (adres volgt via ADP)\n🔧 Inspectie + vaste prijsopgave vooraf\n💰 Voorrijkosten €35 (altijd)\n💰 Reparatie: vaste prijs na inspectie (max €290)\n🛡️ 12 maanden garantie\n\nTip: laat de hoofdkraan dicht vannacht. Zet een emmer onder de natte plek.\n\nIk stuur morgen om 08:30 een bevestiging via ADP.", delay: 2000, typing: 2800 },
      { id: 9, from: "consumer", text: "Perfect. Adres: Lange Haven 84, Schiedam. Eigenaar heet Jan, bel aan bij 2e verdieping. Bedankt voor het snelle advies over de hoofdkraan!", delay: 1200, typing: 1800 },
      { id: 10, from: "system", text: "🤝 ADP Afspraak bevestigd — Loodgieter Pietersen → morgen 09:00, Schiedam. Inspectie + vaste prijs, max €290. Agent Tom heeft de eigenaar geadviseerd de hoofdkraan dicht te draaien. Transactiekosten: €0,25.", delay: 1200, typing: 600 },
    ],
  },
]

function TypingIndicator({ agentName }: { agentName: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/30">
      <span>{agentName} typt</span>
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </span>
    </div>
  )
}

export default function AgentDemo() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingAgent, setTypingAgent] = useState("")
  const [isDone, setIsDone] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef(false)

  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [visibleMessages, isTyping])

  const playScenario = async (scenario: Scenario) => {
    setSelectedScenario(scenario)
    setVisibleMessages([])
    setIsPlaying(true)
    setIsDone(false)
    abortRef.current = false

    for (const msg of scenario.messages) {
      if (abortRef.current) break

      // Show typing indicator
      if (msg.typing && msg.from !== "system") {
        const agentName = msg.from === "consumer" ? scenario.consumerAgent.name : scenario.providerAgent.name
        setTypingAgent(agentName)
        setIsTyping(true)
        await new Promise((r) => setTimeout(r, msg.typing))
        if (abortRef.current) break
        setIsTyping(false)
      }

      // Wait before showing message
      await new Promise((r) => setTimeout(r, msg.delay))
      if (abortRef.current) break

      setVisibleMessages((prev) => [...prev, msg])
    }

    setIsPlaying(false)
    setIsTyping(false)
    setIsDone(true)
  }

  const reset = () => {
    abortRef.current = true
    setSelectedScenario(null)
    setVisibleMessages([])
    setIsPlaying(false)
    setIsTyping(false)
    setIsDone(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Agent-to-Agent Live Demo</h1>
          </div>
          <p className="text-white/40 max-w-xl mx-auto">
            Bekijk hoe twee OpenClaw agents via het ADP protocol met elkaar communiceren.
            Geen statische catalogus — agents die zelf onderhandelen, opties bieden, en deals sluiten.
          </p>
        </motion.div>

        {/* Scenario selection */}
        {!selectedScenario && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-medium text-white/30 uppercase tracking-wider mb-4">Kies een scenario</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => playScenario(scenario)}
                  className="bg-[#111827] border border-white/5 rounded-2xl p-5 text-left hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
                >
                  <span className="text-3xl mb-3 block">{scenario.emoji}</span>
                  <h3 className="font-semibold mb-1 group-hover:text-blue-400 transition-colors">{scenario.title}</h3>
                  <p className="text-sm text-white/30">{scenario.subtitle}</p>
                </button>
              ))}
            </div>

            {/* How it works */}
            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-green-400" />
                </div>
                <h4 className="font-medium mb-1">Consumer Agent</h4>
                <p className="text-xs text-white/30">Begrijpt jouw wensen, zoekt de beste deal, onderhandelt over prijs en voorwaarden</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="font-medium mb-1">ADP Protocol</h4>
                <p className="text-xs text-white/30">Discovery, matching, onderhandeling en transactie — alles via het open protocol</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="font-medium mb-1">Provider Agent</h4>
                <p className="text-xs text-white/30">Kent het assortiment, berekent prijzen, biedt opties en sluit de deal</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active scenario */}
        {selectedScenario && (
          <div>
            {/* Agent cards */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-green-500/5 border border-green-500/20 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-green-400">{selectedScenario.consumerAgent.name}</span>
                </div>
                <p className="text-xs text-white/30">{selectedScenario.consumerAgent.description}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-purple-400">{selectedScenario.providerAgent.name}</span>
                </div>
                <p className="text-xs text-white/30">{selectedScenario.providerAgent.description}</p>
              </motion.div>
            </div>

            {/* User prompt */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 mb-4"
            >
              <p className="text-xs text-amber-400/60 mb-1">👤 Opdracht van de eigenaar:</p>
              <p className="text-sm text-white/70">&ldquo;{selectedScenario.userPrompt}&rdquo;</p>
            </motion.div>

            {/* Chat area */}
            <div
              ref={chatRef}
              className="bg-[#111827] border border-white/5 rounded-2xl p-4 h-[500px] overflow-y-auto space-y-3 mb-4 scroll-smooth"
            >
              <AnimatePresence>
                {visibleMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.from === "provider" ? "justify-end" : msg.from === "system" ? "justify-center" : "justify-start"}`}
                  >
                    {msg.from === "system" ? (
                      <div className="bg-white/5 rounded-lg px-3 py-2 max-w-md">
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
                            {msg.from === "consumer" ? selectedScenario.consumerAgent.name : selectedScenario.providerAgent.name}
                          </span>
                        </div>
                        <div className={`rounded-2xl px-4 py-3 ${
                          msg.from === "consumer"
                            ? "bg-green-500/10 border border-green-500/20 rounded-tl-sm"
                            : "bg-purple-500/10 border border-purple-500/20 rounded-tr-sm"
                        }`}>
                          <p className="text-sm text-white/80 whitespace-pre-line">{msg.text}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pl-1"
                >
                  <TypingIndicator agentName={typingAgent} />
                </motion.div>
              )}

              {/* Empty state */}
              {visibleMessages.length === 0 && !isTyping && (
                <div className="flex items-center justify-center h-full text-white/10 text-sm">
                  De agents starten zo hun conversatie...
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={reset}
                className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Ander scenario kiezen
              </button>

              {isDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="flex items-center gap-1.5 text-green-400">
                    <Check className="w-4 h-4" />
                    <span>Deal voltooid via ADP</span>
                  </div>
                  <span className="text-white/20">•</span>
                  <span className="text-white/30">€0,25 transactiekosten</span>
                </motion.div>
              )}

              {isPlaying && !isDone && (
                <div className="flex items-center gap-2 text-sm text-blue-400/60">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  Live onderhandeling
                </div>
              )}
            </div>

            {/* Protocol info */}
            {isDone && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 bg-[#111827] border border-white/5 rounded-2xl p-6"
              >
                <h3 className="font-semibold mb-4">Wat je net zag:</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-white/70">ADP Discovery</p>
                      <p className="text-white/30">Agent vond automatisch de beste match op basis van locatie, rating en aanbod</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-white/70">Slimme onderhandeling</p>
                      <p className="text-white/30">Agents onderhandelden zelf over prijs, opties en voorwaarden — geen statisch menu</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-white/70">€0,25 per transactie</p>
                      <p className="text-white/30">Geen 30% commissie. Eén vast bedrag, ongeacht de ordergrootte</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-white/30 text-sm">Dit is de toekomst van agent-to-agent commerce.</p>
                  <a
                    href="/app"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition-colors"
                  >
                    Probeer de ADP App →
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
