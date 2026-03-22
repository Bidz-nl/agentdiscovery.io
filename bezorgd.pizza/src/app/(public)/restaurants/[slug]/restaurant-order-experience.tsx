'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import type {
  LocalFoodFulfilmentMode,
  LocalFoodPublicOrderFieldErrors,
  LocalFoodPublicOrderConfirmation,
  LocalFoodPublicOrderDraft,
  LocalFoodPublicOrderInput,
  LocalFoodPublicRestaurantDetail,
} from '@/lib/local-food/local-food-types'

type CartEntry = {
  quantity: number
}

type CheckoutFormState = {
  name: string
  phone: string
  postcode: string
  address: string
}

type CheckoutStep = 'details' | 'review' | 'confirmed'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

type FieldErrors = Partial<Record<keyof CheckoutFormState | 'fulfilment', string>>

type FieldTouched = Partial<Record<keyof CheckoutFormState, boolean>>

type OrderApiResponse = {
  ok: boolean
  status: string
  message?: string
  fieldErrors?: LocalFoodPublicOrderFieldErrors
  order?: LocalFoodPublicOrderDraft | LocalFoodPublicOrderConfirmation
}

function formatPrice(priceCents: number) {
  return `€${(priceCents / 100).toFixed(2)}`
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, '')
}

function normalizePostcode(value: string) {
  return value.replace(/\s+/g, '').toUpperCase()
}

function getFieldErrors(
  form: CheckoutFormState,
  fulfilmentMode: LocalFoodFulfilmentMode | null,
  availableModes: LocalFoodFulfilmentMode[]
): FieldErrors {
  const errors: FieldErrors = {}

  if (form.name.trim().length < 2) {
    errors.name = 'Vul een naam in zodat de bestelling duidelijk klaarstaat.'
  }

  const phone = normalizePhone(form.phone.trim())
  if (phone.length < 8) {
    errors.phone = 'Vul een telefoonnummer in waarop de zaak je kan bereiken.'
  }

  const postcode = normalizePostcode(form.postcode.trim())
  if (postcode.length < 4) {
    errors.postcode = 'Vul een postcode in voor bezorging of contact.'
  }

  if (form.address.trim().length < 5) {
    errors.address = 'Vul een volledig adres of afhaaladres in.'
  }

  if (!fulfilmentMode || !availableModes.includes(fulfilmentMode)) {
    errors.fulfilment = 'Kies hoe je deze bestelling wilt ontvangen.'
  }

  return errors
}

function getInputClassName(hasError: boolean) {
  return `rounded-xl border px-4 py-3 text-base text-[#2f160c] placeholder:text-[#b37b5c] ${
    hasError ? 'border-[#d46b3d] bg-[#fff3ec]' : 'border-orange-200 bg-[#fffaf4]'
  }`
}

function getPressureCardClassName(level: 'normal' | 'busy' | 'very_busy' | 'paused') {
  if (level === 'paused') {
    return 'border-[#c85b24] bg-[#fff1ea] text-[#8a3d1a]'
  }

  if (level === 'very_busy') {
    return 'border-orange-300 bg-[#fff3ea] text-[#8a4a24]'
  }

  if (level === 'busy') {
    return 'border-orange-200 bg-[#fff8f1] text-[#8d5637]'
  }

  return 'border-orange-200 bg-[#fffaf4] text-[#6a3c24]'
}

function isConfirmation(
  order: LocalFoodPublicOrderDraft | LocalFoodPublicOrderConfirmation | null
): order is LocalFoodPublicOrderConfirmation {
  return Boolean(order && 'orderReference' in order)
}

export function RestaurantOrderExperience({
  restaurantDetail,
}: {
  restaurantDetail: LocalFoodPublicRestaurantDetail
}) {
  const { restaurant, categories, menuItems } = restaurantDetail
  const availableFulfilmentModes = restaurant.availability.availableFulfilmentModes
  const [cart, setCart] = useState<Record<string, CartEntry>>({})
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('details')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [draftOrder, setDraftOrder] = useState<LocalFoodPublicOrderDraft | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<LocalFoodPublicOrderConfirmation | null>(null)
  const [touchedFields, setTouchedFields] = useState<FieldTouched>({})
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [fulfilmentMode, setFulfilmentMode] = useState<LocalFoodFulfilmentMode | null>(availableFulfilmentModes[0] ?? null)
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>({
    name: '',
    phone: '',
    postcode: '',
    address: '',
  })

  const menuItemsByCategory = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        items: menuItems.filter((item) => item.categoryId === category.id),
      })),
    [categories, menuItems]
  )

  const cartItems = useMemo(
    () =>
      menuItems
        .map((item) => {
          const quantity = cart[item.id]?.quantity ?? 0
          if (quantity <= 0) {
            return null
          }

          return {
            ...item,
            quantity,
            lineTotalCents: item.priceCents * quantity,
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [cart, menuItems]
  )

  const currentFieldErrors = getFieldErrors(checkoutForm, fulfilmentMode, availableFulfilmentModes)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalCents = cartItems.reduce((sum, item) => sum + item.lineTotalCents, 0)
  const orderLocked = checkoutStep === 'confirmed' && confirmedOrder !== null

  function resetOrderProgress(nextStep: CheckoutStep = 'details') {
    setCheckoutStep(nextStep)
    setSubmitState('idle')
    setSubmitMessage(null)
    setDraftOrder(null)
    setConfirmedOrder(null)
  }

  function startNewOrder() {
    setCart({})
    setCheckoutOpen(false)
    setTouchedFields({})
    setFieldErrors({})
    setFulfilmentMode(availableFulfilmentModes[0] ?? null)
    setCheckoutForm({
      name: '',
      phone: '',
      postcode: '',
      address: '',
    })
    resetOrderProgress()
  }

  function markAllFieldsTouched() {
    setTouchedFields({
      name: true,
      phone: true,
      postcode: true,
      address: true,
    })
  }

  function syncErrors() {
    setFieldErrors(currentFieldErrors)
    return currentFieldErrors
  }

  function applyServerFieldErrors(nextFieldErrors: LocalFoodPublicOrderFieldErrors | undefined) {
    if (!nextFieldErrors) {
      return
    }

    setFieldErrors((current) => ({
      ...current,
      name: nextFieldErrors.name ?? current.name,
      phone: nextFieldErrors.phone ?? current.phone,
      postcode: nextFieldErrors.postcode ?? current.postcode,
      address: nextFieldErrors.address ?? current.address,
      fulfilment: nextFieldErrors.fulfilment ?? current.fulfilment,
    }))

    if (nextFieldErrors.name || nextFieldErrors.phone || nextFieldErrors.postcode || nextFieldErrors.address) {
      markAllFieldsTouched()
    }
  }

  function addToCart(itemId: string) {
    const item = menuItems.find((entry) => entry.id === itemId)

    if (orderLocked) {
      setCheckoutOpen(true)
      setCheckoutStep('confirmed')
      setSubmitState('success')
      setSubmitMessage('Deze bestelling is al geplaatst. Nieuwe keuzes staan uit totdat je bewust een nieuwe bestelling start.')
      return
    }

    if (!restaurant.availability.acceptsOrders || !item?.available) {
      setCheckoutOpen(false)
      setCheckoutStep('details')
      setSubmitState('error')
      setSubmitMessage(item?.unavailableReason ?? restaurant.availability.unavailableReason ?? 'Dit item is nu tijdelijk niet bestelbaar.')
      return
    }

    setCart((current) => ({
      ...current,
      [itemId]: {
        quantity: (current[itemId]?.quantity ?? 0) + 1,
      },
    }))
    setCheckoutOpen(true)
    resetOrderProgress()
  }

  function decreaseQuantity(itemId: string) {
    if (orderLocked) {
      setCheckoutOpen(true)
      setCheckoutStep('confirmed')
      setSubmitState('success')
      setSubmitMessage('Deze bestelling is al geplaatst. Aantallen aanpassen staat nu uit om dubbel bestellen te voorkomen.')
      return
    }

    setCart((current) => {
      const currentQuantity = current[itemId]?.quantity ?? 0
      if (currentQuantity <= 1) {
        const next = { ...current }
        delete next[itemId]
        return next
      }

      return {
        ...current,
        [itemId]: {
          quantity: currentQuantity - 1,
        },
      }
    })
    resetOrderProgress()
  }

  function updateCheckoutField(field: keyof CheckoutFormState, value: string) {
    if (orderLocked) {
      setCheckoutOpen(true)
      setCheckoutStep('confirmed')
      return
    }

    setCheckoutForm((current) => ({
      ...current,
      [field]: value,
    }))
    resetOrderProgress()
  }

  function buildOrderPayload(intent: 'draft' | 'confirm'): LocalFoodPublicOrderInput {
    return {
      intent,
      providerDid: restaurant.providerDid,
      fulfilmentMode: fulfilmentMode ?? availableFulfilmentModes[0] ?? restaurant.fulfilmentModes[0] ?? 'delivery',
      customer: {
        name: checkoutForm.name.trim(),
        phone: checkoutForm.phone.trim(),
        postcode: checkoutForm.postcode.trim(),
        address: checkoutForm.address.trim(),
      },
      items: cartItems.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
      })),
    }
  }

  async function submitOrder(intent: 'draft' | 'confirm') {
    const errors = syncErrors()

    if (orderLocked) {
      setCheckoutOpen(true)
      setCheckoutStep('confirmed')
      setSubmitState('success')
      setSubmitMessage('Deze bestelling is al bevestigd. Eerst deze order afronden voordat je opnieuw bestelt.')
      return
    }

    if (!restaurant.availability.acceptsOrders) {
      setSubmitState('error')
      setSubmitMessage(restaurant.availability.unavailableReason ?? 'Deze zaak neemt tijdelijk geen nieuwe bestellingen aan.')
      return
    }

    if (cartItems.length === 0) {
      setCheckoutOpen(true)
      setCheckoutStep('details')
      setSubmitState('error')
      setSubmitMessage('Kies eerst iets uit het menu voordat je verdergaat.')
      return
    }

    if (Object.keys(errors).length > 0) {
      setCheckoutOpen(true)
      setCheckoutStep('details')
      markAllFieldsTouched()
      setSubmitState('error')
      setSubmitMessage('Controleer je gegevens rustig en vul de ontbrekende velden aan.')
      return
    }

    setSubmitState('submitting')
    setSubmitMessage(null)

    if (intent === 'confirm') {
      setConfirmedOrder(null)
    } else {
      setDraftOrder(null)
    }

    try {
      const response = await fetch('/api/public/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildOrderPayload(intent)),
      })

      const result = (await response.json().catch(() => null)) as OrderApiResponse | null

      if (!response.ok || !result?.ok || !result.order) {
        applyServerFieldErrors(result?.fieldErrors)
        setSubmitState('error')
        setSubmitMessage(result?.message ?? 'De bestelling kon nog niet worden verwerkt. Probeer het opnieuw.')
        return
      }

      setSubmitState('success')
      setSubmitMessage(result.message ?? null)

      if (intent === 'confirm' && isConfirmation(result.order)) {
        setConfirmedOrder(result.order)
        setCheckoutStep('confirmed')
        return
      }

      setDraftOrder(result.order)
      setCheckoutStep('review')
    } catch {
      setSubmitState('error')
      setSubmitMessage('Er ging iets mis tijdens het voorbereiden van je bestelling.')
    }
  }

  function getVisibleFieldError(field: keyof CheckoutFormState) {
    if (!touchedFields[field] && submitState !== 'error') {
      return null
    }

    return fieldErrors[field] ?? currentFieldErrors[field] ?? null
  }

  const visibleFulfilmentError = submitState === 'error' ? fieldErrors.fulfilment ?? currentFieldErrors.fulfilment : null

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-4xl border border-orange-200 bg-white shadow-[0_20px_70px_rgba(96,42,16,0.08)]">
        <div className="relative aspect-16/7 bg-[#f2d6bc]">
          {restaurant.branding.imageUrl ? (
            <img
              src={restaurant.branding.imageUrl}
              alt={restaurant.branding.imageAlt ?? restaurant.businessName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-lg font-medium text-[#7a3413]">
              {restaurant.branding.imageFallback ?? restaurant.businessName}
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-[#21130d]/75 via-[#21130d]/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <div className="max-w-3xl space-y-4 text-white">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm"
                >
                  Naar homepage
                </Link>
                <Link
                  href="/restaurants"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm"
                >
                  Terug naar restaurants
                </Link>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                  {restaurant.locationLabel}
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                  {availableFulfilmentModes.join(' · ') || 'Tijdelijk geen fulfilment'}
                </span>
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{restaurant.businessName}</h1>
                <p className="max-w-2xl text-sm leading-6 text-orange-50 sm:text-base">{restaurant.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {restaurant.cuisineTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-orange-50"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div id="bestellen" className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`#${category.slug}`}
                  className="rounded-full border border-orange-200 bg-[#fff7ee] px-4 py-2 text-sm font-medium text-[#7a3413]"
                >
                  {category.name}
                </a>
              ))}
            </div>
            <div className={`rounded-3xl border px-4 py-4 text-sm leading-6 ${getPressureCardClassName(restaurant.availability.pressure.level)}`}>
              <p className="font-semibold">{restaurant.availability.pressure.title}</p>
              <p className="mt-1">{restaurant.availability.pressure.message}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em]">{restaurant.availability.leadTimeLabel}</p>
              {restaurant.availability.unavailableReason ? <p className="mt-2">{restaurant.availability.unavailableReason}</p> : null}
            </div>
            <p className="text-sm leading-6 text-[#6a3c24]">
              {restaurant.coverageLabel}. Kies rustig je gerechten; je bestelling blijft hieronder zichtbaar en loopt
              daarna in kleine stappen door naar controle en bevestiging.
            </p>
            <button
              type="button"
              onClick={() => {
                if (orderLocked) {
                  setCheckoutOpen(true)
                  setCheckoutStep('confirmed')
                  return
                }

                setCheckoutOpen((current) => !current)
              }}
              disabled={(cartItems.length === 0 && !orderLocked) || !restaurant.availability.acceptsOrders}
              className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-[#7a3413] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {orderLocked ? 'Bekijk bevestiging' : checkoutOpen ? 'Verberg bestelstap' : 'Ga door naar je gegevens'}
            </button>
          </div>

          <aside className="rounded-3xl border border-orange-200 bg-[#fff7ee] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Je bestelling</p>
            <h2 className="mt-3 text-xl font-semibold text-[#2f160c]">Direct zichtbaar wat je kiest</h2>
            <div className="mt-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-orange-300 bg-white px-4 py-5 text-sm leading-6 text-[#6a3c24]">
                  Kies een paar gerechten uit het menu. Zodra je iets toevoegt zie je hier meteen het aantal,
                  de prijs en je voorlopige totaal.
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-orange-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[#2f160c]">{item.name}</h3>
                          <p className="mt-1 text-sm text-[#8d5637]">
                            {item.quantity} x {formatPrice(item.priceCents)}
                          </p>
                        </div>
                        <div className="text-sm font-semibold text-[#7a3413]">{formatPrice(item.lineTotalCents)}</div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item.id)}
                          className="rounded-full border border-orange-200 px-3 py-1 text-sm font-semibold text-[#7a3413]"
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold text-[#2f160c]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(item.id)}
                          className="rounded-full border border-orange-200 px-3 py-1 text-sm font-semibold text-[#7a3413]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-3xl bg-[#2f160c] p-5 text-white">
                <div className="flex items-center justify-between text-sm text-orange-100">
                  <span>Artikelen</span>
                  <span>{itemCount}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-lg font-semibold">
                  <span>Subtotaal</span>
                  <span>{formatPrice(subtotalCents)}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-orange-100">
                  {checkoutStep === 'confirmed'
                    ? 'Je bestelling is bevestigd. Hieronder zie je de kern van wat er is doorgegeven.'
                    : 'Je gaat nu eerst naar je gegevens, daarna naar een rustige review en pas dan naar bevestigen.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutOpen(true)
                    if (orderLocked) {
                      setCheckoutStep('confirmed')
                    }
                  }}
                  disabled={(cartItems.length === 0 && !orderLocked) || !restaurant.availability.acceptsOrders}
                  className="mt-4 w-full rounded-full bg-[#fff2e2] px-4 py-3 text-sm font-semibold text-[#7a3413] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkoutStep === 'review'
                    ? 'Controleer je bestelling'
                    : checkoutStep === 'confirmed'
                      ? 'Bekijk bevestiging'
                      : 'Verder naar je gegevens'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="sticky top-3 z-30 rounded-3xl border border-orange-200 bg-white/95 px-4 py-3 shadow-[0_12px_30px_rgba(96,42,16,0.08)] backdrop-blur sm:px-5">
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#7a3413]">
          <Link
            href="/"
            className="rounded-full border border-orange-200 bg-[#fffaf4] px-4 py-2 transition hover:bg-[#fff1e5]"
          >
            Home
          </Link>
          <Link
            href="/restaurants"
            className="rounded-full border border-orange-200 bg-[#fffaf4] px-4 py-2 transition hover:bg-[#fff1e5]"
          >
            Restaurants
          </Link>
          <a
            href="#bestellen"
            className="rounded-full border border-orange-200 bg-[#fffaf4] px-4 py-2 transition hover:bg-[#fff1e5]"
          >
            Bestellen
          </a>
          <a
            href="#menu"
            className="rounded-full border border-orange-200 bg-[#fffaf4] px-4 py-2 transition hover:bg-[#fff1e5]"
          >
            Menu
          </a>
        </div>
      </section>

      {checkoutOpen ? (
        <section className="rounded-4xl border border-orange-200 bg-white p-6 shadow-[0_14px_40px_rgba(96,42,16,0.06)] sm:p-8">
          {checkoutStep === 'confirmed' && confirmedOrder ? (
            <div className="space-y-6">
              <div className="rounded-3xl bg-[#fff7ee] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Bevestiging</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#2f160c]">{confirmedOrder.statusLabel}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6a3c24]">{confirmedOrder.nextStepLabel}</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Kerngegevens</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-[#6a3c24]">
                    <div>
                      <p className="font-semibold text-[#2f160c]">Restaurant</p>
                      <p className="mt-1">{confirmedOrder.restaurantName}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2f160c]">Referentie</p>
                      <p className="mt-1">{confirmedOrder.orderReference}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2f160c]">Ontvangst</p>
                      <p className="mt-1">
                        {confirmedOrder.fulfilmentMode === 'delivery' ? 'Bezorgen' : 'Afhalen'}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2f160c]">Verwachting</p>
                      <p className="mt-1">{confirmedOrder.expectationLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-orange-200 bg-[#fff7ee] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Klantgegevens</p>
                  <div className="mt-4 space-y-2 text-sm text-[#6a3c24]">
                    <p>{confirmedOrder.customer.name}</p>
                    <p>{confirmedOrder.customer.phone}</p>
                    <p>{confirmedOrder.customer.postcode}</p>
                    <p>{confirmedOrder.customer.address}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-orange-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Bestelling</p>
                    <h3 className="mt-2 text-xl font-semibold text-[#2f160c]">Ontvangen door de zaak</h3>
                  </div>
                  <div className="rounded-full bg-[#fff2e2] px-4 py-2 text-sm font-semibold text-[#7a3413]">
                    {formatPrice(confirmedOrder.subtotalCents)}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {confirmedOrder.items.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm"
                    >
                      <div className="text-[#2f160c]">
                        {item.quantity} x {item.name}
                      </div>
                      <div className="font-semibold text-[#7a3413]">{formatPrice(item.lineTotalCents)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-3xl bg-[#fff7ee] px-4 py-3 text-sm leading-6 text-[#6a3c24]">
                  Deze bestelling staat vast. Extra gerechten toevoegen is nu uitgeschakeld om dubbel bestellen te voorkomen.
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-[#fff7ee]"
                  >
                    Naar homepage
                  </Link>
                  <button
                    type="button"
                    onClick={startNewOrder}
                    className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-[#7a3413] transition hover:bg-[#fff7ee]"
                  >
                    Nieuwe bestelling starten
                  </button>
                </div>
              </div>
            </div>
          ) : checkoutStep === 'review' && draftOrder ? (
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Bestelling controleren</p>
                  <h2 className="text-2xl font-semibold text-[#2f160c]">Loop alles nog één keer rustig langs</h2>
                  <p className="text-sm leading-6 text-[#6a3c24]">
                    Controleer restaurant, bezorgkeuze, gerechten en je gegevens. Daarna kun je zonder payment-ruis bevestigen.
                  </p>
                </div>

                <div className="rounded-3xl border border-orange-200 bg-[#fffaf4] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Review</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-[#6a3c24]">
                    <div>
                      <p className="font-semibold text-[#2f160c]">Restaurant</p>
                      <p className="mt-1">{draftOrder.restaurantName}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2f160c]">Ontvangst</p>
                      <p className="mt-1">{draftOrder.fulfilmentMode === 'delivery' ? 'Bezorgen' : 'Afhalen'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-orange-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Gekozen gerechten</p>
                      <h3 className="mt-2 text-xl font-semibold text-[#2f160c]">Wat er wordt besteld</h3>
                    </div>
                    <div className="rounded-full bg-[#fff2e2] px-4 py-2 text-sm font-semibold text-[#7a3413]">
                      {formatPrice(draftOrder.subtotalCents)}
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {draftOrder.items.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm"
                      >
                        <div className="text-[#2f160c]">
                          {item.quantity} x {item.name}
                        </div>
                        <div className="font-semibold text-[#7a3413]">{formatPrice(item.lineTotalCents)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-orange-200 bg-[#fff7ee] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Jouw gegevens</p>
                <div className="mt-4 space-y-2 text-sm text-[#6a3c24]">
                  <p>{draftOrder.customer.name}</p>
                  <p>{draftOrder.customer.phone}</p>
                  <p>{draftOrder.customer.postcode}</p>
                  <p>{draftOrder.customer.address}</p>
                </div>

                {submitMessage ? (
                  <div className="mt-4 rounded-3xl bg-[#e8f6ee] px-4 py-3 text-sm leading-6 text-[#245c37]">
                    {submitMessage}
                  </div>
                ) : null}

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={() => submitOrder('confirm')}
                    disabled={submitState === 'submitting'}
                    className="w-full rounded-full bg-[#c85b24] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ab4715] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitState === 'submitting' ? 'Bestelling bevestigen...' : 'Bestelling bevestigen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutStep('details')
                      setSubmitState('idle')
                      setSubmitMessage(null)
                    }}
                    className="w-full rounded-full border border-orange-200 px-4 py-3 text-sm font-semibold text-[#7a3413]"
                  >
                    Gegevens aanpassen
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Bestelgegevens</p>
                  <h2 className="text-2xl font-semibold text-[#2f160c]">Nog één rustige stap vóór bevestigen</h2>
                  <p className="text-sm leading-6 text-[#6a3c24]">
                    Vul je gegevens in, kies hoe je de bestelling ontvangt en ga daarna door naar een rustige review.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-[#5f3420]">
                    Naam
                    <input
                      value={checkoutForm.name}
                      onChange={(event) => updateCheckoutField('name', event.target.value)}
                      onBlur={() =>
                        setTouchedFields((current) => ({
                          ...current,
                          name: true,
                        }))
                      }
                      placeholder="Voor- en achternaam"
                      className={getInputClassName(Boolean(getVisibleFieldError('name')))}
                    />
                    {getVisibleFieldError('name') ? (
                      <span className="text-sm leading-6 text-[#b14a1e]">{getVisibleFieldError('name')}</span>
                    ) : null}
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-[#5f3420]">
                    Telefoon
                    <input
                      value={checkoutForm.phone}
                      onChange={(event) => updateCheckoutField('phone', event.target.value)}
                      onBlur={() =>
                        setTouchedFields((current) => ({
                          ...current,
                          phone: true,
                        }))
                      }
                      placeholder="+31 6 12345678"
                      className={getInputClassName(Boolean(getVisibleFieldError('phone')))}
                    />
                    {getVisibleFieldError('phone') ? (
                      <span className="text-sm leading-6 text-[#b14a1e]">{getVisibleFieldError('phone')}</span>
                    ) : null}
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-[#5f3420]">
                    Postcode
                    <input
                      value={checkoutForm.postcode}
                      onChange={(event) => updateCheckoutField('postcode', event.target.value)}
                      onBlur={() =>
                        setTouchedFields((current) => ({
                          ...current,
                          postcode: true,
                        }))
                      }
                      placeholder="1055 AB"
                      className={getInputClassName(Boolean(getVisibleFieldError('postcode')))}
                    />
                    {getVisibleFieldError('postcode') ? (
                      <span className="text-sm leading-6 text-[#b14a1e]">{getVisibleFieldError('postcode')}</span>
                    ) : null}
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-[#5f3420]">
                    Adres
                    <input
                      value={checkoutForm.address}
                      onChange={(event) => updateCheckoutField('address', event.target.value)}
                      onBlur={() =>
                        setTouchedFields((current) => ({
                          ...current,
                          address: true,
                        }))
                      }
                      placeholder="Straat en huisnummer"
                      className={getInputClassName(Boolean(getVisibleFieldError('address')))}
                    />
                    {getVisibleFieldError('address') ? (
                      <span className="text-sm leading-6 text-[#b14a1e]">{getVisibleFieldError('address')}</span>
                    ) : null}
                  </label>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-[#5f3420]">Hoe wil je deze bestelling ontvangen?</p>
                  <div className="flex flex-wrap gap-3">
                    {availableFulfilmentModes.map((mode) => {
                      const selected = fulfilmentMode === mode

                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setFulfilmentMode(mode)
                            resetOrderProgress()
                            setFieldErrors((current) => ({
                              ...current,
                              fulfilment: undefined,
                            }))
                          }}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            selected
                              ? 'bg-[#c85b24] text-white'
                              : 'border border-orange-200 bg-[#fffaf4] text-[#7a3413]'
                          }`}
                        >
                          {mode === 'delivery' ? 'Bezorgen' : 'Afhalen'}
                        </button>
                      )
                    })}
                  </div>
                  {availableFulfilmentModes.length === 0 ? (
                    <p className="text-sm leading-6 text-[#b14a1e]">Er is nu geen fulfilmentoptie beschikbaar voor nieuwe bestellingen.</p>
                  ) : null}
                  {visibleFulfilmentError ? (
                    <p className="text-sm leading-6 text-[#b14a1e]">{visibleFulfilmentError}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-orange-200 bg-[#fff7ee] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">Voor review</p>
                <h3 className="mt-3 text-xl font-semibold text-[#2f160c]">Wat je straks controleert</h3>
                <div className="mt-4 space-y-4 text-sm leading-6 text-[#6a3c24]">
                  <p>Restaurant, bezorgkeuze, gekozen gerechten, aantallen, subtotaal en jouw ingevulde gegevens.</p>
                  <p>Pas daarna bevestig je de bestelling. Payment hoort nog niet bij deze stap.</p>
                </div>

                <div className="mt-5 rounded-3xl bg-white p-4">
                  <div className="flex items-center justify-between text-sm text-[#8d5637]">
                    <span>Restaurant</span>
                    <span>{restaurant.businessName}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-[#8d5637]">
                    <span>Ontvangst</span>
                    <span>{fulfilmentMode === 'delivery' ? 'Bezorgen' : 'Afhalen'}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-[#8d5637]">
                    <span>Artikelen</span>
                    <span>{itemCount}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-base font-semibold text-[#2f160c]">
                    <span>Subtotaal</span>
                    <span>{formatPrice(subtotalCents)}</span>
                  </div>
                </div>

                {submitMessage ? (
                  <div
                    className={`mt-4 rounded-3xl px-4 py-3 text-sm leading-6 ${
                      submitState === 'error' ? 'bg-[#fff1eb] text-[#8a3d1a]' : 'bg-[#e8f6ee] text-[#245c37]'
                    }`}
                  >
                    {submitMessage}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => submitOrder('draft')}
                  disabled={cartItems.length === 0 || submitState === 'submitting'}
                  className="mt-5 w-full rounded-full bg-[#c85b24] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ab4715] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitState === 'submitting' ? 'Review voorbereiden...' : 'Ga naar bestelling controleren'}
                </button>
              </div>
            </div>
          )}
        </section>
      ) : null}

      <section id="menu" className="space-y-8">
        {menuItemsByCategory.map((category) => (
          <section key={category.id} id={category.slug} className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#2f160c]">{category.name}</h2>
                <p className="mt-1 text-sm text-[#8d5637]">
                  {category.items.length} {category.items.length === 1 ? 'gerecht' : 'gerechten'}
                </p>
              </div>
            </div>

            <div className="grid items-stretch gap-4 md:grid-cols-2">
              {category.items.map((item) => {
                const quantity = cart[item.id]?.quantity ?? 0

                return (
                  <article
                    key={item.id}
                    className={`h-full overflow-hidden rounded-3xl border bg-white shadow-[0_12px_30px_rgba(96,42,16,0.05)] ${
                      item.available ? 'border-orange-200' : 'border-orange-300 bg-[#fffaf4] opacity-80'
                    }`}
                  >
                    <div className="grid h-full md:min-h-[274px] md:grid-cols-[220px_1fr]">
                      <div className="h-52 bg-[#f4d9bf] md:h-full">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.imageAlt ?? item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-[#7a3413]">
                            {item.imageFallback ?? item.name}
                          </div>
                        )}
                      </div>
                      <div className="flex h-full flex-col gap-4 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="min-h-14 line-clamp-2 text-xl font-semibold leading-tight text-[#2f160c]">
                              {item.name}
                            </h3>
                            <p className="mt-2 line-clamp-3 min-h-18 text-sm leading-6 text-[#6a3c24]">
                              {item.description}
                            </p>
                          </div>
                          <div className="inline-flex min-w-18 shrink-0 justify-center rounded-full bg-[#fff2e2] px-3 py-1 text-sm font-semibold text-[#7a3413]">
                            {formatPrice(item.priceCents)}
                          </div>
                        </div>
                        <div className="min-h-8 flex flex-wrap content-start gap-2 overflow-hidden">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-orange-200 bg-[#fffaf4] px-3 py-1 text-xs font-medium text-[#7a3413]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-orange-100 pt-3">
                          <div className="text-sm text-[#8d5637]">
                            {item.available ? (quantity > 0 ? `${quantity} gekozen` : 'Nog niet gekozen') : item.unavailableReason ?? 'Tijdelijk niet beschikbaar'}
                          </div>
                          {!item.available ? (
                            <span className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-[#8a4a24]">
                              Tijdelijk uit
                            </span>
                          ) : quantity > 0 ? (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => decreaseQuantity(item.id)}
                                disabled={orderLocked}
                                className="rounded-full border border-orange-200 px-3 py-2 text-sm font-semibold text-[#7a3413] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                -
                              </button>
                              <span className="min-w-8 text-center text-sm font-semibold text-[#2f160c]">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCart(item.id)}
                                disabled={orderLocked}
                                className="inline-flex min-w-36 justify-center rounded-full bg-[#c85b24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ab4715] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Voeg er nog een toe
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addToCart(item.id)}
                              disabled={orderLocked}
                              className="inline-flex min-w-28 justify-center rounded-full bg-[#c85b24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ab4715] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Voeg toe
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </section>
    </div>
  )
}
