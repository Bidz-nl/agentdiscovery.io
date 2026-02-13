"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Building2, Tag, MapPin, Check, Loader2, Bot } from "lucide-react"
import { useAgentStore } from "../../lib/agent-store"
import ADPClient from "../../lib/adp-client"

const categoryOptions = [
  { id: "installation", label: "Installatie", emoji: "🔧" },
  { id: "repair", label: "Reparatie", emoji: "🛠️" },
  { id: "food", label: "Eten & Drinken", emoji: "🍕" },
  { id: "products", label: "Producten", emoji: "📦" },
  { id: "freelance", label: "Freelance", emoji: "💻" },
  { id: "other", label: "Overig", emoji: "✨" },
]

const brandOptions = [
  "Aqara", "FIBARO", "Sonos", "Govee", "Heatit", "Shelly",
  "Philips Hue", "IKEA", "Ring", "Nest",
]

const radiusOptions = [
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
  { value: 50, label: "50 km" },
  { value: 0, label: "Heel NL" },
]

export default function ProviderOnboarding() {
  const router = useRouter()
  const store = useAgentStore()

  const [step, setStep] = useState(1)
  const [companyName, setCompanyName] = useState("")
  const [kvk, setKvk] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [specialization, setSpecialization] = useState("")
  const [postcode, setPostcode] = useState("")
  const [radius, setRadius] = useState(25)
  const [hourlyRate, setHourlyRate] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState("")
  const [agentDid, setAgentDid] = useState("")
  const [capCount, setCapCount] = useState(0)

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    )
  }

  const handleRegister = async () => {
    setIsRegistering(true)
    setError("")

    try {
      const description = [
        selectedCategories.join(", "),
        selectedBrands.length > 0 ? `Merken: ${selectedBrands.join(", ")}` : "",
        specialization,
        kvk ? `KvK: ${kvk}` : "",
      ].filter(Boolean).join(". ")

      const capTitle = selectedCategories.length > 0
        ? `${selectedCategories.map(c => categoryOptions.find(o => o.id === c)?.label).join(" & ")} — ${companyName}`
        : companyName

      const response = await ADPClient.register({
        name: companyName,
        agentType: "service_provider",
        description,
        capability: {
          category: selectedCategories[0] || "services",
          title: capTitle,
          pricing: hourlyRate ? {
            askingPrice: Math.round(parseFloat(hourlyRate) * 100),
            currency: "EUR",
            priceType: "hourly",
            negotiable: true,
          } : undefined,
          specifications: {
            brands: selectedBrands,
            categories: selectedCategories,
            specialization,
            serviceArea: radius > 0 ? { postcode, radiusKm: radius } : { nationwide: true },
          },
          availability: { daysPerWeek: 5 },
        },
      })

      store.setCredentials(response.agent.did, response.apiKey, response.agent.id)
      store.setName(companyName)
      store.setPostcode(postcode)
      store.setRole("provider")
      setAgentDid(response.agent.did)
      setCapCount(response.capability ? 1 : 0)
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registratie mislukt. Probeer opnieuw.")
    } finally {
      setIsRegistering(false)
    }
  }

  const handleComplete = () => {
    store.setOnboardingComplete(true)
    router.replace("/app/provider")
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
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-green-500" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-white/30">Stap {step}/4</span>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: About you */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-1">Over jou</h2>
            <p className="text-white/40 text-sm mb-8">
              We maken een AI-agent aan die klussen voor je ontvangt.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/50 mb-1.5 block">Bedrijfsnaam</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Bijv. Pietersen Installaties"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 mb-1.5 block">KvK-nummer (optioneel)</label>
                <input
                  type="text"
                  value={kvk}
                  onChange={(e) => setKvk(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="12345678"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/50 transition-colors"
                />
                <p className="text-xs text-white/20 mt-1">Verhoogt je trust level naar Level 2</p>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <button
                onClick={() => setStep(2)}
                disabled={!companyName.trim()}
                className="w-full py-3.5 bg-green-600 hover:bg-green-500 disabled:bg-white/5 disabled:text-white/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                Volgende
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: What do you offer */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
              <Tag className="w-6 h-6 text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold mb-1">Wat bied je aan?</h2>
            <p className="text-white/40 text-sm mb-6">Selecteer categorieën en merken.</p>

            <div className="space-y-6 overflow-y-auto flex-1">
              <div>
                <p className="text-xs text-white/30 font-medium uppercase tracking-wider mb-3">Categorieën</p>
                <div className="grid grid-cols-3 gap-2">
                  {categoryOptions.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-[#111827] border-white/5 hover:border-white/10"
                        }`}
                      >
                        <span className="text-xl block mb-1">{cat.emoji}</span>
                        <span className={`text-xs ${isSelected ? "text-green-400" : "text-white/50"}`}>
                          {cat.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs text-white/30 font-medium uppercase tracking-wider mb-3">Merken (optioneel)</p>
                <div className="flex flex-wrap gap-2">
                  {brandOptions.map((brand) => {
                    const isSelected = selectedBrands.includes(brand)
                    return (
                      <button
                        key={brand}
                        onClick={() => toggleBrand(brand)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                          isSelected
                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                            : "bg-[#111827] border-white/5 text-white/40 hover:border-white/10"
                        }`}
                      >
                        {brand}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/50 mb-1.5 block">Specialisaties (optioneel)</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Bijv. smart home, domotica, KNX"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="mt-auto pt-8">
              <button
                onClick={() => setStep(3)}
                disabled={selectedCategories.length === 0}
                className="w-full py-3.5 bg-green-600 hover:bg-green-500 disabled:bg-white/5 disabled:text-white/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                Volgende
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Where and when */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold mb-1">Waar en wanneer?</h2>
            <p className="text-white/40 text-sm mb-8">Stel je werkgebied en tarieven in.</p>

            <div className="space-y-6">
              <div>
                <label className="text-sm text-white/50 mb-1.5 block">Postcode</label>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="1234AB"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/50 transition-colors"
                />
              </div>

              <div>
                <p className="text-xs text-white/30 font-medium uppercase tracking-wider mb-3">Werkgebied</p>
                <div className="grid grid-cols-4 gap-2">
                  {radiusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRadius(opt.value)}
                      className={`py-2.5 rounded-xl border text-sm transition-all ${
                        radius === opt.value
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : "bg-[#111827] border-white/5 text-white/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/50 mb-1.5 block">Uurtarief (optioneel)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">€</span>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="65"
                    className="w-full bg-[#111827] border border-white/10 rounded-xl pl-8 pr-16 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/50 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-sm">/uur</span>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8">
              {error && (
                <p className="text-red-400 text-sm text-center mb-3">{error}</p>
              )}
              <button
                onClick={handleRegister}
                disabled={isRegistering || !postcode.trim()}
                className="w-full py-3.5 bg-green-600 hover:bg-green-500 disabled:bg-white/5 disabled:text-white/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
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

        {/* Step 4: Done */}
        {step === 4 && (
          <motion.div
            key="step4"
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

            <h2 className="text-xl font-bold mb-2">Je agent is live!</h2>
            <p className="text-white/40 text-sm mb-8">
              {companyName} is nu vindbaar op het ADP-netwerk. Klanten kunnen je vinden.
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
                  <span className="text-xs text-white/30">Diensten</span>
                  <span className="text-xs text-white/50">{capCount} capability{capCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/30">Trust Level</span>
                  <span className="text-xs text-white/50">Level {kvk ? 2 : 1} — {kvk ? "Geverifieerd" : "Starter"}</span>
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
              className="w-full py-3.5 bg-green-600 hover:bg-green-500 rounded-xl font-medium transition-colors"
            >
              Bekijk binnenkomende klussen
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
