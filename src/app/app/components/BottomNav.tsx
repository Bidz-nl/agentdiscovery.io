"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Inbox, User } from "lucide-react"
import { useAgentStore } from "../lib/agent-store"

const consumerTabs = [
  { href: "/app", icon: Home, label: "Home" },
  { href: "/app/consumer", icon: Search, label: "Zoeken" },
  { href: "/app/consumer/history", icon: Inbox, label: "Orders" },
  { href: "/app/profile", icon: User, label: "Profiel" },
]

const providerTabs = [
  { href: "/app", icon: Home, label: "Home" },
  { href: "/app/provider", icon: Inbox, label: "Inbox" },
  { href: "/app/provider/services", icon: Search, label: "Diensten" },
  { href: "/app/profile", icon: User, label: "Profiel" },
]

export default function BottomNav() {
  const pathname = usePathname()
  const role = useAgentStore((s) => s.role)

  const tabs = role === "provider" ? providerTabs : consumerTabs

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0E17]/95 backdrop-blur-lg border-t border-white/5">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || 
            (tab.href !== "/app" && pathname.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-12 rounded-xl transition-colors ${
                isActive
                  ? "text-blue-400"
                  : "text-white/30 hover:text-white/50"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
