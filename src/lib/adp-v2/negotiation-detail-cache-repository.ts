import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getDataRoot } from '@/lib/project-paths'

type NegotiationRound = {
  round: number
  action: string
  price: number
  message: string
  by: string
  at: string
  [key: string]: unknown
}

export type CachedLegacyNegotiation = {
  id: number
  status: string
  initiatorDid: string
  responderDid: string
  capabilityId: number
  currentPrice: number
  rounds: NegotiationRound[]
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

export type CachedLegacyNegotiationDetail = {
  negotiation: CachedLegacyNegotiation
}

type NegotiationDetailCacheStoreFile = {
  negotiations: CachedLegacyNegotiation[]
}

const NEGOTIATION_DETAIL_CACHE_DIRECTORY = getDataRoot()
const NEGOTIATION_DETAIL_CACHE_FILE = path.join(NEGOTIATION_DETAIL_CACHE_DIRECTORY, 'legacy-negotiation-details.json')

function ensureNegotiationDetailCacheStore() {
  if (!existsSync(NEGOTIATION_DETAIL_CACHE_DIRECTORY)) {
    mkdirSync(NEGOTIATION_DETAIL_CACHE_DIRECTORY, { recursive: true })
  }

  if (!existsSync(NEGOTIATION_DETAIL_CACHE_FILE)) {
    writeFileSync(NEGOTIATION_DETAIL_CACHE_FILE, JSON.stringify({ negotiations: [] }, null, 2), 'utf8')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function toNegotiationRound(value: unknown): NegotiationRound | null {
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
    ...value,
    round: value.round,
    action: value.action,
    price: value.price,
    message: value.message,
    by: value.by,
    at: value.at,
  }
}

function isNegotiationRound(round: NegotiationRound | null): round is NegotiationRound {
  return Boolean(round)
}

function toCachedLegacyNegotiation(value: unknown): CachedLegacyNegotiation | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== 'number' ||
    !Number.isFinite(value.id) ||
    typeof value.status !== 'string' ||
    typeof value.initiatorDid !== 'string' ||
    typeof value.responderDid !== 'string' ||
    typeof value.capabilityId !== 'number' ||
    !Number.isFinite(value.capabilityId) ||
    typeof value.currentPrice !== 'number' ||
    !Number.isFinite(value.currentPrice) ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    !Array.isArray(value.rounds)
  ) {
    return null
  }

  const rounds = value.rounds.map(toNegotiationRound).filter(isNegotiationRound)

  if (rounds.length !== value.rounds.length) {
    return null
  }

  return {
    ...value,
    id: value.id,
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

function isCachedLegacyNegotiation(negotiation: CachedLegacyNegotiation | null): negotiation is CachedLegacyNegotiation {
  return Boolean(negotiation)
}

function readNegotiationDetailCacheStore(): NegotiationDetailCacheStoreFile {
  if (!existsSync(NEGOTIATION_DETAIL_CACHE_FILE)) {
    return {
      negotiations: [],
    }
  }

  try {
    const raw = readFileSync(NEGOTIATION_DETAIL_CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<NegotiationDetailCacheStoreFile>

    return {
      negotiations: Array.isArray(parsed.negotiations)
        ? parsed.negotiations.map(toCachedLegacyNegotiation).filter(isCachedLegacyNegotiation)
        : [],
    }
  } catch {
    return {
      negotiations: [],
    }
  }
}

function writeNegotiationDetailCacheStore(store: NegotiationDetailCacheStoreFile) {
  ensureNegotiationDetailCacheStore()
  const temporaryFile = `${NEGOTIATION_DETAIL_CACHE_FILE}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8')
  renameSync(temporaryFile, NEGOTIATION_DETAIL_CACHE_FILE)
}

export function normalizeLegacyNegotiationDetailBody(value: unknown): CachedLegacyNegotiationDetail | null {
  if (!isRecord(value)) {
    return null
  }

  const negotiation = toCachedLegacyNegotiation(value.negotiation)

  if (!negotiation) {
    return null
  }

  return {
    negotiation,
  }
}

export function getCachedLegacyNegotiationDetail(negotiationId: number): CachedLegacyNegotiationDetail | null {
  const cachedNegotiation = readNegotiationDetailCacheStore().negotiations.find(
    (negotiation) => negotiation.id === negotiationId
  )

  if (!cachedNegotiation) {
    return null
  }

  return {
    negotiation: cachedNegotiation,
  }
}

export function cacheLegacyNegotiationDetail(detail: CachedLegacyNegotiationDetail): CachedLegacyNegotiationDetail {
  const store = readNegotiationDetailCacheStore()
  const nextNegotiation = detail.negotiation
  const existingIndex = store.negotiations.findIndex((negotiation) => negotiation.id === nextNegotiation.id)

  if (existingIndex === -1) {
    writeNegotiationDetailCacheStore({
      negotiations: [...store.negotiations, nextNegotiation],
    })
  } else {
    writeNegotiationDetailCacheStore({
      negotiations: store.negotiations.map((negotiation, index) =>
        index === existingIndex ? nextNegotiation : negotiation
      ),
    })
  }

  return detail
}
