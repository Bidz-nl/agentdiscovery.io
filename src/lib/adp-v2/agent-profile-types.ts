import type { AgentRole } from '@/lib/adp-v2/agent-types'

export type AgentProfileStatus = 'draft' | 'active' | 'disabled'
export type AgentBackendProvider = 'native' | 'openai' | 'anthropic'
export type AgentBackendMode = 'manual' | 'hosted'
export type AgentSkillExecutionMode = 'prompt_only' | 'tool_augmented' | 'workflow_guided'
export type AgentSkillLevel = 'basic' | 'specialized' | 'expert'
export type AgentSkillPackStatus = 'draft' | 'active' | 'deprecated'
export type AgentToolGrantMode = 'deny' | 'read' | 'write' | 'execute'
export type AgentApprovalMode = 'never' | 'always' | 'conditional'
export type AgentMemoryScopeMode = 'none' | 'ephemeral' | 'session' | 'agent_private' | 'owner_private'
export type AgentKnowledgeSourceKind =
  | 'owner_service_catalog'
  | 'uploaded_document'
  | 'knowledge_base'
  | 'transaction_history'
  | 'negotiation_history'
  | 'crm'
  | 'calendar'
  | 'external_api'
export type AgentKnowledgeAccessScope = 'public_projection' | 'session_scoped' | 'agent_private' | 'owner_private'
export type AgentKnowledgeFreshness = 'static' | 'daily' | 'hourly' | 'realtime'
export type AgentDataSensitivity = 'public' | 'internal' | 'restricted'
export type AgentReputationTrustTier = 'unrated' | 'emerging' | 'trusted' | 'verified'

export interface AgentBackendProfile {
  mode: AgentBackendMode
  provider: AgentBackendProvider
  model: string | null
  modelFamily: string | null
  adapterVersion: string | null
}

export interface AgentIdentityProfile {
  did: string
  slug: string
  displayName: string
  role: AgentRole
  purpose: string
  summary: string
  ownerDefinedSpecialty: string[]
  audience: string[]
  operatingRegions: string[]
  languages: string[]
}

export interface AgentSkillDefinition {
  key: string
  name: string
  summary: string
  level: AgentSkillLevel
  executionMode: AgentSkillExecutionMode
  specialtyTags: string[]
  inputKinds: string[]
  outputKinds: string[]
  successSignals: string[]
  failureBoundaries: string[]
}

export interface AgentSkillPackRef {
  key: string
  version: string
  status: AgentSkillPackStatus
  priority: number
}

export interface AgentApprovalRule {
  actionKey: string
  mode: AgentApprovalMode
  reason: string
  maxSpendUsd: number | null
  requiresHumanCheckpoint: boolean
}

export interface AgentPolicyProfile {
  autonomyMode: 'advisory' | 'semi_autonomous' | 'autonomous'
  defaultApprovalMode: AgentApprovalMode
  approvalRules: AgentApprovalRule[]
  spendCapUsd: number
  maxConcurrentActions: number
  allowExternalSideEffects: boolean
  allowCrossCounterpartyMemory: boolean
  escalationChannels: string[]
}

export interface AgentToolCapabilityGrant {
  toolKey: string
  title: string
  mode: AgentToolGrantMode
  resourceScopes: string[]
  ownerScopedOnly: boolean
  requiresApproval: boolean
  protocolVisible: boolean
  maxCallsPerRun: number | null
}

export interface AgentKnowledgeSourceDescriptor {
  key: string
  title: string
  kind: AgentKnowledgeSourceKind
  accessScope: AgentKnowledgeAccessScope
  freshness: AgentKnowledgeFreshness
  sensitivity: AgentDataSensitivity
  ownerManaged: boolean
  discoverableSummary: string | null
}

export interface AgentMemoryScopeProfile {
  mode: AgentMemoryScopeMode
  namespaces: string[]
  retentionDays: number | null
  storesPreferenceMemory: boolean
  storesCounterpartyMemory: boolean
  storesExecutionMemory: boolean
}

export interface AgentReputationSummary {
  trustTier: AgentReputationTrustTier
  totalTransactions: number
  completedTransactions: number
  averageScore: number | null
  positiveSignalCount: number
  disputedSignalCount: number
  lastUpdatedAt: string | null
}

export interface AgentDiscoveryProfile {
  specialties: string[]
  searchableTags: string[]
  preferredEngagements: string[]
  trustSignals: string[]
  visibleKnowledgeSummaries: string[]
}

export interface AgentProfileRecord {
  id: string
  agentDid: string
  status: AgentProfileStatus
  version: number
  identity: AgentIdentityProfile
  backend: AgentBackendProfile
  skills: AgentSkillDefinition[]
  skillPacks: AgentSkillPackRef[]
  toolGrants: AgentToolCapabilityGrant[]
  knowledgeSources: AgentKnowledgeSourceDescriptor[]
  policyProfile: AgentPolicyProfile
  memoryScope: AgentMemoryScopeProfile
  reputationSummary: AgentReputationSummary
  discoveryProfile: AgentDiscoveryProfile
  createdAt: string
  updatedAt: string
}

export interface PublicAgentProfileProjection {
  agentDid: string
  displayName: string
  role: AgentRole
  purpose: string
  summary: string
  specialties: string[]
  searchableTags: string[]
  skills: Array<Pick<AgentSkillDefinition, 'key' | 'name' | 'summary' | 'level'>>
  toolCapabilities: Array<Pick<AgentToolCapabilityGrant, 'toolKey' | 'mode' | 'protocolVisible'>>
  visibleKnowledgeSummaries: string[]
  reputationSummary: AgentReputationSummary
}
