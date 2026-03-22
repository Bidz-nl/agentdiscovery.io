export function normalizePostcode(value: string) {
  return value.toUpperCase().replace(/\s+/g, '').trim()
}

export function normalizePostcodePrefix(value: string) {
  return normalizePostcode(value).replace(/[^A-Z0-9]/g, '')
}

export function normalizePostcodePrefixes(values: string[]) {
  return Array.from(new Set(values.map(normalizePostcodePrefix).filter(Boolean))).sort()
}

export function postcodeMatchesPrefixes(postcode: string, prefixes: string[]) {
  const normalizedPostcode = normalizePostcode(postcode)
  const normalizedPrefixes = normalizePostcodePrefixes(prefixes)

  if (!normalizedPostcode || normalizedPrefixes.length === 0) {
    return false
  }

  return normalizedPrefixes.some((prefix) => normalizedPostcode.startsWith(prefix))
}
