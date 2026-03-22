import {
  findLocalFoodProviderMenuByProviderDid,
  upsertLocalFoodProviderMenu,
} from '@/lib/db/repositories/local-food-menu-db-repository'
import type { LocalFoodProviderMenuRecord } from '@/lib/local-food/local-food-types'

export async function getLocalFoodProviderMenu(providerDid: string) {
  return findLocalFoodProviderMenuByProviderDid(providerDid)
}

export async function saveLocalFoodProviderMenu(record: LocalFoodProviderMenuRecord) {
  return upsertLocalFoodProviderMenu(record)
}
