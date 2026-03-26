import directoryData from '@/data/restaurant-directory.json'

export type DirectoryRestaurant = {
  id: string
  slug: string
  name: string
  type: 'restaurant' | 'fast_food'
  is_chain: boolean
  cuisines: string[]
  address: {
    street: string
    housenumber: string
    postcode: string
    city: string
    full: string
  }
  location: { lat: number; lon: number } | null
  contact: {
    phone: string | null
    website: string | null
    google_maps_url: string | null
  }
  services: {
    delivery: string
    takeaway: string
  }
  opening_hours: string[] | null
  rating: { score: number; count: number } | null
}

const directory = directoryData as DirectoryRestaurant[]

function normalizePostcode(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase()
}

function postcodeDigits(postcode: string): string {
  return normalizePostcode(postcode).slice(0, 4)
}

export function searchDirectoryByPostcode(postcode: string, limit = 40): DirectoryRestaurant[] {
  if (!postcode || postcode.trim().length < 4) return []
  const digits = postcodeDigits(postcode)
  return directory.filter((r) => postcodeDigits(r.address.postcode) === digits).slice(0, limit)
}

export function searchDirectoryByCity(city: string): DirectoryRestaurant[] {
  if (!city || city.trim().length < 2) return []
  const q = city.toLowerCase().trim()
  return directory.filter((r) => r.address.city.toLowerCase().includes(q))
}

export function searchDirectory(opts: {
  postcode?: string
  city?: string
  query?: string
  limit?: number
}): DirectoryRestaurant[] {
  let results: DirectoryRestaurant[] = []

  if (opts.postcode && opts.postcode.trim().length >= 4) {
    results = searchDirectoryByPostcode(opts.postcode, opts.limit ?? 40)
  } else if (opts.city && opts.city.trim().length >= 2) {
    results = searchDirectoryByCity(opts.city)
  }

  if (opts.query && opts.query.trim().length > 0) {
    const q = opts.query.toLowerCase().trim()
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisines.some((c) => c.toLowerCase().includes(q))
    )
  }

  return results
}

export function findDirectoryRestaurantBySlug(slug: string): DirectoryRestaurant | null {
  return directory.find((r) => r.slug === slug) ?? null
}

export function getDirectorySize(): number {
  return directory.length
}

export function deliveryLabel(r: DirectoryRestaurant): string {
  const parts: string[] = []
  if (r.services.delivery === 'yes') parts.push('Bezorging')
  if (r.services.takeaway === 'yes') parts.push('Afhalen')
  return parts.length > 0 ? parts.join(' · ') : 'Bel voor bezorging'
}
