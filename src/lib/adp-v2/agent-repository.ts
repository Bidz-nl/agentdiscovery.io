import { kvRead, kvWrite } from '@/lib/kv-store'
import type { AgentManifest } from '@/lib/adp-v2/agent-types'

const KV_KEY = 'adp:agent-manifests'

function toAgentManifest(manifest: Partial<AgentManifest>): AgentManifest {
  return {
    did: typeof manifest.did === 'string' ? manifest.did : '',
    name: typeof manifest.name === 'string' ? manifest.name : '',
    role:
      manifest.role === 'consumer' || manifest.role === 'provider' || manifest.role === 'broker'
        ? manifest.role
        : 'provider',
    description: typeof manifest.description === 'string' ? manifest.description : undefined,
    categories: Array.isArray(manifest.categories)
      ? manifest.categories.filter((category): category is string => typeof category === 'string')
      : undefined,
    capabilities: Array.isArray(manifest.capabilities)
      ? manifest.capabilities
          .filter((capability): capability is NonNullable<AgentManifest['capabilities']>[number] => Boolean(capability))
          .map((capability) => ({
            key: typeof capability.key === 'string' ? capability.key : '',
            description: typeof capability.description === 'string' ? capability.description : '',
            input_schema:
              capability.input_schema && typeof capability.input_schema === 'object' && !Array.isArray(capability.input_schema)
                ? capability.input_schema
                : undefined,
            output_schema:
              capability.output_schema && typeof capability.output_schema === 'object' && !Array.isArray(capability.output_schema)
                ? capability.output_schema
                : undefined,
          }))
      : [],
    supported_protocol_versions: Array.isArray(manifest.supported_protocol_versions)
      ? manifest.supported_protocol_versions.filter((version): version is string => typeof version === 'string')
      : [],
    supported_modes: Array.isArray(manifest.supported_modes)
      ? manifest.supported_modes.filter((mode): mode is string => typeof mode === 'string')
      : undefined,
    authority_summary:
      manifest.authority_summary && typeof manifest.authority_summary === 'object' && !Array.isArray(manifest.authority_summary)
        ? manifest.authority_summary
        : undefined,
  }
}

export async function saveAgentManifest(manifest: AgentManifest): Promise<AgentManifest> {
  const nextManifest = toAgentManifest(manifest)
  const store = await kvRead<Record<string, AgentManifest>>(KV_KEY, {})
  store[nextManifest.did] = nextManifest
  await kvWrite(KV_KEY, store)
  return nextManifest
}

export async function getAgentManifest(did: string): Promise<AgentManifest | null> {
  const store = await kvRead<Record<string, AgentManifest>>(KV_KEY, {})
  return store[did] ?? null
}

export async function listAgentManifests(): Promise<AgentManifest[]> {
  const store = await kvRead<Record<string, AgentManifest>>(KV_KEY, {})
  return Object.values(store).map((manifest) => toAgentManifest(manifest))
}
