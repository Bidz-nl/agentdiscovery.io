import { randomUUID } from 'node:crypto'

import { kvRead, kvWrite } from '@/lib/kv-store'
import type { AgentPolicyRecord } from '@/lib/agent-runtime'

type AgentPolicyStoreFile = {
  policies: AgentPolicyRecord[]
}

const KV_KEY = 'adp:agent-policies'

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

async function readAgentPolicyStore(): Promise<AgentPolicyStoreFile> {
  const raw = await kvRead<AgentPolicyStoreFile | null>(KV_KEY, null)
  if (!raw) {
    return { policies: [] }
  }
  try {
    return {
      policies: Array.isArray(raw.policies)
        ? raw.policies.map(toAgentPolicyRecord).filter((record): record is AgentPolicyRecord => Boolean(record))
        : [],
    }
  } catch {
    return { policies: [] }
  }
}

async function writeAgentPolicyStore(store: AgentPolicyStoreFile): Promise<void> {
  await kvWrite(KV_KEY, store)
}

export async function getAgentPolicyRecord(agentId: number): Promise<AgentPolicyRecord | null> {
  return (await readAgentPolicyStore()).policies.find((record) => record.agentId === agentId) ?? null
}

export async function ensureAgentPolicyRecord(agentId: number): Promise<AgentPolicyRecord> {
  const existing = await getAgentPolicyRecord(agentId)
  if (existing) {
    return existing
  }

  const store = await readAgentPolicyStore()
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

  await writeAgentPolicyStore({
    policies: [...store.policies, record],
  })

  return record
}

export async function updateAgentPolicyRecord(
  agentId: number,
  updater: (record: AgentPolicyRecord) => AgentPolicyRecord
): Promise<AgentPolicyRecord> {
  const store = await readAgentPolicyStore()
  const existing = await ensureAgentPolicyRecord(agentId)
  const updated = {
    ...updater(existing),
    updatedAt: new Date().toISOString(),
  }

  const hasExisting = store.policies.some((record) => record.agentId === agentId)

  await writeAgentPolicyStore({
    policies: hasExisting
      ? store.policies.map((record) => (record.agentId === agentId ? updated : record))
      : [...store.policies, updated],
  })

  return updated
}
