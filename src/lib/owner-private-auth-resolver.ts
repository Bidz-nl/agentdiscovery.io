import { NextRequest } from 'next/server'

import { extractBearerApiKey, hashAgentApiKey, verifyBearerAgentApiKey } from '@/lib/adp-v2/agent-api-key'
import type { OwnerPrivateAuthContext } from '@/lib/owner-private-auth'
import {
  createOwnerProviderMemberships,
  getOwnerAppSessionByCredentialFingerprint,
  getOrCreateOwnerPrincipal,
  listOwnerProviderMemberships,
  upsertOwnerAppSession,
} from '@/lib/owner-private-auth-repository'

function getCredentialFingerprint(request: NextRequest) {
  const rawApiKey = extractBearerApiKey(request.headers)
  return rawApiKey ? `credential-${hashAgentApiKey(rawApiKey).slice(0, 32)}` : null
}

export async function resolveOwnerPrivateAuthContext(request: NextRequest): Promise<OwnerPrivateAuthContext | null> {
  const verified = verifyBearerAgentApiKey(request.headers)
  if (!verified) {
    return null
  }

  const credentialFingerprint = getCredentialFingerprint(request)
  if (!credentialFingerprint) {
    return null
  }

  const providerDids = [verified.agent.did]
  const externalSubject = `native-agent:${verified.agent.id}`
  const principal = getOrCreateOwnerPrincipal(externalSubject)
  const existingSession = getOwnerAppSessionByCredentialFingerprint(credentialFingerprint)

  const existingMemberships = listOwnerProviderMemberships(principal.ownerId)
  const memberships =
    existingMemberships.length > 0
      ? existingMemberships
      : createOwnerProviderMemberships(principal.ownerId, providerDids)

  const authorizedProviderDids = Array.from(
    new Set(memberships.map((membership) => membership.providerDid).filter(Boolean))
  )

  if (authorizedProviderDids.length === 0) {
    return null
  }

  const session = upsertOwnerAppSession({
    ownerId: principal.ownerId,
    credentialFingerprint,
    authorizedProviderDids,
    activeProviderDid: existingSession?.activeProviderDid ?? null,
  })

  return {
    ownerId: principal.ownerId,
    sessionId: session.sessionId,
    activeProviderDid: session.activeProviderDid ?? authorizedProviderDids[0],
    authorizedProviderDids,
  }
}
