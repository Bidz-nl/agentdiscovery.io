import { readDbJsonFile, writeDbJsonFile } from '@/lib/db/client'
import type { LocalFoodProviderMenuRecord } from '@/lib/local-food/local-food-types'

const LOCAL_FOOD_MENU_STORE_PATH = 'local-food/menus.json'

type LocalFoodMenuStore = {
  menus: LocalFoodProviderMenuRecord[]
}

const EMPTY_LOCAL_FOOD_MENU_STORE: LocalFoodMenuStore = {
  menus: [],
}

async function readLocalFoodMenuStore() {
  return readDbJsonFile(LOCAL_FOOD_MENU_STORE_PATH, EMPTY_LOCAL_FOOD_MENU_STORE)
}

async function writeLocalFoodMenuStore(store: LocalFoodMenuStore) {
  await writeDbJsonFile(LOCAL_FOOD_MENU_STORE_PATH, store)
}

export async function findLocalFoodProviderMenuByProviderDid(providerDid: string) {
  const store = await readLocalFoodMenuStore()
  return store.menus.find((entry) => entry.providerDid === providerDid) ?? null
}

export async function upsertLocalFoodProviderMenu(record: LocalFoodProviderMenuRecord) {
  const store = await readLocalFoodMenuStore()
  const existingIndex = store.menus.findIndex((entry) => entry.providerDid === record.providerDid)
  const nextMenus = [...store.menus]

  if (existingIndex >= 0) {
    nextMenus[existingIndex] = record
  } else {
    nextMenus.push(record)
  }

  await writeLocalFoodMenuStore({
    menus: nextMenus,
  })

  return record
}
