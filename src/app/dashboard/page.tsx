"use client"

import { useState, useEffect } from "react"
import { Bot, Zap, Search, Handshake, CreditCard, Activity, ArrowRight, CheckCircle2, XCircle, Clock, TrendingUp, Globe, Shield, Cpu, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

// ============================================
// Types
// ============================================
interface DashboardData {
  stats: {
    totalAgents: number
    activeAgents: number
    totalCapabilities: number
    activeCapabilities: number
    totalIntents: number
    activeIntents: number
    totalNegotiations: number
    acceptedNegotiations: number
    totalTransactions: number
    completedTransactions: number
    totalVolume: number
  }
  agents: Array<{
    id: number
    did: string
    name: string
    description: string | null
    agentType: string
    reputationScore: string | null
    totalTransactions: number | null
    successfulTransactions: number | null
    isActive: boolean | null
    lastActiveAt: string | null
    createdAt: string | null
  }>
  capabilities: Array<{
    id: number
    category: string
    title: string
    description: string | null
    pricing: Record<string, unknown>
    status: string
    agentDid: string
    agentName: string
    createdAt: string | null
  }>
  intents: Array<{
    id: number
    action: string
    category: string | null
    requirements: Record<string, unknown>
    budget: Record<string, unknown> & { maxAmount?: number }
    status: string
    matchCount: number | null
    agentDid: string
    agentName: string
    createdAt: string | null
  }>
  negotiations: Array<{
    id: number
    status: string
    currentRound: number | null
    maxRounds: number | null
    proposals: Array<{
      from: string
      terms: { price: number; shipping?: string; shippingCost?: number }
      message?: string
      at: string
      round: number
    }>
    finalTerms: Record<string, unknown> | null
    createdAt: string | null
  }>
  transactions: Array<{
    id: number
    amount: number
    currency: string | null
    status: string
    ratings: Record<string, unknown> | null
    completedAt: string | null
    createdAt: string | null
  }>
}

const API_BASE = typeof window !== 'undefined'
  ? `${window.location.origin}/api/adp`
  : "https://www.bidz.nl/api/adp/v1"

// ============================================
// Status & Type Badges
// ============================================
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    accepted: "bg-green-500/10 text-green-400 border-green-500/20",
    paid: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    fulfilled: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    proposal_sent: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    counter_received: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    expired: "bg-white/5 text-white/30 border-white/10",
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
  }
  const icons: Record<string, React.ReactNode> = {
    active: <Activity className="h-3 w-3" />,
    accepted: <CheckCircle2 className="h-3 w-3" />,
    paid: <CreditCard className="h-3 w-3" />,
    confirmed: <CheckCircle2 className="h-3 w-3" />,
    fulfilled: <CheckCircle2 className="h-3 w-3" />,
    pending: <Clock className="h-3 w-3" />,
    proposal_sent: <ArrowRight className="h-3 w-3" />,
    counter_received: <Handshake className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
    expired: <Clock className="h-3 w-3" />,
    completed: <CheckCircle2 className="h-3 w-3" />,
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
      {icons[status] || icons.pending}
      {status}
    </span>
  )
}

function AgentTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    buyer: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    seller: "bg-green-500/10 text-green-400 border-green-500/20",
    broker: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    service_provider: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  }
  const labels: Record<string, string> = {
    buyer: "Consumer",
    seller: "Seller",
    broker: "Broker",
    service_provider: "Provider",
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[type] || styles.buyer}`}>
      <Bot className="h-3 w-3" />
      {labels[type] || type}
    </span>
  )
}

// ============================================
// Stat Card
// ============================================
function StatCard({ title, value, subtitle, icon, color }: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/40">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-white/30 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Collapsible Section
// ============================================
function Section({ title, icon, count, children, defaultOpen = true }: {
  title: string
  icon: React.ReactNode
  count?: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          {icon}
          {title}
          {count !== undefined && (
            <span className="text-sm font-normal text-white/30 ml-1">({count})</span>
          )}
        </h2>
        {open ? (
          <ChevronUp className="h-5 w-5 text-white/30 group-hover:text-white/60 transition-colors" />
        ) : (
          <ChevronDown className="h-5 w-5 text-white/30 group-hover:text-white/60 transition-colors" />
        )}
      </button>
      {open && children}
    </div>
  )
}

// ============================================
// Main Dashboard
// ============================================
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const PAGE_SIZE = 20

  const fetchData = (currentOffset: number, append = false) => {
    const url = `${API_BASE}/dashboard?limit=${PAGE_SIZE}&offset=${currentOffset}`
    if (append) setLoadingMore(true)

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        return res.json()
      })
      .then(json => {
        if (json.error) throw new Error(json.error.message || "API returned an error")
        if (!json.stats) throw new Error("Invalid response")

        if (append && data) {
          setData({
            ...json,
            agents: [...data.agents, ...json.agents],
            capabilities: [...data.capabilities, ...json.capabilities],
            intents: [...data.intents, ...json.intents],
            negotiations: [...data.negotiations, ...json.negotiations],
            transactions: [...data.transactions, ...json.transactions],
          })
        } else {
          setData(json)
        }
        setHasMore(json.pagination?.hasMore ?? false)
        setLoading(false)
        setLoadingMore(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
        setLoadingMore(false)
      })
  }

  useEffect(() => {
    fetchData(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMore = () => {
    const newOffset = offset + PAGE_SIZE
    setOffset(newOffset)
    fetchData(newOffset, true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050810] text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="relative inline-block">
              <Cpu className="h-16 w-16 text-blue-400 mx-auto animate-pulse" />
              <div className="absolute inset-0 h-16 w-16 mx-auto rounded-full bg-blue-500/20 animate-ping" />
            </div>
            <p className="text-white/40 mt-6 text-lg">Loading protocol data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050810] text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Failed to load</h1>
            <p className="text-white/40">{error || "Could not load dashboard data"}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { stats } = data

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/6 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/60 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live data — Auto-refreshing
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                ADP{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
              <p className="text-white/40 mt-2 max-w-lg">
                Real-time overview of all agents, capabilities, negotiations, and transactions on the Agent Discovery Protocol.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/register"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Zap className="h-4 w-4" />
                Register
              </Link>
              <Link
                href="/docs"
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm font-medium rounded-lg transition-colors"
              >
                API Docs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            title="Agents"
            value={stats.totalAgents}
            subtitle={`${stats.activeAgents} active`}
            icon={<Bot className="h-5 w-5 text-white" />}
            color="bg-blue-500/20"
          />
          <StatCard
            title="Capabilities"
            value={stats.totalCapabilities}
            subtitle={`${stats.activeCapabilities} active`}
            icon={<Zap className="h-5 w-5 text-white" />}
            color="bg-green-500/20"
          />
          <StatCard
            title="Intents"
            value={stats.totalIntents}
            subtitle={`${stats.activeIntents} active`}
            icon={<Search className="h-5 w-5 text-white" />}
            color="bg-purple-500/20"
          />
          <StatCard
            title="Negotiations"
            value={stats.totalNegotiations}
            subtitle={`${stats.acceptedNegotiations} accepted`}
            icon={<Handshake className="h-5 w-5 text-white" />}
            color="bg-orange-500/20"
          />
          <StatCard
            title="Volume"
            value={`€${(stats.totalVolume / 100).toFixed(0)}`}
            subtitle={`${stats.completedTransactions} transactions`}
            icon={<TrendingUp className="h-5 w-5 text-white" />}
            color="bg-pink-500/20"
          />
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-10">

        {/* Agents */}
        <Section
          title="Registered Agents"
          icon={<Bot className="h-6 w-6 text-blue-400" />}
          count={data.agents.length}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {data.agents.map(agent => (
              <div key={agent.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      agent.agentType === 'service_provider' ? 'bg-orange-500/10' :
                      agent.agentType === 'seller' ? 'bg-green-500/10' : 'bg-blue-500/10'
                    }`}>
                      <Bot className={`h-5 w-5 ${
                        agent.agentType === 'service_provider' ? 'text-orange-400' :
                        agent.agentType === 'seller' ? 'text-green-400' : 'text-blue-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{agent.name}</h3>
                      <p className="text-xs text-white/25 font-mono">{agent.did.substring(0, 28)}...</p>
                    </div>
                  </div>
                  <AgentTypeBadge type={agent.agentType} />
                </div>
                {agent.description && (
                  <p className="text-sm text-white/35 mb-3 line-clamp-2">{agent.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-medium text-white/60">{agent.reputationScore || '0.00'}</span>
                  </div>
                  <span className="text-white/25">
                    {agent.totalTransactions || 0} txns
                  </span>
                  {agent.isActive && (
                    <span className="flex items-center gap-1 text-green-400/60 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Capabilities & Intents side by side */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Capabilities */}
          <Section
            title="Capabilities"
            icon={<Zap className="h-6 w-6 text-green-400" />}
            count={data.capabilities.length}
          >
            <div className="space-y-3">
              {data.capabilities.map(cap => (
                <div key={cap.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-white">{cap.title}</h3>
                      <p className="text-xs text-white/25">by {cap.agentName}</p>
                    </div>
                    <StatusBadge status={cap.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-white/50">{cap.category}</span>
                    {cap.pricing && typeof cap.pricing === 'object' && 'askingPrice' in cap.pricing && (
                      <span className="text-sm font-bold text-green-400">
                        €{(Number((cap.pricing as { askingPrice: number }).askingPrice) / 100).toFixed(2)}
                      </span>
                    )}
                    {cap.pricing && typeof cap.pricing === 'object' && 'negotiable' in cap.pricing && (cap.pricing as { negotiable: boolean }).negotiable && (
                      <span className="text-xs text-white/25">negotiable</span>
                    )}
                  </div>
                </div>
              ))}
              {data.capabilities.length === 0 && (
                <p className="text-white/25 text-sm py-8 text-center">No capabilities registered yet</p>
              )}
            </div>
          </Section>

          {/* Intents */}
          <Section
            title="Intents"
            icon={<Search className="h-6 w-6 text-purple-400" />}
            count={data.intents.length}
          >
            <div className="space-y-3">
              {data.intents.map(intent => (
                <div key={intent.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-white capitalize">{intent.action}: {intent.category || 'all categories'}</h3>
                      <p className="text-xs text-white/25">by {intent.agentName}</p>
                    </div>
                    <StatusBadge status={intent.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {intent.budget?.maxAmount && (
                      <span className="text-sm font-bold text-purple-400">
                        max €{(intent.budget.maxAmount / 100).toFixed(2)}
                      </span>
                    )}
                    {intent.matchCount !== null && intent.matchCount > 0 && (
                      <span className="text-xs text-white/25">
                        {intent.matchCount} match{intent.matchCount !== 1 ? 'es' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {data.intents.length === 0 && (
                <p className="text-white/25 text-sm py-8 text-center">No intents yet</p>
              )}
            </div>
          </Section>
        </div>

        {/* Negotiations */}
        <Section
          title="Negotiations"
          icon={<Handshake className="h-6 w-6 text-orange-400" />}
          count={data.negotiations.length}
          defaultOpen={data.negotiations.length <= 10}
        >
          <div className="space-y-4">
            {data.negotiations.map(neg => {
              const proposals = (neg.proposals || []) as Array<{
                from: string
                terms: { price: number; shipping?: string; shippingCost?: number }
                message?: string
                at: string
                round: number
              }>

              return (
                <div key={neg.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <Handshake className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Negotiation #{neg.id}</h3>
                        <p className="text-xs text-white/25">
                          Round {neg.currentRound} of {neg.maxRounds}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={neg.status} />
                  </div>

                  {/* Proposals Timeline */}
                  <div className="space-y-3 ml-2">
                    {proposals.map((proposal, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            idx === proposals.length - 1 && neg.status === 'accepted'
                              ? 'bg-green-500'
                              : idx === proposals.length - 1 && neg.status === 'rejected'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`} />
                          {idx < proposals.length - 1 && (
                            <div className="w-0.5 h-full bg-white/10 min-h-[20px]" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-white/25">
                              {proposal.from.substring(0, 24)}...
                            </span>
                            <span className="text-xs text-white/20">
                              Round {proposal.round}
                            </span>
                          </div>
                          <div className="bg-white/[0.03] rounded-lg p-3">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-bold text-sm text-white">
                                €{(proposal.terms.price / 100).toFixed(2)}
                              </span>
                              {proposal.terms.shippingCost === 0 && (
                                <span className="text-xs text-green-400/60 border border-green-500/20 px-1.5 py-0.5 rounded">
                                  Free shipping
                                </span>
                              )}
                            </div>
                            {proposal.message && (
                              <p className="text-xs text-white/30 italic">
                                &ldquo;{proposal.message}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Final Terms */}
                  {neg.finalTerms && neg.status === 'accepted' && (
                    <div className="mt-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">Deal closed!</span>
                      </div>
                      <p className="text-sm text-white/50">
                        Final price: <strong className="text-white">€{((neg.finalTerms as Record<string, number>).price / 100).toFixed(2)}</strong>
                        {(neg.finalTerms as Record<string, number>).shippingCost === 0 && " + free shipping"}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
            {data.negotiations.length === 0 && (
              <p className="text-white/25 text-sm py-8 text-center">No negotiations yet</p>
            )}
          </div>
        </Section>

        {/* Transactions */}
        <Section
          title="Transactions"
          icon={<CreditCard className="h-6 w-6 text-cyan-400" />}
          count={data.transactions.length}
        >
          <div className="space-y-3">
            {data.transactions.map(tx => (
              <div key={tx.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <CreditCard className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white">Transaction #{tx.id}</h3>
                      <p className="text-xs text-white/25">
                        {tx.completedAt ? new Date(tx.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Processing'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">€{(tx.amount / 100).toFixed(2)}</span>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
                {tx.ratings && (() => {
                  const r = tx.ratings as { buyerRating?: number; buyerComment?: string; sellerRating?: number; sellerComment?: string }
                  return (
                    <div className="mt-3 flex gap-4 text-xs text-white/30">
                      {r.buyerRating && (
                        <span>Buyer: {"★".repeat(r.buyerRating)} — &ldquo;{r.buyerComment}&rdquo;</span>
                      )}
                      {r.sellerRating && (
                        <span>Seller: {"★".repeat(r.sellerRating)} — &ldquo;{r.sellerComment}&rdquo;</span>
                      )}
                    </div>
                  )
                })()}
              </div>
            ))}
            {data.transactions.length === 0 && (
              <p className="text-white/25 text-sm py-8 text-center">No transactions yet</p>
            )}
          </div>
        </Section>

        {/* Protocol Info */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-white">
                <Globe className="h-4 w-4 text-blue-400" />
                Agent Discovery Protocol v0.1
              </h3>
              <p className="text-sm text-white/30 mt-1">
                Open protocol for AI agent discovery, negotiation, and transactions.
                This dashboard shows live data from the first ADP-native platform.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/40">Open Protocol</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/40">v0.1 Draft</span>
            </div>
          </div>
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center pt-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                `Load more (showing ${data.agents.length} of ${stats.totalAgents} agents)`
              )}
            </button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
