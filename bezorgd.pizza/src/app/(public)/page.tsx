import Link from 'next/link'
import Image from 'next/image'

import { listPublicRestaurants } from '@/lib/local-food/local-food-service'

export default async function HomePage() {
  const featuredRestaurants = (await listPublicRestaurants()).slice(0, 3)

  return (
    <div className="flex w-full flex-col gap-8 py-8">
      <section className="relative overflow-hidden border-y border-orange-200 bg-[#fff4e8] shadow-[0_20px_80px_rgba(96,42,16,0.10)] sm:rounded-[2.25rem] sm:border sm:mx-4 lg:mx-6">
        <div className="absolute inset-0">
          <Image
            src="/pizza-bakker.png"
            alt="Vriendelijke pizzabakker met verse pizza voor een warme oven"
            fill
            priority
            className="object-cover object-[53%_center]"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-y-0 left-0 w-[38%] bg-[linear-gradient(90deg,rgba(255,244,232,0.72)_0%,rgba(255,244,232,0.52)_30%,rgba(255,244,232,0.14)_64%,rgba(255,244,232,0.01)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_34%,rgba(255,248,240,0.10)_0%,rgba(255,248,240,0.03)_20%,rgba(255,248,240,0)_48%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(0deg,rgba(255,244,232,0.7)_0%,rgba(255,244,232,0)_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-[760px] w-full max-w-6xl items-center px-4 py-6 sm:px-6 sm:py-8 lg:min-h-[820px] lg:px-8 lg:py-10">
          <div className="flex w-full max-w-120 flex-col gap-6 lg:max-w-md xl:max-w-120">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cfe6d4] bg-[#edf8ef] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2f6b3f] sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-[#2a7a3b]" />
              Warm, lokaal en zonder gedoe
            </div>
            <div className="space-y-4">
              <h1 className="max-w-lg text-4xl font-bold tracking-tight text-[#2f160c] sm:text-5xl lg:text-6xl">
                Vanavond warme pizza uit de buurt. Snel gevonden, warm bezorgd.
              </h1>
              <p className="max-w-xl text-base leading-7 text-[#6a3c24] sm:text-lg">
                bezorgd.pizza helpt je snel een fijne lokale zaak te vinden. Vul je postcode in en
                kijk wat er vanavond warm bezorgd of klaargezet wordt in jouw buurt.
              </p>
            </div>
            <form
              action="/restaurants"
              className="grid gap-3 rounded-[1.75rem] border border-orange-100 bg-white/92 p-5 shadow-[0_18px_44px_rgba(96,42,16,0.16)] backdrop-blur sm:grid-cols-2 lg:translate-x-10 xl:translate-x-16"
            >
              <div className="sm:col-span-2">
                <p className="font-semibold text-[#2f160c]">Waar bezorgen we naartoe?</p>
                <p className="mt-1 text-sm text-[#8a5b42]">Begin met je postcode of buurt en verfijn daarna waar je trek in hebt.</p>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#5f3420]">
                Postcode
                <input
                  defaultValue="1055 AB"
                  name="postcode"
                  placeholder="Bijvoorbeeld 1055 AB"
                  className="rounded-xl border border-orange-200 bg-[#fffaf4] px-4 py-3 text-base text-[#2f160c] outline-none ring-0 placeholder:text-[#b37b5c]"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#5f3420]">
                Plaats of buurt
                <input
                  name="location"
                  placeholder="Amsterdam West"
                  className="rounded-xl border border-orange-200 bg-[#fffaf4] px-4 py-3 text-base text-[#2f160c] outline-none ring-0 placeholder:text-[#b37b5c]"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#5f3420] sm:col-span-2">
                Waar heb je trek in?
                <input
                  name="q"
                  placeholder="Pizza, kapsalon, pasta, döner..."
                  className="rounded-xl border border-orange-200 bg-[#fffaf4] px-4 py-3 text-base text-[#2f160c] outline-none ring-0 placeholder:text-[#b37b5c]"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-full bg-[#c85b24] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ab4715]"
                >
                  Bekijk restaurants in de buurt
                </button>
                <Link
                  href="/restaurants"
                  className="rounded-full border border-orange-200 px-5 py-3 text-sm font-semibold text-[#6a3c24] transition hover:bg-[#fff6ec]"
                >
                  Blader eerst rustig door alles
                </Link>
              </div>
              <div className="flex flex-wrap gap-3 border-t border-orange-100 pt-3 text-xs font-medium text-[#8a5b42] sm:col-span-2">
                <span>Lokale restaurants</span>
                <span>Warm bezorgd of klaar om af te halen</span>
                <span>Rustige bestelervaring</span>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] bg-[#2f160c] p-6 text-white shadow-[0_20px_60px_rgba(47,22,12,0.18)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
                Vandaag populair
              </p>
              <h2 className="text-3xl font-semibold">Lokale zaken die nu lekker aanvoelen</h2>
              <p className="max-w-2xl text-sm leading-6 text-orange-100 sm:text-base">
                Eerst sfeer en zoekstart, daarna direct een paar zaken die vanavond goed voelen qua aanbod,
                drukte en buurtfit.
              </p>
            </div>
            <Link
              href="/restaurants"
              className="w-fit rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-orange-50 transition hover:bg-white/10"
            >
              Bekijk alle restaurants
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {featuredRestaurants.map((restaurant) => (
              <Link
                key={restaurant.slug}
                href={`/restaurants/${restaurant.slug}`}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{restaurant.businessName}</h3>
                    <p className="text-sm text-orange-100">{restaurant.locationLabel}</p>
                  </div>
                  <div className="rounded-full bg-[#fff2e2] px-3 py-1 text-sm font-semibold text-[#7a3413]">
                    Vanaf €{((restaurant.startingPriceCents ?? 0) / 100).toFixed(2)}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-orange-50">{restaurant.summary}</p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-orange-100">
                  <p className="font-semibold">{restaurant.availability.pressure.title}</p>
                  <p className="mt-1">{restaurant.availability.leadTimeLabel}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {restaurant.cuisineTypes.map((type) => (
                    <span
                      key={type}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-orange-100"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-orange-200 bg-white p-5">
            <p className="text-sm font-semibold text-[#9a4a1b]">1. Zoek lokaal</p>
            <h2 className="mt-2 text-xl font-semibold text-[#2f160c]">Begin met postcode of buurt</h2>
            <p className="mt-2 text-sm leading-6 text-[#6a3c24]">
              Geen ruis, geen overdaad. Gewoon snel zien welke lokale zaak in jouw buurt bezorgt.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-orange-200 bg-white p-5">
            <p className="text-sm font-semibold text-[#9a4a1b]">2. Kies per categorie</p>
            <h2 className="mt-2 text-xl font-semibold text-[#2f160c]">Pizza, döner, pasta of iets erbij</h2>
            <p className="mt-2 text-sm leading-6 text-[#6a3c24]">
              Restaurants tonen hun echte categorieën, zodat je menu’s logisch en visueel kunt doorlopen.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-orange-200 bg-white p-5">
            <p className="text-sm font-semibold text-[#9a4a1b]">3. Klaar voor bestellen</p>
            <h2 className="mt-2 text-xl font-semibold text-[#2f160c]">Heldere basis voor order-UX</h2>
            <p className="mt-2 text-sm leading-6 text-[#6a3c24]">
              In deze fase staat de publieke ontdekking goed. Bestellen en checkout bouwen we hier strak op verder.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
