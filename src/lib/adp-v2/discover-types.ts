import type { AgentCapability, AgentRole } from '@/lib/adp-v2/agent-types'

export interface DiscoverPayload {
  intent: string
  category?: string
  capability_key?: string
  location?: string
  budget?: number
}

export interface DiscoverRequest extends DiscoverPayload {
  session_id: string
}

export interface DiscoverMatch {
  did: string
  name: string
  role: AgentRole
  categories?: string[]
  capabilities: AgentCapability[]
}

export interface DiscoverCompletedResponse {
  ok: true
  message: 'ADP v2 discover completed'
  session_id: string
  discover: DiscoverPayload
  matches: DiscoverMatch[]
}

export type DiscoverValidationResult =
  | { success: true; data: DiscoverPayload }
  | {
      success: false
      error: {
        code: string
        message: string
      }
    }
