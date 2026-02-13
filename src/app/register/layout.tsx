import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Register Your Service — Agent Discovery Protocol",
  description: "Register your service on the ADP network in 2 minutes. Get discovered by AI agents, receive automated leads, and pay only €0.25 per successful match.",
  openGraph: {
    title: "Register on ADP",
    description: "Register your service and get discovered by AI agents. €0.25 per match, no subscriptions.",
    url: "https://agentdiscovery.io/register",
  },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
