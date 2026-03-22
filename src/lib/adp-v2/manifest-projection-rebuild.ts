import { getAgentManifest, saveAgentManifest } from '@/lib/adp-v2/agent-repository'
import type { AgentCapability, AgentManifest } from '@/lib/adp-v2/agent-types'
import { listOwnerServiceRecords } from '@/lib/owner-service-repository'

export async function rebuildProviderManifest(providerDid: string): Promise<AgentManifest> {
  const [existingManifest, allServices] = await Promise.all([
    getAgentManifest(providerDid),
    listOwnerServiceRecords(),
  ])

  const publishedServices = allServices
    .filter((service) => service.ownerAgentDid === providerDid)
    .filter((service) => !service.archivedAt)
    .filter((service) => Boolean(service.publishedCapabilityKey && service.latestPublishedSnapshot))

  const capabilities = publishedServices.map(
    (service) =>
      ({
        key: service.latestPublishedSnapshot?.capability.key ?? service.publishedCapabilityKey ?? `service-${service.id}`,
        description: service.latestPublishedSnapshot?.capability.description ?? '',
        input_schema: service.latestPublishedSnapshot?.capability.input_schema,
        output_schema: service.latestPublishedSnapshot?.capability.output_schema,
      }) satisfies AgentCapability
  )

  const categories = Array.from(
    new Set(publishedServices.map((service) => service.latestPublishedSnapshot?.category ?? service.category).filter(Boolean))
  )
  const rebuiltManifest: AgentManifest = {
    did: providerDid,
    name: existingManifest?.name ?? providerDid,
    role: existingManifest?.role ?? 'provider',
    description: existingManifest?.description,
    categories,
    capabilities,
    supported_protocol_versions: existingManifest?.supported_protocol_versions ?? ['2.0'],
    supported_modes: existingManifest?.supported_modes,
    authority_summary: existingManifest?.authority_summary,
  }

  return saveAgentManifest(rebuiltManifest)
}
