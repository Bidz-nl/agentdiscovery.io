"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, Check, X, MessageSquare } from "lucide-react"
import { useAgentStore } from "../../../lib/agent-store"
import ADPClient from "../../../lib/adp-client"
import NegotiationTimeline from "../../../components/NegotiationTimeline"
import type { Negotiation } from "../../../lib/adp-client"
import { getNegotiationLifecycle, normalizeNegotiationStatus } from "@/lib/adp-v2/negotiation-lifecycle"

export default function OrderDetail() {
  const router = useRouter()
  const params = useParams()
  const { agentIdentity, protocolSession, appSession } = useAgentStore()
  const consumerDid = agentIdentity.did
  const protocolSessionId = protocolSession.sessionId
  const appApiKey = appSession.apiKey
  const negotiationId = Number(params.negotiationId)

  const [negotiation, setNegotiation] = useState<Negotiation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActing, setIsActing] = useState(false)
  const [error, setError] = useState("")
  const [replyText, setReplyText] = useState("")
  const [isSendingReply, setIsSendingReply] = useState(false)

  const promptCounterPrice = useCallback((currentPrice: number) => {
    const input = window.prompt("New counter-offer in euro", (currentPrice / 100).toFixed(2))
    if (input === null) return null
    const normalized = Number.parseFloat(input.replace(",", "."))
    if (!Number.isFinite(normalized) || normalized <= 0) {
      setError("Enter a valid amount for the counter-offer.")
      return null
    }
    return Math.round(normalized * 100)
  }, [])

  const fetchNegotiation = useCallback(async () => {
    try {
      const client = new ADPClient(appApiKey || undefined)
      const response = await client.getNegotiation(negotiationId)
      setNegotiation(response.negotiation)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load negotiation")
    } finally {
      setIsLoading(false)
    }
  }, [appApiKey, negotiationId])

  useEffect(() => {
    fetchNegotiation()
    const isDone = negotiation && ["rejected", "cancelled"].includes(normalizeNegotiationStatus(negotiation.status))
    if (!isDone) {
      const interval = setInterval(fetchNegotiation, 5000)
      return () => clearInterval(interval)
    }
  }, [fetchNegotiation, negotiation?.status])

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
        <p className="text-white/40">{error || "Negotiation not found"}</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-400 text-sm">
          Back
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
  const isSessionBackedNegotiation = (negotiation as Negotiation & { source?: string }).source === "session"
  const isNativeSessionNegotiation = (negotiation as Negotiation & { source?: string }).source === "native"
  const isSessionNegotiation = isSessionBackedNegotiation || isNativeSessionNegotiation
  const isLegacyViewOnlyNegotiation = !isSessionNegotiation
  const lifecycle = getNegotiationLifecycle(negotiation)

  const isWaitingForYou = lifecycle.isAwaitingConsumer
  const isWaitingForProvider = lifecycle.isAwaitingProvider
  const isDeliveryActive = lifecycle.isDeliveryOpen
  const isCompleted = lifecycle.isClosedSuccess
  const isFailed = lifecycle.isClosedFailed
  const deliveryConversation = lifecycle.messages

  const handleAction = async (action: "accept" | "reject" | "counter", overridePrice?: number | null) => {
    if (!negotiation || !consumerDid) return
    if (isSessionNegotiation && !protocolSessionId) {
      setError("Open a protocol session first to handle this negotiation.")
      return
    }
    if (isLegacyViewOnlyNegotiation) {
      setError("This legacy negotiation is view-only here. Active negotiation actions now require a protocol session.")
      return
    }
    setIsActing(true)
    setError("")
    try {
      const client = new ADPClient(appApiKey || undefined)
      const n = negotiation as any
      const fallbackPrice = n.finalTerms?.price
        || (n.proposals?.length ? n.proposals[n.proposals.length - 1]?.terms?.price : 0)
        || negotiation.currentPrice || 0
      const price = overridePrice ?? fallbackPrice
      await client.negotiate({
        negotiationId: negotiation.id,
        session_id: isSessionNegotiation ? protocolSessionId || undefined : undefined,
        agentDid: consumerDid,
        action,
        proposal: {
          price,
          currency: "EUR",
        },
        message:
          action === "accept"
            ? "Deal accepted"
            : action === "counter"
              ? "Counter-offer made"
              : "Rejected",
      })
      await fetchNegotiation()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed")
    } finally {
      setIsActing(false)
    }
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push("/app/consumer")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Negotiation #{negotiation.id}</h1>
            <p className="text-xs text-white/30">
              {isWaitingForYou && "Waiting for your decision"}
              {isWaitingForProvider && "Waiting for provider"}
              {isDeliveryActive && "Delivery in progress"}
              {isCompleted && "Completed"}
              {isFailed && "Closed"}
            </p>
          </div>
        </div>

        {/* Status banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 rounded-2xl border p-4 ${
            isCompleted
              ? "border-green-500/20 bg-green-500/5"
              : isFailed
              ? "border-red-500/20 bg-red-500/5"
              : isWaitingForYou
              ? "border-amber-500/20 bg-amber-500/5"
              : "border-blue-500/20 bg-blue-500/5"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/40">Current price</p>
              <p className="text-2xl font-bold text-white">
                {currentPrice ? `€${(currentPrice / 100).toFixed(2)}` : "—"}
              </p>
            </div>
            <div className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              isCompleted
                ? "bg-green-500/10 text-green-400"
                : isFailed
                ? "bg-red-500/10 text-red-400"
                : isWaitingForYou
                ? "bg-amber-500/10 text-amber-400"
                : "bg-blue-500/10 text-blue-400"
            }`}>
              {lifecycle.consumerLabel}
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-2xl border border-white/5 bg-[#111827] p-4"
        >
          <h3 className="mb-4 text-sm font-medium text-white/50">Progress</h3>
          <NegotiationTimeline negotiation={negotiation} />
        </motion.div>

        {/* Delivery conversation thread */}
        {deliveryConversation.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 rounded-2xl border border-white/5 bg-[#111827] p-4"
          >
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-medium text-white/70">Delivery conversation</h3>
            </div>
            <div className="space-y-3">
              {deliveryConversation.map((msg, i) => {
                const isProvider = msg.by === negotiation.responderDid
                return (
                  <div key={i} className={`flex gap-3 ${isProvider ? "" : "flex-row-reverse"}`}>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isProvider ? "bg-blue-500/20 text-blue-300" : "bg-green-500/20 text-green-300"
                    }`}>
                      {isProvider ? "S" : "P"}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      isProvider
                        ? "rounded-tl-sm bg-blue-500/10 text-white/90"
                        : "rounded-tr-sm bg-white/5 text-white/70"
                    }`}>
                      <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                      <p className="mt-1 text-[10px] text-white/25">
                        {new Date(msg.at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Reply input — only if negotiation is not fully completed and last message was from provider */}
            {(() => {
              const providerMsgCount = lifecycle.providerMessageCount
              const canReply = lifecycle.canConsumerReply
              const maxReached = providerMsgCount >= 3
              return canReply && !maxReached ? (
                <div className="mt-4 flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="React op het aanbod van Scout…"
                    rows={2}
                    className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-blue-500/40 focus:outline-none"
                  />
                  <button
                    onClick={async () => {
                      if (!replyText.trim() || !appApiKey) return
                      setIsSendingReply(true)
                      try {
                        const client = new ADPClient(appApiKey)
                        await client.replyToDelivery(negotiation.id, replyText.trim())
                        setReplyText("")
                        await fetchNegotiation()
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Reply mislukt")
                      } finally {
                        setIsSendingReply(false)
                      }
                    }}
                    disabled={isSendingReply || !replyText.trim()}
                    className="shrink-0 self-end rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-blue-500 disabled:opacity-40"
                  >
                    {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                  </button>
                </div>
              ) : maxReached ? (
                <p className="mt-3 text-center text-xs text-white/30">Scout heeft zijn maximum aantal aanbiedingen bereikt.</p>
              ) : null
            })()}
          </motion.div>
        )}

        {/* Fallback: old-style single delivery payload without messages */}
        {negotiation.deliveryPayload && deliveryConversation.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/5 p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              <h3 className="text-sm font-medium text-green-400">Results from provider</h3>
            </div>
            <p className="whitespace-pre-wrap text-sm text-white/80">{negotiation.deliveryPayload}</p>
          </motion.div>
        )}

        {/* Action buttons — only when consumer needs to decide */}
        {isWaitingForYou && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-auto space-y-3"
          >
            {isSessionBackedNegotiation ? (
              <p className="mb-1 text-center text-sm text-amber-400/80">
                The provider sent a quote. What would you like to do?
              </p>
            ) : (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-4 text-center">
                <p className="mb-2 text-sm text-blue-300">
                  This legacy negotiation is view-only here.
                </p>
                <p className="text-xs leading-relaxed text-blue-200/80">
                  Active negotiation actions now run through a protocol session. That is why you can still view this legacy negotiation here, but you can no longer accept, reject, or counter it.
                </p>
              </div>
            )}

            {error && <p className="text-center text-sm text-red-400">{error}</p>}

            {isSessionBackedNegotiation && (
              <>
                <button
                  onClick={() => handleAction("accept")}
                  disabled={isActing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-medium transition-colors hover:bg-green-500 disabled:bg-white/5"
                >
                  {isActing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Accept — start delivery
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleAction("reject")}
                  disabled={isActing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-white/50 font-medium transition-colors hover:border-red-500/30 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => {
                    const counterPrice = promptCounterPrice(currentPrice)
                    if (counterPrice === null) return
                    void handleAction("counter", counterPrice)
                  }}
                  disabled={isActing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 py-3 text-blue-300 font-medium transition-colors hover:border-blue-400/40 hover:text-blue-200"
                >
                  <MessageSquare className="w-4 h-4" />
                  Make counter-offer
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* Waiting for provider */}
        {isWaitingForProvider && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-auto text-center"
          >
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-400" />
            <p className="text-sm text-white/40">Waiting for the provider to respond...</p>
          </motion.div>
        )}

        {/* Completed state */}
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-auto text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-sm text-white/60">Deal completed!</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
