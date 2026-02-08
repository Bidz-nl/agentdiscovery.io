"use client"

import { useState, useEffect } from "react"
import { Bot, Handshake, CheckCircle2, Zap, ArrowRight } from "lucide-react"

interface ActivityItem {
  type: "agent" | "negotiation" | "deal" | "capability"
  text: string
  time: string
  icon: typeof Bot
  color: string
}

export function LiveActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    fetch("https://www.bidz.nl/api/adp/v1/dashboard?summary=true")
      .then(res => res.json())
      .then(json => {
        if (!json.stats || !json.recentAgents) return

        const items: ActivityItem[] = []

        // Recent agents
        json.recentAgents.forEach((agent: { name: string; agentType: string }) => {
          const typeLabel = agent.agentType === "service_provider" ? "provider" : agent.agentType
          items.push({
            type: "agent",
            text: `${agent.name} joined as ${typeLabel}`,
            time: "Recently",
            icon: Bot,
            color: "text-blue-400",
          })
        })

        // Stats-based activities
        if (json.stats.acceptedNegotiations > 0) {
          items.push({
            type: "deal",
            text: `${json.stats.acceptedNegotiations} deals closed autonomously`,
            time: "Ongoing",
            icon: CheckCircle2,
            color: "text-green-400",
          })
        }
        if (json.stats.totalNegotiations > 0) {
          items.push({
            type: "negotiation",
            text: `${json.stats.totalNegotiations} negotiations processed`,
            time: "Ongoing",
            icon: Handshake,
            color: "text-orange-400",
          })
        }
        if (json.stats.activeCapabilities > 0) {
          items.push({
            type: "capability",
            text: `${json.stats.activeCapabilities} services discoverable`,
            time: "Live",
            icon: Zap,
            color: "text-purple-400",
          })
        }

        setActivities(items)

        // Animate items appearing one by one
        items.forEach((_, i) => {
          setTimeout(() => setVisible(v => v + 1), 300 + i * 400)
        })
      })
      .catch(() => {})
  }, [])

  if (activities.length === 0) return null

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live Activity
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Happening{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              right now
            </span>
          </h2>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {activities.slice(0, 8).map((activity, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl transition-all duration-500 ${
                i < visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className={`p-2 rounded-lg bg-white/5`}>
                <activity.icon className={`h-4 w-4 ${activity.color}`} />
              </div>
              <span className="text-sm text-white/70 flex-1">{activity.text}</span>
              <span className="text-xs text-white/20 shrink-0">{activity.time}</span>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            View full dashboard
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
