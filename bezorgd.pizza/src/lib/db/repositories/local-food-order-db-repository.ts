import { readDbJsonFile, writeDbJsonFile } from '@/lib/db/client'
import { getSupabaseClient, isSupabaseAvailable } from '@/lib/db/supabase'
import type { LocalFoodOrderRecord } from '@/lib/local-food/local-food-types'

const LOCAL_FOOD_ORDER_STORE_PATH = 'local-food/orders.json'
const SUPABASE_TABLE = 'local_food_orders'

type LocalFoodOrderStore = {
  orders: LocalFoodOrderRecord[]
}

const EMPTY_LOCAL_FOOD_ORDER_STORE: LocalFoodOrderStore = {
  orders: [],
}

async function readLocalFoodOrderStore() {
  return readDbJsonFile(LOCAL_FOOD_ORDER_STORE_PATH, EMPTY_LOCAL_FOOD_ORDER_STORE)
}

async function writeLocalFoodOrderStore(store: LocalFoodOrderStore) {
  await writeDbJsonFile(LOCAL_FOOD_ORDER_STORE_PATH, store)
}

export async function createLocalFoodOrderRecord(order: LocalFoodOrderRecord) {
  if (isSupabaseAvailable()) {
    const supabase = getSupabaseClient()!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from(SUPABASE_TABLE) as any).insert({
      id: order.id,
      provider_did: order.providerDid,
      data: order,
    })
    return order
  }

  const store = await readLocalFoodOrderStore()
  await writeLocalFoodOrderStore({ orders: [order, ...store.orders] })
  return order
}

export async function findLocalFoodOrderRecordById(orderId: string) {
  if (isSupabaseAvailable()) {
    const supabase = getSupabaseClient()!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from(SUPABASE_TABLE) as any)
      .select('data')
      .eq('id', orderId)
      .single()
    return (data?.data as LocalFoodOrderRecord) ?? null
  }

  const store = await readLocalFoodOrderStore()
  return store.orders.find((order) => order.id === orderId) ?? null
}

export async function listLocalFoodOrderRecordsByProviderDid(providerDid: string) {
  if (isSupabaseAvailable()) {
    const supabase = getSupabaseClient()!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from(SUPABASE_TABLE) as any)
      .select('data')
      .eq('provider_did', providerDid)
      .order('created_at', { ascending: false })
    return ((data ?? []) as any[]).map((row) => row.data as LocalFoodOrderRecord)
  }

  const store = await readLocalFoodOrderStore()
  return store.orders
    .filter((order) => order.providerDid === providerDid)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export async function updateLocalFoodOrderRecord(orderId: string, updater: (order: LocalFoodOrderRecord) => LocalFoodOrderRecord) {
  if (isSupabaseAvailable()) {
    const supabase = getSupabaseClient()!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from(SUPABASE_TABLE) as any)
      .select('data')
      .eq('id', orderId)
      .single()

    if (!existing) return null

    const nextOrder = updater((existing as any).data as LocalFoodOrderRecord)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from(SUPABASE_TABLE) as any)
      .update({ data: nextOrder })
      .eq('id', orderId)
    return nextOrder
  }

  const store = await readLocalFoodOrderStore()
  const orderIndex = store.orders.findIndex((order) => order.id === orderId)
  if (orderIndex < 0) return null

  const nextOrder = updater(store.orders[orderIndex])
  const nextOrders = [...store.orders]
  nextOrders[orderIndex] = nextOrder
  await writeLocalFoodOrderStore({ orders: nextOrders })
  return nextOrder
}
