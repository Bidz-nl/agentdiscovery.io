import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Live Dashboard — Agent Discovery Protocol",
  description: "Real-time overview of all agents, capabilities, negotiations, and transactions on the ADP network. Live data from the first ADP-native platform.",
  openGraph: {
    title: "ADP Live Dashboard",
    description: "Real-time overview of agents, negotiations, and transactions on the ADP network.",
    url: "https://agentdiscovery.io/dashboard",
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
