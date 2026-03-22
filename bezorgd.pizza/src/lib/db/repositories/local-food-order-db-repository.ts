import { readDbJsonFile, writeDbJsonFile } from '@/lib/db/client'
import type { LocalFoodOrderRecord } from '@/lib/local-food/local-food-types'

const LOCAL_FOOD_ORDER_STORE_PATH = 'local-food/orders.json'

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
  const store = await readLocalFoodOrderStore()
  const nextStore: LocalFoodOrderStore = {
    orders: [order, ...store.orders],
  }

  await writeLocalFoodOrderStore(nextStore)

  return order
}

export async function findLocalFoodOrderRecordById(orderId: string) {
  const store = await readLocalFoodOrderStore()
  return store.orders.find((order) => order.id === orderId) ?? null
}

export async function listLocalFoodOrderRecordsByProviderDid(providerDid: string) {
  const store = await readLocalFoodOrderStore()

  return store.orders
    .filter((order) => order.providerDid === providerDid)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export async function updateLocalFoodOrderRecord(orderId: string, updater: (order: LocalFoodOrderRecord) => LocalFoodOrderRecord) {
  const store = await readLocalFoodOrderStore()
  const orderIndex = store.orders.findIndex((order) => order.id === orderId)

  if (orderIndex < 0) {
    return null
  }

  const currentOrder = store.orders[orderIndex]
  const nextOrder = updater(currentOrder)
  const nextOrders = [...store.orders]
  nextOrders[orderIndex] = nextOrder

  await writeLocalFoodOrderStore({
    orders: nextOrders,
  })

  return nextOrder
}
