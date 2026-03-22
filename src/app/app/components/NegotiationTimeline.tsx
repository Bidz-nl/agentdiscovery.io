"use client"

import { Check, Loader2, Clock, MessageSquare, HandMetal } from "lucide-react"
import type { Negotiation } from "../lib/adp-client"
import { getNegotiationLifecycle } from "@/lib/adp-v2/negotiation-lifecycle"

interface NegotiationTimelineProps {
  negotiation: Negotiation
}

const statusSteps = [
  { key: "sent", label: "Quote requested" },
  { key: "received", label: "Provider response" },
  { key: "decision", label: "Decision" },
  { key: "done", label: "Delivery" },
]

function getStepStatus(negotiation: Negotiation, stepKey: string) {
  const lifecycle = getNegotiationLifecycle(negotiation)
  const stepIndex = statusSteps.findIndex((s) => s.key === stepKey)

  if (lifecycle.isClosedFailed) {
    if (stepIndex <= 2) return stepIndex <= 1 ? "done" : "failed"
    return "failed"
  }

  if (lifecycle.isDeliveryOpen) {
    if (stepIndex <= 2) return "done"
    return "active"
  }

  if (lifecycle.isAwaitingConsumer) {
    if (stepIndex <= 1) return "done"
    if (stepIndex === 2) return "waiting"
    return "pending"
  }

  if (lifecycle.isAwaitingProvider) {
    if (stepIndex === 0) return "done"
    if (stepIndex === 1) return "active"
    return "pending"
  }
  return "pending"
}

export default function NegotiationTimeline({ negotiation }: NegotiationTimelineProps) {
  const transcript = negotiation.transcript ?? []

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

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-white/30 font-medium uppercase tracking-wider">Negotiation</p>
          {transcript.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 text-sm">
              <MessageSquare className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" />
              <div>
                <span className="text-white/50">{entry.by === negotiation.initiatorDid ? "You" : "Provider"}: </span>
                <span className="text-white/70">
                  {entry.action === "accept" && "Accepted"}
                  {entry.action === "reject" && "Rejected"}
                  {entry.action === "counter" && typeof entry.price === "number" && `Counter-offer: €${(entry.price / 100).toFixed(2)}`}
                  {entry.action === "propose" && typeof entry.price === "number" && `Proposal: €${(entry.price / 100).toFixed(2)}`}
                  {entry.action === "delivery_offer" && "Sent an offer"}
                  {entry.action === "delivery_reply" && "Replied to the offer"}
                </span>
                {entry.message && <p className="text-white/30 text-xs mt-0.5">{entry.message}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
