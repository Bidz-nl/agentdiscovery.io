import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getDataRoot } from '@/lib/project-paths'

export type SessionNegotiationRecord = {
  id: number
  source: 'session'
  sessionId: string
  status: string
  initiatorDid: string
  responderDid: string
  capabilityId: number
  currentPrice: number
  rounds: Array<{
    round: number
    action: string
    price: number
    message: string
    by: string
    at: string
  }>
  createdAt: string
  updatedAt: string
}

type SessionNegotiationStoreFile = {
  negotiations: SessionNegotiationRecord[]
}

type PersistedSessionNegotiationRecord = Omit<SessionNegotiationRecord, 'source'> & {
  source?: 'session' | 'compat_session'
}

const SESSION_NEGOTIATION_STORE_DIRECTORY = getDataRoot()
const LEGACY_NEGOTIATION_STORE_FILE = path.join(SESSION_NEGOTIATION_STORE_DIRECTORY, 'compat-negotiations.json')
const SESSION_NEGOTIATION_STORE_FILE = path.join(SESSION_NEGOTIATION_STORE_DIRECTORY, 'session-negotiations.json')

function ensureSessionNegotiationStore() {
  if (!existsSync(SESSION_NEGOTIATION_STORE_DIRECTORY)) {
    mkdirSync(SESSION_NEGOTIATION_STORE_DIRECTORY, { recursive: true })
  }

  if (!existsSync(SESSION_NEGOTIATION_STORE_FILE) && existsSync(LEGACY_NEGOTIATION_STORE_FILE)) {
    renameSync(LEGACY_NEGOTIATION_STORE_FILE, SESSION_NEGOTIATION_STORE_FILE)
  }

  if (!existsSync(SESSION_NEGOTIATION_STORE_FILE)) {
    writeFileSync(SESSION_NEGOTIATION_STORE_FILE, JSON.stringify({ negotiations: [] }, null, 2), 'utf8')
  }
}

function toSessionNegotiationRound(
  round: Partial<SessionNegotiationRecord['rounds'][number]>
): SessionNegotiationRecord['rounds'][number] | null {
  if (!round || typeof round !== 'object') {
    return null
  }

  if (
    typeof round.round !== 'number' ||
    !Number.isFinite(round.round) ||
    typeof round.action !== 'string' ||
    typeof round.price !== 'number' ||
    !Number.isFinite(round.price) ||
    typeof round.message !== 'string' ||
    typeof round.by !== 'string' ||
    typeof round.at !== 'string'
  ) {
    return null
  }

  return {
    round: round.round,
    action: round.action,
    price: round.price,
    message: round.message,
    by: round.by,
    at: round.at,
  }
}

function isSessionNegotiationRound(
  round: SessionNegotiationRecord['rounds'][number] | null
): round is SessionNegotiationRecord['rounds'][number] {
  return Boolean(round)
}

function toSessionNegotiationRecord(record: Partial<PersistedSessionNegotiationRecord>): SessionNegotiationRecord | null {
  const source = record.source ?? 'session'

  if (
    typeof record.id !== 'number' ||
    !Number.isFinite(record.id) ||
    (source !== 'session' && source !== 'compat_session') ||
    typeof record.sessionId !== 'string' ||
    typeof record.status !== 'string' ||
    typeof record.initiatorDid !== 'string' ||
    typeof record.responderDid !== 'string' ||
    typeof record.capabilityId !== 'number' ||
    !Number.isFinite(record.capabilityId) ||
    typeof record.currentPrice !== 'number' ||
    !Number.isFinite(record.currentPrice) ||
    typeof record.createdAt !== 'string' ||
    typeof record.updatedAt !== 'string'
  ) {
    return null
  }

  const rounds = Array.isArray(record.rounds)
    ? record.rounds.map(toSessionNegotiationRound).filter(isSessionNegotiationRound)
    : null

  if (!rounds) {
    return null
  }

  return {
    id: record.id,
    source: 'session',
    sessionId: record.sessionId,
    status: record.status,
    initiatorDid: record.initiatorDid,
    responderDid: record.responderDid,
    capabilityId: record.capabilityId,
    currentPrice: record.currentPrice,
    rounds,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

function isSessionNegotiationRecord(record: SessionNegotiationRecord | null): record is SessionNegotiationRecord {
  return Boolean(record)
}

function readSessionNegotiationStore(): SessionNegotiationStoreFile {
  const readableStoreFile = existsSync(SESSION_NEGOTIATION_STORE_FILE)
    ? SESSION_NEGOTIATION_STORE_FILE
    : existsSync(LEGACY_NEGOTIATION_STORE_FILE)
      ? LEGACY_NEGOTIATION_STORE_FILE
      : null

  if (!readableStoreFile) {
    return {
      negotiations: [],
    }
  }

  try {
    const raw = readFileSync(readableStoreFile, 'utf8')
    const parsed = JSON.parse(raw) as Partial<SessionNegotiationStoreFile & { negotiations: PersistedSessionNegotiationRecord[] }>
    return {
      negotiations: Array.isArray(parsed.negotiations)
        ? parsed.negotiations.map(toSessionNegotiationRecord).filter(isSessionNegotiationRecord)
        : [],
    }
  } catch {
    return {
      negotiations: [],
    }
  }
}

function writeSessionNegotiationStore(store: SessionNegotiationStoreFile) {
  ensureSessionNegotiationStore()
  const temporaryFile = `${SESSION_NEGOTIATION_STORE_FILE}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8')
  renameSync(temporaryFile, SESSION_NEGOTIATION_STORE_FILE)
}

function getNextSessionNegotiationId(records: SessionNegotiationRecord[]) {
  const maxId = records.reduce((currentMax, record) => Math.max(currentMax, record.id), 999_999)
  return maxId + 1
}

export function createSessionNegotiationRecord(
  input: Omit<SessionNegotiationRecord, 'id'>
): SessionNegotiationRecord {
  const store = readSessionNegotiationStore()
  const record: SessionNegotiationRecord = {
    id: getNextSessionNegotiationId(store.negotiations),
    ...input,
    source: 'session',
  }

  writeSessionNegotiationStore({
    negotiations: [...store.negotiations, record],
  })

  return record
}

export function getSessionNegotiationRecord(id: number): SessionNegotiationRecord | null {
  return readSessionNegotiationStore().negotiations.find((record) => record.id === id) ?? null
}

export function listSessionNegotiationRecords(): SessionNegotiationRecord[] {
  return readSessionNegotiationStore().negotiations
}

export function updateSessionNegotiationRecord(
  id: number,
  updater: (record: SessionNegotiationRecord) => SessionNegotiationRecord
): SessionNegotiationRecord | null {
  const store = readSessionNegotiationStore()
  const existing = store.negotiations.find((record) => record.id === id)

  if (!existing) {
    return null
  }

  const updated = {
    ...updater(existing),
    source: 'session' as const,
  }
  writeSessionNegotiationStore({
    negotiations: store.negotiations.map((record) => (record.id === id ? updated : record)),
  })

  return updated
}
