import { randomUUID } from 'node:crypto'

import { getAgentRecordByDid } from '@/lib/adp-v2/agent-record-repository'
import type { TransactionRecord, TransactionStatus, TransactPayload } from '@/lib/adp-v2/transact-types'

const transactions = new Map<string, TransactionRecord>()
const ALLOWED_TRANSACTION_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  pending: ['accepted', 'rejected'],
  accepted: ['completed'],
  rejected: [],
  completed: [],
}

export type CreateTransactionResult =
  | { success: true; transaction: TransactionRecord }
  | {
      success: false
      error: {
        status: number
        code: string
        message: string
        details?: Record<string, unknown>
      }
    }

function createTransactionId(): string {
  return `tx_${randomUUID().replace(/-/g, '')}`
}

export function createTransaction(sessionId: string, transact: TransactPayload): CreateTransactionResult {
  const provider = getAgentRecordByDid(transact.provider_did)

  if (!provider) {
    return {
      success: false,
      error: {
        status: 404,
        code: 'TRANSACTION_PROVIDER_NOT_FOUND',
        message: 'Transaction provider not found',
        details: {
          provider_did: transact.provider_did,
        },
      },
    }
  }

  if (provider.role !== 'provider') {
    return {
      success: false,
      error: {
        status: 409,
        code: 'TRANSACTION_PROVIDER_INVALID_ROLE',
        message: 'Transaction provider must have role provider',
        details: {
          provider_did: transact.provider_did,
          role: provider.role,
        },
      },
    }
  }

  if (!provider.supportedProtocolVersions.includes('2.0')) {
    return {
      success: false,
      error: {
        status: 409,
        code: 'TRANSACTION_PROVIDER_UNSUPPORTED_PROTOCOL',
        message: 'Transaction provider does not support ADP protocol version 2.0',
        details: {
          provider_did: transact.provider_did,
          supported_protocol_versions: provider.supportedProtocolVersions,
        },
      },
    }
  }

  const transaction: TransactionRecord = {
    transaction_id: createTransactionId(),
    session_id: sessionId,
    provider_did: transact.provider_did,
    intent: transact.intent,
    budget: transact.budget,
    currency: transact.currency,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  transactions.set(transaction.transaction_id, transaction)

  return {
    success: true,
    transaction,
  }
}

export function getTransaction(transactionId: string): TransactionRecord | null {
  return transactions.get(transactionId) ?? null
}

export interface ListTransactionsFilters {
  session_id?: string
  provider_did?: string
  status?: TransactionStatus
}

export function listTransactions(filters?: ListTransactionsFilters): TransactionRecord[] {
  const allTransactions = Array.from(transactions.values())

  return allTransactions.filter((transaction) => {
    if (filters?.session_id && transaction.session_id !== filters.session_id) {
      return false
    }

    if (filters?.provider_did && transaction.provider_did !== filters.provider_did) {
      return false
    }

    if (filters?.status && transaction.status !== filters.status) {
      return false
    }

    return true
  })
}

export type UpdateTransactionStatusResult =
  | { success: true; transaction: TransactionRecord }
  | {
      success: false
      error: {
        status: number
        code: string
        message: string
        details?: Record<string, unknown>
      }
    }

export function updateTransactionStatus(
  transactionId: string,
  nextStatus: TransactionStatus
): UpdateTransactionStatusResult {
  const transaction = transactions.get(transactionId)

  if (!transaction) {
    return {
      success: false,
      error: {
        status: 404,
        code: 'TRANSACTION_NOT_FOUND',
        message: 'ADP v2 transaction not found',
        details: {
          transaction_id: transactionId,
        },
      },
    }
  }

  const allowedTransitions = ALLOWED_TRANSACTION_TRANSITIONS[transaction.status]

  if (!allowedTransitions.includes(nextStatus)) {
    return {
      success: false,
      error: {
        status: 409,
        code: 'TRANSACTION_INVALID_TRANSITION',
        message: 'Transaction status transition is not allowed',
        details: {
          transaction_id: transactionId,
          current_status: transaction.status,
          next_status: nextStatus,
          allowed_transitions: allowedTransitions,
        },
      },
    }
  }

  const updatedTransaction: TransactionRecord = {
    ...transaction,
    status: nextStatus,
  }

  transactions.set(transactionId, updatedTransaction)

  return {
    success: true,
    transaction: updatedTransaction,
  }
}
