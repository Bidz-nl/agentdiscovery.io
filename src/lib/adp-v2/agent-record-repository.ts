import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getDataRoot } from '@/lib/project-paths'
import type { AgentRecord, AgentRole, AgentStatus } from '@/lib/adp-v2/agent-types'

type AgentStoreFile = {
  agents: AgentRecord[]
}

const AGENT_STORE_DIRECTORY = getDataRoot()
const AGENT_STORE_FILE = path.join(AGENT_STORE_DIRECTORY, 'adp-v2-agents.json')

function ensureAgentStore() {
  if (!existsSync(AGENT_STORE_DIRECTORY)) {
    mkdirSync(AGENT_STORE_DIRECTORY, { recursive: true })
  }

  if (!existsSync(AGENT_STORE_FILE)) {
    writeFileSync(AGENT_STORE_FILE, JSON.stringify({ agents: [] }, null, 2), 'utf8')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isAgentRole(value: unknown): value is AgentRole {
  return value === 'consumer' || value === 'provider' || value === 'broker'
}

function isAgentStatus(value: unknown): value is AgentStatus {
  return value === 'active' || value === 'disabled'
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

  return {
    id: value.id,
    did: value.did.trim(),
    name: value.name.trim(),
    role: value.role,
    description: typeof value.description === 'string' ? value.description : undefined,
    status: value.status,
    supportedProtocolVersions: value.supportedProtocolVersions.map((version) => version.trim()),
    authoritySummary: value.authoritySummary,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function isAgentRecord(value: AgentRecord | null): value is AgentRecord {
  return Boolean(value)
}

function readAgentStore(): AgentStoreFile {
  if (!existsSync(AGENT_STORE_FILE)) {
    return { agents: [] }
  }

  try {
    const raw = readFileSync(AGENT_STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<AgentStoreFile>

    return {
      agents: Array.isArray(parsed.agents) ? parsed.agents.map(toAgentRecord).filter(isAgentRecord) : [],
    }
  } catch {
    return { agents: [] }
  }
}

function writeAgentStore(store: AgentStoreFile) {
  ensureAgentStore()
  const temporaryFile = `${AGENT_STORE_FILE}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8')
  renameSync(temporaryFile, AGENT_STORE_FILE)
}

function getNextAgentId(records: AgentRecord[]) {
  const maxId = records.reduce((currentMax, record) => Math.max(currentMax, record.id), 0)
  return maxId + 1
}

export function createAgentRecord(
  input: Omit<AgentRecord, 'id' | 'createdAt' | 'updatedAt'>
): AgentRecord {
  const store = readAgentStore()
  const timestamp = new Date().toISOString()
  const record: AgentRecord = {
    id: getNextAgentId(store.agents),
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  writeAgentStore({
    agents: [...store.agents, record],
  })

  return record
}

export function getAgentRecordById(id: number): AgentRecord | null {
  return readAgentStore().agents.find((record) => record.id === id) ?? null
}

export function getAgentRecordByDid(did: string): AgentRecord | null {
  return readAgentStore().agents.find((record) => record.did === did) ?? null
}

export function listAgentRecords(): AgentRecord[] {
  return readAgentStore().agents
}
