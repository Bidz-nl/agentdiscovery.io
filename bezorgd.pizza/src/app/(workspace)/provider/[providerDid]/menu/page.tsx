import { notFound } from 'next/navigation'

import { ProviderMenuEditor } from '../provider-menu-editor'

import { getProviderMenuEditorView } from '@/lib/local-food/local-food-service'

export default async function ProviderMenuPage({
  params,
}: Readonly<{
  params: Promise<{ providerDid: string }>
}>) {
  const { providerDid } = await params
  const resolvedProviderDid = decodeURIComponent(providerDid)
  const view = await getProviderMenuEditorView(resolvedProviderDid)

  if (!view) {
    notFound()
  }

  return (
    <section className="space-y-6 rounded-4xl border border-orange-200 bg-white p-6 shadow-[0_14px_40px_rgba(96,42,16,0.06)] sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Menu beheer</p>
        <h3 className="text-3xl font-semibold text-[#2f160c]">Beheer categorieën en gerechten op één plek</h3>
        <p className="max-w-3xl text-sm leading-6 text-[#6a3c24]">
          Wat je hier opslaat loopt direct door naar de publieke restaurantpagina. Zo krijgt ieder restaurant eindelijk een eigen plek om het menu echt te onderhouden.
        </p>
      </div>

      <ProviderMenuEditor providerDid={resolvedProviderDid} initialView={view} />
    </section>
  )
}
