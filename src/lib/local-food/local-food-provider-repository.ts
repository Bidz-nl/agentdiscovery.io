import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getDataRoot } from '@/lib/project-paths'
import type { LocalFoodProviderPatch, LocalFoodProviderRecord } from '@/lib/local-food/local-food-types'
import { normalizePostcodePrefixes } from '@/lib/local-food/local-food-postcode'

type LocalFoodProviderStore = {
  providers: LocalFoodProviderRecord[]
}

const STORE_DIRECTORY = getDataRoot()
const STORE_FILE = path.join(STORE_DIRECTORY, 'local-food-providers.json')

function ensureStore() {
  if (!existsSync(STORE_DIRECTORY)) {
    mkdirSync(STORE_DIRECTORY, { recursive: true })
  }

  if (!existsSync(STORE_FILE)) {
    writeFileSync(STORE_FILE, JSON.stringify({ providers: [] }, null, 2), 'utf8')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function toProviderRecord(value: unknown): LocalFoodProviderRecord | null {
  if (!isRecord(value) || !isRecord(value.serviceArea) || !isRecord(value.payment)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.providerDid !== 'string' ||
    value.vertical !== 'pizza' ||
    (value.status !== 'draft' && value.status !== 'active' && value.status !== 'paused') ||
    typeof value.businessName !== 'string' ||
    typeof value.slug !== 'string' ||
    typeof value.summary !== 'string' ||
    typeof value.cuisineLabel !== 'string' ||
    typeof value.phone !== 'string' ||
    typeof value.locationLabel !== 'string' ||
    !isStringArray(value.fulfilmentModes) ||
    !isStringArray(value.serviceArea.postcodePrefixes) ||
    typeof value.serviceArea.coverageLabel !== 'string' ||
    typeof value.serviceArea.deliveryNotes !== 'string' ||
    value.payment.mode !== 'placeholder' ||
    typeof value.payment.providerLabel !== 'string' ||
    value.payment.readiness !== 'payment_ready_shape' ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    return null
  }

  return {
    ...value,
    fulfilmentModes: value.fulfilmentModes.filter(
      (mode): mode is LocalFoodProviderRecord['fulfilmentModes'][number] => mode === 'delivery' || mode === 'pickup'
    ),
    serviceArea: {
      postcodePrefixes: normalizePostcodePrefixes(value.serviceArea.postcodePrefixes),
      coverageLabel: value.serviceArea.coverageLabel,
      deliveryNotes: value.serviceArea.deliveryNotes,
    },
  } as LocalFoodProviderRecord
}

function readStore(): LocalFoodProviderStore {
  if (!existsSync(STORE_FILE)) {
    return { providers: [] }
  }

  try {
    const raw = readFileSync(STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<LocalFoodProviderStore>

    return {
      providers: Array.isArray(parsed.providers)
        ? parsed.providers.map((entry) => toProviderRecord(entry)).filter((entry): entry is LocalFoodProviderRecord => Boolean(entry))
        : [],
    }
  } catch {
    return { providers: [] }
  }
}

function writeStore(store: LocalFoodProviderStore) {
  ensureStore()
  const temporaryFile = `${STORE_FILE}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8')
  renameSync(temporaryFile, STORE_FILE)
}

export function listLocalFoodProviderRecords() {
  return readStore().providers
}

export function getLocalFoodProviderRecord(providerDid: string) {
  return readStore().providers.find((provider) => provider.providerDid === providerDid) ?? null
}

export function createLocalFoodProviderRecord(
  input: Omit<LocalFoodProviderRecord, 'id' | 'createdAt' | 'updatedAt'>
) {
  const store = readStore()
  const now = new Date().toISOString()
  const record: LocalFoodProviderRecord = {
    id: `lf_provider_${randomUUID().replace(/-/g, '')}`,
    createdAt: now,
    updatedAt: now,
    ...input,
    serviceArea: {
      ...input.serviceArea,
      postcodePrefixes: normalizePostcodePrefixes(input.serviceArea.postcodePrefixes),
    },
  }

  writeStore({
    providers: [...store.providers, record],
  })

  return record
}

export function updateLocalFoodProviderRecord(providerDid: string, patch: LocalFoodProviderPatch) {
  const store = readStore()
  const current = store.providers.find((provider) => provider.providerDid === providerDid)
  if (!current) {
    return null
  }

  const updated: LocalFoodProviderRecord = {
    ...current,
    status: patch.status ?? current.status,
    businessName: typeof patch.businessName === 'string' ? patch.businessName.trim() : current.businessName,
    summary: typeof patch.summary === 'string' ? patch.summary.trim() : current.summary,
    phone: typeof patch.phone === 'string' ? patch.phone.trim() : current.phone,
    locationLabel: typeof patch.locationLabel === 'string' ? patch.locationLabel.trim() : current.locationLabel,
    fulfilmentModes: Array.isArray(patch.fulfilmentModes)
      ? patch.fulfilmentModes.filter(
          (mode): mode is LocalFoodProviderRecord['fulfilmentModes'][number] => mode === 'delivery' || mode === 'pickup'
        )
      : current.fulfilmentModes,
    serviceArea: patch.serviceArea
      ? {
          postcodePrefixes: Array.isArray(patch.serviceArea.postcodePrefixes)
            ? normalizePostcodePrefixes(patch.serviceArea.postcodePrefixes)
            : current.serviceArea.postcodePrefixes,
          coverageLabel:
            typeof patch.serviceArea.coverageLabel === 'string'
              ? patch.serviceArea.coverageLabel.trim()
              : current.serviceArea.coverageLabel,
          deliveryNotes:
            typeof patch.serviceArea.deliveryNotes === 'string'
              ? patch.serviceArea.deliveryNotes.trim()
              : current.serviceArea.deliveryNotes,
        }
      : current.serviceArea,
    updatedAt: new Date().toISOString(),
  }

  writeStore({
    providers: store.providers.map((provider) => (provider.providerDid === providerDid ? updated : provider)),
  })

  return updated
}
