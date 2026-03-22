"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, MapPin, Calendar, Wallet, ArrowLeft, ArrowRight } from "lucide-react"
import { useAgentStore } from "../lib/agent-store"
import ADPClient from "../lib/adp-client"
import LoadingAgent from "../components/LoadingAgent"
import MatchCard from "../components/MatchCard"

const quickCategories = [
  { id: "food", label: "Food", emoji: "🍕" },
  { id: "services", label: "Services", emoji: "🔧" },
  { id: "smart-home", label: "Smart Home", emoji: "🏠" },
  { id: "products", label: "Products", emoji: "📦" },
]

export default function ConsumerSearch() {
  const router = useRouter()
  const { apiKey, postcode, setPostcode, setSearchResults, setLastSearch, clearSkipAutoRedirect } = useAgentStore()

  useEffect(() => {
    clearSkipAutoRedirect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [query, setQuery] = useState("")
  const [budget, setBudget] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [showLocation, setShowLocation] = useState(false)
  const [showBudget, setShowBudget] = useState(false)
  const [showWhen, setShowWhen] = useState(false)
  const [preferredWhen, setPreferredWhen] = useState("")
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
      const normalized = q.toLowerCase().trim()
      const words = normalized.split(/\s+/).filter((w) => w.length > 2)
      // If the entire query is a single word, try it as a category filter too
      const queriedCategory = words.length === 1 ? words[0] : "all"

      const response = await client.matchServices({
        category: queriedCategory,
        postcode: postcode || undefined,
        requirements: { keywords: words, urgency: "normal" },
        budget: budget ? { maxAmount: Math.round(parseFloat(budget) * 100) } : undefined,
        limit: 10,
      })

      setResults(response.matches || [])
      setSearchResults(response.matches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Try again.")
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
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold">What do you need?</h1>
            <p className="mt-1 text-sm text-white/40">Your agent finds the best options for you</p>
          </div>
          <button
            onClick={() => router.push("/app")}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </motion.div>

        {/* Search input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <button
            onClick={() => router.push('/app/food')}
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2.5 text-sm font-medium text-orange-100 transition-colors hover:bg-orange-500/20"
          >
            <span>🍕</span>
            Try the local pizza ordering flow
          </button>

          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g. 'pizza margherita', 'plumber', 'Aqara installation'"
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
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setShowLocation(!showLocation)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                showLocation || postcode ? "border border-blue-500/20 bg-blue-500/10 text-blue-400" : "bg-white/5 text-white/40 hover:bg-white/10"
              }`}
            >
              <MapPin className="w-3 h-3" />
              {postcode || "Location"}
            </button>
            <button
              onClick={() => setShowWhen(!showWhen)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                showWhen || preferredWhen ? "border border-blue-500/20 bg-blue-500/10 text-blue-400" : "bg-white/5 text-white/40 hover:bg-white/10"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {preferredWhen ? preferredWhen.replace("T", " ") : "When"}
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

          {showLocation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3"
            >
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Enter postcode or area"
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </motion.div>
          )}

          {showWhen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3"
            >
              <input
                type="datetime-local"
                value={preferredWhen}
                onChange={(e) => setPreferredWhen(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </motion.div>
          )}

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
            <p className="text-xs text-white/30 font-medium uppercase tracking-wider mb-3">Quick search</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
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
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {!isSearching && hasSearched && !error && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-white/40">
                {results.length} {results.length === 1 ? "result" : "results"}
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
                <p className="text-white/30 text-sm">No results found</p>
                <p className="text-white/15 text-xs mt-1">Try different search terms</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
