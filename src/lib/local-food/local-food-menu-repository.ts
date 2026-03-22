import { randomUUID } from 'node:crypto'

import { kvRead, kvWrite } from '@/lib/kv-store'
import type {
  CreateLocalFoodMenuItemInput,
  LocalFoodMenuCategory,
  LocalFoodMenuItemRecord,
  UpdateLocalFoodMenuItemInput,
} from '@/lib/local-food/local-food-types'

type LocalFoodMenuStore = {
  items: LocalFoodMenuItemRecord[]
}

const KV_KEY = 'localfood:menus'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isCategory(value: unknown): value is LocalFoodMenuCategory {
  return value === 'pizza' || value === 'sides' || value === 'drinks' || value === 'desserts'
}

function toMenuItemRecord(value: unknown): LocalFoodMenuItemRecord | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.providerDid !== 'string' ||
    !isCategory(value.category) ||
    typeof value.name !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.priceCents !== 'number' ||
    !Number.isFinite(value.priceCents) ||
    value.currency !== 'EUR' ||
    typeof value.available !== 'boolean' ||
    !isStringArray(value.tags) ||
    typeof value.position !== 'number' ||
    !Number.isFinite(value.position) ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    return null
  }

  return value as unknown as LocalFoodMenuItemRecord
}

async function readStore(): Promise<LocalFoodMenuStore> {
  const raw = await kvRead<LocalFoodMenuStore | null>(KV_KEY, null)
  if (!raw) {
    return { items: [] }
  }
  try {
    return {
      items: Array.isArray(raw.items)
        ? raw.items.map((entry) => toMenuItemRecord(entry)).filter((entry): entry is LocalFoodMenuItemRecord => Boolean(entry))
        : [],
    }
  } catch {
    return { items: [] }
  }
}

async function writeStore(store: LocalFoodMenuStore): Promise<void> {
  await kvWrite(KV_KEY, store)
}

function nextMenuPosition(items: LocalFoodMenuItemRecord[], providerDid: string) {
  const lastPosition = items
    .filter((item) => item.providerDid === providerDid)
    .reduce((max, item) => Math.max(max, item.position), 0)

  return lastPosition + 1
}

function normalizeTags(tags?: string[]) {
  return Array.from(new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean)))
}

export async function listLocalFoodMenuItems() {
  return (await readStore()).items
}

export async function listLocalFoodMenuItemsByProvider(providerDid: string) {
  return (await readStore()).items
    .filter((item) => item.providerDid === providerDid)
    .sort((left, right) => left.position - right.position || left.createdAt.localeCompare(right.createdAt))
}

export async function getLocalFoodMenuItem(itemId: string) {
  return (await readStore()).items.find((item) => item.id === itemId) ?? null
}

export async function createLocalFoodMenuItem(providerDid: string, input: CreateLocalFoodMenuItemInput) {
  const store = await readStore()
  const now = new Date().toISOString()
  const record: LocalFoodMenuItemRecord = {
    id: `lf_menu_${randomUUID().replace(/-/g, '')}`,
    providerDid,
    category: input.category,
    name: input.name.trim(),
    description: input.description?.trim() ?? '',
    priceCents: Math.max(0, Math.round(input.priceCents)),
    currency: 'EUR',
    available: input.available ?? true,
    tags: normalizeTags(input.tags),
    position: nextMenuPosition(store.items, providerDid),
    createdAt: now,
    updatedAt: now,
  }

  await writeStore({
    items: [...store.items, record],
  })

  return record
}

export async function createManyLocalFoodMenuItems(providerDid: string, inputs: CreateLocalFoodMenuItemInput[]) {
  const store = await readStore()
  let nextPosition = nextMenuPosition(store.items, providerDid)
  const now = new Date().toISOString()
  const created = inputs.map((input) => {
    const record: LocalFoodMenuItemRecord = {
      id: `lf_menu_${randomUUID().replace(/-/g, '')}`,
      providerDid,
      category: input.category,
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      priceCents: Math.max(0, Math.round(input.priceCents)),
      currency: 'EUR',
      available: input.available ?? true,
      tags: normalizeTags(input.tags),
      position: nextPosition,
      createdAt: now,
      updatedAt: now,
    }
    nextPosition += 1
    return record
  })

  await writeStore({
    items: [...store.items, ...created],
  })

  return created
}

export async function updateLocalFoodMenuItem(itemId: string, patch: UpdateLocalFoodMenuItemInput) {
  const store = await readStore()
  const current = store.items.find((item) => item.id === itemId)
  if (!current) {
    return null
  }

  const updated: LocalFoodMenuItemRecord = {
    ...current,
    category: patch.category ?? current.category,
    name: typeof patch.name === 'string' ? patch.name.trim() : current.name,
    description: typeof patch.description === 'string' ? patch.description.trim() : current.description,
    priceCents: typeof patch.priceCents === 'number' ? Math.max(0, Math.round(patch.priceCents)) : current.priceCents,
    available: typeof patch.available === 'boolean' ? patch.available : current.available,
    tags: Array.isArray(patch.tags) ? normalizeTags(patch.tags) : current.tags,
    updatedAt: new Date().toISOString(),
  }

  await writeStore({
    items: store.items.map((item) => (item.id === itemId ? updated : item)),
  })

  return updated
}
