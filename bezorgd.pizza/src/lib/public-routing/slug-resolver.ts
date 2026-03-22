function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function toPublicRestaurantSlug(value: string) {
  return slugify(value)
}

export function resolvePublicSlug(slug: string) {
  return slugify(slug)
}
