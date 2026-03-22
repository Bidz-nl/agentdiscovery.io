import { randomUUID } from 'node:crypto'

import { mintRawAgentApiKey, hashAgentApiKey } from '@/lib/adp-v2/agent-api-key'
import { createAgentCredentialRecord } from '@/lib/adp-v2/agent-credential-repository'
import { createDefaultAgentProfileForDid } from '@/lib/adp-v2/agent-profile-service'
import { createAgentRecord } from '@/lib/adp-v2/agent-record-repository'
import type { AgentRecord, NativeAgentRegistrationRequest } from '@/lib/adp-v2/agent-types'

export async function registerNativeAgent(input: NativeAgentRegistrationRequest) {
  const agent = await createAgentRecord({
    did: `did:adp:${randomUUID()}`,
    name: input.name,
    role: input.role,
    description: input.description,
    status: 'active',
    supportedProtocolVersions: input.supported_protocol_versions,
    authoritySummary: input.authority_summary,
    runtimeMode: 'manual',
    runtimeStatus: 'needs_setup',
    preferredProvider: null,
  })

  const apiKey = mintRawAgentApiKey()
  const credential = await createAgentCredentialRecord({
    agentId: agent.id,
    label: 'default',
    kind: 'app_api_key',
    provider: 'native',
    source: 'hosted_managed',
    secretHash: hashAgentApiKey(apiKey),
    encryptedSecret: null,
    maskedSecret: null,
    status: 'active',
    validationStatus: 'valid',
    validatedAt: new Date().toISOString(),
  })

  await createDefaultAgentProfileForDid(agent.did)

  return {
    agent,
    credential,
    apiKey,
  }
}

export function toPublicAgent(agent: AgentRecord) {
  return {
    id: agent.id,
    did: agent.did,
    name: agent.name,
    role: agent.role,
    description: agent.description,
    status: agent.status,
    supported_protocol_versions: agent.supportedProtocolVersions,
    authority_summary: agent.authoritySummary,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  }
}
