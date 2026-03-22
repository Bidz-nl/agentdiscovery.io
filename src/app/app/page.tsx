"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { Search, Briefcase, Shield, Zap, ArrowLeft } from "lucide-react"
import BotAvatar from "./components/BotAvatar"
import { useAgentStore } from "./lib/agent-store"

export default function AppHome() {
  const router = useRouter()
  const { onboardingComplete, role, name, did, skipAutoRedirect, clearSkipAutoRedirect } = useAgentStore()

  useEffect(() => {
    if (onboardingComplete && role && !skipAutoRedirect) {
      router.replace(role === "consumer" ? "/app/consumer" : "/app/provider")
    }
  }, [onboardingComplete, role, skipAutoRedirect, router])

  // After a bot switch: show a choice screen instead of auto-redirecting
  if (onboardingComplete && role && skipAutoRedirect) {
    return (
      <div className="min-h-screen px-6 pb-24 pt-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3">
              <BotAvatar seed={did || name || "bot"} size={64} className="border-2 border-white/10" />
            </div>
            <h1 className="text-xl font-bold">{name}</h1>
            <p className="mt-1 text-sm text-white/40">What do you want to do?</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => { router.push("/app/provider") }}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition-colors hover:bg-white/10"
            >
              <Briefcase className="h-6 w-6 shrink-0 text-blue-400" />
              <div>
                <p className="font-medium">Bot workspace</p>
                <p className="text-sm text-white/40">Manage capabilities, view incoming requests</p>
              </div>
            </button>
            <button
              onClick={() => { router.push("/app/consumer") }}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition-colors hover:bg-white/10"
            >
              <Search className="h-6 w-6 shrink-0 text-green-400" />
              <div>
                <p className="font-medium">Search for services</p>
                <p className="text-sm text-white/40">Find providers, start a negotiation</p>
              </div>
            </button>
            <button
              onClick={() => { router.push("/app/consumer/history") }}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition-colors hover:bg-white/10"
            >
              <Zap className="h-6 w-6 shrink-0 text-yellow-400" />
              <div>
                <p className="font-medium">My orders</p>
                <p className="text-sm text-white/40">View active and past negotiations</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (onboardingComplete && role) return null

  return (
    <div className="min-h-screen px-6 pb-8 pt-16">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col">
        {/* Back to website */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            agentdiscovery.io
          </Link>
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-700">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">ADP</h1>
          <p className="mt-1 text-sm text-white/40">Agent Discovery Protocol</p>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-2 text-xl font-semibold">
            Find the best service.<br />
            Offer your capability.
          </h2>
          <p className="text-sm text-white/40">
            €0.25 per match. No percentages. No subscriptions.
          </p>
        </motion.div>

        {/* Role selection */}
        <div className="flex-1 space-y-4">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => router.push("/app/onboarding/consumer")}
            className="group w-full rounded-2xl border border-white/5 bg-[#111827] p-5 text-left transition-all hover:border-blue-500/30"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">I need something</h3>
                <p className="text-sm text-white/40">
                  Describe what you need. Your AI agent finds, compares, and negotiates for you.
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => router.push("/app/onboarding/provider")}
            className="group w-full rounded-2xl border border-white/5 bg-[#111827] p-5 text-left transition-all hover:border-green-500/30"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 transition-colors group-hover:bg-green-500/20">
                <Briefcase className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">I offer something</h3>
                <p className="text-sm text-white/40">
                  Register your capabilities. Receive opportunities. Pay only €0.25 per successful match.
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Bottom info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center"
        >
          <div className="mb-2 flex items-center justify-center gap-2 text-xs text-white/20">
            <Zap className="w-3 h-3" />
            <span>Powered by ADP — the open protocol for agent commerce</span>
          </div>
          <p className="text-xs text-white/15">You can always switch later</p>
          <div className="mt-4">
            <Link
              href="/app/restore"
              className="text-xs text-white/25 underline hover:text-white/50 transition-colors"
            >
              Already have a bot? Restore your session →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
