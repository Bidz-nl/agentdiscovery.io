"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Minus, Plus, ShoppingCart } from 'lucide-react'

import ADPClient, { type LocalFoodProviderPublicResponse } from '@/app/app/lib/adp-client'
import { useAgentStore } from '@/app/app/lib/agent-store'

type CartState = Record<string, number>

function toEuroDisplay(priceCents: number) {
  return `€${(priceCents / 100).toFixed(2)}`
}

function toFulfilmentLabel(mode: 'delivery' | 'pickup') {
  return mode === 'delivery' ? 'Bezorgen' : 'Afhalen'
}

export default function FoodProviderPage() {
  const params = useParams<{ providerDid: string }>()
  const providerDid = typeof params.providerDid === 'string' ? decodeURIComponent(params.providerDid) : ''
  const { agentIdentity, postcode, setPostcode } = useAgentStore()

  const [providerResponse, setProviderResponse] = useState<LocalFoodProviderPublicResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [cart, setCart] = useState<CartState>({})
  const [customerName, setCustomerName] = useState(agentIdentity.name || '')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddressLine, setCustomerAddressLine] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [fulfilmentMode, setFulfilmentMode] = useState<'delivery' | 'pickup'>('delivery')

  const loadProvider = useCallback(async () => {
    if (!providerDid) {
      setLoading(false)
      return
    }

    try {
      setErrorMessage(null)
      const client = new ADPClient()
      const response = await client.getLocalFoodProvider(providerDid)
      setProviderResponse(response)
      setFulfilmentMode(response.provider.fulfilmentModes.includes('delivery') ? 'delivery' : response.provider.fulfilmentModes[0] || 'delivery')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load provider menu')
    } finally {
      setLoading(false)
    }
  }, [providerDid])

  useEffect(() => {
    loadProvider()
  }, [loadProvider])

  const menuItems = useMemo(() => providerResponse?.menuItems ?? [], [providerResponse?.menuItems])
  const hasMenuItems = menuItems.length > 0
  const cartItems = useMemo(
    () =>
      menuItems
        .filter((item) => (cart[item.id] ?? 0) > 0)
        .map((item) => ({
          ...item,
          quantity: cart[item.id] ?? 0,
          lineTotalCents: item.priceCents * (cart[item.id] ?? 0),
        })),
    [cart, menuItems]
  )

  const totalCents = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.lineTotalCents, 0),
    [cartItems]
  )

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((current) => {
      const nextQuantity = Math.max(0, (current[menuItemId] ?? 0) + delta)
      if (nextQuantity === 0) {
        const rest = { ...current }
        delete rest[menuItemId]
        return rest
      }
      return {
        ...current,
        [menuItemId]: nextQuantity,
      }
    })
  }

  const handleSubmitOrder = async () => {
    if (!providerDid) {
      return
    }

    if (!customerName.trim()) {
      setErrorMessage('Vul je naam in zodat de aanbieder weet voor wie de bestelling is.')
      return
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Vul een telefoonnummer in voor vragen over de bestelling.')
      return
    }

    if (!postcode.trim()) {
      setErrorMessage('Vul je postcode in om te controleren of deze aanbieder bij je bezorgt.')
      return
    }

    if (!customerAddressLine.trim()) {
      setErrorMessage(
        fulfilmentMode === 'delivery'
          ? 'Vul je adres in voordat je bestelt.'
          : 'Vul een afhaalnotitie of adresregel in voordat je bestelt.'
      )
      return
    }

    if (cartItems.length === 0) {
      setErrorMessage('Voeg eerst minimaal één item toe aan je bestelling.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const client = new ADPClient()
      const response = await client.submitLocalFoodOrder({
        providerDid,
        customerDid: agentIdentity.did,
        customerName,
        customerPhone,
        customerPostcode: postcode,
        customerAddressLine,
        customerNotes,
        fulfilmentMode,
        items: cartItems.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
      })
      setCart({})
      setCustomerAddressLine('')
      setCustomerNotes('')
      setStatusMessage(`Bestelling ontvangen. ${response.order.payment.displayLabel}. In deze demo betaal je nog niet in de app.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'De bestelling kon niet worden verstuurd.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/app/food" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Terug naar pizza-aanbod
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-white">{providerResponse?.provider.businessName || 'Pizza provider'}</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/45">{providerResponse?.provider.summary || 'Bekijk het menu, kies je favorieten en plaats direct je bestelling.'}</p>
          </div>
          {providerResponse ? (
            <div className="relative min-h-[132px] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#111827] sm:max-w-[320px]">
              <Image
                src="/images/pizza/overhead-pizza-food.png"
                alt="Overhead pizza photography"
                fill
                className="object-cover"
                sizes="320px"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#0A0E17] via-[#0A0E17]/70 to-[#0A0E17]/15" />
              <div className="relative p-4 text-sm text-white/70">
                <div>{providerResponse.provider.coverageLabel || providerResponse.provider.locationLabel || 'Local service area'}</div>
                <div className="mt-1 text-xs text-white/45">
                  {providerResponse.provider.fulfilmentModes.map(toFulfilmentLabel).join(' · ')} · Demo betaalreferentie
                </div>
                <div className="mt-4 inline-flex rounded-full border border-white/10 bg-[#0A0E17]/65 px-3 py-1 text-xs text-orange-100">
                  Verse selectie
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/5 bg-[#111827] p-10">
            <Loader2 className="h-6 w-6 animate-spin text-white/30" />
          </div>
        ) : null}

        {errorMessage ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{errorMessage}</div> : null}
        {statusMessage ? <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">{statusMessage}</div> : null}

        {providerResponse ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#111827] p-6">
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.035]"
                  style={{
                    backgroundImage: "url('/images/pizza/pizza-pattern.png')",
                    backgroundSize: '220px',
                    backgroundRepeat: 'repeat',
                  }}
                />
                <div className="mb-5 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
                  Bestellingen gaan in deze demo direct naar de aanbieder. Betalen in de app is nog niet actief.
                </div>
                <div className="relative mb-5 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Menu</h2>
                    <p className="mt-1 text-sm text-white/45">Kies je items en rond je bestelling af bij deze aanbieder.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                    {menuItems.length} menu items
                  </div>
                </div>
                <div className="relative grid gap-4 md:grid-cols-2">
                  {hasMenuItems ? (
                    menuItems.map((item) => {
                      const quantity = cart[item.id] ?? 0
                      return (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-white/35">{item.category}</div>
                              <h2 className="mt-1 text-lg font-semibold text-white">{item.name}</h2>
                              <p className="mt-2 text-sm text-white/45">{item.description}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-[#0A0E17] px-3 py-2 text-sm text-white/80">
                              {toEuroDisplay(item.priceCents)}
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => updateQuantity(item.id, -1)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#0A0E17] text-white/75 transition-colors hover:bg-white/10">
                                <Minus className="h-4 w-4" />
                              </button>
                              <div className="min-w-10 text-center text-sm text-white/80">{quantity}</div>
                              <button type="button" onClick={() => updateQuantity(item.id, 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#0A0E17] text-white/75 transition-colors hover:bg-white/10">
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-right text-xs text-white/45">
                              {item.tags.length > 0 ? item.tags.join(' · ') : 'Freshly available'}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/45 md:col-span-2">
                      <div className="mx-auto h-28 w-28 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                        <Image
                          src="/images/pizza/isometric-food-shop.png"
                          alt="Isometric pizza shop illustration"
                          width={112}
                          height={112}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-4 text-center">
                        Deze aanbieder is live, maar heeft nog geen menu online. Probeer een andere aanbieder of kom later terug.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#111827] p-6">
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: "url('/images/pizza/pizza-pattern.png')",
                    backgroundSize: '220px',
                    backgroundRepeat: 'repeat',
                  }}
                />
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-orange-300" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Afrekenen</h2>
                    <p className="mt-1 text-sm text-white/45">Controleer je gegevens en stuur je bestelling direct naar de aanbieder.</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {cartItems.length > 0 ? (
                    cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                        <span>{item.quantity} × {item.name}</span>
                        <span className="font-medium text-white">{toEuroDisplay(item.lineTotalCents)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/45">
                      Je bestelling is nog leeg. Voeg een pizza, side of drankje toe om verder te gaan.
                    </div>
                  )}
                </div>
                <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${statusMessage ? 'border border-white/10 bg-white/5 text-white/70' : 'border border-orange-500/20 bg-orange-500/10 text-orange-100'}`}>
                  Totaal: {toEuroDisplay(totalCents)}
                </div>
                <div className="mt-4 grid gap-3 text-sm text-white/60 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">1. Controleer je bestelling</div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">2. Vul je gegevens in</div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">3. Verstuur je bestelling</div>
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-white/60">
                  <div className="font-medium text-white">Betaling</div>
                  <div className="mt-1 text-white/45">
                    Deze flow maakt alleen een demo betaalreferentie aan. Er wordt nog niets afgeschreven.
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Naam" className="rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white placeholder:text-white/20 focus:border-orange-500/50 focus:outline-none" />
                  <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Telefoonnummer" className="rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white placeholder:text-white/20 focus:border-orange-500/50 focus:outline-none" />
                  <input value={postcode} onChange={(event) => setPostcode(event.target.value)} placeholder="Postcode" className="rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white placeholder:text-white/20 focus:border-orange-500/50 focus:outline-none" />
                  <input value={customerAddressLine} onChange={(event) => setCustomerAddressLine(event.target.value)} placeholder={fulfilmentMode === 'delivery' ? 'Straat en huisnummer' : 'Afhaalnotitie of adresregel'} className="rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white placeholder:text-white/20 focus:border-orange-500/50 focus:outline-none" />
                  <select value={fulfilmentMode} onChange={(event) => setFulfilmentMode(event.target.value as 'delivery' | 'pickup')} className="rounded-xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none">
                    {providerResponse.provider.fulfilmentModes.map((mode) => <option key={mode} value={mode}>{toFulfilmentLabel(mode)}</option>)}
                  </select>
                  <textarea value={customerNotes} onChange={(event) => setCustomerNotes(event.target.value)} placeholder="Opmerkingen, allergieën of afhaalinstructies" rows={3} className="rounded-2xl border border-white/10 bg-[#0A0E17] px-4 py-3 text-white placeholder:text-white/20 focus:border-orange-500/50 focus:outline-none" />
                </div>
                <button type="button" onClick={handleSubmitOrder} disabled={submitting || cartItems.length === 0 || !hasMenuItems} className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${statusMessage ? 'border border-white/10 bg-white/5 text-white/80 hover:bg-white/10' : 'border border-orange-500/30 bg-orange-500/10 text-orange-100 hover:bg-orange-500/20'}`}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                  Bestelling versturen
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
