"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, User, MapPin, Sparkles, Check, Loader2, Bot } from "lucide-react"
import { useAgentStore } from "../../lib/agent-store"
import ADPClient from "../../lib/adp-client"

const preferenceOptions = [
  { id: "price", label: "Laagste prijs", emoji: "💰" },
  { id: "rating", label: "Beste beoordeeld", emoji: "⭐" },
  { id: "speed", label: "Snelst beschikbaar", emoji: "⚡" },
  { id: "proximity", label: "Dichtst bij", emoji: "📍" },
]

export default function ConsumerOnboarding() {
  const router = useRouter()
  const store = useAgentStore()

  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [postcode, setPostcode] = useState("")
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState("")
  const [agentDid, setAgentDid] = useState("")

  const togglePref = (id: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleRegister = async () => {
    setIsRegistering(true)
    setError("")

    try {
      const response = await ADPClient.register({
        name: `${name}'s Agent`,
        agentType: "buyer",
        description: `Consumer agent voor ${name}`,
      })

      store.setCredentials(response.agent.did, response.apiKey, response.agent.id)
      store.setName(name)
      store.setPostcode(postcode)
      store.setPreferences(selectedPrefs)
      store.setRole("consumer")
      setAgentDid(response.agent.did)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registratie mislukt. Probeer opnieuw.")
    } finally {
      setIsRegistering(false)
    }
  }

  const handleComplete = () => {
    store.setOnboardingComplete(true)
    router.replace("/app/consumer")
  }

  return (
    <div className="flex flex-col min-h-screen px-6 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div className="flex-1">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-blue-500" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-white/30">Stap {step}/3</span>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Who are you */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold mb-1">Wie ben je?</h2>
            <p className="text-white/40 text-sm mb-8">
              We maken een AI-agent aan die namens jou zoekt en onderhandelt.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/50 mb-1.5 block">Naam</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Je voornaam"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 mb-1.5 block">Postcode</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="1234AB"
                    className="w-full bg-[#111827] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <p className="text-xs text-white/20 mt-1">Voor het vinden van aanbieders bij jou in de buurt</p>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim() || !postcode.trim()}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                Volgende
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Preferences */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold mb-1">Wat vind je belangrijk?</h2>
            <p className="text-white/40 text-sm mb-8">
              Je agent gebruikt dit om de beste resultaten te vinden. Je kunt meerdere kiezen.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {preferenceOptions.map((pref) => {
                const isSelected = selectedPrefs.includes(pref.id)
                return (
                  <button
                    key={pref.id}
                    onClick={() => togglePref(pref.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-[#111827] border-white/5 hover:border-white/10"
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{pref.emoji}</span>
                    <span className={`text-sm font-medium ${isSelected ? "text-blue-400" : "text-white/60"}`}>
                      {pref.label}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-400 absolute top-2 right-2" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-auto pt-8">
              {error && (
                <p className="text-red-400 text-sm text-center mb-3">{error}</p>
              )}
              <button
                onClick={handleRegister}
                disabled={isRegistering || selectedPrefs.length === 0}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Agent aanmaken...
                  </>
                ) : (
                  <>
                    Agent aanmaken
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6"
            >
              <Bot className="w-10 h-10 text-green-400" />
            </motion.div>

            <h2 className="text-xl font-bold mb-2">Je agent is klaar!</h2>
            <p className="text-white/40 text-sm mb-8">
              {name}&apos;s Agent is geregistreerd op het ADP-netwerk en klaar om te zoeken.
            </p>

            <div className="w-full bg-[#111827] border border-white/5 rounded-xl p-4 mb-8 text-left">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-white/30">Agent ID</span>
                  <span className="text-xs text-white/50 font-mono">
                    {agentDid.slice(0, 20)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/30">Trust Level</span>
                  <span className="text-xs text-white/50">Level 1 — Starter</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/30">Status</span>
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Online
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
            >
              Start met zoeken
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
