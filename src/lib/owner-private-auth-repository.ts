import { randomUUID } from 'node:crypto'

import { kvRead, kvWrite } from '@/lib/kv-store'
import type { OwnerAppSession, OwnerPrincipal, OwnerProviderMembership } from '@/lib/owner-private-auth'

const KV_KEY = 'adp:owner-auth'
const OWNER_APP_SESSION_TTL_MS = 12 * 60 * 60 * 1000

type OwnerPrivateAuthStoreFile = {
  principals: OwnerPrincipal[]
  memberships: OwnerProviderMembership[]
  sessions: OwnerAppSession[]
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

async function readOwnerPrivateAuthStore(): Promise<OwnerPrivateAuthStoreFile> {
  const raw = await kvRead<OwnerPrivateAuthStoreFile | null>(KV_KEY, null)
  if (!raw) {
    return { principals: [], memberships: [], sessions: [] }
  }
  try {
    return {
      principals: Array.isArray(raw.principals)
        ? raw.principals.map((record) => toOwnerPrincipal(record)).filter((record): record is OwnerPrincipal => Boolean(record))
        : [],
      memberships: Array.isArray(raw.memberships)
        ? raw.memberships
            .map((record) => toOwnerProviderMembership(record))
            .filter((record): record is OwnerProviderMembership => Boolean(record))
        : [],
      sessions: Array.isArray(raw.sessions)
        ? raw.sessions.map((record) => toOwnerAppSession(record)).filter((record): record is OwnerAppSession => Boolean(record))
        : [],
    }
  } catch {
    return { principals: [], memberships: [], sessions: [] }
  }
}

async function writeOwnerPrivateAuthStore(store: OwnerPrivateAuthStoreFile): Promise<void> {
  await kvWrite(KV_KEY, store)
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

export async function getOwnerPrincipalByExternalSubject(externalSubject: string): Promise<OwnerPrincipal | null> {
  const normalizedSubject = normalizeString(externalSubject)
  if (!normalizedSubject) {
    return null
  }

  return (await readOwnerPrivateAuthStore()).principals.find((principal) => principal.externalSubject === normalizedSubject) ?? null
}

export async function getOrCreateOwnerPrincipal(externalSubject: string): Promise<OwnerPrincipal> {
  const normalizedSubject = normalizeString(externalSubject)
  const existing = await getOwnerPrincipalByExternalSubject(normalizedSubject)

  if (existing) {
    return existing
  }

  const store = await readOwnerPrivateAuthStore()
  const principal: OwnerPrincipal = {
    ownerId: createOwnerId(),
    externalSubject: normalizedSubject,
    createdAt: new Date().toISOString(),
    status: 'active',
  }

  await writeOwnerPrivateAuthStore({
    ...store,
    principals: [...store.principals, principal],
  })

  return principal
}

export async function listOwnerProviderMemberships(ownerId: string): Promise<OwnerProviderMembership[]> {
  const normalizedOwnerId = normalizeString(ownerId)
  if (!normalizedOwnerId) {
    return []
  }

  return (await readOwnerPrivateAuthStore()).memberships.filter((membership) => membership.ownerId === normalizedOwnerId)
}

export async function createOwnerProviderMemberships(ownerId: string, providerDids: string[]): Promise<OwnerProviderMembership[]> {
  const normalizedOwnerId = normalizeString(ownerId)
  const nextProviderDids = normalizeProviderDidList(providerDids)

  if (!normalizedOwnerId || nextProviderDids.length === 0) {
    return []
  }

  const store = await readOwnerPrivateAuthStore()
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

  await writeOwnerPrivateAuthStore({
    ...store,
    memberships: [...store.memberships, ...created],
  })

  return [...store.memberships.filter((membership) => membership.ownerId === normalizedOwnerId), ...created]
}

export async function getOwnerAppSessionByCredentialFingerprint(credentialFingerprint: string): Promise<OwnerAppSession | null> {
  const normalizedFingerprint = normalizeString(credentialFingerprint)
  if (!normalizedFingerprint) {
    return null
  }

  const session =
    (await readOwnerPrivateAuthStore()).sessions.find((existingSession) => existingSession.credentialFingerprint === normalizedFingerprint) ?? null

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

export async function upsertOwnerAppSession(input: {
  ownerId: string
  credentialFingerprint: string
  authorizedProviderDids: string[]
  activeProviderDid: string | null
}): Promise<OwnerAppSession> {
  const normalizedOwnerId = normalizeString(input.ownerId)
  const normalizedFingerprint = normalizeString(input.credentialFingerprint)
  const authorizedProviderDids = normalizeProviderDidList(input.authorizedProviderDids)

  const store = await readOwnerPrivateAuthStore()
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

  await writeOwnerPrivateAuthStore({
    ...store,
    sessions: existing
      ? store.sessions.map((current) => (current.sessionId === existing.sessionId ? session : current))
      : [...store.sessions, session],
  })

  return session
}

export async function setOwnerAppSessionActiveProvider(
  sessionId: string,
  activeProviderDid: string
): Promise<OwnerAppSession | null> {
  const normalizedSessionId = normalizeString(sessionId)
  const normalizedActiveProviderDid = normalizeString(activeProviderDid)
  if (!normalizedSessionId || !normalizedActiveProviderDid) {
    return null
  }

  const store = await readOwnerPrivateAuthStore()
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

  await writeOwnerPrivateAuthStore({
    ...store,
    sessions: store.sessions.map((session) => (session.sessionId === normalizedSessionId ? updated : session)),
  })

  return updated
}
