"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Clock, ChevronRight, Inbox, Loader2 } from "lucide-react"
import { useAgentStore } from "../../lib/agent-store"
import ADPClient from "../../lib/adp-client"
import type { Negotiation } from "../../lib/adp-client"
import { getNegotiationLifecycle } from "@/lib/adp-v2/negotiation-lifecycle"

export default function ConsumerHistory() {
  const router = useRouter()
  const { appSession, clearSkipAutoRedirect } = useAgentStore()
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    clearSkipAutoRedirect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const client = new ADPClient(appSession.apiKey || undefined)
        const response = await client.getNegotiations()
        setNegotiations(response.negotiations || [])
      } catch {
        setNegotiations([])
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [appSession.apiKey])

  return (
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold">My orders</h1>
          <p className="mt-1 text-sm text-white/40">Overview of your negotiations</p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-white/20" />
          </div>
        ) : negotiations.length > 0 ? (
          <div className="space-y-3">
            {negotiations.map((neg, i) => {
              const lifecycle = getNegotiationLifecycle(neg)

              return (
                <motion.button
                  key={neg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/app/consumer/order/${neg.id}`)}
                  className="w-full rounded-2xl border border-white/5 bg-[#111827] p-4 text-left transition-colors hover:border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Negotiation #{neg.id}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-white/30">
                        <Clock className="w-3 h-3" />
                        {new Date(neg.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        lifecycle.isDeliveryOpen
                          ? "bg-green-500/10 text-green-400"
                          : lifecycle.isClosedFailed
                            ? "bg-red-500/10 text-red-400"
                            : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {lifecycle.consumerLabel}
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/20" />
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Inbox className="mb-4 h-12 w-12 text-white/10" />
            <p className="text-sm text-white/30">No orders yet</p>
            <p className="mt-1 text-xs text-white/15">Search for something to start your first order</p>
            <button
              onClick={() => router.push("/app/consumer")}
              className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-blue-500"
            >
              Start searching
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
