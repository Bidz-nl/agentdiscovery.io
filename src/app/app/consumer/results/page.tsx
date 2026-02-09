"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Star, MapPin, Clock, Shield, Loader2, MessageSquare, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react"
import { useAgentStore } from "../../lib/agent-store"
import ADPClient from "../../lib/adp-client"

function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { apiKey, did, searchResults, postcode, lastSearch } = useAgentStore()

  const capabilityId = searchParams.get("capabilityId")
  const agentDid = searchParams.get("agentDid")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = searchResults.find((m: any) => {
    const agent = m.agent || m.provider || {}
    return String(m.capability?.id) === capabilityId && agent.did === agentDid
  }) as any

  const [isEngaging, setIsEngaging] = useState(false)
  const [error, setError] = useState("")
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderDetails, setOrderDetails] = useState(lastSearch || "")
  const [orderQuantity, setOrderQuantity] = useState("1")
  const [orderNotes, setOrderNotes] = useState("")

  const handleEngage = async () => {
    if (!match || !apiKey || !did) return

    setIsEngaging(true)
    setError("")

    try {
      const client = new ADPClient(apiKey)
      const keywords = lastSearch.toLowerCase().split(/\s+/).filter((w) => w.length > 2)

      // Build order specification message
      const orderSpec = [
        orderDetails.trim(),
        orderQuantity !== "1" ? `Aantal: ${orderQuantity}` : "",
        orderNotes.trim() ? `Opmerking: ${orderNotes.trim()}` : "",
      ].filter(Boolean).join(" | ")

      const response = await client.engage({
        agentDid: did!,
        query: orderSpec || lastSearch || match.capability?.title || 'service request',
        category: match.capability?.category || 'all',
        postcode: postcode || undefined,
        targetCapabilityId: match.capability?.id,
        autoNegotiate: true,
        proposal: match.capability?.pricing?.askingPrice ? {
          price: match.capability.pricing.askingPrice * parseInt(orderQuantity || "1"),
          message: orderSpec,
        } : undefined,
      }) as { negotiation?: { id: number } }

      if (response.negotiation?.id) {
        router.push(`/app/consumer/order/${response.negotiation.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon geen contact opnemen. Probeer opnieuw.")
    } finally {
      setIsEngaging(false)
    }
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <p className="text-white/40">Resultaat niet gevonden</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-400 text-sm"
        >
          Terug naar resultaten
        </button>
      </div>
    )
  }

  const agent = match.agent || match.provider || {}
  const price = (match.capability?.pricing || {}) as { askingPrice?: number; currency?: string; negotiable?: boolean }
  const priceDisplay = price?.askingPrice ? `€${(price.askingPrice / 100).toFixed(2)}` : "Op aanvraag"
  const reputation = parseFloat(agent.reputationScore || "0")
  const rawScore = match.matchScore ?? match.relevanceScore ?? 0
  const score = Math.round(rawScore * 100)
  const specs = (match.capability?.specifications || {}) as Record<string, unknown>

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <h1 className="text-lg font-semibold truncate flex-1">{match.capability?.title}</h1>
      </div>

      {/* Match score banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-4 mb-4 border ${
          score >= 90
            ? "bg-green-500/5 border-green-500/20"
            : score >= 70
            ? "bg-yellow-500/5 border-yellow-500/20"
            : "bg-white/[0.02] border-white/5"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/40">Match score</p>
            <p className={`text-3xl font-bold ${
              score >= 90 ? "text-green-400" : score >= 70 ? "text-yellow-400" : "text-white/50"
            }`}>
              {score}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/40">Prijs</p>
            <p className="text-2xl font-bold text-white">{priceDisplay}</p>
            {price?.negotiable && (
              <p className="text-xs text-blue-400">Onderhandelbaar</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Provider info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#111827] border border-white/5 rounded-2xl p-4 mb-4"
      >
        <h3 className="font-semibold mb-3">{agent.name}</h3>

        <div className="grid grid-cols-3 gap-3">
          {reputation > 0 && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{reputation.toFixed(1)}</span>
              </div>
              <p className="text-xs text-white/30">Rating</p>
            </div>
          )}
          {match.distance !== undefined && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="font-semibold">{Math.round(match.distance)} km</span>
              </div>
              <p className="text-xs text-white/30">Afstand</p>
            </div>
          )}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="font-semibold">Level 1</span>
            </div>
            <p className="text-xs text-white/30">Trust</p>
          </div>
        </div>

        {agent.totalTransactions > 0 && (
          <p className="text-xs text-white/20 text-center mt-3">
            {agent.successfulTransactions}/{agent.totalTransactions} transacties succesvol
          </p>
        )}
      </motion.div>

      {/* Description */}
      {match.capability?.description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111827] border border-white/5 rounded-2xl p-4 mb-4"
        >
          <h4 className="text-sm font-medium text-white/50 mb-2">Beschrijving</h4>
          <p className="text-sm text-white/70">{match.capability.description}</p>
        </motion.div>
      )}

      {/* Specifications */}
      {specs && Object.keys(specs).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#111827] border border-white/5 rounded-2xl p-4 mb-4"
        >
          <h4 className="text-sm font-medium text-white/50 mb-2">Details</h4>
          <div className="space-y-2">
            {Object.entries(specs).map(([key, value]) => {
              let display: string
              if (value === null || value === undefined) {
                display = "—"
              } else if (Array.isArray(value)) {
                display = value.join(", ")
              } else if (typeof value === "object") {
                const entries = Object.entries(value as Record<string, unknown>)
                display = entries.map(([k, v]) => `${k}: ${v}`).join(", ")
              } else {
                display = String(value)
              }
              const isLong = display.length > 30
              return (
                <div key={key} className={`text-sm ${isLong ? "flex flex-col gap-0.5" : "flex justify-between gap-4"}`}>
                  <span className="text-white/30 capitalize shrink-0">{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}</span>
                  <span className="text-white/60 text-right break-words overflow-hidden">{display}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Availability */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 text-sm text-white/40 mb-8"
      >
        <Clock className="w-4 h-4" />
        <span>Beschikbaar</span>
      </motion.div>

      {/* Order specification */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-[#111827] border border-white/5 rounded-2xl p-4 mb-6"
      >
        <button
          onClick={() => setShowOrderForm(!showOrderForm)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-medium text-white/70">Wat wil je bestellen?</h4>
          </div>
          {showOrderForm ? (
            <ChevronUp className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/30" />
          )}
        </button>

        {showOrderForm && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-white/30 mb-1 block">Bestelling</label>
              <textarea
                value={orderDetails}
                onChange={(e) => setOrderDetails(e.target.value)}
                placeholder="Bijv. '2x Margherita, 1x Quattro Stagioni' of 'Babi Pangang voor 2 personen'"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-white/30 mb-1 block">Aantal</label>
                <select
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={String(n)}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/30 mb-1 block">Opmerkingen (optioneel)</label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Bijv. 'zonder ui', 'extra pittig', 'bezorgen voor 19:00'"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* CTA */}
      <div className="mt-auto">
        {error && (
          <p className="text-red-400 text-sm text-center mb-3">{error}</p>
        )}
        <button
          onClick={() => {
            if (!showOrderForm && !orderDetails.trim()) {
              setShowOrderForm(true)
              return
            }
            handleEngage()
          }}
          disabled={isEngaging}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isEngaging ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Offerte aanvragen...
            </>
          ) : !orderDetails.trim() ? (
            <>
              <ShoppingBag className="w-4 h-4" />
              Bestelling specificeren
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              Offerte aanvragen
            </>
          )}
        </button>
        <p className="text-xs text-white/20 text-center mt-2">
          {!orderDetails.trim()
            ? "Geef aan wat je precies wilt bestellen"
            : "Je agent vraagt een offerte aan — jij beslist daarna"
          }
        </p>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}
