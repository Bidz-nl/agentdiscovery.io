import { randomUUID } from 'node:crypto'

import { saveHandshakeSession } from '@/lib/adp-v2/handshake-repository'
import type { HandshakeAckResponse, HandshakeRequest, HandshakeSession } from '@/lib/adp-v2/handshake-types'

const HANDSHAKE_TTL_MS = 15 * 60 * 1000

function createSessionId(): string {
  return `hs_${randomUUID().replace(/-/g, '')}`
}

export function createHandshakeSession(request: HandshakeRequest): {
  session: HandshakeSession
  response: HandshakeAckResponse
} {
  const createdAt = new Date()
  const expiresAt = new Date(createdAt.getTime() + HANDSHAKE_TTL_MS)

  const session: HandshakeSession = {
    session_id: createSessionId(),
    initiator_did: request.did,
    protocol_version: request.protocol_version,
    role: request.role,
    supported_versions: request.supported_versions,
    supported_modes: request.supported_modes ?? [],
    authority_digest: request.authority_digest ?? {},
    reputation_ref: request.reputation_ref,
    nonce: request.nonce,
    timestamp: request.timestamp,
    signature: request.signature,
    status: 'open',
    trust_level: 'provisional',
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  }

  saveHandshakeSession(session)

  return {
    session,
    response: {
      message_type: 'ACK',
      accepted: true,
      session_id: session.session_id,
      status: session.status,
      trust_level: session.trust_level,
      expires_at: session.expires_at,
    },
  }
}
