import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ProviderOperationalControls } from '../provider-operational-controls'
import { WorkspaceAutoRefresh } from '../workspace-auto-refresh'

import {
  findPublicRestaurantByProviderDid,
  getProviderOperationalControlsView,
  getProviderOrderBoard,
} from '@/lib/local-food/local-food-service'
import type { LocalFoodProviderOrderQueueItem, LocalFoodProviderQueueFilter } from '@/lib/local-food/local-food-types'

function formatPrice(priceCents: number) {
  return `€${(priceCents / 100).toFixed(2)}`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getMinutesSince(value: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
}

function getAgeLabel(value: string) {
  const minutes = getMinutesSince(value)

  if (minutes < 1) {
    return 'Zojuist'
  }

  if (minutes < 60) {
    return `${minutes} min geleden`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} u geleden`
  }

  return `${hours} u ${remainingMinutes} min geleden`
}

function getStatusAgeLabel(order: LocalFoodProviderOrderQueueItem) {
  if (order.status === 'received') {
    return `${order.currentStatusAgeLabel} nieuw`
  }

  if (order.status === 'preparing') {
    return `${order.currentStatusAgeLabel} in bereiding`
  }

  if (order.status === 'ready_for_pickup' || order.status === 'out_for_delivery') {
    return `${order.currentStatusAgeLabel} in deze stap`
  }

  return order.currentStatusAgeLabel
}

function getCardClassName(order: LocalFoodProviderOrderQueueItem) {
  switch (order.status) {
    case 'received':
      return 'border-red-400 bg-red-50 ring-2 ring-red-200 shadow-[0_14px_34px_rgba(220,38,38,0.12)]'
    case 'preparing':
      return 'border-orange-400 bg-orange-50 ring-1 ring-orange-200'
    case 'ready_for_pickup':
    case 'out_for_delivery':
      return 'border-amber-400 bg-amber-50 ring-1 ring-amber-200'
    case 'completed':
      return 'border-green-400 bg-green-50 opacity-80'
    case 'cancelled':
      return 'border-gray-300 bg-gray-50 opacity-50'
  }
}

function getStatusBadgeClassName(order: LocalFoodProviderOrderQueueItem) {
  switch (order.status) {
    case 'received':
      return 'border-red-500 bg-red-500 text-white'
    case 'preparing':
      return 'border-orange-500 bg-orange-500 text-white'
    case 'ready_for_pickup':
    case 'out_for_delivery':
      return 'border-amber-500 bg-amber-500 text-white'
    case 'completed':
      return 'border-green-600 bg-green-600 text-white'
    case 'cancelled':
      return 'border-gray-400 bg-gray-400 text-white'
  }
}

export default async function ProviderOrdersPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ providerDid: string }>
  searchParams: Promise<{ filter?: string; view?: string }>
}>) {
  const { providerDid } = await params
  const { filter, view } = await searchParams
  const resolvedProviderDid = decodeURIComponent(providerDid)
  const restaurantDetail = await findPublicRestaurantByProviderDid(resolvedProviderDid)

  if (!restaurantDetail) {
    notFound()
  }

  const activeFilter = (filter ?? 'all') as LocalFoodProviderQueueFilter
  const activeView = view === 'controls' ? 'controls' : 'intake'
  const controlsView = await getProviderOperationalControlsView(restaurantDetail.restaurant.providerDid)
  const board = await getProviderOrderBoard(restaurantDetail.restaurant.providerDid, activeFilter)

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-orange-200 bg-white p-4 shadow-[0_14px_40px_rgba(96,42,16,0.06)] sm:p-5">
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/provider/${encodeURIComponent(restaurantDetail.restaurant.providerDid)}/orders?filter=${board.activeFilter}`}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              activeView === 'intake'
                ? 'border-[#c85b24] bg-[#c85b24] text-white'
                : 'border-orange-200 bg-white text-[#6a3c24] hover:bg-[#fffaf4]'
            }`}
          >
            Balie intake
          </Link>
          <Link
            href={`/provider/${encodeURIComponent(restaurantDetail.restaurant.providerDid)}/orders?view=controls&filter=${board.activeFilter}`}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              activeView === 'controls'
                ? 'border-[#c85b24] bg-[#c85b24] text-white'
                : 'border-orange-200 bg-white text-[#6a3c24] hover:bg-[#fffaf4]'
            }`}
          >
            Rustknoppen
          </Link>
        </div>
      </section>

      {activeView === 'intake' ? (
      <section className="space-y-6 rounded-4xl border border-orange-200 bg-white p-6 shadow-[0_14px_40px_rgba(96,42,16,0.06)] sm:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Balie / intake</p>
            <h3 className="text-3xl font-semibold text-[#2f160c]">Voorkant ziet direct wat nu binnenkomt</h3>
            <p className="max-w-3xl text-sm leading-6 text-[#6a3c24]">
              Nieuwe orders, klantcontext en fulfilment staan voorop. Zo kan de balie snel intake doen, bevestigen en de keuken gericht voeden zonder onnodige ruis.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] px-4 py-3 text-sm text-[#6a3c24]">
              {board.summary.total} opgeslagen bestelling{board.summary.total === 1 ? '' : 'en'}
            </div>
            <WorkspaceAutoRefresh />
          </div>
        </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-[#c85b24] bg-[#fff1ea] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a4a1b]">Aandacht nu</p>
          <p className="mt-2 text-3xl font-semibold text-[#2f160c]">{board.summary.attentionCount}</p>
        </div>
        <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a4a1b]">Nieuw</p>
          <p className="mt-2 text-3xl font-semibold text-[#2f160c]">{board.summary.newCount}</p>
        </div>
        <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a4a1b]">In bereiding</p>
          <p className="mt-2 text-3xl font-semibold text-[#2f160c]">{board.summary.preparingCount}</p>
        </div>
        <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a4a1b]">Klaar / onderweg</p>
          <p className="mt-2 text-3xl font-semibold text-[#2f160c]">{board.summary.readyCount}</p>
        </div>
        <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a4a1b]">Afgerond</p>
          <p className="mt-2 text-3xl font-semibold text-[#2f160c]">{board.summary.completedCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {board.filters.map((option) => {
          const isActive = option.value === board.activeFilter

          return (
            <Link
              key={option.value}
              href={`/provider/${encodeURIComponent(board.providerDid)}/orders?filter=${option.value}`}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'border-[#c85b24] bg-[#c85b24] text-white'
                  : 'border-orange-200 bg-white text-[#6a3c24] hover:bg-[#fffaf4]'
              }`}
            >
              {option.label} · {option.count}
            </Link>
          )
        })}
      </div>

      {board.orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-orange-200 bg-[#fffaf4] p-8 text-sm leading-6 text-[#6a3c24]">
          Er staan geen orders in deze selectie. Wissel van filter of wacht op een nieuwe publieke bevestiging.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {board.orders.map((order) => (
            <Link
              key={order.id}
              href={`/provider/${encodeURIComponent(order.providerDid)}/orders/${order.id}`}
              className={`block rounded-3xl border p-5 transition hover:border-[#c85b24] hover:shadow-[0_10px_30px_rgba(96,42,16,0.10)] ${getCardClassName(order)}`}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#9a4a1b]">
                    <span>{order.orderReference}</span>
                    <span className={`rounded-full border px-3 py-1 normal-case tracking-normal ${getStatusBadgeClassName(order)}`}>
                      {order.statusLabel}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#2f160c]">{getAgeLabel(order.createdAt)}</p>
                    <p className="text-xs text-[#6a3c24]">{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-2xl font-semibold text-[#2f160c]">{order.customerName}</h4>
                    <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-sm font-semibold text-[#6a3c24]">
                      {order.fulfilmentLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm leading-6 text-[#6a3c24]">
                    <span className="rounded-full bg-white px-3 py-1 font-semibold text-[#2f160c]">{order.itemCount} items</span>
                    <span>{formatPrice(order.subtotalCents)}</span>
                    <span>Baliecontext: {order.statusLabel.toLowerCase()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-[#6a3c24]">{order.paymentStatusLabel}</span>
                </div>

                <div className="rounded-2xl bg-white/80 p-4 text-sm text-[#6a3c24]">
                  <p className="font-semibold text-[#2f160c]">{order.nextActionLabel ? `Doorzetten naar: ${order.nextActionLabel}` : 'Geen vervolgstap meer open'}</p>
                  <p className="mt-1">{order.operationalHint}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#9a4a1b]">
                    {getStatusAgeLabel(order)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      </section>
      ) : null}

      {activeView === 'controls' && controlsView ? (
        <ProviderOperationalControls providerDid={restaurantDetail.restaurant.providerDid} initialView={controlsView} />
      ) : null}
    </div>
  )
}
