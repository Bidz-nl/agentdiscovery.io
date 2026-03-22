"use client"

import { useRouter } from "next/navigation"
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useAgentStore } from "../lib/agent-store"
import type { SavedBot } from "../lib/agent-store"
import BotAvatar from "./BotAvatar"

function roleBadge(role: SavedBot["role"]) {
  if (role === "provider") return "Provider"
  if (role === "consumer") return "Consumer"
  return "—"
}

export default function BotSwitcher() {
  const router = useRouter()
  const { did, name, savedBots, switchBot, removeSavedBot } = useAgentStore()
  const [open, setOpen] = useState(false)

  const otherBots = savedBots.filter((b) => b.did !== did)
  const currentBot = savedBots.find((b) => b.did === did)

  const handleSwitch = (targetDid: string) => {
    switchBot(targetDid)
    setOpen(false)
    router.push("/app")
  }

  const handleRemove = (e: React.MouseEvent, targetDid: string) => {
    e.stopPropagation()
    removeSavedBot(targetDid)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10"
      >
        <BotAvatar seed={did || currentBot?.name || "bot"} size={28} className="shrink-0 border border-white/10" />
        <span className="max-w-[100px] truncate font-medium text-white">
          {currentBot?.name || name || "Your bot"}
        </span>
        {savedBots.length > 1 && (
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
            {savedBots.length}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-2xl border border-white/10 bg-[#0d1a35] shadow-xl shadow-black/50">
            <div className="px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider text-white/30">
              Your bots
            </div>

            {savedBots.map((bot) => {
              const isActive = bot.did === did
              return (
                <button
                  key={bot.did}
                  onClick={() => !isActive && handleSwitch(bot.did)}
                  disabled={isActive}
                  className={`group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? "cursor-default"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className={`shrink-0 rounded-lg overflow-hidden ring-2 ${
                    isActive ? "ring-green-500/40" : "ring-white/10"
                  }`}>
                    <BotAvatar seed={bot.did || bot.name} size={32} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm font-medium ${isActive ? "text-white" : "text-white/70"}`}>
                      {bot.name}
                    </div>
                    <div className="text-[10px] text-white/30">{roleBadge(bot.role)}</div>
                  </div>
                  {isActive ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
                  ) : (
                    <button
                      onClick={(e) => handleRemove(e, bot.did)}
                      className="hidden shrink-0 rounded p-0.5 text-white/20 transition-colors hover:text-red-400 group-hover:inline-flex"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </button>
              )
            })}

            {savedBots.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-white/30">
                No saved bots yet
              </div>
            )}

            <div className="border-t border-white/8 px-3 py-2">
              <button
                onClick={() => { setOpen(false); router.push("/app/restore") }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
              >
                <Plus className="h-3.5 w-3.5" />
                Add bot with API key
              </button>
              <button
                onClick={() => { setOpen(false); router.push("/register") }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
              >
                <Plus className="h-3.5 w-3.5" />
                Register a new bot
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
