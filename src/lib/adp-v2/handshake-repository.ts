import type { HandshakeSession } from '@/lib/adp-v2/handshake-types'

const handshakeSessions = new Map<string, HandshakeSession>()

function isExpired(session: HandshakeSession): boolean {
  return Date.parse(session.expires_at) <= Date.now()
}

export function saveHandshakeSession(session: HandshakeSession): HandshakeSession {
  handshakeSessions.set(session.session_id, session)
  return session
}

export function getHandshakeSession(sessionId: string): HandshakeSession | null {
  const session = handshakeSessions.get(sessionId)

  if (!session) {
    return null
  }

  if (session.status === 'open' && isExpired(session)) {
    const expiredSession: HandshakeSession = {
      ...session,
      status: 'expired',
    }
    handshakeSessions.set(sessionId, expiredSession)
    return expiredSession
  }

  return session
}
