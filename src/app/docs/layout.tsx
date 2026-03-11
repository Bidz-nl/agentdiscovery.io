import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Documentation — Agent Discovery Protocol",
  description: "ADP v2 documentation hub with overview, protocol specification, architecture notes, and quickstart resources.",
  openGraph: {
    title: "ADP Documentation",
    description: "Protocol overview, specification, architecture, and quickstart resources for ADP v2.",
    url: "https://agentdiscovery.io/docs",
  },
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
