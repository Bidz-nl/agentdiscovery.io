import type { DiscoverPayload, DiscoverValidationResult } from '@/lib/adp-v2/discover-types'

export function validateDiscoverRequest(input: Record<string, unknown>): DiscoverValidationResult {
  if (typeof input.intent !== 'string' || input.intent.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_DISCOVER_INTENT',
        message: 'intent is required and must be a non-empty string',
      },
    }
  }

  if (input.category !== undefined && typeof input.category !== 'string') {
    return {
      success: false,
      error: {
        code: 'INVALID_DISCOVER_CATEGORY',
        message: 'category must be a string when provided',
      },
    }
  }

  if (input.location !== undefined && typeof input.location !== 'string') {
    return {
      success: false,
      error: {
        code: 'INVALID_DISCOVER_LOCATION',
        message: 'location must be a string when provided',
      },
    }
  }

  if (
    input.budget !== undefined &&
    (typeof input.budget !== 'number' || Number.isNaN(input.budget) || input.budget < 0)
  ) {
    return {
      success: false,
      error: {
        code: 'INVALID_DISCOVER_BUDGET',
        message: 'budget must be a valid number greater than or equal to 0 when provided',
      },
    }
  }

  const discover: DiscoverPayload = {
    intent: input.intent.trim(),
  }

  if (typeof input.category === 'string' && input.category.trim().length > 0) {
    discover.category = input.category.trim()
  }

  if (typeof input.location === 'string' && input.location.trim().length > 0) {
    discover.location = input.location.trim()
  }

  if (typeof input.budget === 'number') {
    discover.budget = input.budget
  }

  return {
    success: true,
    data: discover,
  }
}
