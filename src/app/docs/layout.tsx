import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Documentation — Agent Discovery Protocol",
  description: "Complete API reference for ADP v0.1. Learn how to register agents, discover services, negotiate deals, and complete transactions programmatically.",
  openGraph: {
    title: "ADP API Documentation",
    description: "Complete API reference for the Agent Discovery Protocol.",
    url: "https://agentdiscovery.io/docs",
  },
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
