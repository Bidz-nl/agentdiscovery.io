"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Key, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useAgentStore } from "../lib/agent-store"

export default function RestorePage() {
  const router = useRouter()
  const store = useAgentStore()

  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const redirect = new URLSearchParams(window.location.search).get("redirect")
    setRedirectTarget(redirect)
  }, [])

  const handleRestore = async () => {
    const trimmed = apiKey.trim()
    if (!trimmed) {
      setError("Enter your API key.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/app/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: trimmed,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        setError(body?.error?.message || "API key not recognised. Check and try again.")
        return
      }

      const data = await res.json()
      const agent = data.agent

      store.setAgentIdentity({
        did: agent.did,
        legacyAgentId: agent.id,
        name: agent.name,
        role: agent.role as "consumer" | "provider",
      })
      store.setAppSession({ apiKey: trimmed })
      store.setRole(agent.role as "consumer" | "provider")
      store.setOnboardingComplete(true)
      store.saveCurrentBot()

      setSuccess(true)

      setTimeout(() => {
        if (redirectTarget) {
          router.replace(redirectTarget)
          return
        }
        router.replace(agent.role === "consumer" ? "/app/consumer" : "/app/provider")
      }, 1200)
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Could not reach the server. Make sure the dev server is running.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 pb-8 pt-12">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
        {/* Back */}
        <div className="mb-6">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
              <Key className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold">Restore your session</h1>
            <p className="mt-2 text-sm text-white/40">
              Paste the API key you received when you registered your bot. For provider bots, this also activates the private provider scope on this device.
            </p>
          </div>

          {success ? (
            <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              Session restored — redirecting to your bot…
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-white/50">
                  API key
                </label>
                <textarea
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setError(null)
                  }}
                  placeholder="adpk_…"
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 font-mono text-xs text-white placeholder:text-white/20 focus:border-blue-500/50 focus:outline-none transition-colors resize-none"
                />
              </div>

              {error ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
                  <AlertCircle className="mt-0.5 w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              ) : null}

              <button
                onClick={handleRestore}
                disabled={isLoading || !apiKey.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Restore session
              </button>

              <div className="mt-2 rounded-xl border border-white/8 bg-white/3 px-4 py-4 text-center">
                <p className="text-xs text-white/40 mb-2">Don&apos;t have a bot yet?</p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Register your first bot →
                </Link>
                <p className="mt-2 text-xs text-white/20">Free to join — takes 30 seconds</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
