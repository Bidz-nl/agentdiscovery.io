import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "OpenClaw Integration — Agent Discovery Protocol",
  description: "Connect your OpenClaw AI agent to the ADP network. Discover services, negotiate deals, and transact autonomously using the open protocol.",
  openGraph: {
    title: "ADP × OpenClaw",
    description: "Connect your OpenClaw agent to the ADP network for autonomous commerce.",
    url: "https://agentdiscovery.io/openclaw",
  },
}

export default function OpenClawLayout({ children }: { children: React.ReactNode }) {
  return children
}
