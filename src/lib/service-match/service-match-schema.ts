export interface NormalizedServiceMatchQuery {
  category: string
  postcode?: string
  requirements: {
    keywords: string[]
    urgency?: string
  }
  budget?: {
    maxAmount?: number
    currency?: string
  }
  limit: number
}

export type ServiceMatchValidationResult =
  | {
      success: true
      data: NormalizedServiceMatchQuery
    }
  | {
      success: false
      status: number
      error: {
        code: string
        message: string
        details: {
          formErrors: string[]
          fieldErrors: Record<string, string[]>
        }
      }
    }

const MAX_LIMIT = 25
const DEFAULT_LIMIT = 10
const ALLOWED_URGENCY_VALUES = new Set(['low', 'normal', 'high', 'emergency'])

function validationError(fieldErrors: Record<string, string[]>): ServiceMatchValidationResult {
  return {
    success: false,
    status: 400,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: {
        formErrors: [],
        fieldErrors,
      },
    },
  }
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function normalizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value
        .map((entry) => (typeof entry === 'string' ? entry.trim().toLowerCase() : ''))
        .filter(Boolean)
    )
  )
}

function normalizeLimit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_LIMIT
  }

  const normalized = Math.trunc(value)
  if (normalized < 1) {
    return 1
  }

  return Math.min(normalized, MAX_LIMIT)
}

export function parseServiceMatchRequest(rawBody: string): ServiceMatchValidationResult {
  let body: unknown

  try {
    body = JSON.parse(rawBody)
  } catch {
    return validationError({
      form: ['Expected object, received invalid JSON'],
    })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return validationError({
      form: ['Expected object, received non-object body'],
    })
  }

  const payload = body as Record<string, unknown>
  const requirements =
    payload.requirements && typeof payload.requirements === 'object' && !Array.isArray(payload.requirements)
      ? (payload.requirements as Record<string, unknown>)
      : {}
  const budget = payload.budget && typeof payload.budget === 'object' && !Array.isArray(payload.budget)
    ? (payload.budget as Record<string, unknown>)
    : null

  const category = normalizeString(payload.category)
  const postcode = normalizeString(payload.postcode)
  const urgency = normalizeString(requirements.urgency)
  const keywords = normalizeKeywords(requirements.keywords)
  const maxAmount = typeof budget?.maxAmount === 'number' && Number.isFinite(budget.maxAmount) ? budget.maxAmount : undefined
  const currency = normalizeString(budget?.currency)

  if (!category) {
    return validationError({
      category: ['Required'],
    })
  }

  if (urgency && !ALLOWED_URGENCY_VALUES.has(urgency)) {
    return validationError({
      requirements: [
        `Invalid enum value. Expected 'low' | 'normal' | 'high' | 'emergency', received '${urgency}'`,
      ],
    })
  }

  return {
    success: true,
    data: {
      category,
      ...(postcode ? { postcode } : {}),
      requirements: {
        keywords,
        ...(urgency ? { urgency } : {}),
      },
      ...(maxAmount !== undefined || currency
        ? {
            budget: {
              ...(maxAmount !== undefined ? { maxAmount } : {}),
              ...(currency ? { currency } : {}),
            },
          }
        : {}),
      limit: normalizeLimit(payload.limit),
    },
  }
}
