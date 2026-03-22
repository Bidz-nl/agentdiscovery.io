import { randomUUID } from 'node:crypto'

import { kvRead, kvWrite } from '@/lib/kv-store'
import type {
  LocalFoodOrderRecord,
  LocalFoodOrderStatus,
  LocalFoodOrderStatusEvent,
} from '@/lib/local-food/local-food-types'

type LocalFoodOrderStore = {
  orders: LocalFoodOrderRecord[]
}

const KV_KEY = 'localfood:orders'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
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

async function readStore(): Promise<LocalFoodOrderStore> {
  const raw = await kvRead<LocalFoodOrderStore | null>(KV_KEY, null)
  if (!raw) {
    return { orders: [] }
  }
  try {
    return {
      orders: Array.isArray(raw.orders)
        ? raw.orders.map((entry) => toOrderRecord(entry)).filter((entry): entry is LocalFoodOrderRecord => Boolean(entry))
        : [],
    }
  } catch {
    return { orders: [] }
  }
}

async function writeStore(store: LocalFoodOrderStore): Promise<void> {
  await kvWrite(KV_KEY, store)
}

export async function listLocalFoodOrders() {
  return (await readStore()).orders
}

export async function listLocalFoodOrdersByProvider(providerDid: string) {
  return (await readStore()).orders
    .filter((order) => order.providerDid === providerDid)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export async function getLocalFoodOrder(orderId: string) {
  return (await readStore()).orders.find((order) => order.id === orderId) ?? null
}

export async function createLocalFoodOrderRecord(input: Omit<LocalFoodOrderRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  const store = await readStore()
  const now = new Date().toISOString()
  const record: LocalFoodOrderRecord = {
    id: `lf_order_${randomUUID().replace(/-/g, '')}`,
    createdAt: now,
    updatedAt: now,
    ...input,
  }

  await writeStore({
    orders: [...store.orders, record],
  })

  return record
}

export async function updateLocalFoodOrderRecord(
  orderId: string,
  updater: (current: LocalFoodOrderRecord) => LocalFoodOrderRecord
) {
  const store = await readStore()
  const current = store.orders.find((order) => order.id === orderId)
  if (!current) {
    return null
  }

  const updated: LocalFoodOrderRecord = {
    ...updater(current),
    updatedAt: new Date().toISOString(),
  }

  await writeStore({
    orders: store.orders.map((order) => (order.id === orderId ? updated : order)),
  })

  return updated
}
