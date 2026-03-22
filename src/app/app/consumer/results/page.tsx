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
  const { agentIdentity, protocolSession, setProtocolSession, searchResults, postcode, lastSearch } = useAgentStore()
  const consumerDid = agentIdentity.did

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
  const canEngage = Boolean(match && consumerDid)

  const createFreshHandshakeSession = async (): Promise<string | null> => {
    if (!consumerDid) return null
    try {
      const res = await fetch("/api/adp/v2/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          did: consumerDid,
          protocol_version: "2.0",
          role: "consumer",
          supported_versions: ["2.0"],
          supported_modes: ["negotiate"],
          authority_digest: {},
          nonce: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const sessionId = data.session_id as string
      setProtocolSession({ sessionId, trustLevel: "provisional", expiresAt: data.expires_at })
      return sessionId
    } catch {
      return null
    }
  }

  const ensureProtocolSession = async (): Promise<string | null> => {
    if (!protocolSession.sessionId) return createFreshHandshakeSession()

    // Verify the stored session is still alive (in-memory sessions are lost on server restart)
    try {
      const res = await fetch(`/api/adp/v2/handshake/${protocolSession.sessionId}`)
      if (res.ok) return protocolSession.sessionId
    } catch {
      // fall through to create new
    }

    return createFreshHandshakeSession()
  }

  const handleEngage = async () => {
    if (!match || !consumerDid) return

    setIsEngaging(true)
    setError("")

    try {
      const provider = match.agent || match.provider || {}
      const requestAgentDid = provider.did

      if (!requestAgentDid) {
        setError("Target agent not found")
        return
      }

      const sessionId = await ensureProtocolSession()
      if (!sessionId) {
        setError("Could not open a protocol session. Try again.")
        return
      }

      const client = new ADPClient()

      // Build order specification message
      const orderSpec = [
        orderDetails.trim(),
        orderQuantity !== "1" ? `Quantity: ${orderQuantity}` : "",
        orderNotes.trim() ? `Note: ${orderNotes.trim()}` : "",
      ].filter(Boolean).join(" | ")

      const response = await client.engage({
        agentDid: requestAgentDid,
        session_id: sessionId,
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
      setError(err instanceof Error ? err.message : "Could not get in touch. Try again.")
    } finally {
      setIsEngaging(false)
    }
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <p className="text-white/40">Result not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-400 text-sm"
        >
          Back to results
        </button>
      </div>
    )
  }

  const agent = match.agent || match.provider || {}
  const price = (match.capability?.pricing || {}) as { askingPrice?: number; currency?: string; negotiable?: boolean }
  const priceDisplay = price?.askingPrice ? `€${(price.askingPrice / 100).toFixed(2)}` : "On request"
  const reputation = parseFloat(agent.reputationScore || "0")
  const rawScore = match.matchScore ?? match.relevanceScore ?? 0
  const score = Math.round(rawScore * 100)
  const specs = (match.capability?.specifications || {}) as Record<string, unknown>

  return (
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <h1 className="flex-1 truncate text-lg font-semibold">{match.capability?.title}</h1>
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
            : "bg-white/2 border-white/5"
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
            <p className="text-sm text-white/40">Price</p>
            <p className="text-2xl font-bold text-white">{priceDisplay}</p>
            {price?.negotiable && (
              <p className="text-xs text-blue-400">Negotiable</p>
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
              <p className="text-xs text-white/30">Distance</p>
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
            {agent.successfulTransactions}/{agent.totalTransactions} successful transactions
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
          <h4 className="text-sm font-medium text-white/50 mb-2">Description</h4>
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
        <span>Available</span>
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
            <h4 className="text-sm font-medium text-white/70">What would you like to order?</h4>
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
              <label className="text-xs text-white/30 mb-1 block">Order</label>
              <textarea
                value={orderDetails}
                onChange={(e) => setOrderDetails(e.target.value)}
                placeholder="E.g. '2x Margherita, 1x Quattro Stagioni' or 'Babi pangang for 2 people'"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-white/30 mb-1 block">Quantity</label>
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
              <label className="text-xs text-white/30 mb-1 block">Notes (optional)</label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="E.g. 'no onion', 'extra spicy', 'deliver before 19:00'"
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
          disabled={isEngaging || !canEngage}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isEngaging ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Requesting quote...
            </>
          ) : !orderDetails.trim() ? (
            <>
              <ShoppingBag className="w-4 h-4" />
              Specify order
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              Request quote
            </>
          )}
        </button>
        <p className="text-xs text-white/20 text-center mt-2">
          {!orderDetails.trim()
            ? "Specify what you want to order first"
            : "Your agent requests a quote — you decide what happens next"
          }
        </p>
      </div>
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
