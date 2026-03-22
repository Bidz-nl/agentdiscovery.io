import { kvRead, kvWrite } from '@/lib/kv-store'

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

const KV_KEY = 'adp:session-negotiations'

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

async function readSessionNegotiationStore(): Promise<SessionNegotiationStoreFile> {
  const raw = await kvRead<SessionNegotiationStoreFile | null>(KV_KEY, null)
  if (!raw) {
    return { negotiations: [] }
  }
  try {
    return {
      negotiations: Array.isArray(raw.negotiations)
        ? (raw.negotiations as Partial<PersistedSessionNegotiationRecord>[]).map(toSessionNegotiationRecord).filter(isSessionNegotiationRecord)
        : [],
    }
  } catch {
    return { negotiations: [] }
  }
}

async function writeSessionNegotiationStore(store: SessionNegotiationStoreFile): Promise<void> {
  await kvWrite(KV_KEY, store)
}

function getNextSessionNegotiationId(records: SessionNegotiationRecord[]) {
  const maxId = records.reduce((currentMax, record) => Math.max(currentMax, record.id), 999_999)
  return maxId + 1
}

export async function createSessionNegotiationRecord(
  input: Omit<SessionNegotiationRecord, 'id'>
): Promise<SessionNegotiationRecord> {
  const store = await readSessionNegotiationStore()
  const record: SessionNegotiationRecord = {
    id: getNextSessionNegotiationId(store.negotiations),
    ...input,
    source: 'session',
  }

  await writeSessionNegotiationStore({
    negotiations: [...store.negotiations, record],
  })

  return record
}

export async function getSessionNegotiationRecord(id: number): Promise<SessionNegotiationRecord | null> {
  return (await readSessionNegotiationStore()).negotiations.find((record) => record.id === id) ?? null
}

export async function listSessionNegotiationRecords(): Promise<SessionNegotiationRecord[]> {
  return (await readSessionNegotiationStore()).negotiations
}

export async function updateSessionNegotiationRecord(
  id: number,
  updater: (record: SessionNegotiationRecord) => SessionNegotiationRecord
): Promise<SessionNegotiationRecord | null> {
  const store = await readSessionNegotiationStore()
  const existing = store.negotiations.find((record) => record.id === id)

  if (!existing) {
    return null
  }

  const updated = {
    ...updater(existing),
    source: 'session' as const,
  }
  await writeSessionNegotiationStore({
    negotiations: store.negotiations.map((record) => (record.id === id ? updated : record)),
  })

  return updated
}
