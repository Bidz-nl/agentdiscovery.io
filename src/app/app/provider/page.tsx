"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Inbox, Check, SkipForward, Loader2, Star, MapPin, Wallet, ToggleLeft, ToggleRight } from "lucide-react"
import { useAgentStore } from "../lib/agent-store"
import ADPClient from "../lib/adp-client"
import type { InboxItem } from "../lib/adp-client"

export default function ProviderDashboard() {
  const router = useRouter()
  const { apiKey, did, name, isOnline, setIsOnline, setInbox } = useAgentStore()

  const [items, setItems] = useState<InboxItem[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [actingOn, setActingOn] = useState<number | null>(null)
  const [error, setError] = useState("")

  const fetchInbox = useCallback(async () => {
    if (!apiKey || !did) return
    try {
      const client = new ADPClient(apiKey)
      const response = await client.getInbox(did)
      setItems(response.inbox || [])
      setStats(response.stats || {})
      setInbox(response.inbox || [])
    } catch (err) {
      if (!error) setError(err instanceof Error ? err.message : "Kon inbox niet laden")
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, did, setInbox, error])

  useEffect(() => {
    fetchInbox()
    const interval = setInterval(fetchInbox, 10000)
    return () => clearInterval(interval)
  }, [fetchInbox])

  const handleRespond = async (item: InboxItem, action: "accept" | "reject") => {
    if (!apiKey || !did) return
    setActingOn(item.negotiation.id)

    try {
      const client = new ADPClient(apiKey)
      await client.respondToInbox(did, {
        negotiationId: item.negotiation.id,
        action,
        proposal: action === "accept" ? {
          message: "Ik neem deze klus aan!",
        } : undefined,
      })
      await fetchInbox()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Actie mislukt")
    } finally {
      setActingOn(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">{name}</p>
        </div>
        <button
          onClick={() => setIsOnline(!isOnline)}
          className="flex items-center gap-2"
        >
          {isOnline ? (
            <ToggleRight className="w-8 h-8 text-green-400" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-white/20" />
          )}
          <span className={`text-xs ${isOnline ? "text-green-400" : "text-white/30"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <div className="bg-[#111827] border border-white/5 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-blue-400">{stats.pending || 0}</p>
          <p className="text-xs text-white/30 mt-0.5">Nieuw</p>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-yellow-400">{stats.active || 0}</p>
          <p className="text-xs text-white/30 mt-0.5">Actief</p>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-green-400">{stats.completed || 0}</p>
          <p className="text-xs text-white/30 mt-0.5">Afgerond</p>
        </div>
      </motion.div>

      {/* Inbox */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-white/50">Binnenkomende verzoeken</h2>
        {!isLoading && (
          <button onClick={fetchInbox} className="text-xs text-blue-400 hover:text-blue-300">
            Vernieuwen
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-white/30 text-sm">{error}</p>
          <button onClick={fetchInbox} className="mt-3 text-sm text-blue-400">
            Opnieuw proberen
          </button>
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.negotiation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#111827] border border-white/5 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {item.capability?.title || `Verzoek #${item.negotiation.id}`}
                  </h3>
                  <p className="text-xs text-white/30 mt-0.5">
                    Van: {item.initiator?.name || "Onbekend"}
                  </p>
                </div>
                {item.initiator?.reputationScore && parseFloat(item.initiator.reputationScore) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    {parseFloat(item.initiator.reputationScore).toFixed(1)}
                  </span>
                )}
              </div>

              {item.negotiation.currentPrice > 0 && (
                <div className="flex items-center gap-1 text-sm text-white/60 mb-3">
                  <Wallet className="w-3.5 h-3.5 text-white/30" />
                  €{(item.negotiation.currentPrice / 100).toFixed(2)}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleRespond(item, "accept")}
                  disabled={actingOn === item.negotiation.id}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-white/5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  {actingOn === item.negotiation.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Interesse
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleRespond(item, "reject")}
                  disabled={actingOn === item.negotiation.id}
                  className="py-2.5 px-4 border border-white/10 hover:border-white/20 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors flex items-center gap-1.5"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
          <Inbox className="w-12 h-12 text-white/10 mb-4" />
          <p className="text-white/30 text-sm">Nog geen verzoeken</p>
          <p className="text-white/15 text-xs mt-1">
            {isOnline ? "Je agent luistert naar nieuwe klussen" : "Zet je agent online om klussen te ontvangen"}
          </p>
        </div>
      )}
    </div>
  )
}
