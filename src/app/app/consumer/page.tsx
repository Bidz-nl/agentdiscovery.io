"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, MapPin, Calendar, Wallet, ArrowRight } from "lucide-react"
import { useAgentStore } from "../lib/agent-store"
import ADPClient from "../lib/adp-client"
import LoadingAgent from "../components/LoadingAgent"
import MatchCard from "../components/MatchCard"

const quickCategories = [
  { id: "food", label: "Eten", emoji: "🍕" },
  { id: "services", label: "Diensten", emoji: "🔧" },
  { id: "smart-home", label: "Smart Home", emoji: "🏠" },
  { id: "products", label: "Producten", emoji: "📦" },
]

export default function ConsumerSearch() {
  const router = useRouter()
  const { apiKey, postcode, setSearchResults, setLastSearch } = useAgentStore()

  const [query, setQuery] = useState("")
  const [budget, setBudget] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [showBudget, setShowBudget] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return

    setIsSearching(true)
    setError("")
    setHasSearched(true)
    setLastSearch(q)

    try {
      const client = new ADPClient(apiKey || undefined)
      const keywords = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2)

      const response = await client.matchServices({
        category: "all",
        postcode: postcode || undefined,
        requirements: { keywords, urgency: "normal" },
        budget: budget ? { maxAmount: Math.round(parseFloat(budget) * 100) } : undefined,
        limit: 10,
      })

      setResults(response.matches || [])
      setSearchResults(response.matches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Zoeken mislukt. Probeer opnieuw.")
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectMatch = (match: any) => {
    const agent = match.agent || match.provider || {}
    router.push(`/app/consumer/results?capabilityId=${match.capability?.id}&agentDid=${agent.did}`)
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Wat heb je nodig?</h1>
        <p className="text-white/40 text-sm mt-1">Je agent zoekt de beste opties voor je</p>
      </motion.div>

      {/* Search input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Bijv. 'pizza margherita', 'loodgieter', 'Aqara installatie'"
            rows={3}
            className="w-full bg-[#111827] border border-white/10 rounded-2xl px-4 py-3 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSearch()
              }
            }}
          />
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || isSearching}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 flex items-center justify-center transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/40 hover:bg-white/10 transition-colors">
            <MapPin className="w-3 h-3" />
            {postcode || "Locatie"}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/40 hover:bg-white/10 transition-colors">
            <Calendar className="w-3 h-3" />
            Wanneer
          </button>
          <button
            onClick={() => setShowBudget(!showBudget)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
              showBudget || budget ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-white/5 text-white/40 hover:bg-white/10"
            }`}
          >
            <Wallet className="w-3 h-3" />
            {budget ? `€${budget}` : "Budget"}
          </button>
        </div>

        {/* Budget input */}
        {showBudget && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">€</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Max budget"
                className="w-full bg-[#111827] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Quick categories */}
      {!hasSearched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <p className="text-xs text-white/30 font-medium uppercase tracking-wider mb-3">Snel zoeken</p>
          <div className="grid grid-cols-4 gap-2">
            {quickCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setQuery(cat.label)
                  handleSearch(cat.label)
                }}
                className="bg-[#111827] border border-white/5 rounded-xl p-3 text-center hover:border-white/10 transition-colors"
              >
                <span className="text-xl block mb-1">{cat.emoji}</span>
                <span className="text-xs text-white/40">{cat.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {isSearching && <LoadingAgent isLoading={true} />}

      {/* Error */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => handleSearch()}
            className="mt-3 text-sm text-blue-400 hover:text-blue-300"
          >
            Opnieuw proberen
          </button>
        </div>
      )}

      {/* Results */}
      {!isSearching && hasSearched && !error && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-white/40">
              {results.length} {results.length === 1 ? "resultaat" : "resultaten"}
            </p>
          </div>
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((match, i) => (
                <MatchCard
                  key={match.capability.id}
                  match={match}
                  index={i}
                  onSelect={handleSelectMatch}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Geen resultaten gevonden</p>
              <p className="text-white/15 text-xs mt-1">Probeer andere zoektermen</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
