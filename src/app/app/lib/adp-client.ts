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
import type {
  AgentPolicyRecord,
  AgentRunRecord,
  AgentRuntimeReadModel,
  ConnectRuntimeProviderRequest,
  SandboxRunRequest,
  UpdateAgentPolicyRequest,
} from '@/lib/agent-runtime'

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

export interface AgentProfileResponse {
  agent: {
    id: number
    did: string
    name: string
    description: string | null
    role: string
    updatedAt: string
  }
}

export interface OwnerAgentProfileResponse {
  profile: {
    id: string
    agentDid: string
    status: string
    version: number
    identity: {
      did: string
      slug: string
      displayName: string
      role: string
      purpose: string
      summary: string
      ownerDefinedSpecialty: string[]
      audience: string[]
      operatingRegions: string[]
      languages: string[]
    }
    backend: {
      mode: string
      provider: string
      model: string | null
      modelFamily: string | null
      adapterVersion: string | null
    }
    skills: Array<{
      key: string
      name: string
      summary: string
      level: string
      executionMode: string
      specialtyTags: string[]
      inputKinds: string[]
      outputKinds: string[]
      successSignals: string[]
      failureBoundaries: string[]
    }>
    toolGrants: Array<{
      toolKey: string
      title: string
      mode: string
      resourceScopes: string[]
      ownerScopedOnly: boolean
      requiresApproval: boolean
      protocolVisible: boolean
      maxCallsPerRun: number | null
    }>
    policyProfile: {
      autonomyMode: string
      defaultApprovalMode: string
      approvalRules: Array<Record<string, unknown>>
      spendCapUsd: number
      maxConcurrentActions: number
      allowExternalSideEffects: boolean
      allowCrossCounterpartyMemory: boolean
      escalationChannels: string[]
    }
    memoryScope: {
      mode: string
      namespaces: string[]
      retentionDays: number | null
      storesPreferenceMemory: boolean
      storesCounterpartyMemory: boolean
      storesExecutionMemory: boolean
    }
    knowledgeSources: Array<{
      key: string
      title: string
      kind: string
      accessScope: string
      freshness: string
      sensitivity: string
      ownerManaged: boolean
      discoverableSummary: string | null
    }>
    reputationSummary: {
      trustTier: string
      totalTransactions: number
      completedTransactions: number
      averageScore: number | null
      positiveSignalCount: number
      disputedSignalCount: number
      lastUpdatedAt: string | null
    }
    discoveryProfile: {
      specialties: string[]
      searchableTags: string[]
      preferredEngagements: string[]
      trustSignals: string[]
      visibleKnowledgeSummaries: string[]
    }
    createdAt: string
    updatedAt: string
  }
  editor: {
    availableSkills: Array<{
      key: string
      name: string
      summary: string
      level: string
    }>
    availableTools: Array<{
      toolKey: string
      title: string
      mode: string
      requiresApproval: boolean
      protocolVisible: boolean
    }>
    allowedMemoryScopes: string[]
    allowedAutonomyModes: string[]
    allowedApprovalModes: string[]
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

export interface LocalFoodProviderAdminResponse {
  provider: {
    id: string
    providerDid: string
    vertical: 'pizza'
    status: 'draft' | 'active' | 'paused'
    businessName: string
    slug: string
    summary: string
    cuisineLabel: string
    phone: string
    locationLabel: string
    fulfilmentModes: Array<'delivery' | 'pickup'>
    serviceArea: {
      postcodePrefixes: string[]
      coverageLabel: string
      deliveryNotes: string
    }
    payment: {
      mode: 'placeholder'
      providerLabel: string
      readiness: 'payment_ready_shape'
    }
    createdAt: string
    updatedAt: string
  }
  menuItems: Array<{
    id: string
    category: 'pizza' | 'sides' | 'drinks' | 'desserts'
    name: string
    description: string
    priceCents: number
    currency: 'EUR'
    available: boolean
    tags: string[]
    position: number
    createdAt: string
    updatedAt: string
  }>
  dashboard: {
    availableMenuItems: number
    totalMenuItems: number
    incomingOrders: number
    awaitingAction: number
  }
  launchChecklist: {
    hasBusinessBasics: boolean
    hasServiceArea: boolean
    hasMenu: boolean
    canGoLive: boolean
    nextRecommendedAction: string
  }
}

export interface LocalFoodDiscoverProvider {
  providerDid: string
  businessName: string
  summary: string
  cuisineLabel: string
  locationLabel: string
  coverageLabel: string
  fulfilmentModes: Array<'delivery' | 'pickup'>
  startingPriceCents: number | null
  availableMenuItemCount: number
  specialties: string[]
}

export interface LocalFoodProviderPublicResponse {
  provider: {
    providerDid: string
    businessName: string
    summary: string
    cuisineLabel: string
    locationLabel: string
    coverageLabel: string
    deliveryNotes: string
    fulfilmentModes: Array<'delivery' | 'pickup'>
    payment: {
      mode: 'placeholder'
      providerLabel: string
      readiness: 'payment_ready_shape'
    }
    specialties: string[]
  }
  menuItems: Array<{
    id: string
    category: 'pizza' | 'sides' | 'drinks' | 'desserts'
    name: string
    description: string
    priceCents: number
    currency: 'EUR'
    available: boolean
    tags: string[]
  }>
}

export interface LocalFoodOrderReadModel {
  id: string
  providerDid: string
  customerDid: string | null
  customerName: string
  customerPhone: string
  customerPostcode: string
  customerAddressLine: string
  customerNotes: string
  fulfilmentMode: 'delivery' | 'pickup'
  items: Array<{
    menuItemId: string
    category: 'pizza' | 'sides' | 'drinks' | 'desserts'
    name: string
    unitPriceCents: number
    quantity: number
    lineTotalCents: number
  }>
  subtotalCents: number
  totalCents: number
  currency: 'EUR'
  payment: {
    mode: 'placeholder'
    status: 'pending'
    displayLabel: string
    checkoutReference: string
  }
  status: 'submitted' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  statusTimeline: Array<{
    status: 'submitted' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    at: string
    note: string | null
  }>
  createdAt: string
  updatedAt: string
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
  deliveryPayload?: string
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
  deliveryPayload?: string
  deliveryMessages?: Array<{ by: string; message: string; at: string }>
  transcript?: Array<{
    id: string
    kind: 'round' | 'message'
    action: string
    by: string
    message: string
    price?: number
    at: string
  }>
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

export interface RuntimeConnectionResponse {
  validation: {
    ok: boolean
    provider: 'openai' | 'anthropic'
    message: string
    model: string
  }
  runtime: AgentRuntimeReadModel | null
}

type AppRequestError = Error & {
  status?: number
  code?: string
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
      const nextError = new Error(error.error?.message || `API error: ${res.status}`) as AppRequestError
      nextError.status = res.status
      nextError.code = error.error?.code
      throw nextError
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

  async renameCurrentAgent(name: string) {
    return this.appRequest<AgentProfileResponse>('PATCH', '/api/app/agents/me', { name })
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

  async getAgentRuntime() {
    return this.appRequest<{ runtime: AgentRuntimeReadModel }>('GET', '/api/app/agents/runtime')
  }

  async getOwnerAgentProfile() {
    return this.appRequest<OwnerAgentProfileResponse>('GET', '/api/app/agents/profile')
  }

  async updateOwnerAgentProfile(data: Record<string, unknown>) {
    return this.appRequest<OwnerAgentProfileResponse>('PATCH', '/api/app/agents/profile', data)
  }

  async connectAgentRuntime(data: ConnectRuntimeProviderRequest) {
    return this.appRequest<RuntimeConnectionResponse>('POST', '/api/app/agents/runtime', data)
  }

  async updateAgentRuntimePolicy(data: UpdateAgentPolicyRequest) {
    return this.appRequest<{ policy: AgentPolicyRecord; runtime: AgentRuntimeReadModel | null }>(
      'PATCH',
      '/api/app/agents/runtime/policy',
      data
    )
  }

  async runAgentSandbox(data: SandboxRunRequest) {
    return this.appRequest<{ run: AgentRunRecord; runtime: AgentRuntimeReadModel | null }>(
      'POST',
      '/api/app/agents/runtime/sandbox',
      data
    )
  }

  // ---- Discovery ----

  async matchServices(data: ServiceMatchQuery) {
    return this.appRequest<{ matches: MatchResult[] }>('POST', '/api/app/services/match', data)
  }

  async discoverLocalFoodProviders(postcode: string) {
    return this.appRequest<{ providers: LocalFoodDiscoverProvider[] }>('POST', '/api/app/local-food/discover', {
      postcode,
    })
  }

  async getLocalFoodProvider(providerDid: string) {
    return this.appRequest<LocalFoodProviderPublicResponse>(
      'GET',
      `/api/app/local-food/providers/${encodeURIComponent(providerDid)}`
    )
  }

  async submitLocalFoodOrder(data: Record<string, unknown>) {
    return this.appRequest<{ order: LocalFoodOrderReadModel }>('POST', '/api/app/local-food/orders/submit', data)
  }

  async getLocalFoodProviderAdmin() {
    return this.appRequest<LocalFoodProviderAdminResponse>('GET', '/api/app/local-food/provider')
  }

  async updateLocalFoodProvider(data: Record<string, unknown>) {
    return this.appRequest<{ provider: LocalFoodProviderAdminResponse['provider'] }>(
      'PATCH',
      '/api/app/local-food/provider',
      data
    )
  }

  async bootstrapLocalFoodDemo() {
    return this.appRequest<{ provider: LocalFoodProviderAdminResponse['provider'] }>(
      'POST',
      '/api/app/local-food/demo-bootstrap'
    )
  }

  async getLocalFoodMenuItems() {
    return this.appRequest<{ menuItems: LocalFoodProviderAdminResponse['menuItems'] }>('GET', '/api/app/local-food/menu')
  }

  async createLocalFoodMenuItem(data: Record<string, unknown>) {
    return this.appRequest<{ menuItem: LocalFoodProviderAdminResponse['menuItems'][number] }>(
      'POST',
      '/api/app/local-food/menu',
      data
    )
  }

  async importLocalFoodMenuCsv(csvText: string) {
    return this.appRequest<{ menuItems: LocalFoodProviderAdminResponse['menuItems'] }>(
      'POST',
      '/api/app/local-food/menu',
      { mode: 'csv', csvText }
    )
  }

  async updateLocalFoodMenuItem(itemId: string, data: Record<string, unknown>) {
    return this.appRequest<{ menuItem: LocalFoodProviderAdminResponse['menuItems'][number] }>(
      'PATCH',
      `/api/app/local-food/menu/${encodeURIComponent(itemId)}`,
      data
    )
  }

  async getLocalFoodOrders() {
    return this.appRequest<{ orders: LocalFoodOrderReadModel[] }>('GET', '/api/app/local-food/orders')
  }

  async updateLocalFoodOrderStatus(orderId: string, data: { status: LocalFoodOrderReadModel['status']; note?: string }) {
    return this.appRequest<{ order: LocalFoodOrderReadModel }>(
      'PATCH',
      `/api/app/local-food/orders/${encodeURIComponent(orderId)}`,
      data
    )
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

  async getNegotiations() {
    return this.appRequest<{ negotiations: Negotiation[] }>('GET', '/api/app/negotiations')
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

  async sendDelivery(negotiationId: number, deliveryPayload: string) {
    return this.appRequest('POST', `/api/app/negotiations/${negotiationId}/deliver`, { deliveryPayload })
  }

  async replyToDelivery(negotiationId: number, message: string) {
    return this.appRequest('POST', `/api/app/negotiations/${negotiationId}/deliver/reply`, { message })
  }

  // ---- Dashboard Stats ----

  async getStats() {
    return this.appRequest('GET', '/api/app/dashboard/summary')
  }
}

export default ADPClient
