"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, MapPin, Pizza, Store } from 'lucide-react'

import ADPClient, { type LocalFoodDiscoverProvider } from '@/app/app/lib/adp-client'
import { useAgentStore } from '@/app/app/lib/agent-store'

function toEuroDisplay(priceCents: number | null) {
  if (typeof priceCents !== 'number') {
    return 'Menu pricing inside'
  }

  return `From €${(priceCents / 100).toFixed(2)}`
}

export default function FoodDiscoveryPage() {
  const router = useRouter()
  const { postcode, setPostcode } = useAgentStore()

  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<LocalFoodDiscoverProvider[]>([])
  const [searched, setSearched] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const hasResults = results.length > 0

  const handleSearch = async () => {
    if (!postcode.trim()) {
      setErrorMessage('Enter a postcode to discover nearby pizza providers')
      return
    }

    setIsSearching(true)
    setErrorMessage(null)
    setSearched(true)

    try {
      const client = new ADPClient()
      const response = await client.discoverLocalFoodProviders(postcode)
      setResults(response.providers || [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to search local pizza providers')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/app/consumer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-white">Order local pizza</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/45">
              Enter your postcode, browse nearby pizza partners, open a menu, and place a direct local order.
            </p>
          </div>
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
            Demo flow · postcode to order in a few clicks
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#111827] p-6">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.045]"
              style={{
                backgroundImage: "url('/images/pizza/pizza-pattern.png')",
                backgroundSize: '220px',
                backgroundRepeat: 'repeat',
              }}
            />
            <div className="relative flex items-center gap-3">
              <MapPin className="h-5 w-5 text-orange-300" />
              <div>
                <h2 className="text-lg font-semibold text-white">Find pizza near you</h2>
                <p className="mt-1 text-sm text-white/45">Search by postcode, open one supplier menu, and place a simple direct order.</p>
              </div>
            </div>
            <div className="relative mt-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
              Demo tip: try `1055 AB` to find seeded or manually configured Amsterdam West suppliers.
            </div>
            <div className="mt-4 grid gap-3 text-sm text-white/60 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">1. Enter a postcode</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">2. Open a supplier menu</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">3. Place a direct order</div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input value={postcode} onChange={(event) => setPostcode(event.target.value)} placeholder="1012, 1055, 3011…" className="flex-1 rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white placeholder:text-white/20 focus:border-orange-500/50 focus:outline-none" />
              <button type="button" onClick={handleSearch} disabled={isSearching} className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-medium text-orange-100 transition-colors hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60">
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pizza className="h-4 w-4" />}
                Search suppliers
              </button>
            </div>
          </div>

          <div className="relative hidden overflow-hidden rounded-3xl border border-white/5 bg-[#111827] lg:block">
            <Image
              src="/images/pizza/warm-dutch-local-delivery-photography.png"
              alt="Warm Dutch local delivery scene"
              fill
              className="object-cover"
              sizes="320px"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#0A0E17] via-[#0A0E17]/55 to-[#0A0E17]/10" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="inline-flex rounded-full border border-white/10 bg-[#0A0E17]/70 px-3 py-1 text-xs text-orange-100">
                Buurtgevoel
              </div>
              <div className="mt-3 text-lg font-semibold text-white">Lokale bezorging, eenvoudig uitgelegd</div>
              <div className="mt-1 text-sm text-white/65">
                Een warme demo-visual voor postcode, ontdekking en bezorging in de buurt.
              </div>
            </div>
          </div>
        </div>

        {errorMessage ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{errorMessage}</div> : null}

        {searched ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {hasResults ? (
              results.map((provider) => (
                <button key={provider.providerDid} type="button" onClick={() => router.push(`/app/food/provider/${encodeURIComponent(provider.providerDid)}`)} className="rounded-3xl border border-white/5 bg-[#111827] p-6 text-left transition-colors hover:border-white/10 hover:bg-[#141c2d]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">
                        <Store className="h-3.5 w-3.5" />
                        {provider.cuisineLabel}
                      </div>
                      <h3 className="mt-3 text-xl font-semibold text-white">{provider.businessName}</h3>
                      <p className="mt-2 text-sm text-white/45">{provider.summary}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                      {toEuroDisplay(provider.startingPriceCents)}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{provider.locationLabel || provider.coverageLabel || 'Local area'}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{provider.availableMenuItemCount} items</span>
                    {provider.fulfilmentModes.map((mode) => (
                      <span key={`${provider.providerDid}-${mode}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{mode}</span>
                    ))}
                  </div>
                </button>
              ))
            ) : (
              <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#111827] px-6 py-16 text-center text-sm text-white/45 lg:col-span-2">
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: "url('/images/pizza/pizza-pattern.png')",
                    backgroundSize: '220px',
                    backgroundRepeat: 'repeat',
                  }}
                />
                <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                  <Image
                    src="/images/pizza/isometric-food-shop.png"
                    alt="Isometric pizza shop illustration"
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <div className="relative mt-5 font-medium text-white">No live pizza providers found for this postcode yet.</div>
                <div className="relative mt-2">
                  Try a nearby postcode, use the demo postcode `1055 AB`, or open the supplier setup flow to publish a provider menu first.
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
