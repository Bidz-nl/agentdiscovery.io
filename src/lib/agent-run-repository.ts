import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getDataRoot } from '@/lib/project-paths'
import type { AgentRunRecord } from '@/lib/agent-runtime'

type AgentRunStoreFile = {
  runs: AgentRunRecord[]
}

const AGENT_RUN_STORE_DIRECTORY = getDataRoot()
const AGENT_RUN_STORE_FILE = path.join(AGENT_RUN_STORE_DIRECTORY, 'adp-v2-agent-runs.json')

function ensureAgentRunStore() {
  if (!existsSync(AGENT_RUN_STORE_DIRECTORY)) {
    mkdirSync(AGENT_RUN_STORE_DIRECTORY, { recursive: true })
  }

  if (!existsSync(AGENT_RUN_STORE_FILE)) {
    writeFileSync(AGENT_RUN_STORE_FILE, JSON.stringify({ runs: [] }, null, 2), 'utf8')
  }
}

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

function readAgentRunStore(): AgentRunStoreFile {
  if (!existsSync(AGENT_RUN_STORE_FILE)) {
    return { runs: [] }
  }

  try {
    const raw = readFileSync(AGENT_RUN_STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<AgentRunStoreFile>
    return {
      runs: Array.isArray(parsed.runs)
        ? parsed.runs.map(toAgentRunRecord).filter((record): record is AgentRunRecord => Boolean(record))
        : [],
    }
  } catch {
    return { runs: [] }
  }
}

function writeAgentRunStore(store: AgentRunStoreFile) {
  ensureAgentRunStore()
  const temporaryFile = `${AGENT_RUN_STORE_FILE}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8')
  renameSync(temporaryFile, AGENT_RUN_STORE_FILE)
}

export function createAgentRunRecord(input: Omit<AgentRunRecord, 'id' | 'startedAt'>): AgentRunRecord {
  const store = readAgentRunStore()
  const record: AgentRunRecord = {
    id: `run_${randomUUID().replace(/-/g, '')}`,
    ...input,
    startedAt: new Date().toISOString(),
  }

  writeAgentRunStore({
    runs: [...store.runs, record],
  })

  return record
}

export function updateAgentRunRecord(
  id: string,
  updater: (record: AgentRunRecord) => AgentRunRecord
): AgentRunRecord | null {
  const store = readAgentRunStore()
  const existing = store.runs.find((record) => record.id === id)

  if (!existing) {
    return null
  }

  const updated = updater(existing)

  writeAgentRunStore({
    runs: store.runs.map((record) => (record.id === id ? updated : record)),
  })

  return updated
}

export function listAgentRunRecords(agentId: number): AgentRunRecord[] {
  return readAgentRunStore().runs
    .filter((record) => record.agentId === agentId)
    .sort((left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt))
}

export function sumAgentRunEstimatedCostUsd(agentId: number): number {
  return listAgentRunRecords(agentId).reduce((total, record) => total + (record.usage.estimatedCostUsd ?? 0), 0)
}
