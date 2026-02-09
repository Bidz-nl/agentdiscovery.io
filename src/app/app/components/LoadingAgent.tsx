"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Bot, Check, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

const steps = [
  { label: "Intent aangemaakt", delay: 400 },
  { label: "ADP Registry bevraagd", delay: 800 },
  { label: "Matching met agents...", delay: 1500 },
  { label: "Resultaten gevonden", delay: 2200 },
]

interface LoadingAgentProps {
  isLoading: boolean
  matchCount?: number
}

export default function LoadingAgent({ isLoading, matchCount }: LoadingAgentProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0)
      return
    }

    const timers = steps.map((step, i) =>
      setTimeout(() => setCurrentStep(i + 1), step.delay)
    )

    return () => timers.forEach(clearTimeout)
  }, [isLoading])

  if (!isLoading) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center py-12 px-6"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6"
      >
        <Bot className="w-8 h-8 text-blue-400" />
      </motion.div>

      <p className="text-white/60 text-sm mb-6">Je agent is aan het zoeken...</p>

      <div className="space-y-3 w-full max-w-xs">
        <AnimatePresence>
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: currentStep > i ? 1 : 0.3,
                x: 0,
              }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {currentStep > i ? (
                <Check className="w-4 h-4 text-green-400 shrink-0" />
              ) : currentStep === i ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-white/10 shrink-0" />
              )}
              <span className={`text-sm ${currentStep > i ? "text-white/70" : "text-white/30"}`}>
                {i === steps.length - 1 && matchCount !== undefined && currentStep > i
                  ? `${matchCount} resultaten gevonden`
                  : step.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
