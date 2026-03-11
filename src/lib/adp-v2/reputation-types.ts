export interface ReputationSignal {
  reputation_id: string
  transaction_id: string
  provider_did: string
  score: number
  signal: string
  created_at: string
}

export interface ReputationRequest {
  transaction_id: string
  provider_did: string
  score: number
  signal: string
}

export interface ReputationSuccessResponse {
  ok: true
  message: 'ADP v2 reputation recorded'
  reputation: ReputationSignal
}

export type ReputationValidationResult =
  | { success: true; data: ReputationRequest }
  | {
      success: false
      error: {
        code: string
        message: string
      }
    }
