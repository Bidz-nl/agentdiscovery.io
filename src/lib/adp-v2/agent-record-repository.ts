import { kvRead, kvWrite } from '@/lib/kv-store'
import type {
  AgentRecord,
  AgentRole,
  AgentRuntimeMode,
  AgentRuntimeStatus,
  AgentStatus,
} from '@/lib/adp-v2/agent-types'

type AgentStoreFile = {
  agents: AgentRecord[]
}

const KV_KEY = 'adp:agents'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isAgentRole(value: unknown): value is AgentRole {
  return value === 'consumer' || value === 'provider' || value === 'broker'
}

function isAgentStatus(value: unknown): value is AgentStatus {
  return value === 'active' || value === 'disabled'
}

function isAgentRuntimeMode(value: unknown): value is AgentRuntimeMode {
  return value === 'manual' || value === 'hosted'
}

function isAgentRuntimeStatus(value: unknown): value is AgentRuntimeStatus {
  return value === 'needs_setup' || value === 'ready' || value === 'disabled'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.trim().length > 0)
}

function toAgentRecord(value: unknown): AgentRecord | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== 'number' ||
    !Number.isFinite(value.id) ||
    typeof value.did !== 'string' ||
    value.did.trim().length === 0 ||
    typeof value.name !== 'string' ||
    value.name.trim().length === 0 ||
    !isAgentRole(value.role) ||
    !isAgentStatus(value.status) ||
    !isStringArray(value.supportedProtocolVersions) ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    return null
  }

  if (value.description !== undefined && typeof value.description !== 'string') {
    return null
  }

  if (value.authoritySummary !== undefined && !isRecord(value.authoritySummary)) {
    return null
  }

  const runtimeMode = isAgentRuntimeMode(value.runtimeMode) ? value.runtimeMode : 'manual'
  const runtimeStatus = isAgentRuntimeStatus(value.runtimeStatus) ? value.runtimeStatus : 'needs_setup'
  const preferredProvider =
    value.preferredProvider === 'openai' || value.preferredProvider === 'anthropic'
      ? value.preferredProvider
      : null

  return {
    id: value.id,
    did: value.did.trim(),
    name: value.name.trim(),
    role: value.role,
    description: typeof value.description === 'string' ? value.description : undefined,
    status: value.status,
    supportedProtocolVersions: value.supportedProtocolVersions.map((version) => version.trim()),
    authoritySummary: value.authoritySummary,
    runtimeMode,
    runtimeStatus,
    preferredProvider,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function isAgentRecord(value: AgentRecord | null): value is AgentRecord {
  return Boolean(value)
}

async function readAgentStore(): Promise<AgentStoreFile> {
  const raw = await kvRead<AgentStoreFile | null>(KV_KEY, null)
  if (!raw) {
    return { agents: [] }
  }
  try {
    return {
      agents: Array.isArray(raw.agents) ? raw.agents.map(toAgentRecord).filter(isAgentRecord) : [],
    }
  } catch {
    return { agents: [] }
  }
}

async function writeAgentStore(store: AgentStoreFile): Promise<void> {
  await kvWrite(KV_KEY, store)
}

function getNextAgentId(records: AgentRecord[]) {
  const maxId = records.reduce((currentMax, record) => Math.max(currentMax, record.id), 0)
  return maxId + 1
}

export async function createAgentRecord(
  input: Omit<AgentRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AgentRecord> {
  const store = await readAgentStore()
  const timestamp = new Date().toISOString()
  const record: AgentRecord = {
    id: getNextAgentId(store.agents),
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await writeAgentStore({
    agents: [...store.agents, record],
  })

  return record
}

export async function getAgentRecordById(id: number): Promise<AgentRecord | null> {
  return (await readAgentStore()).agents.find((record) => record.id === id) ?? null
}

export async function getAgentRecordByDid(did: string): Promise<AgentRecord | null> {
  return (await readAgentStore()).agents.find((record) => record.did === did) ?? null
}

export async function getAgentRecordByName(name: string): Promise<AgentRecord | null> {
  const normalizedName = name.trim().toLowerCase()
  if (!normalizedName) {
    return null
  }

  return (
    (await readAgentStore()).agents.find((record) => record.name.trim().toLowerCase() === normalizedName) ?? null
  )
}

export async function updateAgentRecordName(did: string, name: string): Promise<AgentRecord | null> {
  const store = await readAgentStore()
  const current = store.agents.find((record) => record.did === did)
  if (!current) {
    return null
  }

  const updated: AgentRecord = {
    ...current,
    name: name.trim(),
    updatedAt: new Date().toISOString(),
  }

  await writeAgentStore({
    agents: store.agents.map((record) => (record.did === did ? updated : record)),
  })

  return updated
}

export async function listAgentRecords(): Promise<AgentRecord[]> {
  return (await readAgentStore()).agents
}

export async function updateAgentRuntimeConfiguration(
  did: string,
  input: Partial<Pick<AgentRecord, 'runtimeMode' | 'runtimeStatus' | 'preferredProvider'>>
): Promise<AgentRecord | null> {
  const store = await readAgentStore()
  const current = store.agents.find((record) => record.did === did)

  if (!current) {
    return null
  }

  const updated: AgentRecord = {
    ...current,
    runtimeMode: input.runtimeMode ?? current.runtimeMode,
    runtimeStatus: input.runtimeStatus ?? current.runtimeStatus,
    preferredProvider: input.preferredProvider ?? current.preferredProvider,
    updatedAt: new Date().toISOString(),
  }

  await writeAgentStore({
    agents: store.agents.map((record) => (record.did === did ? updated : record)),
  })

  return updated
}
