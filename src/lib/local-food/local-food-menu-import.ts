import type { CreateLocalFoodMenuItemInput, LocalFoodMenuCategory } from '@/lib/local-food/local-food-types'

function splitCsvLine(line: string) {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]

    if (character === '"') {
      const nextCharacter = line[index + 1]
      if (inQuotes && nextCharacter === '"') {
        current += '"'
        index += 1
        continue
      }

      inQuotes = !inQuotes
      continue
    }

    if (character === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  values.push(current.trim())
  return values
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase()
}

function parseCategory(value: string): LocalFoodMenuCategory {
  const normalized = value.trim().toLowerCase()

  if (normalized === 'pizza' || normalized === 'sides' || normalized === 'drinks' || normalized === 'desserts') {
    return normalized
  }

  return 'pizza'
}

function parseBoolean(value: string) {
  const normalized = value.trim().toLowerCase()
  return !(normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'sold_out')
}

function parsePriceToCents(value: string) {
  const normalized = value.trim().replace('€', '').replace(/\s+/g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid price value: ${value}`)
  }

  return Math.round(parsed * 100)
}

export function parseLocalFoodMenuCsv(csvText: string): CreateLocalFoodMenuItemInput[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader)

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))

    if (!row.name?.trim()) {
      throw new Error('CSV menu row is missing a name value')
    }

    return {
      category: parseCategory(row.category || 'pizza'),
      name: row.name.trim(),
      description: row.description?.trim() ?? '',
      priceCents: parsePriceToCents(row.price || row.price_eur || row.amount || ''),
      available: row.available ? parseBoolean(row.available) : true,
      tags: row.tags
        ? row.tags
            .split('|')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    }
  })
}
