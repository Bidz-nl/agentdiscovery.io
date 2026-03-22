"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Inbox, User, Globe } from "lucide-react"
import { useAgentStore } from "../lib/agent-store"
import BotSwitcher from "./BotSwitcher"

const consumerTabs = [
  { href: "/app", icon: Home, label: "Home" },
  { href: "/app/consumer", icon: Search, label: "Search" },
  { href: "/app/consumer/history", icon: Inbox, label: "Orders" },
  { href: "/app/profile", icon: User, label: "Profile" },
  { href: "/", icon: Globe, label: "Website" },
]

const providerTabs = [
  { href: "/app", icon: Home, label: "Home" },
  { href: "/app/provider", icon: Inbox, label: "Bot" },
  { href: "/app/provider/services", icon: Search, label: "Capabilities" },
  { href: "/app/profile", icon: User, label: "Profile" },
  { href: "/", icon: Globe, label: "Website" },
]

export default function BottomNav() {
  const pathname = usePathname()
  const role = useAgentStore((s) => s.role)

  const tabs = role === "provider" ? providerTabs : consumerTabs

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1a35] border-t-2 border-blue-500/50 shadow-[0_-8px_32px_rgba(59,130,246,0.2),0_-2px_8px_rgba(0,0,0,0.8)]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-2 md:px-4">
        <div className="flex flex-1 items-center justify-around md:justify-center md:gap-3">
          {tabs.map((tab) => {
            const isActive = tab.href !== "/" && (pathname === tab.href ||
              (tab.href !== "/app" && pathname.startsWith(tab.href)))
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex h-12 w-16 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors md:w-24 ${
                  isActive
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-white/60 hover:text-white/90 hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px w-8 h-0.5 rounded-full bg-blue-400" />
                )}
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            )
          })}
        </div>
        <div className="ml-2 shrink-0">
          <BotSwitcher />
        </div>
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
