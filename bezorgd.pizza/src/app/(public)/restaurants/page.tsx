import Image from 'next/image'
import Link from 'next/link'

import { listPublicRestaurants } from '@/lib/local-food/local-food-service'
import { searchDirectory, getDirectorySize, deliveryLabel, type DirectoryRestaurant } from '@/lib/local-food/restaurant-directory'

function takeFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getAvailabilityToneClassName(level: 'normal' | 'busy' | 'very_busy' | 'paused') {
  if (level === 'paused') {
    return 'border-[#c85b24] bg-[#fff1ea] text-[#9a3f17]'
  }

  if (level === 'very_busy') {
    return 'border-orange-300 bg-[#fff3ea] text-[#9a4a1b]'
  }

  if (level === 'busy') {
    return 'border-orange-200 bg-[#fffaf4] text-[#8d5637]'
  }

  return 'border-orange-200 bg-[#fffaf4] text-[#7a3413]'
}

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{
    postcode?: string | string[]
    location?: string | string[]
    q?: string | string[]
  }>
}) {
  const resolvedSearchParams = await searchParams
  const postcode = takeFirst(resolvedSearchParams.postcode) ?? ''
  const location = takeFirst(resolvedSearchParams.location) ?? ''
  const query = takeFirst(resolvedSearchParams.q) ?? ''

  const isSearch = postcode.length >= 4 || location.length >= 2
  const directoryResults = isSearch
    ? searchDirectory({ postcode: postcode || undefined, city: location || undefined, query: query || undefined })
    : []

  const demoRestaurants = isSearch && directoryResults.length === 0
    ? await listPublicRestaurants({ postcode: postcode || undefined, location: location || undefined, query: query || undefined })
    : !isSearch
    ? await listPublicRestaurants({})
    : []

  const totalCount = directoryResults.length + demoRestaurants.length
  const directoryTotal = getDirectorySize()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-4xl border border-orange-200 bg-[#fff2e2] px-6 py-6 shadow-[0_18px_48px_rgba(96,42,16,0.06)] sm:px-8 sm:py-8">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,249,241,0.42)_0%,rgba(255,242,226,0)_58%)]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.32)_0%,rgba(255,255,255,0)_72%)]" />
        <div className="pointer-events-none absolute -left-1 top-0 hidden opacity-70 lg:block">
          <Image
            src="/images/druiven-rank-links.png"
            alt=""
            width={220}
            height={230}
            className="h-auto w-[170px] xl:w-[210px]"
          />
        </div>
        <div className="pointer-events-none absolute right-0 top-0 hidden opacity-60 lg:block">
          <Image
            src="/images/druiven-rank-rechts.png"
            alt=""
            width={220}
            height={230}
            className="h-auto w-[165px] xl:w-[205px]"
          />
        </div>
        <div className="pointer-events-none absolute -bottom-1 left-1/2 hidden -translate-x-1/2 opacity-55 lg:block">
          <Image
            src="/images/wijnrank-takje-midden.png"
            alt=""
            width={380}
            height={40}
            className="h-auto w-[220px] xl:w-[280px]"
          />
        </div>
        <div className="pointer-events-none absolute bottom-8 left-[42%] hidden opacity-55 xl:block">
          <Image
            src="/images/olijf-takje-links.png"
            alt=""
            width={120}
            height={70}
            className="h-auto w-[90px]"
          />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a4a1b]">
              Restaurants in de buurt
            </p>
            <h1 className="font-serif text-[2.25rem] font-semibold leading-tight tracking-[-0.02em] text-[#2f160c] sm:text-[2.95rem]">
              Vind een lokale zaak die past bij vanavond
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-[#6a3c24] sm:text-[1.05rem]">
              Zoek op postcode, buurt of waar je trek in hebt. De publieke listings zijn direct
              gekoppeld aan de nieuwe categorie- en image-ready read flow.
            </p>
          </div>
          <div className="rounded-full border border-orange-100 bg-white/95 px-4 py-2 text-sm font-semibold text-[#7a3413] shadow-sm">
            {isSearch
              ? `${totalCount} ${totalCount === 1 ? 'restaurant' : 'restaurants'} gevonden`
              : `${directoryTotal.toLocaleString('nl')} pizzeria's in heel Nederland`}
          </div>
        </div>

        <form action="/restaurants" className="relative z-10 mx-auto mt-6 grid max-w-4xl gap-3 rounded-[1.5rem] border border-white/70 bg-white/92 p-4 shadow-[0_10px_30px_rgba(96,42,16,0.05)] backdrop-blur sm:grid-cols-3">
          <input
            name="postcode"
            defaultValue={postcode}
            placeholder="Postcode"
            className="rounded-xl border border-orange-200 bg-[#fffaf4] px-4 py-3 text-base text-[#2f160c] placeholder:text-[#b37b5c]"
          />
          <input
            name="location"
            defaultValue={location}
            placeholder="Plaats of buurt"
            className="rounded-xl border border-orange-200 bg-[#fffaf4] px-4 py-3 text-base text-[#2f160c] placeholder:text-[#b37b5c]"
          />
          <input
            name="q"
            defaultValue={query}
            placeholder="Pizza, kapsalon, pasta..."
            className="rounded-xl border border-orange-200 bg-[#fffaf4] px-4 py-3 text-base text-[#2f160c] placeholder:text-[#b37b5c]"
          />
          <div className="flex flex-wrap justify-center gap-3 sm:col-span-3">
            <button
              type="submit"
              className="rounded-full bg-[#c85b24] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ab4715]"
            >
              Zoek opnieuw
            </button>
            <Link
              href="/"
              className="rounded-full border border-orange-200 px-5 py-3 text-sm font-semibold text-[#6a3c24] transition hover:bg-[#fff6ec]"
            >
              Terug naar homepage
            </Link>
          </div>
        </form>
      </section>

      {totalCount === 0 && isSearch ? (
        <section className="rounded-3xl border border-dashed border-orange-300 bg-white p-8 text-center">
          <h2 className="text-2xl font-semibold text-[#2f160c]">Nog niets gevonden voor deze zoekopdracht</h2>
          <p className="mt-3 text-sm leading-6 text-[#6a3c24]">
            Probeer een andere postcode, laat het zoekveld leeg of kijk eerst rustig door alle lokale zaken.
          </p>
        </section>
      ) : (
        <>
          {directoryResults.length > 0 && (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {directoryResults.map((r: DirectoryRestaurant) => (
                <Link
                  key={r.slug}
                  href={`/restaurants/${r.slug}`}
                  className="overflow-hidden rounded-[1.75rem] border border-orange-200 bg-white shadow-[0_12px_40px_rgba(96,42,16,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(96,42,16,0.1)]"
                >
                  <div className="flex h-28 items-center justify-center bg-[#fff2e2] px-6 text-center text-base font-semibold text-[#7a3413]">
                    {r.name}
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-[#2f160c]">{r.name}</h2>
                        <p className="mt-0.5 text-sm text-[#8d5637]">{r.address.city} · {r.address.postcode}</p>
                      </div>
                      {r.rating && (
                        <div className="flex items-center gap-1 rounded-full bg-[#fff2e2] px-3 py-1 text-sm font-semibold text-[#7a3413]">
                          <span>★</span>
                          <span>{r.rating.score.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-[#6a3c24]">{r.address.full || `${r.address.street} ${r.address.housenumber}, ${r.address.city}`}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        {r.cuisines.slice(0, 3).map((c) => (
                          <span key={c} className="rounded-full border border-orange-200 bg-[#fffaf4] px-3 py-1 text-xs font-medium text-[#7a3413]">
                            {c}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-[#8d5637]">{deliveryLabel(r)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {demoRestaurants.length > 0 && (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {demoRestaurants.map((restaurant) => (
                <Link
                  key={restaurant.slug}
                  href={`/restaurants/${restaurant.slug}`}
                  className="overflow-hidden rounded-[1.75rem] border border-orange-200 bg-white shadow-[0_12px_40px_rgba(96,42,16,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(96,42,16,0.1)]"
                >
                  <div className="aspect-4/3 bg-[#f4d9bf]">
                    {restaurant.branding.imageUrl ? (
                      <img
                        src={restaurant.branding.imageUrl}
                        alt={restaurant.branding.imageAlt ?? restaurant.businessName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-[#7a3413]">
                        {restaurant.branding.imageFallback ?? restaurant.businessName}
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-[#2f160c]">{restaurant.businessName}</h2>
                        <p className="mt-1 text-sm text-[#8d5637]">
                          {restaurant.locationLabel} · {restaurant.coverageLabel}
                        </p>
                      </div>
                      <div className="rounded-full bg-[#fff2e2] px-3 py-1 text-sm font-semibold text-[#7a3413]">
                        Vanaf €{((restaurant.startingPriceCents ?? 0) / 100).toFixed(2)}
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-[#6a3c24]">{restaurant.summary}</p>
                    <div className={`rounded-2xl border px-4 py-3 text-sm ${getAvailabilityToneClassName(restaurant.availability.pressure.level)}`}>
                      <p className="font-semibold">{restaurant.availability.pressure.title}</p>
                      <p className="mt-1">{restaurant.availability.pressure.message}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em]">{restaurant.availability.leadTimeLabel}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.cuisineTypes.map((type: string) => (
                        <span key={type} className="rounded-full border border-orange-200 bg-[#fffaf4] px-3 py-1 text-xs font-medium text-[#7a3413]">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
