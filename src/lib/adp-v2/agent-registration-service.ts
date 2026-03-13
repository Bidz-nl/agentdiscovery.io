import { randomUUID } from 'node:crypto'

import { mintRawAgentApiKey, hashAgentApiKey } from '@/lib/adp-v2/agent-api-key'
import { createAgentCredentialRecord } from '@/lib/adp-v2/agent-credential-repository'
import { createAgentRecord } from '@/lib/adp-v2/agent-record-repository'
import type { AgentRecord, NativeAgentRegistrationRequest } from '@/lib/adp-v2/agent-types'

export function registerNativeAgent(input: NativeAgentRegistrationRequest) {
  const agent = createAgentRecord({
    did: `did:adp:${randomUUID()}`,
    name: input.name,
    role: input.role,
    description: input.description,
    status: 'active',
    supportedProtocolVersions: input.supported_protocol_versions,
    authoritySummary: input.authority_summary,
  })

  const apiKey = mintRawAgentApiKey()
  const credential = createAgentCredentialRecord({
    agentId: agent.id,
    label: 'default',
    secretHash: hashAgentApiKey(apiKey),
    status: 'active',
  })

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
