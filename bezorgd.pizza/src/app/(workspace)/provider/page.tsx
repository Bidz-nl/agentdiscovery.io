import Link from 'next/link'
import { redirect } from 'next/navigation'

import { listPublicRestaurants } from '@/lib/local-food/local-food-service'
import { getProviderWorkspaceSession } from '@/lib/provider-workspace/provider-workspace-auth'

export default async function ProviderWorkspaceEntryPage() {
  const session = await getProviderWorkspaceSession()

  if (!session) {
    redirect('/login')
  }

  const restaurants = (await listPublicRestaurants()).filter((restaurant) =>
    session.authorizedProviderDids.includes(restaurant.providerDid)
  )

  if (restaurants.length === 1) {
    redirect(`/provider/${encodeURIComponent(restaurants[0].providerDid)}/orders`)
  }

  return (
    <section className="space-y-6 rounded-4xl border border-orange-200 bg-white p-6 shadow-[0_14px_40px_rgba(96,42,16,0.06)] sm:p-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Workspace start</p>
        <h2 className="text-3xl font-semibold text-[#2f160c]">Kies een restaurant om de orderqueue te openen</h2>
        <p className="max-w-3xl text-sm leading-6 text-[#6a3c24]">Kies de zaak waarvoor je bent aangemeld en open het operationele orderscherm.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {restaurants.map((restaurant) => (
          <Link
            key={restaurant.providerDid}
            href={`/provider/${encodeURIComponent(restaurant.providerDid)}/orders`}
            className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-5 transition hover:border-[#c85b24] hover:bg-[#fff3ea]"
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Provider</p>
                <h3 className="mt-2 text-xl font-semibold text-[#2f160c]">{restaurant.businessName}</h3>
              </div>
              <p className="text-sm leading-6 text-[#6a3c24]">{restaurant.summary}</p>
              <div className="space-y-1 text-sm text-[#6a3c24]">
                <p>{restaurant.locationLabel}</p>
                <p>{restaurant.fulfilmentModes.join(' · ')}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
