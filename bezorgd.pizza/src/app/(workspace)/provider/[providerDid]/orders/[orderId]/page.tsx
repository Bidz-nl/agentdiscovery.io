import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ProviderOrderActions } from './provider-order-actions'

import { getProviderOrder } from '@/lib/local-food/local-food-service'

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

export default async function ProviderOrderDetailPage({
  params,
}: Readonly<{
  params: Promise<{ providerDid: string; orderId: string }>
}>) {
  const { providerDid, orderId } = await params
  const resolvedProviderDid = decodeURIComponent(providerDid)
  const order = await getProviderOrder(resolvedProviderDid, orderId)

  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-orange-200 bg-white p-6 shadow-[0_14px_40px_rgba(96,42,16,0.06)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link href={`/provider/${encodeURIComponent(order.providerDid)}/orders`} className="inline-flex text-sm font-medium text-[#9a4a1b] hover:text-[#7d3411]">
              ← Terug naar orderlijst
            </Link>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Order detail</p>
              <h3 className="mt-2 text-3xl font-semibold text-[#2f160c]">{order.orderReference}</h3>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-[#6a3c24]">
              <span className="rounded-full border border-orange-200 bg-[#fffaf4] px-3 py-1">{order.statusLabel}</span>
              <span className="rounded-full border border-orange-200 bg-[#fffaf4] px-3 py-1">{order.paymentStatusLabel}</span>
              <span className="rounded-full border border-orange-200 bg-[#fffaf4] px-3 py-1">{order.fulfilmentLabel}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="space-y-1 text-sm text-[#6a3c24] lg:text-right">
              <p>Ontvangen: {formatDateTime(order.createdAt)}</p>
              <p>Laatst bijgewerkt: {formatDateTime(order.updatedAt)}</p>
            </div>
            <Link
              href={`/provider/${encodeURIComponent(order.providerDid)}/orders/${order.id}/ticket`}
              className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-[#6a3c24] transition hover:bg-[#fff3ea]"
            >
              Open keukenbon
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6 rounded-4xl border border-orange-200 bg-white p-6 shadow-[0_14px_40px_rgba(96,42,16,0.06)] sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Bestelling</p>
            <h4 className="mt-2 text-2xl font-semibold text-[#2f160c]">{order.customer.name}</h4>
            <p className="mt-1 text-sm text-[#6a3c24]">{order.customer.phone} · {order.customer.postcode} · {order.customer.address}</p>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.menuItemId} className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h5 className="font-semibold text-[#2f160c]">{item.name}</h5>
                    <p className="mt-1 text-sm text-[#6a3c24]">{item.quantity} × {formatPrice(item.unitPriceCents)}</p>
                  </div>
                  <p className="font-semibold text-[#2f160c]">{formatPrice(item.lineTotalCents)}</p>
                </div>
                {item.note ? <p className="mt-3 text-sm text-[#6a3c24]">Notitie: {item.note}</p> : null}
                {item.modifiers.length > 0 ? (
                  <div className="mt-3 space-y-1 text-sm text-[#6a3c24]">
                    {item.modifiers.map((modifier) => (
                      <p key={`${item.menuItemId}-${modifier.id}`}>+ {modifier.label} × {modifier.quantity}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-4">
            <div className="flex items-center justify-between text-sm text-[#6a3c24]">
              <span>Aantal items</span>
              <span>{order.itemCount}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-base font-semibold text-[#2f160c]">
              <span>Totaal</span>
              <span>{formatPrice(order.subtotalCents)}</span>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-4xl border border-orange-200 bg-white p-6 shadow-[0_14px_40px_rgba(96,42,16,0.06)] sm:p-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Acties</p>
            <h4 className="text-2xl font-semibold text-[#2f160c]">Werk de order gecontroleerd bij</h4>
            <p className="text-sm leading-6 text-[#6a3c24]">Grote, directe acties voor de vloer. De keukenbon kan later compact en printvriendelijk verder worden aangescherpt.</p>
          </div>

          <ProviderOrderActions
            providerDid={order.providerDid}
            orderId={order.id}
            availableStatusActions={order.availableStatusActions}
            paymentPreparation={order.paymentPreparation}
          />
        </section>
      </div>
    </div>
  )
}
