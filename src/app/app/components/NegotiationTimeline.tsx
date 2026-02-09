"use client"

import { Check, Loader2, Clock, MessageSquare, HandMetal } from "lucide-react"
import type { Negotiation } from "../lib/adp-client"

interface NegotiationTimelineProps {
  negotiation: Negotiation
}

const statusSteps = [
  { key: "sent", label: "Offerte aangevraagd" },
  { key: "received", label: "Offerte ontvangen" },
  { key: "decision", label: "Jouw keuze" },
  { key: "done", label: "Afgerond" },
]

function getStepStatus(negotiation: Negotiation, stepKey: string) {
  const status = negotiation.status
  const stepIndex = statusSteps.findIndex((s) => s.key === stepKey)

  // Deal is done (accepted or completed) → all green
  if (status === "completed" || status === "accepted") {
    return "done"
  }
  // Deal rejected/cancelled
  if (status === "rejected" || status === "cancelled") {
    if (stepIndex <= 2) return stepIndex <= 1 ? "done" : "failed"
    return "failed"
  }
  // Proposal received → consumer needs to decide
  if (status === "proposal_sent" || status === "counter_proposed") {
    if (stepIndex <= 1) return "done"
    if (stepIndex === 2) return "waiting" // consumer must act
    return "pending"
  }
  // Still waiting for provider response
  if (status === "pending" || status === "initiated") {
    if (stepIndex === 0) return "done"
    if (stepIndex === 1) return "active"
    return "pending"
  }
  return "pending"
}

export default function NegotiationTimeline({ negotiation }: NegotiationTimelineProps) {
  return (
    <div className="space-y-0">
      {statusSteps.map((step, i) => {
        const stepStatus = getStepStatus(negotiation, step.key)
        return (
          <div key={step.key} className="flex gap-3">
            {/* Line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  stepStatus === "done"
                    ? "bg-green-500/10 border border-green-500/30"
                    : stepStatus === "active"
                    ? "bg-blue-500/10 border border-blue-500/30"
                    : stepStatus === "waiting"
                    ? "bg-amber-500/10 border border-amber-500/30 animate-pulse"
                    : stepStatus === "failed"
                    ? "bg-red-500/10 border border-red-500/30"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {stepStatus === "done" ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : stepStatus === "active" ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : stepStatus === "waiting" ? (
                  <HandMetal className="w-4 h-4 text-amber-400" />
                ) : stepStatus === "failed" ? (
                  <span className="text-red-400 text-xs">✕</span>
                ) : (
                  <Clock className="w-4 h-4 text-white/20" />
                )}
              </div>
              {i < statusSteps.length - 1 && (
                <div
                  className={`w-px h-8 ${
                    stepStatus === "done" ? "bg-green-500/30" : "bg-white/5"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-6 pt-1">
              <p
                className={`text-sm font-medium ${
                  stepStatus === "done"
                    ? "text-white/70"
                    : stepStatus === "active"
                    ? "text-blue-400"
                    : stepStatus === "waiting"
                    ? "text-amber-400"
                    : "text-white/20"
                }`}
              >
                {step.label}
              </p>
            </div>
          </div>
        )
      })}

      {/* Rounds */}
      {negotiation.rounds && negotiation.rounds.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-white/30 font-medium uppercase tracking-wider">Onderhandeling</p>
          {negotiation.rounds.map((round, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <MessageSquare className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" />
              <div>
                <span className="text-white/50">{round.by === negotiation.initiatorDid ? "Jij" : "Aanbieder"}: </span>
                <span className="text-white/70">
                  {round.action === "accept" && "Geaccepteerd"}
                  {round.action === "reject" && "Afgewezen"}
                  {round.action === "counter" && `Tegenvoorstel: €${(round.price / 100).toFixed(2)}`}
                  {round.action === "propose" && `Voorstel: €${(round.price / 100).toFixed(2)}`}
                </span>
                {round.message && <p className="text-white/30 text-xs mt-0.5">{round.message}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
