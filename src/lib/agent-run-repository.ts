import { randomUUID } from 'node:crypto'

import { kvRead, kvWrite } from '@/lib/kv-store'
import type { AgentRunRecord } from '@/lib/agent-runtime'

type AgentRunStoreFile = {
  runs: AgentRunRecord[]
}

const KV_KEY = 'adp:agent-runs'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function toAgentRunRecord(value: unknown): AgentRunRecord | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.agentId !== 'number' ||
    !Number.isFinite(value.agentId) ||
    (value.provider !== 'openai' && value.provider !== 'anthropic') ||
    typeof value.model !== 'string' ||
    value.kind !== 'sandbox' ||
    (value.status !== 'pending' && value.status !== 'completed' && value.status !== 'failed') ||
    typeof value.prompt !== 'string' ||
    (value.outputText !== null && typeof value.outputText !== 'string') ||
    !Array.isArray(value.toolCalls) ||
    typeof value.startedAt !== 'string' ||
    (value.completedAt !== null && typeof value.completedAt !== 'string') ||
    (value.errorMessage !== null && typeof value.errorMessage !== 'string') ||
    !isRecord(value.usage)
  ) {
    return null
  }

  return {
    id: value.id,
    agentId: value.agentId,
    provider: value.provider,
    model: value.model,
    kind: 'sandbox',
    status: value.status,
    prompt: value.prompt,
    outputText: value.outputText,
    toolCalls: value.toolCalls as AgentRunRecord['toolCalls'],
    credentialId: typeof value.credentialId === 'string' ? value.credentialId : null,
    startedAt: value.startedAt,
    completedAt: value.completedAt,
    errorMessage: value.errorMessage,
    failure:
      value.failure &&
      isRecord(value.failure) &&
      typeof value.failure.code === 'string' &&
      typeof value.failure.message === 'string'
        ? {
            code: value.failure.code as AgentRunRecord['failure'] extends infer T
              ? T extends { code: infer C }
                ? C
                : never
              : never,
            message: value.failure.message,
          }
        : null,
    usage: {
      inputTokens: typeof value.usage.inputTokens === 'number' ? value.usage.inputTokens : null,
      outputTokens: typeof value.usage.outputTokens === 'number' ? value.usage.outputTokens : null,
      estimatedCostUsd: typeof value.usage.estimatedCostUsd === 'number' ? value.usage.estimatedCostUsd : null,
      accountingMode:
        value.usage.accountingMode === 'token_estimate_scaffold' ? 'token_estimate_scaffold' : 'unavailable',
    },
  }
}

async function readAgentRunStore(): Promise<AgentRunStoreFile> {
  const raw = await kvRead<AgentRunStoreFile | null>(KV_KEY, null)
  if (!raw) {
    return { runs: [] }
  }
  try {
    return {
      runs: Array.isArray(raw.runs)
        ? raw.runs.map(toAgentRunRecord).filter((record): record is AgentRunRecord => Boolean(record))
        : [],
    }
  } catch {
    return { runs: [] }
  }
}

async function writeAgentRunStore(store: AgentRunStoreFile): Promise<void> {
  await kvWrite(KV_KEY, store)
}

export async function createAgentRunRecord(input: Omit<AgentRunRecord, 'id' | 'startedAt'>): Promise<AgentRunRecord> {
  const store = await readAgentRunStore()
  const record: AgentRunRecord = {
    id: `run_${randomUUID().replace(/-/g, '')}`,
    ...input,
    startedAt: new Date().toISOString(),
  }

  await writeAgentRunStore({
    runs: [...store.runs, record],
  })

  return record
}

export async function updateAgentRunRecord(
  id: string,
  updater: (record: AgentRunRecord) => AgentRunRecord
): Promise<AgentRunRecord | null> {
  const store = await readAgentRunStore()
  const existing = store.runs.find((record) => record.id === id)

  if (!existing) {
    return null
  }

  const updated = updater(existing)

  await writeAgentRunStore({
    runs: store.runs.map((record) => (record.id === id ? updated : record)),
  })

  return updated
}

export async function listAgentRunRecords(agentId: number): Promise<AgentRunRecord[]> {
  return (await readAgentRunStore()).runs
    .filter((record) => record.agentId === agentId)
    .sort((left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt))
}

export async function sumAgentRunEstimatedCostUsd(agentId: number): Promise<number> {
  return (await listAgentRunRecords(agentId)).reduce((total, record) => total + (record.usage.estimatedCostUsd ?? 0), 0)
}
