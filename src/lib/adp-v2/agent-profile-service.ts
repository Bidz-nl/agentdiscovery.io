import type {
  AgentMemoryScopeMode,
  AgentProfileRecord,
  AgentSkillDefinition,
  AgentToolCapabilityGrant,
  PublicAgentProfileProjection,
} from '@/lib/adp-v2/agent-profile-types'
import { createAgentProfileRecord, getAgentProfileRecord, updateAgentProfileRecord } from '@/lib/adp-v2/agent-profile-repository'
import { getAgentRecordByDid } from '@/lib/adp-v2/agent-record-repository'
import type { AgentRecord } from '@/lib/adp-v2/agent-types'

export type AgentProfilePolicyAutonomyMode = 'advisory' | 'semi_autonomous' | 'autonomous'
export type AgentProfileApprovalMode = 'never' | 'always' | 'conditional'
export type AgentProfileToolGrantMode = 'deny' | 'read' | 'write' | 'execute'

export interface AgentProfilePrivateReadModel {
  profile: AgentProfileRecord
  editor: {
    availableSkills: AgentSkillDefinition[]
    availableTools: Array<Pick<AgentToolCapabilityGrant, 'toolKey' | 'title' | 'mode' | 'requiresApproval' | 'protocolVisible'>>
    allowedMemoryScopes: AgentMemoryScopeMode[]
    allowedAutonomyModes: AgentProfilePolicyAutonomyMode[]
    allowedApprovalModes: AgentProfileApprovalMode[]
  }
}

export interface AgentProfileRuntimeProjection {
  displayName: string
  purpose: string
  specialties: string[]
  allowedToolModes: Array<Pick<AgentToolCapabilityGrant, 'toolKey' | 'mode' | 'ownerScopedOnly' | 'requiresApproval'>>
  memoryScope: Pick<AgentProfileRecord['memoryScope'], 'mode' | 'storesExecutionMemory' | 'storesPreferenceMemory' | 'storesCounterpartyMemory'>
  policy: Pick<AgentProfileRecord['policyProfile'], 'autonomyMode' | 'defaultApprovalMode' | 'allowExternalSideEffects' | 'allowCrossCounterpartyMemory' | 'spendCapUsd'>
}

export interface UpdateAgentProfileInput {
  displayName?: string
  purpose?: string
  ownerDefinedSpecialty?: string[]
  selectedSkillKeys?: string[]
  toolGrants?: Array<{
    toolKey: string
    mode?: AgentProfileToolGrantMode
    requiresApproval?: boolean
  }>
  policyProfile?: {
    autonomyMode?: AgentProfilePolicyAutonomyMode
    defaultApprovalMode?: AgentProfileApprovalMode
    spendCapUsd?: number
    allowExternalSideEffects?: boolean
    allowCrossCounterpartyMemory?: boolean
  }
  memoryScope?: {
    mode?: AgentMemoryScopeMode
    retentionDays?: number | null
    storesPreferenceMemory?: boolean
    storesExecutionMemory?: boolean
  }
}

const MEMORY_SCOPE_OPTIONS: AgentMemoryScopeMode[] = ['none', 'ephemeral', 'session', 'agent_private', 'owner_private']
const AUTONOMY_MODE_OPTIONS: AgentProfilePolicyAutonomyMode[] = ['advisory', 'semi_autonomous', 'autonomous']
const APPROVAL_MODE_OPTIONS: AgentProfileApprovalMode[] = ['never', 'conditional', 'always']

const SKILL_LIBRARY: AgentSkillDefinition[] = [
  {
    key: 'compare_provider_quotes',
    name: 'Compare Provider Quotes',
    summary: 'Compare offers, pricing, and terms across providers.',
    level: 'specialized',
    executionMode: 'workflow_guided',
    specialtyTags: ['pricing', 'evaluation', 'comparison'],
    inputKinds: ['service_request', 'quote_list'],
    outputKinds: ['comparison_summary', 'recommendation'],
    successSignals: ['clear recommendation', 'tradeoff explanation'],
    failureBoundaries: ['does not fabricate unavailable offers'],
  },
  {
    key: 'negotiate_buyer_constraints',
    name: 'Negotiate Buyer Constraints',
    summary: 'Negotiate around buyer budget, delivery, and scope constraints.',
    level: 'expert',
    executionMode: 'tool_augmented',
    specialtyTags: ['negotiation', 'budget', 'delivery'],
    inputKinds: ['buyer_constraints', 'provider_terms'],
    outputKinds: ['counterproposal', 'constraint_summary'],
    successSignals: ['constraints preserved', 'concrete next step'],
    failureBoundaries: ['does not exceed buyer policy guardrails'],
  },
  {
    key: 'translate_services_into_offers',
    name: 'Translate Services Into Offers',
    summary: 'Turn owner service context into clear offers and scopes.',
    level: 'expert',
    executionMode: 'tool_augmented',
    specialtyTags: ['service packaging', 'proposal writing', 'pricing'],
    inputKinds: ['service_catalog', 'buyer_request'],
    outputKinds: ['offer_summary', 'scope_outline'],
    successSignals: ['service fit stated', 'scope clear'],
    failureBoundaries: ['does not promise unsupported service delivery'],
  },
  {
    key: 'provider_negotiation_response',
    name: 'Provider Negotiation Response',
    summary: 'Respond to negotiation turns while protecting provider constraints.',
    level: 'specialized',
    executionMode: 'workflow_guided',
    specialtyTags: ['counteroffer', 'margin protection', 'availability'],
    inputKinds: ['negotiation_turn', 'provider_constraints'],
    outputKinds: ['response_message', 'counterproposal'],
    successSignals: ['clear rationale', 'acceptable terms'],
    failureBoundaries: ['does not disclose hidden internal margins'],
  },
  {
    key: 'schedule_delivery_windows',
    name: 'Schedule Delivery Windows',
    summary: 'Coordinate timing, handoff windows, and schedule fit.',
    level: 'expert',
    executionMode: 'workflow_guided',
    specialtyTags: ['scheduling', 'coordination', 'handoff'],
    inputKinds: ['availability_window', 'delivery_constraints'],
    outputKinds: ['schedule_plan', 'handoff_window'],
    successSignals: ['time conflict resolved', 'window confirmed'],
    failureBoundaries: ['does not commit unavailable times'],
  },
  {
    key: 'resolve_logistics_conflicts',
    name: 'Resolve Logistics Conflicts',
    summary: 'Handle reschedules and logistics exceptions safely.',
    level: 'specialized',
    executionMode: 'tool_augmented',
    specialtyTags: ['rescheduling', 'exceptions', 'fulfillment'],
    inputKinds: ['schedule_conflict', 'fulfillment_context'],
    outputKinds: ['resolution_options', 'updated_plan'],
    successSignals: ['alternate options produced'],
    failureBoundaries: ['does not fabricate transport state'],
  },
]

const TOOL_LIBRARY: AgentToolCapabilityGrant[] = [
  {
    toolKey: 'list_capabilities',
    title: 'List owner capabilities',
    mode: 'read',
    resourceScopes: ['owner:services:summary'],
    ownerScopedOnly: true,
    requiresApproval: false,
    protocolVisible: true,
    maxCallsPerRun: 1,
  },
  {
    toolKey: 'calendar_read',
    title: 'Read owner availability windows',
    mode: 'deny',
    resourceScopes: ['owner:calendar:availability'],
    ownerScopedOnly: true,
    requiresApproval: true,
    protocolVisible: false,
    maxCallsPerRun: 3,
  },
]

function normalizeString(value: unknown, fallback = '') {
  if (typeof value !== 'string') {
    return fallback
  }

  return value.trim()
}

function normalizeStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback
  }

  return Array.from(
    new Set(
      value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
    )
  )
}

function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'agent'
}

function getSkillByKey(skillKey: string) {
  return SKILL_LIBRARY.find((skill) => skill.key === skillKey) ?? null
}

function getDefaultSkillKeys(role: AgentRecord['role']) {
  if (role === 'consumer') {
    return ['compare_provider_quotes', 'negotiate_buyer_constraints']
  }

  if (role === 'provider') {
    return ['translate_services_into_offers', 'provider_negotiation_response']
  }

  return ['schedule_delivery_windows', 'resolve_logistics_conflicts']
}

function getDefaultKnowledgeSources(agent: AgentRecord): AgentProfileRecord['knowledgeSources'] {
  if (agent.role === 'provider') {
    return [
      {
        key: 'owner_service_catalog',
        title: 'Owner service catalog',
        kind: 'owner_service_catalog',
        accessScope: 'owner_private',
        freshness: 'daily',
        sensitivity: 'internal',
        ownerManaged: true,
        discoverableSummary: 'Can reason over owner-managed service context',
      },
    ]
  }

  if (agent.role === 'consumer') {
    return [
      {
        key: 'buyer_preferences',
        title: 'Buyer preferences',
        kind: 'knowledge_base',
        accessScope: 'agent_private',
        freshness: 'static',
        sensitivity: 'internal',
        ownerManaged: true,
        discoverableSummary: 'Can use buyer preference templates',
      },
    ]
  }

  return [
    {
      key: 'coordination_history',
      title: 'Coordination history',
      kind: 'transaction_history',
      accessScope: 'agent_private',
      freshness: 'daily',
      sensitivity: 'internal',
      ownerManaged: true,
      discoverableSummary: 'Can reference prior coordination patterns',
    },
  ]
}

function getDefaultPolicyProfile(agent: AgentRecord): AgentProfileRecord['policyProfile'] {
  return {
    autonomyMode: agent.role === 'provider' ? 'semi_autonomous' : 'advisory',
    defaultApprovalMode: agent.role === 'broker' ? 'always' : 'conditional',
    approvalRules: [],
    spendCapUsd: 5,
    maxConcurrentActions: 1,
    allowExternalSideEffects: false,
    allowCrossCounterpartyMemory: false,
    escalationChannels: [],
  }
}

function getDefaultMemoryScope(agent: AgentRecord): AgentProfileRecord['memoryScope'] {
  if (agent.role === 'provider') {
    return {
      mode: 'owner_private',
      namespaces: [`agent:${agent.did}`, `owner:${agent.did}`],
      retentionDays: 30,
      storesPreferenceMemory: false,
      storesCounterpartyMemory: false,
      storesExecutionMemory: true,
    }
  }

  if (agent.role === 'consumer') {
    return {
      mode: 'agent_private',
      namespaces: [`agent:${agent.did}`],
      retentionDays: 30,
      storesPreferenceMemory: true,
      storesCounterpartyMemory: false,
      storesExecutionMemory: true,
    }
  }

  return {
    mode: 'session',
    namespaces: [`agent:${agent.did}`],
    retentionDays: 7,
    storesPreferenceMemory: false,
    storesCounterpartyMemory: false,
    storesExecutionMemory: true,
  }
}

function buildDefaultToolGrants(): AgentToolCapabilityGrant[] {
  return TOOL_LIBRARY.map((tool) => ({ ...tool }))
}

function buildDefaultDiscoveryProfile(agent: AgentRecord, selectedSkills: AgentSkillDefinition[], knowledgeSources: AgentProfileRecord['knowledgeSources']) {
  const specialties = Array.from(new Set(selectedSkills.flatMap((skill) => skill.specialtyTags))).slice(0, 8)

  return {
    specialties,
    searchableTags: Array.from(new Set([agent.role, ...specialties])).slice(0, 12),
    preferredEngagements: agent.role === 'provider' ? ['quote_response', 'service_negotiation'] : agent.role === 'consumer' ? ['provider_discovery', 'buyer_negotiation'] : ['scheduling', 'coordination'],
    trustSignals: [],
    visibleKnowledgeSummaries: knowledgeSources
      .map((source) => source.discoverableSummary)
      .filter((summary): summary is string => Boolean(summary)),
  }
}

export function buildDefaultAgentProfileInput(agent: AgentRecord): Omit<AgentProfileRecord, 'id' | 'version' | 'createdAt' | 'updatedAt'> {
  const selectedSkills = getDefaultSkillKeys(agent.role)
    .map((skillKey) => getSkillByKey(skillKey))
    .filter((skill): skill is AgentSkillDefinition => Boolean(skill))
  const knowledgeSources = getDefaultKnowledgeSources(agent)
  const policyProfile = getDefaultPolicyProfile(agent)
  const memoryScope = getDefaultMemoryScope(agent)

  return {
    agentDid: agent.did,
    status: 'active',
    identity: {
      did: agent.did,
      slug: toSlug(agent.name),
      displayName: agent.name,
      role: agent.role,
      purpose: agent.description?.trim() || `${agent.name} helps as a ${agent.role} bot inside ADP.`,
      summary: agent.description?.trim() || `${agent.name} is an ADP-native ${agent.role} bot.`,
      ownerDefinedSpecialty: [],
      audience: [],
      operatingRegions: [],
      languages: ['en'],
    },
    backend: {
      mode: agent.runtimeMode,
      provider: agent.preferredProvider ?? 'native',
      model: null,
      modelFamily: null,
      adapterVersion: null,
    },
    skills: selectedSkills,
    skillPacks: [],
    toolGrants: buildDefaultToolGrants(),
    knowledgeSources,
    policyProfile,
    memoryScope,
    reputationSummary: {
      trustTier: 'unrated',
      totalTransactions: 0,
      completedTransactions: 0,
      averageScore: null,
      positiveSignalCount: 0,
      disputedSignalCount: 0,
      lastUpdatedAt: null,
    },
    discoveryProfile: buildDefaultDiscoveryProfile(agent, selectedSkills, knowledgeSources),
  }
}

export async function ensureAgentProfileByDid(agentDid: string): Promise<AgentProfileRecord | null> {
  const existing = await getAgentProfileRecord(agentDid)
  if (existing) {
    return existing
  }

  const agent = await getAgentRecordByDid(agentDid)
  if (!agent) {
    return null
  }

  return createAgentProfileRecord(buildDefaultAgentProfileInput(agent))
}

export async function createDefaultAgentProfileForDid(agentDid: string): Promise<AgentProfileRecord | null> {
  const agent = await getAgentRecordByDid(agentDid)
  if (!agent) {
    return null
  }

  const existing = await getAgentProfileRecord(agentDid)
  if (existing) {
    return existing
  }

  return createAgentProfileRecord(buildDefaultAgentProfileInput(agent))
}

function normalizeToolGrants(input: UpdateAgentProfileInput['toolGrants'], current: AgentProfileRecord['toolGrants']) {
  if (!Array.isArray(input)) {
    return current
  }

  const currentByToolKey = new Map(current.map((grant) => [grant.toolKey, grant]))

  return TOOL_LIBRARY.map((catalogTool) => {
    const requested = input.find((grant) => grant.toolKey === catalogTool.toolKey)
    const existing = currentByToolKey.get(catalogTool.toolKey) ?? catalogTool
    const mode = requested?.mode && ['deny', 'read', 'write', 'execute'].includes(requested.mode) ? requested.mode : existing.mode

    return {
      ...catalogTool,
      mode: catalogTool.toolKey === 'list_capabilities' && mode !== 'read' && mode !== 'deny' ? existing.mode : mode,
      requiresApproval: typeof requested?.requiresApproval === 'boolean' ? requested.requiresApproval : existing.requiresApproval,
    }
  })
}

function normalizeSelectedSkills(skillKeys: unknown, fallback: AgentProfileRecord['skills']) {
  if (!Array.isArray(skillKeys)) {
    return fallback
  }

  const selected = Array.from(new Set(skillKeys.filter((entry): entry is string => typeof entry === 'string')))
    .map((skillKey) => getSkillByKey(skillKey))
    .filter((skill): skill is AgentSkillDefinition => Boolean(skill))

  return selected.length > 0 ? selected : fallback
}

function normalizePolicyProfile(input: UpdateAgentProfileInput['policyProfile'], current: AgentProfileRecord['policyProfile']) {
  return {
    ...current,
    autonomyMode:
      input?.autonomyMode && AUTONOMY_MODE_OPTIONS.includes(input.autonomyMode)
        ? input.autonomyMode
        : current.autonomyMode,
    defaultApprovalMode:
      input?.defaultApprovalMode && APPROVAL_MODE_OPTIONS.includes(input.defaultApprovalMode)
        ? input.defaultApprovalMode
        : current.defaultApprovalMode,
    spendCapUsd:
      typeof input?.spendCapUsd === 'number' && Number.isFinite(input.spendCapUsd)
        ? Math.max(0, Number(input.spendCapUsd.toFixed(2)))
        : current.spendCapUsd,
    allowExternalSideEffects:
      typeof input?.allowExternalSideEffects === 'boolean'
        ? input.allowExternalSideEffects
        : current.allowExternalSideEffects,
    allowCrossCounterpartyMemory:
      typeof input?.allowCrossCounterpartyMemory === 'boolean'
        ? input.allowCrossCounterpartyMemory
        : current.allowCrossCounterpartyMemory,
  }
}

function normalizeMemoryScope(input: UpdateAgentProfileInput['memoryScope'], current: AgentProfileRecord['memoryScope']) {
  const mode = input?.mode && MEMORY_SCOPE_OPTIONS.includes(input.mode) ? input.mode : current.mode
  const retentionDays =
    input?.retentionDays === null
      ? null
      : typeof input?.retentionDays === 'number' && Number.isFinite(input.retentionDays)
        ? Math.max(0, Math.trunc(input.retentionDays))
        : current.retentionDays

  return {
    ...current,
    mode,
    retentionDays,
    storesPreferenceMemory:
      typeof input?.storesPreferenceMemory === 'boolean'
        ? input.storesPreferenceMemory
        : current.storesPreferenceMemory,
    storesExecutionMemory:
      typeof input?.storesExecutionMemory === 'boolean'
        ? input.storesExecutionMemory
        : current.storesExecutionMemory,
  }
}

function rebuildDerivedProfileSections(profile: AgentProfileRecord): AgentProfileRecord {
  return {
    ...profile,
    discoveryProfile: {
      ...profile.discoveryProfile,
      specialties: Array.from(new Set([...profile.identity.ownerDefinedSpecialty, ...profile.skills.flatMap((skill) => skill.specialtyTags)])).slice(0, 12),
      searchableTags: Array.from(new Set([
        profile.identity.role,
        ...profile.identity.ownerDefinedSpecialty,
        ...profile.skills.map((skill) => skill.key),
        ...profile.skills.flatMap((skill) => skill.specialtyTags),
      ])).slice(0, 16),
      visibleKnowledgeSummaries: profile.knowledgeSources
        .map((source) => source.discoverableSummary)
        .filter((summary): summary is string => Boolean(summary)),
    },
    identity: {
      ...profile.identity,
      slug: toSlug(profile.identity.displayName),
      summary: profile.identity.purpose || profile.identity.summary,
    },
    backend: {
      ...profile.backend,
      provider: profile.backend.provider,
    },
  }
}

export async function updateAgentProfileByDid(agentDid: string, input: UpdateAgentProfileInput): Promise<AgentProfileRecord | null> {
  const existing = await ensureAgentProfileByDid(agentDid)
  if (!existing) {
    return null
  }

  return updateAgentProfileRecord(agentDid, (current) => {
    const nextSkills = normalizeSelectedSkills(input.selectedSkillKeys, current.skills)
    const nextToolGrants = normalizeToolGrants(input.toolGrants, current.toolGrants)
    const nextPolicyProfile = normalizePolicyProfile(input.policyProfile, current.policyProfile)
    const nextMemoryScope = normalizeMemoryScope(input.memoryScope, current.memoryScope)
    const nextProfile: AgentProfileRecord = {
      ...current,
      identity: {
        ...current.identity,
        displayName: normalizeString(input.displayName, current.identity.displayName) || current.identity.displayName,
        purpose: normalizeString(input.purpose, current.identity.purpose) || current.identity.purpose,
        ownerDefinedSpecialty: normalizeStringArray(input.ownerDefinedSpecialty, current.identity.ownerDefinedSpecialty).slice(0, 12),
      },
      skills: nextSkills,
      toolGrants: nextToolGrants,
      policyProfile: nextPolicyProfile,
      memoryScope: nextMemoryScope,
    }

    return rebuildDerivedProfileSections(nextProfile)
  })
}

export async function getAgentProfilePrivateReadModel(agentDid: string): Promise<AgentProfilePrivateReadModel | null> {
  const profile = await ensureAgentProfileByDid(agentDid)
  if (!profile) {
    return null
  }

  return {
    profile,
    editor: {
      availableSkills: SKILL_LIBRARY,
      availableTools: TOOL_LIBRARY.map((tool) => ({
        toolKey: tool.toolKey,
        title: tool.title,
        mode: tool.mode,
        requiresApproval: tool.requiresApproval,
        protocolVisible: tool.protocolVisible,
      })),
      allowedMemoryScopes: MEMORY_SCOPE_OPTIONS,
      allowedAutonomyModes: AUTONOMY_MODE_OPTIONS,
      allowedApprovalModes: APPROVAL_MODE_OPTIONS,
    },
  }
}

export async function getPublicAgentProfileProjection(agentDid: string): Promise<PublicAgentProfileProjection | null> {
  const profile = await ensureAgentProfileByDid(agentDid)
  if (!profile) {
    return null
  }

  return {
    agentDid: profile.agentDid,
    displayName: profile.identity.displayName,
    role: profile.identity.role,
    purpose: profile.identity.purpose,
    summary: profile.identity.summary,
    specialties: profile.discoveryProfile.specialties,
    searchableTags: profile.discoveryProfile.searchableTags,
    skills: profile.skills.map((skill) => ({
      key: skill.key,
      name: skill.name,
      summary: skill.summary,
      level: skill.level,
    })),
    toolCapabilities: profile.toolGrants
      .filter((grant) => grant.protocolVisible)
      .map((grant) => ({
        toolKey: grant.toolKey,
        mode: grant.mode,
        protocolVisible: grant.protocolVisible,
      })),
    visibleKnowledgeSummaries: profile.discoveryProfile.visibleKnowledgeSummaries,
    reputationSummary: profile.reputationSummary,
  }
}

export async function getAgentRuntimeEnforcementProjection(agentDid: string): Promise<AgentProfileRuntimeProjection | null> {
  const profile = await ensureAgentProfileByDid(agentDid)
  if (!profile) {
    return null
  }

  return {
    displayName: profile.identity.displayName,
    purpose: profile.identity.purpose,
    specialties: profile.discoveryProfile.specialties,
    allowedToolModes: profile.toolGrants.map((grant) => ({
      toolKey: grant.toolKey,
      mode: grant.mode,
      ownerScopedOnly: grant.ownerScopedOnly,
      requiresApproval: grant.requiresApproval,
    })),
    memoryScope: {
      mode: profile.memoryScope.mode,
      storesExecutionMemory: profile.memoryScope.storesExecutionMemory,
      storesPreferenceMemory: profile.memoryScope.storesPreferenceMemory,
      storesCounterpartyMemory: profile.memoryScope.storesCounterpartyMemory,
    },
    policy: {
      autonomyMode: profile.policyProfile.autonomyMode,
      defaultApprovalMode: profile.policyProfile.defaultApprovalMode,
      allowExternalSideEffects: profile.policyProfile.allowExternalSideEffects,
      allowCrossCounterpartyMemory: profile.policyProfile.allowCrossCounterpartyMemory,
      spendCapUsd: profile.policyProfile.spendCapUsd,
    },
  }
}
