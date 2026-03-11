import type { TransactPayload, TransactValidationResult } from '@/lib/adp-v2/transact-types'

export function validateTransactRequest(input: Record<string, unknown>): TransactValidationResult {
  if (typeof input.provider_did !== 'string' || input.provider_did.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_TRANSACT_PROVIDER_DID',
        message: 'provider_did is required and must be a non-empty string',
      },
    }
  }

  if (typeof input.intent !== 'string' || input.intent.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_TRANSACT_INTENT',
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
        code: 'INVALID_TRANSACT_BUDGET',
        message: 'budget must be a valid number greater than or equal to 0 when provided',
      },
    }
  }

  if (input.currency !== undefined && typeof input.currency !== 'string') {
    return {
      success: false,
      error: {
        code: 'INVALID_TRANSACT_CURRENCY',
        message: 'currency must be a string when provided',
      },
    }
  }

  const transact: TransactPayload = {
    provider_did: input.provider_did.trim(),
    intent: input.intent.trim(),
  }

  if (typeof input.budget === 'number') {
    transact.budget = input.budget
  }

  if (typeof input.currency === 'string' && input.currency.trim().length > 0) {
    transact.currency = input.currency.trim()
  }

  return {
    success: true,
    data: transact,
  }
}
