import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import type { AgentProfileRecord } from '@/lib/adp-v2/agent-profile-types'
import { getDataRoot } from '@/lib/project-paths'

type AgentProfileStoreFile = {
  profiles: AgentProfileRecord[]
}

const AGENT_PROFILE_STORE_DIRECTORY = getDataRoot()
const AGENT_PROFILE_STORE_FILE = path.join(AGENT_PROFILE_STORE_DIRECTORY, 'adp-v2-agent-profiles.json')

function ensureAgentProfileStore() {
  if (!existsSync(AGENT_PROFILE_STORE_DIRECTORY)) {
    mkdirSync(AGENT_PROFILE_STORE_DIRECTORY, { recursive: true })
  }

  if (!existsSync(AGENT_PROFILE_STORE_FILE)) {
    writeFileSync(AGENT_PROFILE_STORE_FILE, JSON.stringify({ profiles: [] }, null, 2), 'utf8')
  }
}

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

function readAgentProfileStore(): AgentProfileStoreFile {
  if (!existsSync(AGENT_PROFILE_STORE_FILE)) {
    return { profiles: [] }
  }

  try {
    const raw = readFileSync(AGENT_PROFILE_STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<AgentProfileStoreFile>

    return {
      profiles: Array.isArray(parsed.profiles)
        ? parsed.profiles
            .map((profile) => toAgentProfileRecord(profile))
            .filter((profile): profile is AgentProfileRecord => Boolean(profile))
        : [],
    }
  } catch {
    return { profiles: [] }
  }
}

function writeAgentProfileStore(store: AgentProfileStoreFile) {
  ensureAgentProfileStore()
  const temporaryFile = `${AGENT_PROFILE_STORE_FILE}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8')
  renameSync(temporaryFile, AGENT_PROFILE_STORE_FILE)
}

export function listAgentProfileRecords(): AgentProfileRecord[] {
  return readAgentProfileStore().profiles
}

export function getAgentProfileRecord(agentDid: string): AgentProfileRecord | null {
  return readAgentProfileStore().profiles.find((profile) => profile.agentDid === agentDid) ?? null
}

export function createAgentProfileRecord(
  input: Omit<AgentProfileRecord, 'id' | 'version' | 'createdAt' | 'updatedAt'>
): AgentProfileRecord {
  const store = readAgentProfileStore()
  const timestamp = new Date().toISOString()
  const record: AgentProfileRecord = {
    id: `profile_${randomUUID().replace(/-/g, '')}`,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...input,
  }

  writeAgentProfileStore({
    profiles: [...store.profiles, record],
  })

  return record
}

export function updateAgentProfileRecord(
  agentDid: string,
  updater: (record: AgentProfileRecord) => AgentProfileRecord
): AgentProfileRecord | null {
  const store = readAgentProfileStore()
  const existing = store.profiles.find((profile) => profile.agentDid === agentDid)

  if (!existing) {
    return null
  }

  const updated: AgentProfileRecord = {
    ...updater(existing),
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  }

  writeAgentProfileStore({
    profiles: store.profiles.map((profile) => (profile.agentDid === agentDid ? updated : profile)),
  })

  return updated
}
