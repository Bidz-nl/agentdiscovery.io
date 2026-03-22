import { redirect } from 'next/navigation'

import { ProviderLoginForm } from './provider-login-form'

import { listPublicRestaurants } from '@/lib/local-food/local-food-service'
import { getProviderWorkspaceSession } from '@/lib/provider-workspace/provider-workspace-auth'

export default async function WorkspaceLoginPage() {
  const session = await getProviderWorkspaceSession()

  if (session?.activeProviderDid) {
    redirect(`/provider/${encodeURIComponent(session.activeProviderDid)}/orders`)
  }

  const providers = (await listPublicRestaurants()).map((restaurant) => ({
    providerDid: restaurant.providerDid,
    businessName: restaurant.businessName,
    locationLabel: restaurant.locationLabel,
  }))

  return (
    <div className="mx-auto max-w-3xl">
      <ProviderLoginForm providers={providers} />
    </div>
  )
}
