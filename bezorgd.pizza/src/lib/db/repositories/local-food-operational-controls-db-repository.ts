import { readDbJsonFile, writeDbJsonFile } from '@/lib/db/client'
import type { LocalFoodProviderOperationalControls } from '@/lib/local-food/local-food-types'

const LOCAL_FOOD_OPERATIONAL_CONTROLS_STORE_PATH = 'local-food/operational-controls.json'

type LocalFoodOperationalControlsStore = {
  controls: LocalFoodProviderOperationalControls[]
}

const EMPTY_LOCAL_FOOD_OPERATIONAL_CONTROLS_STORE: LocalFoodOperationalControlsStore = {
  controls: [],
}

async function readLocalFoodOperationalControlsStore() {
  return readDbJsonFile(LOCAL_FOOD_OPERATIONAL_CONTROLS_STORE_PATH, EMPTY_LOCAL_FOOD_OPERATIONAL_CONTROLS_STORE)
}

async function writeLocalFoodOperationalControlsStore(store: LocalFoodOperationalControlsStore) {
  await writeDbJsonFile(LOCAL_FOOD_OPERATIONAL_CONTROLS_STORE_PATH, store)
}

export async function findLocalFoodOperationalControlsByProviderDid(providerDid: string) {
  const store = await readLocalFoodOperationalControlsStore()
  return store.controls.find((entry) => entry.providerDid === providerDid) ?? null
}

export async function upsertLocalFoodOperationalControls(record: LocalFoodProviderOperationalControls) {
  const store = await readLocalFoodOperationalControlsStore()
  const existingIndex = store.controls.findIndex((entry) => entry.providerDid === record.providerDid)
  const nextControls = [...store.controls]

  if (existingIndex >= 0) {
    nextControls[existingIndex] = record
  } else {
    nextControls.push(record)
  }

  await writeLocalFoodOperationalControlsStore({
    controls: nextControls,
  })

  return record
}
