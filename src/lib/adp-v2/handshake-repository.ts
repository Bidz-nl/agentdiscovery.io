import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getDataRoot } from '@/lib/project-paths'
import type { HandshakeSession } from '@/lib/adp-v2/handshake-types'

const STORE_DIR = getDataRoot()
const STORE_FILE = path.join(STORE_DIR, 'adp-v2-handshake-sessions.json')

function isExpired(session: HandshakeSession): boolean {
  return Date.parse(session.expires_at) <= Date.now()
}

function readStore(): Record<string, HandshakeSession> {
  if (!existsSync(STORE_FILE)) return {}
  try {
    return JSON.parse(readFileSync(STORE_FILE, 'utf8')) as Record<string, HandshakeSession>
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, HandshakeSession>) {
  if (!existsSync(STORE_DIR)) mkdirSync(STORE_DIR, { recursive: true })
  const tmp = `${STORE_FILE}.tmp`
  writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8')
  renameSync(tmp, STORE_FILE)
}

export function saveHandshakeSession(session: HandshakeSession): HandshakeSession {
  const store = readStore()
  store[session.session_id] = session
  writeStore(store)
  return session
}

export function getHandshakeSession(sessionId: string): HandshakeSession | null {
  const store = readStore()
  const session = store[sessionId]

  if (!session) return null

  if (session.status === 'open' && isExpired(session)) {
    const expiredSession: HandshakeSession = { ...session, status: 'expired' }
    store[sessionId] = expiredSession
    writeStore(store)
    return expiredSession
  }

  return session
}
