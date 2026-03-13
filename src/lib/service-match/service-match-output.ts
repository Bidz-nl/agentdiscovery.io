import type { AgentRecord } from '@/lib/adp-v2/agent-types'
import type { ServiceRecord } from '@/lib/owner-services'
import { toPublishedAgentNumericId, toPublishedServiceCapabilityId } from '@/lib/service-match/service-identity'

export interface ServiceMatchResult {
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
  provider: {
    did: string
    name: string
    reputationScore: string
    totalTransactions: number
    successfulTransactions: number
  }
  relevanceScore: number
  distance?: number
}

export interface NativeServiceMatchCandidate {
  service: ServiceRecord
  agent: AgentRecord | null
  matchScore: number
}

export function toServiceMatchResult(candidate: NativeServiceMatchCandidate): ServiceMatchResult {
  const { service, agent, matchScore } = candidate
  const snapshot = service.latestPublishedSnapshot

  const specifications: Record<string, unknown> = {
    serviceId: service.id,
  }

  if (snapshot?.capability.input_schema) {
    specifications.input_schema = snapshot.capability.input_schema
  }

  if (snapshot?.capability.output_schema) {
    specifications.output_schema = snapshot.capability.output_schema
  }

  const pricing: Record<string, unknown> = {}
  if (typeof service.pricingSummary.askingPrice === 'number') {
    pricing.askingPrice = service.pricingSummary.askingPrice
  }
  if (service.pricingSummary.currency) {
    pricing.currency = service.pricingSummary.currency
  }
  if (typeof service.pricingSummary.negotiable === 'boolean') {
    pricing.negotiable = service.pricingSummary.negotiable
  }

  return {
    capability: {
      id: toPublishedServiceCapabilityId(service.id),
      agentId: toPublishedAgentNumericId(service.ownerAgentDid),
      category: snapshot?.category ?? service.category,
      title: service.title,
      description: service.description ?? snapshot?.capability.description ?? null,
      specifications,
      pricing,
      availability: {},
      status: 'published',
    },
    provider: {
      did: service.ownerAgentDid,
      name: agent?.name || service.ownerAgentDid,
      reputationScore: '0',
      totalTransactions: 0,
      successfulTransactions: 0,
    },
    relevanceScore: matchScore,
  }
}

export function createServiceMatchResponse(matches: NativeServiceMatchCandidate[]) {
  return {
    matches: matches.map(toServiceMatchResult),
  }
}
