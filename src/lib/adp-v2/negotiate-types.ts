import type { AgentCapability, AgentRole } from '@/lib/adp-v2/agent-types'

export interface NegotiatePayload {
  provider_did: string
  service_category: string
  intent: string
  budget?: number
  currency?: string
  constraints?: Record<string, unknown>
}

export interface NegotiateRequest extends NegotiatePayload {
  session_id: string
}

export interface NegotiateProviderSummary {
  did: string
  name: string
  role: AgentRole
  categories?: string[]
  capabilities: AgentCapability[]
}

export interface NegotiateSuccessResponse {
  ok: true
  message: 'ADP v2 negotiate request accepted'
  session_id: string
  negotiate: NegotiatePayload
  provider: NegotiateProviderSummary
}

export type NegotiateValidationResult =
  | { success: true; data: NegotiatePayload }
  | {
      success: false
      error: {
        code: string
        message: string
      }
    }
