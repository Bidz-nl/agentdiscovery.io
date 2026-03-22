import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getDataRoot } from '@/lib/project-paths'
import type {
  LocalFoodOrderRecord,
  LocalFoodOrderStatus,
  LocalFoodOrderStatusEvent,
} from '@/lib/local-food/local-food-types'

type LocalFoodOrderStore = {
  orders: LocalFoodOrderRecord[]
}

const STORE_DIRECTORY = getDataRoot()
const STORE_FILE = path.join(STORE_DIRECTORY, 'local-food-orders.json')

function ensureStore() {
  if (!existsSync(STORE_DIRECTORY)) {
    mkdirSync(STORE_DIRECTORY, { recursive: true })
  }

  if (!existsSync(STORE_FILE)) {
    writeFileSync(STORE_FILE, JSON.stringify({ orders: [] }, null, 2), 'utf8')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isStatus(value: unknown): value is LocalFoodOrderStatus {
  return value === 'submitted' || value === 'confirmed' || value === 'preparing' || value === 'ready' || value === 'completed' || value === 'cancelled'
}

function isStatusTimeline(value: unknown): value is LocalFoodOrderStatusEvent[] {
  return Array.isArray(value) && value.every((entry) => isRecord(entry) && isStatus(entry.status) && typeof entry.at === 'string' && (entry.note === null || typeof entry.note === 'string'))
}

function toOrderRecord(value: unknown): LocalFoodOrderRecord | null {
  if (!isRecord(value) || !isRecord(value.payment)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.providerDid !== 'string' ||
    (value.customerDid !== null && typeof value.customerDid !== 'string') ||
    typeof value.customerName !== 'string' ||
    typeof value.customerPhone !== 'string' ||
    typeof value.customerPostcode !== 'string' ||
    typeof value.customerAddressLine !== 'string' ||
    typeof value.customerNotes !== 'string' ||
    (value.fulfilmentMode !== 'delivery' && value.fulfilmentMode !== 'pickup') ||
    !Array.isArray(value.items) ||
    typeof value.subtotalCents !== 'number' ||
    typeof value.totalCents !== 'number' ||
    value.currency !== 'EUR' ||
    value.payment.mode !== 'placeholder' ||
    value.payment.status !== 'pending' ||
    typeof value.payment.displayLabel !== 'string' ||
    typeof value.payment.checkoutReference !== 'string' ||
    !isStatus(value.status) ||
    !isStatusTimeline(value.statusTimeline) ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    return null
  }

  return value as unknown as LocalFoodOrderRecord
}

function readStore(): LocalFoodOrderStore {
  if (!existsSync(STORE_FILE)) {
    return { orders: [] }
  }

  try {
    const raw = readFileSync(STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<LocalFoodOrderStore>

    return {
      orders: Array.isArray(parsed.orders)
        ? parsed.orders.map((entry) => toOrderRecord(entry)).filter((entry): entry is LocalFoodOrderRecord => Boolean(entry))
        : [],
    }
  } catch {
    return { orders: [] }
  }
}

function writeStore(store: LocalFoodOrderStore) {
  ensureStore()
  const temporaryFile = `${STORE_FILE}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8')
  renameSync(temporaryFile, STORE_FILE)
}

export function listLocalFoodOrders() {
  return readStore().orders
}

export function listLocalFoodOrdersByProvider(providerDid: string) {
  return readStore().orders
    .filter((order) => order.providerDid === providerDid)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export function getLocalFoodOrder(orderId: string) {
  return readStore().orders.find((order) => order.id === orderId) ?? null
}

export function createLocalFoodOrderRecord(input: Omit<LocalFoodOrderRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  const store = readStore()
  const now = new Date().toISOString()
  const record: LocalFoodOrderRecord = {
    id: `lf_order_${randomUUID().replace(/-/g, '')}`,
    createdAt: now,
    updatedAt: now,
    ...input,
  }

  writeStore({
    orders: [...store.orders, record],
  })

  return record
}

export function updateLocalFoodOrderRecord(
  orderId: string,
  updater: (current: LocalFoodOrderRecord) => LocalFoodOrderRecord
) {
  const store = readStore()
  const current = store.orders.find((order) => order.id === orderId)
  if (!current) {
    return null
  }

  const updated: LocalFoodOrderRecord = {
    ...updater(current),
    updatedAt: new Date().toISOString(),
  }

  writeStore({
    orders: store.orders.map((order) => (order.id === orderId ? updated : order)),
  })

  return updated
}
