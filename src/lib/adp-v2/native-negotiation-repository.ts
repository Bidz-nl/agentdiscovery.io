import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getDataRoot } from '@/lib/project-paths'

export type NativeNegotiationRound = {
  round: number
  action: string
  price: number
  message: string
  by: string
  at: string
}

export type NativeNegotiationRecord = {
  id: number
  source: 'native'
  sessionId: string
  status: string
  initiatorDid: string
  responderDid: string
  capabilityId: number
  currentPrice: number
  rounds: NativeNegotiationRound[]
  createdAt: string
  updatedAt: string
}

export type NativeNegotiationEvent = {
  id: string
  negotiationId: number
  round: number
  actorDid: string
  action: string
  price: number
  message: string
  createdAt: string
}

type NativeNegotiationStoreFile = {
  negotiations: NativeNegotiationRecord[]
  events: NativeNegotiationEvent[]
}

const NATIVE_NEGOTIATION_STORE_DIRECTORY = getDataRoot()
const NATIVE_NEGOTIATION_STORE_FILE = path.join(NATIVE_NEGOTIATION_STORE_DIRECTORY, 'adp-v2-negotiations.json')

function ensureNativeNegotiationStore() {
  if (!existsSync(NATIVE_NEGOTIATION_STORE_DIRECTORY)) {
    mkdirSync(NATIVE_NEGOTIATION_STORE_DIRECTORY, { recursive: true })
  }

  if (!existsSync(NATIVE_NEGOTIATION_STORE_FILE)) {
    writeFileSync(
      NATIVE_NEGOTIATION_STORE_FILE,
      JSON.stringify({ negotiations: [], events: [] }, null, 2),
      'utf8'
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function toNativeNegotiationRound(value: unknown): NativeNegotiationRound | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.round !== 'number' ||
    !Number.isFinite(value.round) ||
    typeof value.action !== 'string' ||
    typeof value.price !== 'number' ||
    !Number.isFinite(value.price) ||
    typeof value.message !== 'string' ||
    typeof value.by !== 'string' ||
    typeof value.at !== 'string'
  ) {
    return null
  }

  return {
    round: value.round,
    action: value.action,
    price: value.price,
    message: value.message,
    by: value.by,
    at: value.at,
  }
}

function isNativeNegotiationRound(value: NativeNegotiationRound | null): value is NativeNegotiationRound {
  return Boolean(value)
}

function toNativeNegotiationRecord(value: unknown): NativeNegotiationRecord | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== 'number' ||
    !Number.isFinite(value.id) ||
    value.source !== 'native' ||
    typeof value.sessionId !== 'string' ||
    typeof value.status !== 'string' ||
    typeof value.initiatorDid !== 'string' ||
    typeof value.responderDid !== 'string' ||
    typeof value.capabilityId !== 'number' ||
    !Number.isFinite(value.capabilityId) ||
    typeof value.currentPrice !== 'number' ||
    !Number.isFinite(value.currentPrice) ||
    !Array.isArray(value.rounds) ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    return null
  }

  const rounds = value.rounds.map(toNativeNegotiationRound).filter(isNativeNegotiationRound)

  if (rounds.length !== value.rounds.length) {
    return null
  }

  return {
    id: value.id,
    source: 'native',
    sessionId: value.sessionId,
    status: value.status,
    initiatorDid: value.initiatorDid,
    responderDid: value.responderDid,
    capabilityId: value.capabilityId,
    currentPrice: value.currentPrice,
    rounds,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function isNativeNegotiationRecord(value: NativeNegotiationRecord | null): value is NativeNegotiationRecord {
  return Boolean(value)
}

function toNativeNegotiationEvent(value: unknown): NativeNegotiationEvent | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.negotiationId !== 'number' ||
    !Number.isFinite(value.negotiationId) ||
    typeof value.round !== 'number' ||
    !Number.isFinite(value.round) ||
    typeof value.actorDid !== 'string' ||
    typeof value.action !== 'string' ||
    typeof value.price !== 'number' ||
    !Number.isFinite(value.price) ||
    typeof value.message !== 'string' ||
    typeof value.createdAt !== 'string'
  ) {
    return null
  }

  return {
    id: value.id,
    negotiationId: value.negotiationId,
    round: value.round,
    actorDid: value.actorDid,
    action: value.action,
    price: value.price,
    message: value.message,
    createdAt: value.createdAt,
  }
}

function isNativeNegotiationEvent(value: NativeNegotiationEvent | null): value is NativeNegotiationEvent {
  return Boolean(value)
}

function readNativeNegotiationStore(): NativeNegotiationStoreFile {
  ensureNativeNegotiationStore()

  try {
    const raw = readFileSync(NATIVE_NEGOTIATION_STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<NativeNegotiationStoreFile>

    return {
      negotiations: Array.isArray(parsed.negotiations)
        ? parsed.negotiations.map(toNativeNegotiationRecord).filter(isNativeNegotiationRecord)
        : [],
      events: Array.isArray(parsed.events)
        ? parsed.events.map(toNativeNegotiationEvent).filter(isNativeNegotiationEvent)
        : [],
    }
  } catch {
    return {
      negotiations: [],
      events: [],
    }
  }
}

function writeNativeNegotiationStore(store: NativeNegotiationStoreFile) {
  ensureNativeNegotiationStore()
  const temporaryFile = `${NATIVE_NEGOTIATION_STORE_FILE}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8')
  renameSync(temporaryFile, NATIVE_NEGOTIATION_STORE_FILE)
}

function getNextNegotiationId(records: NativeNegotiationRecord[]) {
  const maxId = records.reduce((currentMax, record) => Math.max(currentMax, record.id), 0)
  return maxId + 1
}

export function createNativeNegotiationRecord(
  input: Omit<NativeNegotiationRecord, 'id' | 'source'>,
  initialEvent?: Omit<NativeNegotiationEvent, 'id' | 'negotiationId'>
) {
  const store = readNativeNegotiationStore()
  const record: NativeNegotiationRecord = {
    id: getNextNegotiationId(store.negotiations),
    source: 'native',
    ...input,
  }

  const events = initialEvent
    ? [
        ...store.events,
        {
          id: `neg_event_${randomUUID().replace(/-/g, '')}`,
          negotiationId: record.id,
          ...initialEvent,
        },
      ]
    : store.events

  writeNativeNegotiationStore({
    negotiations: [...store.negotiations, record],
    events,
  })

  return record
}

export function getNativeNegotiationRecord(id: number): NativeNegotiationRecord | null {
  return readNativeNegotiationStore().negotiations.find((record) => record.id === id) ?? null
}

export function listNativeNegotiationRecords() {
  return readNativeNegotiationStore().negotiations
}

export function listNativeNegotiationEvents(negotiationId: number) {
  return readNativeNegotiationStore().events.filter((event) => event.negotiationId === negotiationId)
}

export function updateNativeNegotiationRecord(
  id: number,
  updater: (record: NativeNegotiationRecord) => NativeNegotiationRecord,
  nextEvent?: Omit<NativeNegotiationEvent, 'id' | 'negotiationId'>
) {
  const store = readNativeNegotiationStore()
  const existing = store.negotiations.find((record) => record.id === id)

  if (!existing) {
    return null
  }

  const updated = updater(existing)
  const events = nextEvent
    ? [
        ...store.events,
        {
          id: `neg_event_${randomUUID().replace(/-/g, '')}`,
          negotiationId: id,
          ...nextEvent,
        },
      ]
    : store.events

  writeNativeNegotiationStore({
    negotiations: store.negotiations.map((record) => (record.id === id ? updated : record)),
    events,
  })

  return updated
}
