"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, Check, X, MessageSquare } from "lucide-react"
import { useAgentStore } from "../../../lib/agent-store"
import ADPClient from "../../../lib/adp-client"
import NegotiationTimeline from "../../../components/NegotiationTimeline"
import type { Negotiation } from "../../../lib/adp-client"

export default function OrderDetail() {
  const router = useRouter()
  const params = useParams()
  const { apiKey, did } = useAgentStore()
  const negotiationId = Number(params.negotiationId)

  const [negotiation, setNegotiation] = useState<Negotiation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActing, setIsActing] = useState(false)
  const [error, setError] = useState("")

  const fetchNegotiation = useCallback(async () => {
    if (!apiKey) return
    try {
      const client = new ADPClient(apiKey)
      const response = await client.getNegotiation(negotiationId)
      setNegotiation(response.negotiation)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon onderhandeling niet laden")
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, negotiationId])

  useEffect(() => {
    fetchNegotiation()
    // Only poll while negotiation is still active
    const isDone = negotiation && ["completed", "accepted", "rejected", "cancelled"].includes(negotiation.status)
    if (!isDone) {
      const interval = setInterval(fetchNegotiation, 5000)
      return () => clearInterval(interval)
    }
  }, [fetchNegotiation, negotiation?.status])

  const handleAction = async (action: "accept" | "reject") => {
    if (!apiKey || !negotiation || !did) return
    setIsActing(true)
    setError("")
    try {
      const client = new ADPClient(apiKey)
      // Extract price from proposals or finalTerms
      const n = negotiation as any
      const price = n.finalTerms?.price
        || (n.proposals?.length ? n.proposals[n.proposals.length - 1]?.terms?.price : 0)
        || negotiation.currentPrice || 0
      await client.negotiate({
        negotiationId: negotiation.id,
        agentDid: did,
        action,
        proposal: {
          price,
          currency: "EUR",
        },
        message: action === "accept" ? "Deal geaccepteerd" : "Afgewezen",
      })
      await fetchNegotiation()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Actie mislukt")
    } finally {
      setIsActing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    )
  }

  if (!negotiation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <p className="text-white/40">{error || "Onderhandeling niet gevonden"}</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-400 text-sm">
          Terug
        </button>
      </div>
    )
  }

  // Extract price from finalTerms or last proposal
  const neg = negotiation as any
  const finalPrice = neg.finalTerms?.price
  const lastProposalPrice = neg.proposals?.length
    ? neg.proposals[neg.proposals.length - 1]?.terms?.price
    : undefined
  const currentPrice = finalPrice || lastProposalPrice || negotiation.currentPrice || 0

  const isWaitingForYou = ["proposal_sent", "counter_proposed"].includes(negotiation.status)
  const isWaitingForProvider = ["pending", "initiated"].includes(negotiation.status)
  const isActive = isWaitingForYou || isWaitingForProvider
  const isCompleted = negotiation.status === "completed" || negotiation.status === "accepted"
  const isFailed = negotiation.status === "rejected" || negotiation.status === "cancelled"

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/app/consumer")}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">Onderhandeling #{negotiation.id}</h1>
          <p className="text-xs text-white/30">
            {isWaitingForYou && "Wacht op jouw keuze"}
            {isWaitingForProvider && "Wacht op aanbieder"}
            {isCompleted && "Afgerond"}
            {isFailed && "Afgebroken"}
          </p>
        </div>
      </div>

      {/* Status banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-4 mb-6 border ${
          isCompleted
            ? "bg-green-500/5 border-green-500/20"
            : isFailed
            ? "bg-red-500/5 border-red-500/20"
            : isWaitingForYou
            ? "bg-amber-500/5 border-amber-500/20"
            : "bg-blue-500/5 border-blue-500/20"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/40">Huidige prijs</p>
            <p className="text-2xl font-bold text-white">
              {currentPrice ? `€${(currentPrice / 100).toFixed(2)}` : "—"}
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            isCompleted
              ? "bg-green-500/10 text-green-400"
              : isFailed
              ? "bg-red-500/10 text-red-400"
              : isWaitingForYou
              ? "bg-amber-500/10 text-amber-400"
              : "bg-blue-500/10 text-blue-400"
          }`}>
            {negotiation.status === "pending" && "Wacht op aanbieder"}
            {negotiation.status === "initiated" && "Verstuurd"}
            {negotiation.status === "proposal_sent" && "Jouw keuze"}
            {negotiation.status === "counter_proposed" && "Tegenvoorstel"}
            {negotiation.status === "accepted" && "Geaccepteerd"}
            {negotiation.status === "completed" && "Afgerond"}
            {negotiation.status === "rejected" && "Afgewezen"}
            {negotiation.status === "cancelled" && "Geannuleerd"}
          </div>
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#111827] border border-white/5 rounded-2xl p-4 mb-6"
      >
        <h3 className="text-sm font-medium text-white/50 mb-4">Voortgang</h3>
        <NegotiationTimeline negotiation={negotiation} />
      </motion.div>

      {/* Action buttons — only when consumer needs to decide */}
      {isWaitingForYou && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mt-auto"
        >
          <p className="text-sm text-amber-400/80 text-center mb-1">
            De aanbieder heeft een offerte gestuurd. Wat wil je doen?
          </p>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={() => handleAction("accept")}
            disabled={isActing}
            className="w-full py-3.5 bg-green-600 hover:bg-green-500 disabled:bg-white/5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isActing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                Accepteren — deal sluiten
              </>
            )}
          </button>

          <button
            onClick={() => handleAction("reject")}
            disabled={isActing}
            className="w-full py-3 border border-white/10 hover:border-red-500/30 rounded-xl text-white/50 hover:text-red-400 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Afwijzen
          </button>
        </motion.div>
      )}

      {/* Waiting for provider */}
      {isWaitingForProvider && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mt-auto"
        >
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-white/40 text-sm">Wachten op reactie van de aanbieder...</p>
        </motion.div>
      )}

      {/* Completed state */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mt-auto"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-white/60 text-sm">Deal afgerond!</p>
        </motion.div>
      )}
    </div>
  )
}
