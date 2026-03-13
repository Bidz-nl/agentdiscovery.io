import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import type { OwnerAppSession, OwnerPrincipal, OwnerProviderMembership } from '@/lib/owner-private-auth'

const OWNER_PRIVATE_AUTH_STORE_DIRECTORY = path.join(process.cwd(), '.data')
const OWNER_PRIVATE_AUTH_STORE_FILE = path.join(OWNER_PRIVATE_AUTH_STORE_DIRECTORY, 'owner-private-auth.json')
const OWNER_APP_SESSION_TTL_MS = 12 * 60 * 60 * 1000

type OwnerPrivateAuthStoreFile = {
  principals: OwnerPrincipal[]
  memberships: OwnerProviderMembership[]
  sessions: OwnerAppSession[]
}

function ensureOwnerPrivateAuthStore(): void {
  if (!existsSync(OWNER_PRIVATE_AUTH_STORE_DIRECTORY)) {
    mkdirSync(OWNER_PRIVATE_AUTH_STORE_DIRECTORY, { recursive: true })
  }

  if (!existsSync(OWNER_PRIVATE_AUTH_STORE_FILE)) {
    writeFileSync(
      OWNER_PRIVATE_AUTH_STORE_FILE,
      JSON.stringify({ principals: [], memberships: [], sessions: [] }, null, 2),
      'utf8'
    )
  }
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeProviderDidList(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => normalizeString(value)).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  )
}

function toOwnerPrincipal(record: Partial<OwnerPrincipal>): OwnerPrincipal | null {
  const ownerId = normalizeString(record.ownerId)
  const externalSubject = normalizeString(record.externalSubject)
  const createdAt = normalizeString(record.createdAt)

  if (!ownerId || !externalSubject || !createdAt) {
    return null
  }

  return {
    ownerId,
    externalSubject,
    createdAt,
    status: 'active',
  }
}

function toOwnerProviderMembership(record: Partial<OwnerProviderMembership>): OwnerProviderMembership | null {
  const membershipId = normalizeString(record.membershipId)
  const ownerId = normalizeString(record.ownerId)
  const providerDid = normalizeString(record.providerDid)
  const createdAt = normalizeString(record.createdAt)

  if (!membershipId || !ownerId || !providerDid || !createdAt) {
    return null
  }

  return {
    membershipId,
    ownerId,
    providerDid,
    role: 'owner',
    createdAt,
    status: 'active',
  }
}

function toOwnerAppSession(record: Partial<OwnerAppSession>): OwnerAppSession | null {
  const sessionId = normalizeString(record.sessionId)
  const ownerId = normalizeString(record.ownerId)
  const credentialFingerprint = normalizeString(record.credentialFingerprint)
  const createdAt = normalizeString(record.createdAt)
  const expiresAt = normalizeString(record.expiresAt)

  if (!sessionId || !ownerId || !credentialFingerprint || !createdAt || !expiresAt) {
    return null
  }

  const authorizedProviderDids = Array.isArray(record.authorizedProviderDids)
    ? Array.from(
        new Set(
          record.authorizedProviderDids
            .map((value) => normalizeString(value))
            .filter(Boolean)
        )
      )
    : []

  const activeProviderDid = normalizeString(record.activeProviderDid)

  return {
    sessionId,
    ownerId,
    credentialFingerprint,
    activeProviderDid: activeProviderDid || null,
    authorizedProviderDids,
    createdAt,
    expiresAt,
  }
}

function readOwnerPrivateAuthStore(): OwnerPrivateAuthStoreFile {
  if (!existsSync(OWNER_PRIVATE_AUTH_STORE_FILE)) {
    return {
      principals: [],
      memberships: [],
      sessions: [],
    }
  }

  try {
    const raw = readFileSync(OWNER_PRIVATE_AUTH_STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<OwnerPrivateAuthStoreFile>

    return {
      principals: Array.isArray(parsed.principals)
        ? parsed.principals.map((record) => toOwnerPrincipal(record)).filter((record): record is OwnerPrincipal => Boolean(record))
        : [],
      memberships: Array.isArray(parsed.memberships)
        ? parsed.memberships
            .map((record) => toOwnerProviderMembership(record))
            .filter((record): record is OwnerProviderMembership => Boolean(record))
        : [],
      sessions: Array.isArray(parsed.sessions)
        ? parsed.sessions.map((record) => toOwnerAppSession(record)).filter((record): record is OwnerAppSession => Boolean(record))
        : [],
    }
  } catch {
    return {
      principals: [],
      memberships: [],
      sessions: [],
    }
  }
}

function writeOwnerPrivateAuthStore(store: OwnerPrivateAuthStoreFile): void {
  ensureOwnerPrivateAuthStore()
  const temporaryFile = `${OWNER_PRIVATE_AUTH_STORE_FILE}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8')
  renameSync(temporaryFile, OWNER_PRIVATE_AUTH_STORE_FILE)
}

function createOwnerId(): string {
  return `owner_${randomUUID().replace(/-/g, '')}`
}

function createMembershipId(): string {
  return `membership_${randomUUID().replace(/-/g, '')}`
}

function createSessionId(): string {
  return `owner_session_${randomUUID().replace(/-/g, '')}`
}

function createExpiresAt(): string {
  return new Date(Date.now() + OWNER_APP_SESSION_TTL_MS).toISOString()
}

function isExpired(session: OwnerAppSession): boolean {
  return Date.parse(session.expiresAt) <= Date.now()
}

export function getOwnerPrincipalByExternalSubject(externalSubject: string): OwnerPrincipal | null {
  const normalizedSubject = normalizeString(externalSubject)
  if (!normalizedSubject) {
    return null
  }

  return readOwnerPrivateAuthStore().principals.find((principal) => principal.externalSubject === normalizedSubject) ?? null
}

export function getOrCreateOwnerPrincipal(externalSubject: string): OwnerPrincipal {
  const normalizedSubject = normalizeString(externalSubject)
  const existing = getOwnerPrincipalByExternalSubject(normalizedSubject)

  if (existing) {
    return existing
  }

  const store = readOwnerPrivateAuthStore()
  const principal: OwnerPrincipal = {
    ownerId: createOwnerId(),
    externalSubject: normalizedSubject,
    createdAt: new Date().toISOString(),
    status: 'active',
  }

  writeOwnerPrivateAuthStore({
    ...store,
    principals: [...store.principals, principal],
  })

  return principal
}

export function listOwnerProviderMemberships(ownerId: string): OwnerProviderMembership[] {
  const normalizedOwnerId = normalizeString(ownerId)
  if (!normalizedOwnerId) {
    return []
  }

  return readOwnerPrivateAuthStore().memberships.filter((membership) => membership.ownerId === normalizedOwnerId)
}

export function createOwnerProviderMemberships(ownerId: string, providerDids: string[]): OwnerProviderMembership[] {
  const normalizedOwnerId = normalizeString(ownerId)
  const nextProviderDids = normalizeProviderDidList(providerDids)

  if (!normalizedOwnerId || nextProviderDids.length === 0) {
    return []
  }

  const store = readOwnerPrivateAuthStore()
  const existingProviderDids = new Set(
    store.memberships.filter((membership) => membership.ownerId === normalizedOwnerId).map((membership) => membership.providerDid)
  )

  const created = nextProviderDids
    .filter((providerDid) => !existingProviderDids.has(providerDid))
    .map<OwnerProviderMembership>((providerDid) => ({
      membershipId: createMembershipId(),
      ownerId: normalizedOwnerId,
      providerDid,
      role: 'owner',
      createdAt: new Date().toISOString(),
      status: 'active',
    }))

  if (created.length === 0) {
    return store.memberships.filter((membership) => membership.ownerId === normalizedOwnerId)
  }

  writeOwnerPrivateAuthStore({
    ...store,
    memberships: [...store.memberships, ...created],
  })

  return [...store.memberships.filter((membership) => membership.ownerId === normalizedOwnerId), ...created]
}

export function getOwnerAppSessionByCredentialFingerprint(credentialFingerprint: string): OwnerAppSession | null {
  const normalizedFingerprint = normalizeString(credentialFingerprint)
  if (!normalizedFingerprint) {
    return null
  }

  const session =
    readOwnerPrivateAuthStore().sessions.find((existingSession) => existingSession.credentialFingerprint === normalizedFingerprint) ?? null

  if (!session) {
    return null
  }

  return isExpired(session) ? null : session
}

export function selectDeterministicActiveProviderDid(
  authorizedProviderDids: string[],
  preferredProviderDid?: string | null
): string | null {
  const normalizedAuthorizedProviderDids = normalizeProviderDidList(authorizedProviderDids)
  const normalizedPreferredProviderDid = normalizeString(preferredProviderDid)

  if (normalizedPreferredProviderDid && normalizedAuthorizedProviderDids.includes(normalizedPreferredProviderDid)) {
    return normalizedPreferredProviderDid
  }

  return normalizedAuthorizedProviderDids[0] ?? null
}

export function upsertOwnerAppSession(input: {
  ownerId: string
  credentialFingerprint: string
  authorizedProviderDids: string[]
  activeProviderDid: string | null
}): OwnerAppSession {
  const normalizedOwnerId = normalizeString(input.ownerId)
  const normalizedFingerprint = normalizeString(input.credentialFingerprint)
  const authorizedProviderDids = normalizeProviderDidList(input.authorizedProviderDids)

  const store = readOwnerPrivateAuthStore()
  const existing =
    store.sessions.find((session) => session.credentialFingerprint === normalizedFingerprint && session.ownerId === normalizedOwnerId) ?? null

  const session: OwnerAppSession = {
    sessionId: existing?.sessionId ?? createSessionId(),
    ownerId: normalizedOwnerId,
    credentialFingerprint: normalizedFingerprint,
    activeProviderDid: selectDeterministicActiveProviderDid(authorizedProviderDids, input.activeProviderDid),
    authorizedProviderDids,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    expiresAt: createExpiresAt(),
  }

  writeOwnerPrivateAuthStore({
    ...store,
    sessions: existing
      ? store.sessions.map((current) => (current.sessionId === existing.sessionId ? session : current))
      : [...store.sessions, session],
  })

  return session
}

export function setOwnerAppSessionActiveProvider(
  sessionId: string,
  activeProviderDid: string
): OwnerAppSession | null {
  const normalizedSessionId = normalizeString(sessionId)
  const normalizedActiveProviderDid = normalizeString(activeProviderDid)
  if (!normalizedSessionId || !normalizedActiveProviderDid) {
    return null
  }

  const store = readOwnerPrivateAuthStore()
  const existing = store.sessions.find((session) => session.sessionId === normalizedSessionId) ?? null

  if (!existing) {
    return null
  }

  const nextActiveProviderDid = selectDeterministicActiveProviderDid(
    existing.authorizedProviderDids,
    normalizedActiveProviderDid
  )

  if (!nextActiveProviderDid || nextActiveProviderDid !== normalizedActiveProviderDid) {
    return null
  }

  const updated: OwnerAppSession = {
    ...existing,
    activeProviderDid: nextActiveProviderDid,
    authorizedProviderDids: normalizeProviderDidList(existing.authorizedProviderDids),
    expiresAt: createExpiresAt(),
  }

  writeOwnerPrivateAuthStore({
    ...store,
    sessions: store.sessions.map((session) => (session.sessionId === normalizedSessionId ? updated : session)),
  })

  return updated
}
