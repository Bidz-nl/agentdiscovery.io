import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getDataRoot } from '@/lib/project-paths'
import type { AgentPolicyRecord } from '@/lib/agent-runtime'

type AgentPolicyStoreFile = {
  policies: AgentPolicyRecord[]
}

const AGENT_POLICY_STORE_DIRECTORY = getDataRoot()
const AGENT_POLICY_STORE_FILE = path.join(AGENT_POLICY_STORE_DIRECTORY, 'adp-v2-agent-policies.json')

function ensureAgentPolicyStore() {
  if (!existsSync(AGENT_POLICY_STORE_DIRECTORY)) {
    mkdirSync(AGENT_POLICY_STORE_DIRECTORY, { recursive: true })
  }

  if (!existsSync(AGENT_POLICY_STORE_FILE)) {
    writeFileSync(AGENT_POLICY_STORE_FILE, JSON.stringify({ policies: [] }, null, 2), 'utf8')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isAllowedTool(value: unknown): value is AgentPolicyRecord['allowedTools'][number] {
  return value === 'list_capabilities'
}

function toAgentPolicyRecord(value: unknown): AgentPolicyRecord | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.agentId !== 'number' ||
    !Number.isFinite(value.agentId) ||
    typeof value.enabled !== 'boolean' ||
    typeof value.approvalRequired !== 'boolean' ||
    !Array.isArray(value.allowedTools) ||
    !value.allowedTools.every(isAllowedTool) ||
    typeof value.spendCapUsd !== 'number' ||
    !Number.isFinite(value.spendCapUsd) ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    return null
  }

  return {
    id: value.id,
    agentId: value.agentId,
    enabled: value.enabled,
    approvalRequired: value.approvalRequired,
    allowedTools: value.allowedTools,
    spendCapUsd: value.spendCapUsd,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function readAgentPolicyStore(): AgentPolicyStoreFile {
  if (!existsSync(AGENT_POLICY_STORE_FILE)) {
    return { policies: [] }
  }

  try {
    const raw = readFileSync(AGENT_POLICY_STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<AgentPolicyStoreFile>
    return {
      policies: Array.isArray(parsed.policies)
        ? parsed.policies.map(toAgentPolicyRecord).filter((record): record is AgentPolicyRecord => Boolean(record))
        : [],
    }
  } catch {
    return { policies: [] }
  }
}

function writeAgentPolicyStore(store: AgentPolicyStoreFile) {
  ensureAgentPolicyStore()
  const temporaryFile = `${AGENT_POLICY_STORE_FILE}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8')
  renameSync(temporaryFile, AGENT_POLICY_STORE_FILE)
}

export function getAgentPolicyRecord(agentId: number): AgentPolicyRecord | null {
  return readAgentPolicyStore().policies.find((record) => record.agentId === agentId) ?? null
}

export function ensureAgentPolicyRecord(agentId: number): AgentPolicyRecord {
  const existing = getAgentPolicyRecord(agentId)
  if (existing) {
    return existing
  }

  const store = readAgentPolicyStore()
  const timestamp = new Date().toISOString()
  const record: AgentPolicyRecord = {
    id: `policy_${randomUUID().replace(/-/g, '')}`,
    agentId,
    enabled: true,
    approvalRequired: true,
    allowedTools: ['list_capabilities'],
    spendCapUsd: 5,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  writeAgentPolicyStore({
    policies: [...store.policies, record],
  })

  return record
}

export function updateAgentPolicyRecord(
  agentId: number,
  updater: (record: AgentPolicyRecord) => AgentPolicyRecord
): AgentPolicyRecord {
  const store = readAgentPolicyStore()
  const existing = ensureAgentPolicyRecord(agentId)
  const updated = {
    ...updater(existing),
    updatedAt: new Date().toISOString(),
  }

  const hasExisting = store.policies.some((record) => record.agentId === agentId)

  writeAgentPolicyStore({
    policies: hasExisting
      ? store.policies.map((record) => (record.agentId === agentId ? updated : record))
      : [...store.policies, updated],
  })

  return updated
}
