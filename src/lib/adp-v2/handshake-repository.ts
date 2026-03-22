import { kvRead, kvWrite } from '@/lib/kv-store'
import type { HandshakeSession } from '@/lib/adp-v2/handshake-types'

const KV_KEY = 'adp:handshake-sessions'

function isExpired(session: HandshakeSession): boolean {
  return Date.parse(session.expires_at) <= Date.now()
}

async function readStore(): Promise<Record<string, HandshakeSession>> {
  return kvRead<Record<string, HandshakeSession>>(KV_KEY, {})
}

async function writeStore(store: Record<string, HandshakeSession>): Promise<void> {
  await kvWrite(KV_KEY, store)
}

export async function saveHandshakeSession(session: HandshakeSession): Promise<HandshakeSession> {
  const store = await readStore()
  store[session.session_id] = session
  await writeStore(store)
  return session
}

export async function getHandshakeSession(sessionId: string): Promise<HandshakeSession | null> {
  const store = await readStore()
  const session = store[sessionId]

  if (!session) return null

  if (session.status === 'open' && isExpired(session)) {
    const expiredSession: HandshakeSession = { ...session, status: 'expired' }
    store[sessionId] = expiredSession
    await writeStore(store)
    return expiredSession
  }

  return session
}
