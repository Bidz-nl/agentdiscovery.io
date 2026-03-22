import { kvRead, kvWrite } from '@/lib/kv-store'

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

const KV_KEY = 'adp:negotiation-cache'

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

async function readNegotiationDetailCacheStore(): Promise<NegotiationDetailCacheStoreFile> {
  const raw = await kvRead<NegotiationDetailCacheStoreFile | null>(KV_KEY, null)
  if (!raw) {
    return { negotiations: [] }
  }
  try {
    return {
      negotiations: Array.isArray(raw.negotiations)
        ? raw.negotiations.map(toCachedLegacyNegotiation).filter(isCachedLegacyNegotiation)
        : [],
    }
  } catch {
    return { negotiations: [] }
  }
}

async function writeNegotiationDetailCacheStore(store: NegotiationDetailCacheStoreFile): Promise<void> {
  await kvWrite(KV_KEY, store)
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

export async function getCachedLegacyNegotiationDetail(negotiationId: number): Promise<CachedLegacyNegotiationDetail | null> {
  const cachedNegotiation = (await readNegotiationDetailCacheStore()).negotiations.find(
    (negotiation) => negotiation.id === negotiationId
  )

  if (!cachedNegotiation) {
    return null
  }

  return {
    negotiation: cachedNegotiation,
  }
}

export async function cacheLegacyNegotiationDetail(detail: CachedLegacyNegotiationDetail): Promise<CachedLegacyNegotiationDetail> {
  const store = await readNegotiationDetailCacheStore()
  const nextNegotiation = detail.negotiation
  const existingIndex = store.negotiations.findIndex((negotiation) => negotiation.id === nextNegotiation.id)

  if (existingIndex === -1) {
    await writeNegotiationDetailCacheStore({
      negotiations: [...store.negotiations, nextNegotiation],
    })
  } else {
    await writeNegotiationDetailCacheStore({
      negotiations: store.negotiations.map((negotiation, index) =>
        index === existingIndex ? nextNegotiation : negotiation
      ),
    })
  }

  return detail
}
