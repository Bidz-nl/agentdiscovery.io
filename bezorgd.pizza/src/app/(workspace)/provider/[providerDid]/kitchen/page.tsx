import Link from 'next/link'
import { notFound } from 'next/navigation'

import { WorkspaceAutoRefresh } from '../workspace-auto-refresh'

import { findPublicRestaurantByProviderDid, getProviderOrderBoard } from '@/lib/local-food/local-food-service'
import type { LocalFoodProviderOrderQueueItem } from '@/lib/local-food/local-food-types'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getKitchenOrders(orders: LocalFoodProviderOrderQueueItem[]) {
  return orders.filter((order) => order.status !== 'completed' && order.status !== 'cancelled')
}

function getKitchenCardClassName(order: LocalFoodProviderOrderQueueItem) {
  switch (order.status) {
    case 'received':
      return 'border-red-400 bg-red-50 ring-2 ring-red-200 shadow-[0_14px_34px_rgba(220,38,38,0.12)]'
    case 'preparing':
      return 'border-orange-400 bg-orange-50 ring-1 ring-orange-200'
    case 'ready_for_pickup':
    case 'out_for_delivery':
      return 'border-amber-400 bg-amber-50 ring-1 ring-amber-200'
    default:
      return 'border-green-400 bg-green-50 opacity-80'
  }
}

export default async function ProviderKitchenPage({
  params,
}: Readonly<{
  params: Promise<{ providerDid: string }>
}>) {
  const { providerDid } = await params
  const resolvedProviderDid = decodeURIComponent(providerDid)
  const restaurantDetail = await findPublicRestaurantByProviderDid(resolvedProviderDid)

  if (!restaurantDetail) {
    notFound()
  }

  const board = await getProviderOrderBoard(restaurantDetail.restaurant.providerDid, 'attention')
  const kitchenOrders = getKitchenOrders(board.orders)

  return (
    <section className="space-y-6 rounded-4xl border border-orange-200 bg-white p-6 shadow-[0_14px_40px_rgba(96,42,16,0.06)] sm:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Keuken / productie</p>
          <h3 className="text-3xl font-semibold text-[#2f160c]">Wat nu gemaakt moet worden staat vooraan</h3>
          <p className="max-w-3xl text-sm leading-6 text-[#6a3c24]">
            Productie ziet alleen wat nu gemaakt of afgerond moet worden. Aantallen, modifiers en notities krijgen voorrang; ruis blijft op de achtergrond.
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] px-4 py-3 text-sm text-[#6a3c24]">
            {kitchenOrders.length} actieve keukenorder{kitchenOrders.length === 1 ? '' : 's'}
          </div>
          <WorkspaceAutoRefresh />
        </div>
      </div>

      {kitchenOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-orange-200 bg-[#fffaf4] p-8 text-sm leading-6 text-[#6a3c24]">
          Er staat nu niets open voor productie. Nieuwe orders of lopende bereiding verschijnen hier vanzelf.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {kitchenOrders.map((order) => (
            <Link
              key={order.id}
              href={`/provider/${encodeURIComponent(order.providerDid)}/orders/${order.id}/ticket`}
              className={`block rounded-3xl border p-5 transition hover:border-[#c85b24] hover:shadow-[0_10px_30px_rgba(96,42,16,0.10)] ${getKitchenCardClassName(order)}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9a4a1b]">{order.orderReference}</p>
                    <h4 className="mt-2 text-2xl font-semibold text-[#2f160c]">{order.fulfilmentLabel}</h4>
                  </div>
                  <div className="text-right text-sm text-[#6a3c24]">
                    <p className="font-semibold text-[#2f160c]">{order.currentStatusAgeLabel}</p>
                    <p>{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-2xl border-2 border-[#2f160c] px-4 py-2 text-2xl font-bold text-[#2f160c]">{order.itemCount}</span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#9a4a1b]">Klant / referentie</p>
                    <p className="text-lg font-semibold text-[#2f160c]">{order.customerName}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/80 p-4 text-sm text-[#6a3c24]">
                  <p className="font-semibold text-[#2f160c]">{order.operationalHint}</p>
                  <p className="mt-1">Open de keukenbon voor de volledige maaklijst met notities en modifiers.</p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-[#6a3c24]">{order.statusLabel}</span>
                  <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-[#6a3c24]">{order.paymentStatusLabel}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
