import type { AgentManifest } from '@/lib/adp-v2/agent-types'

const agentManifests = new Map<string, AgentManifest>()

export function saveAgentManifest(manifest: AgentManifest): AgentManifest {
  agentManifests.set(manifest.did, manifest)
  return manifest
}

export function getAgentManifest(did: string): AgentManifest | null {
  return agentManifests.get(did) ?? null
}

export function listAgentManifests(): AgentManifest[] {
  return Array.from(agentManifests.values())
}
