import {
  findLocalFoodOperationalControlsByProviderDid,
  upsertLocalFoodOperationalControls,
} from '@/lib/db/repositories/local-food-operational-controls-db-repository'
import type { LocalFoodProviderOperationalControls } from '@/lib/local-food/local-food-types'

function createDefaultControls(providerDid: string): LocalFoodProviderOperationalControls {
  return {
    providerDid,
    paused: false,
    pausedReason: null,
    disabledFulfilmentModes: [],
    forcedFulfilmentMode: null,
    leadTimeOffsetMinutes: 0,
    disabledCategoryIds: [],
    disabledMenuItemIds: [],
    pressureMessage: null,
    updatedAt: null,
  }
}

export async function getLocalFoodOperationalControls(providerDid: string) {
  const stored = await findLocalFoodOperationalControlsByProviderDid(providerDid)
  return stored ?? createDefaultControls(providerDid)
}

export async function saveLocalFoodOperationalControls(record: LocalFoodProviderOperationalControls) {
  return upsertLocalFoodOperationalControls(record)
}
