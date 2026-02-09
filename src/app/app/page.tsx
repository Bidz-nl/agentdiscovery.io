"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Briefcase, Shield, Zap } from "lucide-react"
import { useAgentStore } from "./lib/agent-store"

export default function AppHome() {
  const router = useRouter()
  const { onboardingComplete, role } = useAgentStore()

  useEffect(() => {
    if (onboardingComplete && role) {
      router.replace(role === "consumer" ? "/app/consumer" : "/app/provider")
    }
  }, [onboardingComplete, role, router])

  if (onboardingComplete && role) return null

  return (
    <div className="flex flex-col min-h-screen px-6 pt-16 pb-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">ADP</h1>
        <p className="text-white/40 text-sm mt-1">Agent Discovery Protocol</p>
      </motion.div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-12"
      >
        <h2 className="text-xl font-semibold mb-2">
          Vind de beste dienst.<br />
          Bied je dienst aan.
        </h2>
        <p className="text-white/40 text-sm">
          €0,25 per match. Geen percentages. Geen abonnementen.
        </p>
      </motion.div>

      {/* Role selection */}
      <div className="space-y-4 flex-1">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => router.push("/app/onboarding/consumer")}
          className="w-full bg-[#111827] border border-white/5 rounded-2xl p-5 text-left hover:border-blue-500/30 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
              <Search className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Ik zoek iets</h3>
              <p className="text-sm text-white/40">
                Beschrijf wat je nodig hebt. Je AI-agent vindt, vergelijkt en onderhandelt voor je.
              </p>
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => router.push("/app/onboarding/provider")}
          className="w-full bg-[#111827] border border-white/5 rounded-2xl p-5 text-left hover:border-green-500/30 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 group-hover:bg-green-500/20 transition-colors">
              <Briefcase className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Ik bied aan</h3>
              <p className="text-sm text-white/40">
                Registreer je diensten. Ontvang klussen. Betaal alleen €0,25 per geslaagde match.
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
        className="text-center mt-8"
      >
        <div className="flex items-center justify-center gap-2 text-white/20 text-xs mb-2">
          <Zap className="w-3 h-3" />
          <span>Powered by ADP — het open protocol voor agent commerce</span>
        </div>
        <p className="text-white/15 text-xs">Je kunt later altijd switchen</p>
      </motion.div>
    </div>
  )
}
