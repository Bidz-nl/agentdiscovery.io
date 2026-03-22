export type AgentRuntimeMode = 'manual' | 'hosted'
export type AgentRuntimeStatus = 'needs_setup' | 'ready' | 'disabled'
export type AgentProvider = 'native' | 'openai' | 'anthropic'
export type AgentCredentialStatus = 'active' | 'revoked'
export type AgentCredentialKind = 'app_api_key' | 'provider_api_key'
export type AgentCredentialValidationStatus = 'unvalidated' | 'valid' | 'invalid'
export type AgentCredentialSource = 'hosted_managed' | 'bring_your_own'
export type AgentRunStatus = 'pending' | 'completed' | 'failed'
export type AgentRunKind = 'sandbox'
export type AgentToolName = 'list_capabilities'
export type AgentRuntimeBlockReason =
  | 'none'
  | 'policy_disabled'
  | 'provider_not_connected'
  | 'credential_invalid'
  | 'runtime_not_ready'
  | 'spend_guard_blocked'
export type AgentSpendGuardMode = 'token_estimate_scaffold'
export type AgentRunFailureCode =
  | 'provider_run_failed'
  | 'provider_auth_failed'
  | 'policy_blocked'
  | 'spend_guard_blocked'
  | 'runtime_not_ready'

export interface AgentPolicyRecord {
  id: string
  agentId: number
  enabled: boolean
  approvalRequired: boolean
  allowedTools: AgentToolName[]
  spendCapUsd: number
  createdAt: string
  updatedAt: string
}

export interface AgentRunRecord {
  id: string
  agentId: number
  provider: Exclude<AgentProvider, 'native'>
  model: string
  kind: AgentRunKind
  status: AgentRunStatus
  prompt: string
  outputText: string | null
  toolCalls: Array<{
    toolName: AgentToolName
    status: 'completed' | 'failed'
    input: Record<string, unknown>
    output: Record<string, unknown>
  }>
  credentialId: string | null
  startedAt: string
  completedAt: string | null
  errorMessage: string | null
  failure: {
    code: AgentRunFailureCode
    message: string
  } | null
  usage: {
    inputTokens: number | null
    outputTokens: number | null
    estimatedCostUsd: number | null
    accountingMode: 'token_estimate_scaffold' | 'unavailable'
  }
}

export interface AgentRuntimeSummary {
  runtimeMode: AgentRuntimeMode
  runtimeStatus: AgentRuntimeStatus
  preferredProvider: Exclude<AgentProvider, 'native'> | null
}

export interface AgentCredentialReadModel {
  id: string
  label: string
  provider: Exclude<AgentProvider, 'native'>
  source: AgentCredentialSource
  status: AgentCredentialStatus
  validationStatus: AgentCredentialValidationStatus
  validatedAt: string | null
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
  maskedSecret: string | null
}

export interface AgentRuntimeReadModel {
  agent: {
    id: number
    did: string
    name: string
    runtimeMode: AgentRuntimeMode
    runtimeStatus: AgentRuntimeStatus
    preferredProvider: Exclude<AgentProvider, 'native'> | null
  }
  profile: {
    displayName: string
    purpose: string
    specialties: string[]
    memoryScopeMode: 'none' | 'ephemeral' | 'session' | 'agent_private' | 'owner_private'
  } | null
  providerConnection: {
    provider: Exclude<AgentProvider, 'native'> | null
    supportsTools: boolean
    supportsStreaming: boolean
    usingHostedCredential: boolean
    credential: AgentCredentialReadModel | null
    lastValidatedAt: string | null
    validationStatus: AgentCredentialValidationStatus
  }
  policy: AgentPolicyRecord
  state: {
    runtimeStatus: AgentRuntimeStatus
    validationStatus: AgentCredentialValidationStatus
    policyEnabled: boolean
    canRunSandbox: boolean
    blockReason: AgentRuntimeBlockReason
  }
  spend: {
    mode: AgentSpendGuardMode
    spendCapUsd: number
    trackedEstimatedCostUsd: number
    remainingBudgetUsd: number
    blocked: boolean
    accountingComplete: false
    note: string
  }
  recentRuns: AgentRunRecord[]
}

export interface ConnectRuntimeProviderRequest {
  provider: Exclude<AgentProvider, 'native'>
  label?: string
  apiKey?: string
}

export interface UpdateAgentPolicyRequest {
  enabled?: boolean
  approvalRequired?: boolean
  allowedTools?: AgentToolName[]
  spendCapUsd?: number
}

export interface SandboxRunRequest {
  provider?: Exclude<AgentProvider, 'native'>
  prompt: string
  model?: string
  useTool?: boolean
}
