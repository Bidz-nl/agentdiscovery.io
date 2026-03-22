export type AgentRole = 'consumer' | 'provider' | 'broker'
export type AgentStatus = 'active' | 'disabled'
export type AgentCredentialStatus = 'active' | 'revoked'
export type AgentRuntimeMode = 'manual' | 'hosted'
export type AgentRuntimeStatus = 'needs_setup' | 'ready' | 'disabled'
export type AgentCredentialKind = 'app_api_key' | 'provider_api_key'
export type AgentCredentialValidationStatus = 'unvalidated' | 'valid' | 'invalid'
export type AgentCredentialSource = 'hosted_managed' | 'bring_your_own'

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

export interface AgentRecord {
  id: number
  did: string
  name: string
  role: AgentRole
  description?: string
  status: AgentStatus
  supportedProtocolVersions: string[]
  authoritySummary?: Record<string, unknown>
  runtimeMode: AgentRuntimeMode
  runtimeStatus: AgentRuntimeStatus
  preferredProvider: 'openai' | 'anthropic' | null
  createdAt: string
  updatedAt: string
}

export interface AgentCredentialRecord {
  id: string
  agentId: number
  label: string
  kind: AgentCredentialKind
  provider: 'native' | 'openai' | 'anthropic' | null
  source: AgentCredentialSource
  secretHash: string
  encryptedSecret: string | null
  maskedSecret: string | null
  status: AgentCredentialStatus
  validationStatus: AgentCredentialValidationStatus
  validatedAt: string | null
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

export interface NativeAgentRegistrationRequest {
  name: string
  role: AgentRole
  description?: string
  supported_protocol_versions: string[]
  authority_summary?: Record<string, unknown>
}

export type AgentRegistrationValidationResult =
  | { success: true; data: AgentRegistrationRequest }
  | { success: false; errors: string[] }
