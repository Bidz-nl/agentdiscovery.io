import { notFound } from 'next/navigation'

import type { LocalFoodOrderStatus } from '@/lib/local-food/local-food-types'
import { getProviderOrder } from '@/lib/local-food/local-food-service'

function formatPrice(priceCents: number) {
  return `€${(priceCents / 100).toFixed(2)}`
}

function getStatusBarClass(status: LocalFoodOrderStatus) {
  switch (status) {
    case 'received':
      return 'bg-red-500 text-white'
    case 'preparing':
      return 'bg-orange-500 text-white'
    case 'ready_for_pickup':
    case 'out_for_delivery':
      return 'bg-amber-400 text-black'
    case 'completed':
      return 'bg-green-500 text-white'
    case 'cancelled':
      return 'bg-gray-400 text-white'
  }
}

export default async function ProviderOrderTicketPage({
  params,
}: Readonly<{
  params: Promise<{ providerDid: string; orderId: string }>
}>) {
  const { providerDid, orderId } = await params
  const order = await getProviderOrder(decodeURIComponent(providerDid), orderId)

  if (!order) {
    notFound()
  }

  return (
    <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-black bg-white text-black print:max-w-none print:rounded-none print:border-0">
      <div className={`px-6 py-3 text-center text-sm font-bold uppercase tracking-widest print:hidden ${getStatusBarClass(order.status)}`}>
        {order.statusLabel}
      </div>
      <div className="space-y-2 border-b border-dashed border-black p-6 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Keukenbon</p>
        <h1 className="text-3xl font-semibold">{order.orderReference}</h1>
        <p className="text-sm">
          {order.customer.name} · {order.fulfilmentLabel}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {order.items.map((item) => (
          <div key={item.menuItemId} className="border-b border-dashed border-black pb-4 last:border-b-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-semibold">{item.quantity} × {item.name}</p>
                {item.note ? <p className="mt-1 text-sm">Notitie: {item.note}</p> : null}
                {item.modifiers.length > 0 ? (
                  <div className="mt-2 space-y-1 text-sm">
                    {item.modifiers.map((modifier) => (
                      <p key={`${item.menuItemId}-${modifier.id}`}>+ {modifier.label} × {modifier.quantity}</p>
                    ))}
                  </div>
                ) : null}
              </div>
              <p className="text-lg font-semibold">{formatPrice(item.lineTotalCents)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-dashed border-black pt-4">
        <p className="text-lg font-semibold">Totaal</p>
        <p className="text-lg font-semibold">{formatPrice(order.subtotalCents)}</p>
      </div>
    </section>
  )
}
