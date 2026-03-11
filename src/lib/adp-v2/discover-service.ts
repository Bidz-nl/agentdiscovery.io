import { listAgentManifests } from '@/lib/adp-v2/agent-repository'
import type {
  DiscoverCompletedResponse,
  DiscoverMatch,
  DiscoverPayload,
} from '@/lib/adp-v2/discover-types'

export function findDiscoverMatches(discover: DiscoverPayload): DiscoverMatch[] {
  return listAgentManifests()
    .filter((agent) => agent.role === 'provider')
    .filter((agent) => agent.supported_protocol_versions.includes('2.0'))
    .filter((agent) =>
      discover.category
        ? Array.isArray(agent.categories) && agent.categories.includes(discover.category)
        : true
    )
    .map((agent) => ({
      did: agent.did,
      name: agent.name,
      role: agent.role,
      categories: agent.categories,
      capabilities: agent.capabilities,
    }))
}

export function createDiscoverCompletedResponse(
  sessionId: string,
  discover: DiscoverPayload
): DiscoverCompletedResponse {
  return {
    ok: true,
    message: 'ADP v2 discover completed',
    session_id: sessionId,
    discover,
    matches: findDiscoverMatches(discover),
  }
}
