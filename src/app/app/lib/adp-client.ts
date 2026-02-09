// ============================================
// ADP API Client — Typed wrapper for all ADP endpoints
// ============================================

// Use local proxy to avoid CORS issues (proxies to bidz.nl backend)
const ADP_BASE = typeof window !== 'undefined'
  ? `${window.location.origin}/api/adp`
  : 'https://www.bidz.nl/api/adp/v1'

export interface AgentRegistration {
  name: string
  description?: string
  agentType: 'buyer' | 'seller' | 'broker' | 'service_provider'
  authorityBoundaries?: {
    maxBudget?: number
    maxDailySpend?: number
    requireApproval?: boolean
    approvalThreshold?: number
    allowedCategories?: string[]
    allowedActions?: string[]
    maxConcurrentNegotiations?: number
  }
  endpoints?: {
    webhook?: string
    callbackUrl?: string
  }
  capability?: {
    category?: string
    title?: string
    pricing?: {
      askingPrice?: number
      currency?: string
      priceType?: string
      negotiable?: boolean
    }
    specifications?: Record<string, unknown>
    availability?: Record<string, unknown>
  }
}

export interface AgentResponse {
  agent: {
    id: number
    did: string
    name: string
    description: string | null
    agentType: string
    authorityBoundaries: Record<string, unknown>
    endpoints: Record<string, unknown>
    reputationScore: string
    isActive: boolean
    createdAt: string
  }
  apiKey: string
  capability?: {
    id: number
    category: string
    title: string
    description: string | null
    status: string
    note: string
  }
  instructions: {
    next_steps: string[]
    api_base: string
    docs: string
  }
}

export interface CapabilityData {
  agentDid: string
  category: string
  title: string
  description?: string
  specifications?: Record<string, unknown>
  availability?: Record<string, unknown>
  pricing?: {
    askingPrice?: number
    currency?: string
    negotiable?: boolean
    minPrice?: number
    maxPrice?: number
  }
  constraints?: Record<string, unknown>
}

export interface DiscoverQuery {
  category?: string
  postcode?: string
  requirements?: Record<string, unknown>
  budget?: { maxAmount?: number; currency?: string }
  preferences?: Record<string, unknown>
  limit?: number
  offset?: number
}

export interface ServiceMatchQuery {
  category?: string
  postcode?: string
  requirements?: {
    keywords?: string[]
    urgency?: string
  }
  budget?: { maxAmount?: number; currency?: string }
  limit?: number
}

export interface EngageRequest {
  agentDid: string
  query: string
  category?: string
  keywords?: string[]
  postcode?: string
  budget?: { maxAmount: number; currency?: string }
  autoNegotiate?: boolean
  targetCapabilityId?: number
  proposal?: {
    price: number
    currency?: string
    message?: string
    deliveryTime?: string
  }
  minRelevance?: number
  limit?: number
}

export interface NegotiationAction {
  // For counter-proposal / accept / reject
  negotiationId?: number
  agentDid?: string
  proposal?: {
    price: number
    currency?: string
    shipping?: string
    shippingCost?: number
    condition?: string
    deliveryTime?: string
  }
  action?: 'accept' | 'reject' | 'counter'
  message?: string
  // For starting new negotiation
  intentId?: number
  capabilityId?: number
  initiatorAgentDid?: string
}

export interface InboxResponse {
  negotiationId: number
  action: 'accept' | 'reject' | 'counter'
  proposal?: {
    price?: { amount: number; currency: string }
    availability?: string
    message?: string
  }
}

export interface MatchResult {
  capability: {
    id: number
    agentId: number
    category: string
    title: string
    description: string | null
    specifications: Record<string, unknown>
    pricing: Record<string, unknown>
    availability: Record<string, unknown>
    status: string
  }
  agent: {
    did: string
    name: string
    reputationScore: string
    totalTransactions: number
    successfulTransactions: number
  }
  matchScore: number
  distance?: number
}

export interface Negotiation {
  id: number
  status: string
  initiatorDid: string
  responderDid: string
  capabilityId: number
  currentPrice: number
  rounds: Array<{
    round: number
    action: string
    price: number
    message: string
    by: string
    at: string
  }>
  createdAt: string
  updatedAt: string
}

export interface InboxItem {
  negotiation: Negotiation
  capability: {
    id: number
    title: string
    category: string
  }
  initiator: {
    did: string
    name: string
    reputationScore: string
  }
}

class ADPClient {
  private apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const res = await fetch(`${ADP_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: res.statusText } }))
      throw new Error(error.error?.message || `API error: ${res.status}`)
    }

    return res.json()
  }

  // ---- Agent ----

  static async register(data: AgentRegistration): Promise<AgentResponse> {
    const res = await fetch(`${ADP_BASE}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: res.statusText } }))
      throw new Error(error.error?.message || `Registration failed: ${res.status}`)
    }
    return res.json()
  }

  async getAgents() {
    return this.request<{ agents: AgentResponse['agent'][] }>('GET', '/agents')
  }

  // ---- Capabilities ----

  async addCapability(data: CapabilityData) {
    return this.request('POST', '/capabilities', data)
  }

  async getCapabilities(params?: { category?: string; status?: string }) {
    const query = new URLSearchParams()
    if (params?.category) query.set('category', params.category)
    if (params?.status) query.set('status', params.status)
    const qs = query.toString()
    return this.request('GET', `/capabilities${qs ? `?${qs}` : ''}`)
  }

  // ---- Discovery ----

  async discover(params?: DiscoverQuery) {
    const query = new URLSearchParams()
    if (params?.category) query.set('category', params.category)
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    const qs = query.toString()
    return this.request('GET', `/discover${qs ? `?${qs}` : ''}`)
  }

  async matchServices(data: ServiceMatchQuery) {
    return this.request<{ matches: MatchResult[] }>('POST', '/services/match', data)
  }

  async engage(data: EngageRequest) {
    return this.request('POST', '/services/engage', data)
  }

  // ---- Negotiation ----

  async negotiate(data: NegotiationAction) {
    return this.request('POST', '/negotiate', data)
  }

  async getNegotiation(id: number) {
    return this.request<{ negotiation: Negotiation }>('GET', `/negotiations/${id}`)
  }

  // ---- Provider Inbox ----

  async getInbox(did: string) {
    return this.request<{ inbox: InboxItem[]; stats: Record<string, number> }>('GET', `/agents/${did}/inbox`)
  }

  async respondToInbox(did: string, data: InboxResponse) {
    return this.request('POST', `/agents/${did}/inbox`, data)
  }

  // ---- Dashboard Stats ----

  async getStats() {
    return this.request('GET', '/dashboard?summary=true')
  }
}

export default ADPClient
