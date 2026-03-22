import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { ProviderWorkspaceNav } from './provider-workspace-nav'
import { ProviderWorkspaceSignOut } from '../provider-workspace-sign-out'

import { findPublicRestaurantByProviderDid } from '@/lib/local-food/local-food-service'
import { getAuthorizedProviderWorkspaceSession } from '@/lib/provider-workspace/provider-workspace-auth'

export default async function ProviderScopedLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ providerDid: string }>
}>) {
  const { providerDid } = await params
  const resolvedProviderDid = decodeURIComponent(providerDid)
  const session = await getAuthorizedProviderWorkspaceSession(resolvedProviderDid)

  if (!session) {
    redirect('/login')
  }

  const restaurantDetail = await findPublicRestaurantByProviderDid(resolvedProviderDid)

  if (!restaurantDetail) {
    notFound()
  }

  const activeProviderDid = restaurantDetail.restaurant.providerDid

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-orange-200 bg-white p-6 shadow-[0_14px_40px_rgba(96,42,16,0.06)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Restaurant workspace</p>
            <div>
              <h2 className="text-3xl font-semibold text-[#2f160c]">{restaurantDetail.restaurant.businessName}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6a3c24]">{restaurantDetail.restaurant.summary}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/provider"
              className="rounded-full border border-orange-200 px-4 py-2 font-medium text-[#6a3c24] transition hover:border-[#c85b24] hover:text-[#2f160c]"
            >
              Wissel restaurant
            </Link>
            <ProviderWorkspaceNav providerDid={activeProviderDid} />
            <ProviderWorkspaceSignOut />
          </div>
        </div>
      </section>
      {children}
    </div>
  )
}
