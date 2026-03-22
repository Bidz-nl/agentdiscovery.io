import { randomUUID } from 'node:crypto'

import { kvRead, kvWrite } from '@/lib/kv-store'
import type { AgentProfileRecord } from '@/lib/adp-v2/agent-profile-types'

type AgentProfileStoreFile = {
  profiles: AgentProfileRecord[]
}

const KV_KEY = 'adp:agent-profiles'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function toAgentProfileRecord(value: unknown): AgentProfileRecord | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.agentDid !== 'string' ||
    (value.status !== 'draft' && value.status !== 'active' && value.status !== 'disabled') ||
    typeof value.version !== 'number' ||
    !Number.isFinite(value.version) ||
    !isRecord(value.identity) ||
    !isRecord(value.backend) ||
    !Array.isArray(value.skills) ||
    !Array.isArray(value.skillPacks) ||
    !Array.isArray(value.toolGrants) ||
    !Array.isArray(value.knowledgeSources) ||
    !isRecord(value.policyProfile) ||
    !isRecord(value.memoryScope) ||
    !isRecord(value.reputationSummary) ||
    !isRecord(value.discoveryProfile) ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    return null
  }

  const identity = value.identity
  const backend = value.backend
  const policyProfile = value.policyProfile
  const memoryScope = value.memoryScope
  const reputationSummary = value.reputationSummary
  const discoveryProfile = value.discoveryProfile

  if (
    typeof identity.did !== 'string' ||
    typeof identity.slug !== 'string' ||
    typeof identity.displayName !== 'string' ||
    typeof identity.role !== 'string' ||
    typeof identity.purpose !== 'string' ||
    typeof identity.summary !== 'string' ||
    !isStringArray(identity.ownerDefinedSpecialty) ||
    !isStringArray(identity.audience) ||
    !isStringArray(identity.operatingRegions) ||
    !isStringArray(identity.languages) ||
    typeof backend.mode !== 'string' ||
    typeof backend.provider !== 'string' ||
    (backend.model !== null && typeof backend.model !== 'string') ||
    (backend.modelFamily !== null && typeof backend.modelFamily !== 'string') ||
    (backend.adapterVersion !== null && typeof backend.adapterVersion !== 'string') ||
    typeof policyProfile.autonomyMode !== 'string' ||
    typeof policyProfile.defaultApprovalMode !== 'string' ||
    !Array.isArray(policyProfile.approvalRules) ||
    typeof policyProfile.spendCapUsd !== 'number' ||
    !Number.isFinite(policyProfile.spendCapUsd) ||
    typeof policyProfile.maxConcurrentActions !== 'number' ||
    !Number.isFinite(policyProfile.maxConcurrentActions) ||
    typeof policyProfile.allowExternalSideEffects !== 'boolean' ||
    typeof policyProfile.allowCrossCounterpartyMemory !== 'boolean' ||
    !isStringArray(policyProfile.escalationChannels) ||
    typeof memoryScope.mode !== 'string' ||
    !isStringArray(memoryScope.namespaces) ||
    (memoryScope.retentionDays !== null && (typeof memoryScope.retentionDays !== 'number' || !Number.isFinite(memoryScope.retentionDays))) ||
    typeof memoryScope.storesPreferenceMemory !== 'boolean' ||
    typeof memoryScope.storesCounterpartyMemory !== 'boolean' ||
    typeof memoryScope.storesExecutionMemory !== 'boolean' ||
    typeof reputationSummary.trustTier !== 'string' ||
    typeof reputationSummary.totalTransactions !== 'number' ||
    typeof reputationSummary.completedTransactions !== 'number' ||
    (reputationSummary.averageScore !== null && (typeof reputationSummary.averageScore !== 'number' || !Number.isFinite(reputationSummary.averageScore))) ||
    typeof reputationSummary.positiveSignalCount !== 'number' ||
    typeof reputationSummary.disputedSignalCount !== 'number' ||
    (reputationSummary.lastUpdatedAt !== null && typeof reputationSummary.lastUpdatedAt !== 'string') ||
    !isStringArray(discoveryProfile.specialties) ||
    !isStringArray(discoveryProfile.searchableTags) ||
    !isStringArray(discoveryProfile.preferredEngagements) ||
    !isStringArray(discoveryProfile.trustSignals) ||
    !isStringArray(discoveryProfile.visibleKnowledgeSummaries)
  ) {
    return null
  }

  return value as unknown as AgentProfileRecord
}

async function readAgentProfileStore(): Promise<AgentProfileStoreFile> {
  const raw = await kvRead<AgentProfileStoreFile | null>(KV_KEY, null)
  if (!raw) {
    return { profiles: [] }
  }
  try {
    return {
      profiles: Array.isArray(raw.profiles)
        ? raw.profiles
            .map((profile) => toAgentProfileRecord(profile))
            .filter((profile): profile is AgentProfileRecord => Boolean(profile))
        : [],
    }
  } catch {
    return { profiles: [] }
  }
}

async function writeAgentProfileStore(store: AgentProfileStoreFile): Promise<void> {
  await kvWrite(KV_KEY, store)
}

export async function listAgentProfileRecords(): Promise<AgentProfileRecord[]> {
  return (await readAgentProfileStore()).profiles
}

export async function getAgentProfileRecord(agentDid: string): Promise<AgentProfileRecord | null> {
  return (await readAgentProfileStore()).profiles.find((profile) => profile.agentDid === agentDid) ?? null
}

export async function createAgentProfileRecord(
  input: Omit<AgentProfileRecord, 'id' | 'version' | 'createdAt' | 'updatedAt'>
): Promise<AgentProfileRecord> {
  const store = await readAgentProfileStore()
  const timestamp = new Date().toISOString()
  const record: AgentProfileRecord = {
    id: `profile_${randomUUID().replace(/-/g, '')}`,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...input,
  }

  await writeAgentProfileStore({
    profiles: [...store.profiles, record],
  })

  return record
}

export async function updateAgentProfileRecord(
  agentDid: string,
  updater: (record: AgentProfileRecord) => AgentProfileRecord
): Promise<AgentProfileRecord | null> {
  const store = await readAgentProfileStore()
  const existing = store.profiles.find((profile) => profile.agentDid === agentDid)

  if (!existing) {
    return null
  }

  const updated: AgentProfileRecord = {
    ...updater(existing),
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  }

  await writeAgentProfileStore({
    profiles: store.profiles.map((profile) => (profile.agentDid === agentDid ? updated : profile)),
  })

  return updated
}
