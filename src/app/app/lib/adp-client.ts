// ============================================
// ADP API Client — Typed wrapper for all ADP endpoints
// ============================================

import type {
  CreateOwnerServiceRequest,
  OwnerServiceDetailResponse,
  OwnerServiceListResponse,
  OwnerServiceReadModel,
  UpdateOwnerServiceRequest,
} from '@/lib/owner-services'
import type {
  OwnerProviderContextResponse,
  SwitchActiveProviderRequest,
} from '@/lib/owner-private-auth'

function toNegotiationEngagePath() {
  return '/api/app/negotiations/engage'
}

function toNegotiationActionPath(negotiationId: number) {
  return `/api/app/negotiations/${negotiationId}/action`
}

function toNegotiationDetailResolverPath(negotiationId: number) {
  return `/api/app/negotiations/${negotiationId}`
}

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
  session_id?: string
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
  session_id?: string
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
  session_id?: string
  action: 'accept' | 'reject' | 'counter'
  proposal?: {
    price?: { amount: number; currency: string } | number
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
  provider?: {
    did: string
    name: string
    reputationScore: string
    totalTransactions: number
    successfulTransactions: number
  }
  agent?: {
    did: string
    name: string
    reputationScore: string
    totalTransactions: number
    successfulTransactions: number
  }
  relevanceScore?: number
  matchScore?: number
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

  private async appRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const res = await fetch(path, {
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
    const res = await fetch('/api/app/agents/register', {
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

  // ---- Capabilities ----

  async getOwnerServices() {
    return this.appRequest<OwnerServiceListResponse>('GET', '/api/app/provider/services')
  }

  async getOwnerService(serviceId: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const res = await fetch(`/api/app/provider/services/${serviceId}`, {
      method: 'GET',
      headers,
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: res.statusText } }))
      const nextError = new Error(error.error?.message || `API error: ${res.status}`) as Error & {
        status?: number
        code?: string
      }

      nextError.status = res.status
      nextError.code = error.error?.code

      throw nextError
    }

    return res.json() as Promise<OwnerServiceDetailResponse>
  }

  async createOwnerService(data: CreateOwnerServiceRequest) {
    return this.appRequest<{ service: OwnerServiceReadModel }>('POST', '/api/app/provider/services', data)
  }

  async updateOwnerService(serviceId: string, data: UpdateOwnerServiceRequest) {
    return this.appRequest<{ service: OwnerServiceReadModel }>('PATCH', `/api/app/provider/services/${serviceId}`, data)
  }

  async publishOwnerService(serviceId: string) {
    return this.appRequest<{ service: OwnerServiceReadModel }>(
      'POST',
      `/api/app/provider/services/${serviceId}/publish`
    )
  }

  async unpublishOwnerService(serviceId: string) {
    return this.appRequest<{ service: OwnerServiceReadModel }>(
      'POST',
      `/api/app/provider/services/${serviceId}/unpublish`
    )
  }

  async archiveOwnerService(serviceId: string) {
    return this.appRequest<{ service: OwnerServiceReadModel }>(
      'POST',
      `/api/app/provider/services/${serviceId}/archive`
    )
  }

  async restoreOwnerService(serviceId: string) {
    return this.appRequest<{ service: OwnerServiceReadModel }>(
      'POST',
      `/api/app/provider/services/${serviceId}/restore`
    )
  }

  async deleteOwnerService(serviceId: string) {
    return this.appRequest<{ deleted: boolean; serviceId: string }>(
      'POST',
      `/api/app/provider/services/${serviceId}/delete`
    )
  }

  async getOwnerProviderContext() {
    return this.appRequest<OwnerProviderContextResponse>('GET', '/api/app/provider/context')
  }

  async switchOwnerProviderContext(activeProviderDid: string) {
    const body: SwitchActiveProviderRequest = {
      activeProviderDid,
    }

    return this.appRequest<OwnerProviderContextResponse>('POST', '/api/app/provider/context/switch', body)
  }

  // ---- Discovery ----

  async matchServices(data: ServiceMatchQuery) {
    return this.appRequest<{ matches: MatchResult[] }>('POST', '/api/app/services/match', data)
  }

  async engage(data: EngageRequest) {
    return this.appRequest('POST', toNegotiationEngagePath(), data)
  }

  // ---- Negotiation ----

  async negotiate(data: NegotiationAction) {
    return this.appRequest('POST', toNegotiationActionPath(data.negotiationId as number), data)
  }

  async getNegotiation(id: number) {
    return this.appRequest<{ negotiation: Negotiation }>('GET', toNegotiationDetailResolverPath(id))
  }

  // ---- Provider Inbox ----

  async getInbox(did: string, sessionId?: string) {
    const query = new URLSearchParams()
    if (sessionId) {
      query.set('session_id', sessionId)
    }
    const qs = query.toString()
    return this.appRequest<{ inbox: InboxItem[]; stats: Record<string, number> }>(
      'GET',
      `/api/app/providers/${encodeURIComponent(did)}/inbox${qs ? `?${qs}` : ''}`
    )
  }

  async respondToInbox(did: string, data: InboxResponse) {
    return this.appRequest('POST', `/api/app/providers/${encodeURIComponent(did)}/inbox`, data)
  }

  // ---- Dashboard Stats ----

  async getStats() {
    return this.appRequest('GET', '/api/app/dashboard/summary')
  }
}

export default ADPClient
