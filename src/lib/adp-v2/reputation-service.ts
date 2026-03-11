import { randomUUID } from 'node:crypto'

import { getTransaction } from '@/lib/adp-v2/transact-service'
import type { ReputationRequest, ReputationSignal } from '@/lib/adp-v2/reputation-types'

const reputations = new Map<string, ReputationSignal>()

export type CreateReputationSignalResult =
  | { success: true; reputation: ReputationSignal }
  | {
      success: false
      error: {
        status: number
        code: string
        message: string
        details?: Record<string, unknown>
      }
    }

function createReputationId(): string {
  return `rep_${randomUUID().replace(/-/g, '')}`
}

export function createReputationSignal(
  payload: ReputationRequest
): CreateReputationSignalResult {
  const transaction = getTransaction(payload.transaction_id)

  if (!transaction) {
    return {
      success: false,
      error: {
        status: 404,
        code: 'REPUTATION_TRANSACTION_NOT_FOUND',
        message: 'Reputation transaction not found',
        details: {
          transaction_id: payload.transaction_id,
        },
      },
    }
  }

  if (transaction.status !== 'completed') {
    return {
      success: false,
      error: {
        status: 409,
        code: 'REPUTATION_TRANSACTION_NOT_COMPLETED',
        message: 'Reputation can only be recorded for completed transactions',
        details: {
          transaction_id: payload.transaction_id,
          status: transaction.status,
        },
      },
    }
  }

  if (transaction.provider_did !== payload.provider_did) {
    return {
      success: false,
      error: {
        status: 409,
        code: 'REPUTATION_PROVIDER_MISMATCH',
        message: 'Reputation provider_did must match the transaction provider',
        details: {
          transaction_id: payload.transaction_id,
          provider_did: payload.provider_did,
          transaction_provider_did: transaction.provider_did,
        },
      },
    }
  }

  const reputation: ReputationSignal = {
    reputation_id: createReputationId(),
    transaction_id: payload.transaction_id,
    provider_did: payload.provider_did,
    score: payload.score,
    signal: payload.signal,
    created_at: new Date().toISOString(),
  }

  reputations.set(reputation.reputation_id, reputation)

  return {
    success: true,
    reputation,
  }
}
