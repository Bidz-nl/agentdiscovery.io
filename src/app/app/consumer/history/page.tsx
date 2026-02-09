"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Clock, ChevronRight, Inbox } from "lucide-react"
import { useAgentStore } from "../../lib/agent-store"

export default function ConsumerHistory() {
  const router = useRouter()
  const { activeNegotiations } = useAgentStore()

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Mijn orders</h1>
        <p className="text-white/40 text-sm mt-1">Overzicht van je onderhandelingen</p>
      </motion.div>

      {activeNegotiations.length > 0 ? (
        <div className="space-y-3">
          {activeNegotiations.map((neg, i) => (
            <motion.button
              key={neg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => router.push(`/app/consumer/order/${neg.id}`)}
              className="w-full text-left bg-[#111827] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Onderhandeling #{neg.id}</p>
                  <p className="text-xs text-white/30 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(neg.createdAt).toLocaleDateString("nl-NL")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    neg.status === "accepted" || neg.status === "completed"
                      ? "bg-green-500/10 text-green-400"
                      : neg.status === "rejected" || neg.status === "cancelled"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {neg.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <Inbox className="w-12 h-12 text-white/10 mb-4" />
          <p className="text-white/30 text-sm">Nog geen orders</p>
          <p className="text-white/15 text-xs mt-1">Zoek iets om je eerste order te starten</p>
          <button
            onClick={() => router.push("/app/consumer")}
            className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition-colors"
          >
            Start met zoeken
          </button>
        </div>
      )}
    </div>
  )
}
