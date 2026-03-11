import type { NegotiatePayload, NegotiateValidationResult } from '@/lib/adp-v2/negotiate-types'

export function validateNegotiateRequest(input: Record<string, unknown>): NegotiateValidationResult {
  if (typeof input.provider_did !== 'string' || input.provider_did.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_NEGOTIATE_PROVIDER_DID',
        message: 'provider_did is required and must be a non-empty string',
      },
    }
  }

  if (typeof input.service_category !== 'string' || input.service_category.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_NEGOTIATE_SERVICE_CATEGORY',
        message: 'service_category is required and must be a non-empty string',
      },
    }
  }

  if (typeof input.intent !== 'string' || input.intent.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_NEGOTIATE_INTENT',
        message: 'intent is required and must be a non-empty string',
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
        code: 'INVALID_NEGOTIATE_BUDGET',
        message: 'budget must be a valid number greater than or equal to 0 when provided',
      },
    }
  }

  if (input.currency !== undefined && typeof input.currency !== 'string') {
    return {
      success: false,
      error: {
        code: 'INVALID_NEGOTIATE_CURRENCY',
        message: 'currency must be a string when provided',
      },
    }
  }

  if (
    input.constraints !== undefined &&
    (!input.constraints || typeof input.constraints !== 'object' || Array.isArray(input.constraints))
  ) {
    return {
      success: false,
      error: {
        code: 'INVALID_NEGOTIATE_CONSTRAINTS',
        message: 'constraints must be an object when provided',
      },
    }
  }

  const negotiate: NegotiatePayload = {
    provider_did: input.provider_did.trim(),
    service_category: input.service_category.trim(),
    intent: input.intent.trim(),
  }

  if (typeof input.budget === 'number') {
    negotiate.budget = input.budget
  }

  if (typeof input.currency === 'string' && input.currency.trim().length > 0) {
    negotiate.currency = input.currency.trim()
  }

  if (input.constraints && typeof input.constraints === 'object' && !Array.isArray(input.constraints)) {
    negotiate.constraints = input.constraints as Record<string, unknown>
  }

  return {
    success: true,
    data: negotiate,
  }
}
