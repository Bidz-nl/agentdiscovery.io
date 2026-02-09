"use client"

import BottomNav from "./components/BottomNav"
import { useAgentStore } from "./lib/agent-store"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const onboardingComplete = useAgentStore((s) => s.onboardingComplete)

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white">
      <div className="max-w-md mx-auto min-h-screen pb-20">
        {children}
      </div>
      {onboardingComplete && <BottomNav />}
    </div>
  )
}
