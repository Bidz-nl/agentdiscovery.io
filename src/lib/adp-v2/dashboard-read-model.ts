import { listAgentRecords } from '@/lib/adp-v2/agent-record-repository'
import { listNativeNegotiationRecords } from '@/lib/adp-v2/native-negotiation-repository'
import { listSessionNegotiationRecords } from '@/lib/adp-v2/session-negotiation-repository'
import { listTransactions } from '@/lib/adp-v2/transact-service'
import { listOwnerServiceRecords } from '@/lib/owner-service-repository'
import { toPublishedServiceCapabilityId } from '@/lib/service-match/service-identity'

function toLegacyAgentType(role: string): string {
  if (role === 'provider') return 'service_provider'
  if (role === 'consumer') return 'buyer'
  return role
}

function toCapabilityTitle(key: string): string {
  return key
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toPublishedCapabilities() {
  return listOwnerServiceRecords()
    .filter((service) => !service.archivedAt)
    .filter((service) => Boolean(service.publishedCapabilityKey && service.latestPublishedSnapshot))
    .map((service) => ({
      id: toPublishedServiceCapabilityId(service.id),
      category: service.latestPublishedSnapshot?.category ?? service.category,
      title:
        service.title ||
        toCapabilityTitle(service.latestPublishedSnapshot?.capability.key ?? service.category ?? 'service'),
      description: service.description ?? service.latestPublishedSnapshot?.capability.description ?? null,
      pricing: {
        ...(typeof service.pricingSummary.askingPrice === 'number'
          ? { askingPrice: service.pricingSummary.askingPrice }
          : {}),
        ...(typeof service.pricingSummary.currency === 'string' ? { currency: service.pricingSummary.currency } : {}),
        ...(typeof service.pricingSummary.negotiable === 'boolean'
          ? { negotiable: service.pricingSummary.negotiable }
          : {}),
      },
      status: 'active',
      agentDid: service.ownerAgentDid,
      createdAt: service.createdAt,
    }))
}

function toNegotiations() {
  const native = listNativeNegotiationRecords().map((negotiation) => ({
    id: negotiation.id,
    status: negotiation.status,
    currentRound: negotiation.rounds.length,
    maxRounds: null,
    proposals: negotiation.rounds.map((round) => ({
      from: round.by,
      terms: {
        price: round.price,
      },
      message: round.message,
      at: round.at,
      round: round.round,
    })),
    finalTerms:
      negotiation.status === 'accepted' || negotiation.status === 'completed'
        ? {
            price: negotiation.currentPrice,
          }
        : null,
    createdAt: negotiation.createdAt,
    participantDids: [negotiation.initiatorDid, negotiation.responderDid],
  }))

  const session = listSessionNegotiationRecords().map((negotiation) => ({
    id: negotiation.id,
    status: negotiation.status,
    currentRound: negotiation.rounds.length,
    maxRounds: null,
    proposals: negotiation.rounds.map((round) => ({
      from: round.by,
      terms: {
        price: round.price,
      },
      message: round.message,
      at: round.at,
      round: round.round,
    })),
    finalTerms:
      negotiation.status === 'accepted' || negotiation.status === 'completed'
        ? {
            price: negotiation.currentPrice,
          }
        : null,
    createdAt: negotiation.createdAt,
    participantDids: [negotiation.initiatorDid, negotiation.responderDid],
  }))

  return [...native, ...session].sort((a, b) => {
    const left = a.createdAt ? Date.parse(a.createdAt) : 0
    const right = b.createdAt ? Date.parse(b.createdAt) : 0
    return right - left
  })
}

export function getDashboardAggregate(limit: number, offset: number) {
  const agents = listAgentRecords()
  const publishedCapabilities = toPublishedCapabilities()
  const allNegotiations = toNegotiations()
  const transactions = listTransactions()
  const completedTransactions = transactions.filter((transaction) => transaction.status === 'completed')
  const acceptedNegotiations = allNegotiations.filter(
    (negotiation) => negotiation.status === 'accepted' || negotiation.status === 'completed'
  )

  const capabilitiesByAgent = new Map<string, typeof publishedCapabilities>()
  publishedCapabilities.forEach((capability) => {
    const existing = capabilitiesByAgent.get(capability.agentDid) ?? []
    existing.push(capability)
    capabilitiesByAgent.set(capability.agentDid, existing)
  })

  const negotiationsByAgent = new Map<string, typeof allNegotiations>()
  allNegotiations.forEach((negotiation) => {
    negotiation.participantDids.forEach((did) => {
      const existing = negotiationsByAgent.get(did) ?? []
      existing.push(negotiation)
      negotiationsByAgent.set(did, existing)
    })
  })

  const transactionsByProvider = new Map<string, typeof transactions>()
  transactions.forEach((transaction) => {
    const existing = transactionsByProvider.get(transaction.provider_did) ?? []
    existing.push(transaction)
    transactionsByProvider.set(transaction.provider_did, existing)
  })

  const allAgents = agents.map((agent) => {
    const agentCapabilities = capabilitiesByAgent.get(agent.did) ?? []
    const agentNegotiations = negotiationsByAgent.get(agent.did) ?? []
    const agentTransactions = transactionsByProvider.get(agent.did) ?? []
    const successfulTransactions = agentTransactions.filter((transaction) => transaction.status === 'completed')
    const activityTimestamps = [
      agent.updatedAt,
      ...agentCapabilities.map((capability) => capability.createdAt),
      ...agentNegotiations.map((negotiation) => negotiation.createdAt),
      ...agentTransactions.map((transaction) => transaction.created_at),
    ].filter((value): value is string => typeof value === 'string' && value.length > 0)
    const lastActiveAt = activityTimestamps.slice().sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null

    return {
      id: agent.id,
      did: agent.did,
      name: agent.name,
      description: agent.description ?? null,
      agentType: toLegacyAgentType(agent.role),
      reputationScore: null,
      totalTransactions: agentTransactions.length,
      successfulTransactions: successfulTransactions.length,
      isActive:
        agent.status === 'active' &&
        (agentCapabilities.length > 0 || agentNegotiations.length > 0 || agentTransactions.length > 0),
      lastActiveAt,
      createdAt: agent.createdAt,
    }
  })

  const pagedAgents = allAgents.slice(offset, offset + limit)
  const pagedAgentDids = new Set(pagedAgents.map((agent) => agent.did))
  const pagedCapabilities = publishedCapabilities
    .filter((capability) => pagedAgentDids.has(capability.agentDid))
    .map((capability) => ({
      ...capability,
      agentName: pagedAgents.find((agent) => agent.did === capability.agentDid)?.name ?? capability.agentDid,
    }))
  const pagedNegotiations = allNegotiations
    .filter((negotiation) => negotiation.participantDids.some((did) => pagedAgentDids.has(did)))
    .map(({ participantDids: _participantDids, ...negotiation }) => negotiation)
  const pagedTransactions = transactions
    .filter((transaction) => pagedAgentDids.has(transaction.provider_did))
    .map((transaction, index) => ({
      id: offset + index + 1,
      amount: transaction.budget ?? 0,
      currency: transaction.currency ?? 'EUR',
      status: transaction.status,
      ratings: null,
      completedAt: transaction.status === 'completed' ? transaction.created_at : null,
      createdAt: transaction.created_at,
    }))

  return {
    stats: {
      totalAgents: allAgents.length,
      activeAgents: allAgents.filter((agent) => agent.isActive).length,
      totalCapabilities: publishedCapabilities.length,
      activeCapabilities: publishedCapabilities.length,
      totalIntents: 0,
      activeIntents: 0,
      totalNegotiations: allNegotiations.length,
      acceptedNegotiations: acceptedNegotiations.length,
      totalTransactions: transactions.length,
      completedTransactions: completedTransactions.length,
      totalVolume: completedTransactions.reduce((sum, transaction) => sum + (transaction.budget ?? 0), 0),
    },
    agents: pagedAgents,
    capabilities: pagedCapabilities,
    intents: [],
    negotiations: pagedNegotiations,
    transactions: pagedTransactions,
    pagination: {
      hasMore: offset + limit < allAgents.length,
    },
  }
}

export function getDashboardSummary() {
  const dashboard = getDashboardAggregate(5, 0)

  return {
    stats: {
      totalAgents: dashboard.stats.totalAgents,
      activeCapabilities: dashboard.stats.activeCapabilities,
      totalNegotiations: dashboard.stats.totalNegotiations,
      acceptedNegotiations: dashboard.stats.acceptedNegotiations,
      completedTransactions: dashboard.stats.completedTransactions,
      totalVolume: dashboard.stats.totalVolume,
    },
    recentAgents: dashboard.agents
      .slice()
      .sort((left, right) => {
        const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0
        const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0
        return rightTime - leftTime
      })
      .slice(0, 5)
      .map((agent) => ({
        did: agent.did,
        name: agent.name,
        agentType: agent.agentType,
      })),
  }
}
