export type TransactionStatus = 'pending' | 'accepted' | 'rejected' | 'completed'

export interface TransactPayload {
  provider_did: string
  intent: string
  budget?: number
  currency?: string
}

export interface TransactRequest extends TransactPayload {
  session_id: string
}

export interface TransactionRecord {
  transaction_id: string
  session_id: string
  provider_did: string
  intent: string
  budget?: number
  currency?: string
  status: TransactionStatus
  created_at: string
}

export interface TransactSuccessResponse {
  ok: true
  message: 'ADP v2 transaction created'
  transaction: TransactionRecord
}

export interface TransactionStatusUpdateRequest {
  status: TransactionStatus
}

export type TransactionStatusUpdateValidationResult =
  | { success: true; data: TransactionStatusUpdateRequest }
  | {
      success: false
      error: {
        code: string
        message: string
      }
    }

export type TransactValidationResult =
  | { success: true; data: TransactPayload }
  | {
      success: false
      error: {
        code: string
        message: string
      }
    }
