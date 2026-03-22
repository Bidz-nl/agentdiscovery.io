import { getPublicAgentProfileProjection } from '@/lib/adp-v2/agent-profile-service'
import { listAgentRecords } from '@/lib/adp-v2/agent-record-repository'
import { listOwnerServiceRecords } from '@/lib/owner-service-repository'
import type {
  DiscoverCompletedResponse,
  DiscoverMatch,
  DiscoverPayload,
} from '@/lib/adp-v2/discover-types'

export async function findDiscoverMatches(discover: DiscoverPayload): Promise<DiscoverMatch[]> {
  const [allServices, allAgents] = await Promise.all([
    listOwnerServiceRecords(),
    listAgentRecords(),
  ])

  const publishedServices = allServices
    .filter((service) => !service.archivedAt)
    .filter((service) => Boolean(service.publishedCapabilityKey && service.latestPublishedSnapshot))

  const publishedServicesByProvider = new Map<string, typeof publishedServices>()
  publishedServices.forEach((service) => {
    const existing = publishedServicesByProvider.get(service.ownerAgentDid) ?? []
    existing.push(service)
    publishedServicesByProvider.set(service.ownerAgentDid, existing)
  })

  const matchingAgents = allAgents
    .filter((agent) => agent.role === 'provider')
    .filter((agent) => agent.status === 'active')
    .filter((agent) => agent.supportedProtocolVersions.includes('2.0'))
    .map((agent) => {
      const services = publishedServicesByProvider.get(agent.did) ?? []
      const categories = Array.from(
        new Set(services.map((service) => service.latestPublishedSnapshot?.category || service.category).filter(Boolean))
      )
      const capabilities = services
        .map((service) => service.latestPublishedSnapshot?.capability)
        .filter(
          (capability): capability is {
            key: string
            description: string
            input_schema?: Record<string, unknown>
            output_schema?: Record<string, unknown>
          } => Boolean(capability)
        )

      return {
        agent,
        categories,
        capabilities,
      }
    })
    .filter(({ capabilities }) => capabilities.length > 0)
    .filter(({ categories }) =>
      discover.category
        ? categories.some((category) => category.toLowerCase() === discover.category?.toLowerCase())
        : true
    )
    .filter(({ capabilities }) =>
      discover.capability_key
        ? capabilities.some((capability) => capability.key.toLowerCase() === discover.capability_key?.toLowerCase())
        : true
    )

  const results: DiscoverMatch[] = []
  for (const { agent, categories, capabilities } of matchingAgents) {
    results.push({
      did: agent.did,
      name: agent.name,
      role: agent.role,
      categories,
      capabilities,
      profile: (await getPublicAgentProfileProjection(agent.did)) ?? undefined,
    })
  }

  return results
}

export async function createDiscoverCompletedResponse(
  sessionId: string,
  discover: DiscoverPayload
): Promise<DiscoverCompletedResponse> {
  return {
    ok: true,
    message: 'ADP v2 discover completed',
    session_id: sessionId,
    discover,
    matches: await findDiscoverMatches(discover),
  }
}
