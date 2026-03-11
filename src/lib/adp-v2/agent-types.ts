export type AgentRole = 'consumer' | 'provider' | 'broker'

export interface AgentCapability {
  key: string
  description: string
  input_schema?: Record<string, unknown>
  output_schema?: Record<string, unknown>
}

export interface AgentManifest {
  did: string
  name: string
  role: AgentRole
  description?: string
  categories?: string[]
  capabilities: AgentCapability[]
  supported_protocol_versions: string[]
  supported_modes?: string[]
  authority_summary?: Record<string, unknown>
}

export interface AgentRegistrationRequest extends AgentManifest {}

export type AgentRegistrationValidationResult =
  | { success: true; data: AgentRegistrationRequest }
  | { success: false; errors: string[] }
