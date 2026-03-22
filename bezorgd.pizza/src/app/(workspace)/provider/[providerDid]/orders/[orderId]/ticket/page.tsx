import { notFound } from 'next/navigation'

import { getProviderOrder } from '@/lib/local-food/local-food-service'

function formatPrice(priceCents: number) {
  return `€${(priceCents / 100).toFixed(2)}`
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
    <section className="mx-auto max-w-2xl rounded-3xl border border-black bg-white p-6 text-black print:max-w-none print:rounded-none print:border-0 print:p-0">
      <div className="space-y-2 border-b border-dashed border-black pb-4">
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
