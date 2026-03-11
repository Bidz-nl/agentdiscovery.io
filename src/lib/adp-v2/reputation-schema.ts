import type { ReputationRequest, ReputationValidationResult } from '@/lib/adp-v2/reputation-types'

export function validateReputationRequest(input: Record<string, unknown>): ReputationValidationResult {
  if (typeof input.transaction_id !== 'string' || input.transaction_id.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_REPUTATION_TRANSACTION_ID',
        message: 'transaction_id is required and must be a non-empty string',
      },
    }
  }

  if (typeof input.provider_did !== 'string' || input.provider_did.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_REPUTATION_PROVIDER_DID',
        message: 'provider_did is required and must be a non-empty string',
      },
    }
  }

  if (
    typeof input.score !== 'number' ||
    Number.isNaN(input.score) ||
    !Number.isInteger(input.score) ||
    input.score < 1 ||
    input.score > 3
  ) {
    return {
      success: false,
      error: {
        code: 'INVALID_REPUTATION_SCORE',
        message: 'score must be an integer between 1 and 3',
      },
    }
  }

  if (typeof input.signal !== 'string' || input.signal.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_REPUTATION_SIGNAL',
        message: 'signal is required and must be a non-empty string',
      },
    }
  }

  const reputation: ReputationRequest = {
    transaction_id: input.transaction_id.trim(),
    provider_did: input.provider_did.trim(),
    score: input.score,
    signal: input.signal.trim(),
  }

  return {
    success: true,
    data: reputation,
  }
}
