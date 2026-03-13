import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getDataRoot } from '@/lib/project-paths'
import type { AgentManifest } from '@/lib/adp-v2/agent-types'

const AGENT_MANIFEST_STORE_DIRECTORY = path.join(getDataRoot(), 'agent-manifests')

function ensureAgentManifestStore(): void {
  if (!existsSync(AGENT_MANIFEST_STORE_DIRECTORY)) {
    mkdirSync(AGENT_MANIFEST_STORE_DIRECTORY, { recursive: true })
  }
}

function getManifestStoreFilePath(did: string): string {
  return path.join(AGENT_MANIFEST_STORE_DIRECTORY, `${encodeURIComponent(did)}.json`)
}

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

function readAgentManifestFile(filePath: string): AgentManifest | null {
  try {
    const raw = readFileSync(filePath, 'utf8')
    return toAgentManifest(JSON.parse(raw) as Partial<AgentManifest>)
  } catch {
    return null
  }
}

export function saveAgentManifest(manifest: AgentManifest): AgentManifest {
  ensureAgentManifestStore()
  const nextManifest = toAgentManifest(manifest)
  const targetFile = getManifestStoreFilePath(nextManifest.did)
  const temporaryFile = `${targetFile}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(nextManifest, null, 2), 'utf8')
  renameSync(temporaryFile, targetFile)
  return nextManifest
}

export function getAgentManifest(did: string): AgentManifest | null {
  if (!existsSync(AGENT_MANIFEST_STORE_DIRECTORY)) {
    return null
  }

  return readAgentManifestFile(getManifestStoreFilePath(did))
}

export function listAgentManifests(): AgentManifest[] {
  if (!existsSync(AGENT_MANIFEST_STORE_DIRECTORY)) {
    return []
  }

  return readdirSync(AGENT_MANIFEST_STORE_DIRECTORY)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => readAgentManifestFile(path.join(AGENT_MANIFEST_STORE_DIRECTORY, fileName)))
    .filter((manifest): manifest is AgentManifest => Boolean(manifest))
}
