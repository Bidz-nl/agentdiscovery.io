"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Tag, Loader2, ToggleLeft, ToggleRight } from "lucide-react"
import { useAgentStore } from "../../lib/agent-store"
import ADPClient from "../../lib/adp-client"

export default function ProviderServices() {
  const router = useRouter()
  const { apiKey, did, capabilities, setCapabilities } = useAgentStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCapabilities() {
      if (!apiKey) return
      try {
        const client = new ADPClient(apiKey)
        const response = await client.getCapabilities() as { capabilities: typeof capabilities }
        setCapabilities(response.capabilities || [])
      } catch {
        // Silently fail — show existing state
      } finally {
        setIsLoading(false)
      }
    }
    fetchCapabilities()
  }, [apiKey, setCapabilities])

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold">Mijn diensten</h1>
          <p className="text-white/40 text-sm mt-1">Beheer wat je aanbiedt</p>
        </div>
        <button
          onClick={() => router.push("/app/provider/services/add")}
          className="w-10 h-10 rounded-xl bg-green-600 hover:bg-green-500 flex items-center justify-center transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      ) : capabilities.length > 0 ? (
        <div className="space-y-3">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#111827] border border-white/5 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{cap.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-white/30">
                      <Tag className="w-3 h-3" />
                      {cap.category}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  cap.status === "active"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-white/5 text-white/30"
                }`}>
                  {cap.status === "active" ? "Actief" : cap.status}
                </span>
              </div>
              {cap.description && (
                <p className="text-xs text-white/40 line-clamp-2">{cap.description}</p>
              )}
              {cap.pricing && (cap.pricing as { askingPrice?: number }).askingPrice && (
                <p className="text-sm text-white/60 mt-2 font-medium">
                  €{((cap.pricing as { askingPrice: number }).askingPrice / 100).toFixed(2)}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
          <Tag className="w-12 h-12 text-white/10 mb-4" />
          <p className="text-white/30 text-sm">Nog geen diensten</p>
          <p className="text-white/15 text-xs mt-1">Voeg je eerste dienst toe</p>
          <button
            onClick={() => router.push("/app/provider/services/add")}
            className="mt-6 px-6 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-medium transition-colors"
          >
            Dienst toevoegen
          </button>
        </div>
      )}
    </div>
  )
}
