"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Bot, Shield, Star, ArrowLeft, ArrowRightLeft, Trash2, ChevronRight, Copy, Check, Pencil, Loader2 } from "lucide-react"
import { useAgentStore } from "../lib/agent-store"
import { useState } from "react"
import { useProviderScope } from "../provider/use-provider-scope"
import ADPClient from "../lib/adp-client"

export default function ProfilePage() {
  const router = useRouter()
  const store = useAgentStore()
  const appApiKey = store.appSession.apiKey
  const { context: providerContext } = useProviderScope(appApiKey)
  const providerDid = providerContext?.providerScope.activeProviderDid ?? null
  const [copied, setCopied] = useState(false)
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [draftName, setDraftName] = useState(store.name || "")
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameMessage, setRenameMessage] = useState<string | null>(null)
  const [renameError, setRenameError] = useState<string | null>(null)

  const handleSwitchRole = () => {
    const newRole = store.role === "consumer" ? "provider" : "consumer"
    store.setRole(newRole as "consumer" | "provider")
    router.replace(newRole === "consumer" ? "/app/consumer" : "/app/provider")
  }

  const handleReset = () => {
    store.clearAgent()
    router.replace("/app")
  }

  const didValue = store.did?.trim() || providerDid?.trim() || null
  const hasDid = Boolean(didValue)

  const handleCopyDid = () => {
    if (didValue) {
      navigator.clipboard.writeText(didValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRename = async () => {
    if (!appApiKey) {
      setRenameError("An active bot session is required to change the bot name.")
      return
    }

    setIsRenaming(true)
    setRenameError(null)
    setRenameMessage(null)

    try {
      const client = new ADPClient(appApiKey)
      const response = await client.renameCurrentAgent(draftName)
      store.setName(response.agent.name)
      store.setAgentIdentity({
        name: response.agent.name,
      })
      setDraftName(response.agent.name)
      setRenameMessage("Bot name updated.")
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : "Unable to update the bot name.")
    } finally {
      setIsRenaming(false)
    }
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <h1 className="text-2xl font-bold">Profile</h1>
          <button
            onClick={() => router.push("/app/provider")}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to your bot
          </button>
        </motion.div>

        {/* Agent card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111827] border border-white/5 rounded-2xl p-5 mb-4"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{store.name || "Agent"}</h2>
              <p className="text-xs text-white/30 capitalize">{store.role || "—"}</p>
            </div>
            <div className="ml-auto">
              <span className={`flex items-center gap-1 text-xs ${store.isOnline ? "text-green-400" : "text-white/30"}`}>
                <span className={`w-2 h-2 rounded-full ${store.isOnline ? "bg-green-400" : "bg-white/20"}`} />
                {store.isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center rounded-xl bg-white/2 p-2">
              <Shield className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-sm font-semibold">Level {store.trustLevel}</p>
              <p className="text-[10px] text-white/30">Trust</p>
            </div>
            <div className="text-center rounded-xl bg-white/2 p-2">
              <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-sm font-semibold">{store.reputationScore.toFixed(1)}</p>
              <p className="text-[10px] text-white/30">Rating</p>
            </div>
            <div className="text-center rounded-xl bg-white/2 p-2">
              <p className="text-sm font-semibold mt-1">0</p>
              <p className="text-[10px] text-white/30 mt-1">Transactions</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-[#111827] border border-white/5 rounded-2xl p-4 mb-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-white/5 p-2 text-white/50">
              <Pencil className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Bot name</p>
              <p className="mt-1 text-xs text-white/35">
                Change it early if you are still figuring out positioning. Exact-name duplicates are blocked.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Enter bot name"
                  className="flex-1 rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:outline-none transition-colors"
                />
                <button
                  onClick={handleRename}
                  disabled={isRenaming || draftName.trim() === (store.name || "").trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30"
                >
                  {isRenaming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save name
                </button>
              </div>
              {renameError ? (
                <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {renameError}
                </div>
              ) : null}
              {renameMessage ? (
                <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-200">
                  {renameMessage}
                </div>
              ) : null}
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
              <p className={`text-xs font-mono ${hasDid ? "truncate text-white/50" : "text-white/30"}`}>
                {didValue ?? "No DID available in this local session yet"}
              </p>
            </div>
            <button
              onClick={handleCopyDid}
              disabled={!hasDid}
              className="ml-3 rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/20 disabled:hover:bg-white/5"
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
              <p className="text-sm font-medium">Switch to {store.role === "consumer" ? "provider" : "consumer"}</p>
              <p className="text-xs text-white/30">Use this same bot in a different role</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </button>

          <button
            onClick={() => setShowConfirmReset(true)}
            className="w-full flex items-center gap-3 bg-[#111827] border border-white/5 rounded-2xl p-4 hover:border-red-500/20 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-red-400/50" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white/50">Remove bot</p>
              <p className="text-xs text-white/20">Clear all local data from this device</p>
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
              <h3 className="font-semibold mb-2">Remove bot?</h3>
              <p className="text-sm text-white/40 mb-6">
                This clears your local data. Your bot will still exist on the ADP network.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="flex-1 py-2.5 border border-white/10 rounded-xl text-sm font-medium text-white/50 hover:text-white/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-medium transition-colors"
                >
                  Remove
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
    </div>
  )
}
