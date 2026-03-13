import { createHash, randomBytes } from 'node:crypto'

import { getAgentCredentialBySecretHash, touchAgentCredentialLastUsed } from '@/lib/adp-v2/agent-credential-repository'
import { getAgentRecordById } from '@/lib/adp-v2/agent-record-repository'
import type { AgentCredentialRecord, AgentRecord } from '@/lib/adp-v2/agent-types'

export function mintRawAgentApiKey() {
  return `adp_${randomBytes(32).toString('hex')}`
}

export function hashAgentApiKey(rawApiKey: string) {
  return createHash('sha256').update(rawApiKey).digest('hex')
}

export function extractBearerApiKey(headers: Headers) {
  const authorizationHeader = headers.get('Authorization')?.trim()

  if (!authorizationHeader) {
    return null
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

export function verifyBearerAgentApiKey(headers: Headers): { agent: AgentRecord; credential: AgentCredentialRecord } | null {
  const rawApiKey = extractBearerApiKey(headers)

  if (!rawApiKey) {
    return null
  }

  const credential = getAgentCredentialBySecretHash(hashAgentApiKey(rawApiKey))

  if (!credential || credential.status !== 'active') {
    return null
  }

  const agent = getAgentRecordById(credential.agentId)

  if (!agent || agent.status !== 'active') {
    return null
  }

  const touchedCredential = touchAgentCredentialLastUsed(credential.id) ?? credential

  return {
    agent,
    credential: touchedCredential,
  }
}
