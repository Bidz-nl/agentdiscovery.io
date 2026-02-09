"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Bot, Shield, Star, ArrowRightLeft, Trash2, ChevronRight, Copy, Check } from "lucide-react"
import { useAgentStore } from "../lib/agent-store"
import { useState } from "react"

export default function ProfilePage() {
  const router = useRouter()
  const store = useAgentStore()
  const [copied, setCopied] = useState(false)
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  const handleSwitchRole = () => {
    const newRole = store.role === "consumer" ? "provider" : "consumer"
    store.setRole(newRole as "consumer" | "provider")
    router.replace(newRole === "consumer" ? "/app/consumer" : "/app/provider")
  }

  const handleReset = () => {
    store.clearAgent()
    router.replace("/app")
  }

  const handleCopyDid = () => {
    if (store.did) {
      navigator.clipboard.writeText(store.did)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-12 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">Profiel</h1>
      </motion.div>

      {/* Agent card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#111827] border border-white/5 rounded-2xl p-5 mb-4"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{store.name || "Agent"}</h2>
            <p className="text-xs text-white/30 capitalize">{store.role || "—"}</p>
          </div>
          <div className="ml-auto">
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Online
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-white/[0.02] rounded-xl">
            <Shield className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-sm font-semibold">Level {store.trustLevel}</p>
            <p className="text-[10px] text-white/30">Trust</p>
          </div>
          <div className="text-center p-2 bg-white/[0.02] rounded-xl">
            <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="text-sm font-semibold">{store.reputationScore.toFixed(1)}</p>
            <p className="text-[10px] text-white/30">Rating</p>
          </div>
          <div className="text-center p-2 bg-white/[0.02] rounded-xl">
            <p className="text-sm font-semibold mt-1">0</p>
            <p className="text-[10px] text-white/30 mt-1">Transacties</p>
          </div>
        </div>
      </motion.div>

      {/* Agent DID */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-[#111827] border border-white/5 rounded-2xl p-4 mb-4"
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/30 mb-1">Agent DID</p>
            <p className="text-xs text-white/50 font-mono truncate">{store.did || "—"}</p>
          </div>
          <button
            onClick={handleCopyDid}
            className="ml-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/30" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <button
          onClick={handleSwitchRole}
          className="w-full flex items-center gap-3 bg-[#111827] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors"
        >
          <ArrowRightLeft className="w-5 h-5 text-blue-400" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Wissel naar {store.role === "consumer" ? "aanbieder" : "consument"}</p>
            <p className="text-xs text-white/30">Gebruik dezelfde agent in een andere rol</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/20" />
        </button>

        <button
          onClick={() => setShowConfirmReset(true)}
          className="w-full flex items-center gap-3 bg-[#111827] border border-white/5 rounded-2xl p-4 hover:border-red-500/20 transition-colors"
        >
          <Trash2 className="w-5 h-5 text-red-400/50" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-white/50">Agent verwijderen</p>
            <p className="text-xs text-white/20">Alle lokale gegevens wissen</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/10" />
        </button>
      </motion.div>

      {/* Confirm reset modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="font-semibold mb-2">Agent verwijderen?</h3>
            <p className="text-sm text-white/40 mb-6">
              Dit verwijdert je lokale gegevens. Je agent blijft bestaan op het ADP-netwerk.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2.5 border border-white/10 rounded-xl text-sm font-medium text-white/50 hover:text-white/70 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-medium transition-colors"
              >
                Verwijderen
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-8 text-center">
        <p className="text-xs text-white/15">
          ADP v0.1 — agentdiscovery.io
        </p>
      </div>
    </div>
  )
}
