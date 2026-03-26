import Link from 'next/link'

import type { DirectoryRestaurant } from '@/lib/local-food/restaurant-directory'
import { deliveryLabel } from '@/lib/local-food/restaurant-directory'

export function RestaurantDirectoryInfo({ restaurant: r }: { restaurant: DirectoryRestaurant }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-2 text-sm text-[#8a5b42]">
        <Link href="/restaurants" className="hover:underline">Restaurants</Link>
        <span>›</span>
        <span className="text-[#2f160c]">{r.name}</span>
      </nav>

      <div className="overflow-hidden rounded-[2rem] border border-orange-200 bg-white shadow-[0_14px_40px_rgba(96,42,16,0.06)]">
        <div className="flex items-center justify-center bg-[#fff2e2] px-6 py-10 text-2xl font-bold text-[#7a3413]">
          {r.name}
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#2f160c]">{r.name}</h1>
              <p className="mt-1 text-sm text-[#8d5637]">{r.address.city} · {r.address.postcode}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.cuisines.map((c) => (
                <span key={c} className="rounded-full border border-orange-200 bg-[#fffaf4] px-3 py-1 text-xs font-medium text-[#7a3413]">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {r.rating && (
            <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-[#fffaf4] px-4 py-3">
              <span className="text-xl text-[#c85b24]">★</span>
              <div>
                <p className="font-semibold text-[#2f160c]">{r.rating.score.toFixed(1)} van 5</p>
                <p className="text-xs text-[#8a5b42]">{r.rating.count.toLocaleString('nl')} beoordelingen via Google</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4a1b]">Adres</p>
              <p className="text-sm text-[#2f160c]">{r.address.full || `${r.address.street} ${r.address.housenumber}`}</p>
              <p className="text-sm text-[#6a3c24]">{r.address.postcode} {r.address.city}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4a1b]">Bezorging & afhalen</p>
              <p className="text-sm text-[#2f160c]">{deliveryLabel(r)}</p>
            </div>

            {r.contact.phone && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4a1b]">Telefoon</p>
                <a href={`tel:${r.contact.phone}`} className="text-sm text-[#c85b24] hover:underline">
                  {r.contact.phone}
                </a>
              </div>
            )}

            {r.contact.website && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4a1b]">Website</p>
                <a
                  href={r.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#c85b24] hover:underline"
                >
                  {r.contact.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              </div>
            )}
          </div>

          {r.opening_hours && r.opening_hours.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a4a1b]">Openingstijden</p>
              <ul className="space-y-1">
                {r.opening_hours.map((line) => (
                  <li key={line} className="text-sm text-[#2f160c]">{line}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 border-t border-orange-100 pt-5">
            {r.contact.google_maps_url && (
              <a
                href={r.contact.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#c85b24] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ab4715]"
              >
                Bekijk op Google Maps
              </a>
            )}
            <Link
              href="/restaurants"
              className="rounded-full border border-orange-200 px-5 py-3 text-sm font-semibold text-[#6a3c24] transition hover:bg-[#fff6ec]"
            >
              Terug naar overzicht
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
