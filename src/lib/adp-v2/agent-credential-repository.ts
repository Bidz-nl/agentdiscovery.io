import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getDataRoot } from '@/lib/project-paths'
import type { AgentCredentialRecord } from '@/lib/adp-v2/agent-types'

type AgentCredentialStoreFile = {
  credentials: AgentCredentialRecord[]
}

const AGENT_CREDENTIAL_STORE_DIRECTORY = getDataRoot()
const AGENT_CREDENTIAL_STORE_FILE = path.join(AGENT_CREDENTIAL_STORE_DIRECTORY, 'adp-v2-agent-credentials.json')

function ensureAgentCredentialStore() {
  if (!existsSync(AGENT_CREDENTIAL_STORE_DIRECTORY)) {
    mkdirSync(AGENT_CREDENTIAL_STORE_DIRECTORY, { recursive: true })
  }

  if (!existsSync(AGENT_CREDENTIAL_STORE_FILE)) {
    writeFileSync(AGENT_CREDENTIAL_STORE_FILE, JSON.stringify({ credentials: [] }, null, 2), 'utf8')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function toAgentCredentialRecord(value: unknown): AgentCredentialRecord | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    value.id.trim().length === 0 ||
    typeof value.agentId !== 'number' ||
    !Number.isFinite(value.agentId) ||
    typeof value.label !== 'string' ||
    value.label.trim().length === 0 ||
    typeof value.secretHash !== 'string' ||
    value.secretHash.trim().length === 0 ||
    typeof value.status !== 'string' ||
    (value.status !== 'active' && value.status !== 'revoked') ||
    typeof value.createdAt !== 'string' ||
    (value.lastUsedAt !== null && typeof value.lastUsedAt !== 'string') ||
    (value.revokedAt !== null && typeof value.revokedAt !== 'string')
  ) {
    return null
  }

  return {
    id: value.id,
    agentId: value.agentId,
    label: value.label.trim(),
    secretHash: value.secretHash.trim(),
    status: value.status,
    createdAt: value.createdAt,
    lastUsedAt: value.lastUsedAt,
    revokedAt: value.revokedAt,
  }
}

function isAgentCredentialRecord(value: AgentCredentialRecord | null): value is AgentCredentialRecord {
  return Boolean(value)
}

function readAgentCredentialStore(): AgentCredentialStoreFile {
  if (!existsSync(AGENT_CREDENTIAL_STORE_FILE)) {
    return { credentials: [] }
  }

  try {
    const raw = readFileSync(AGENT_CREDENTIAL_STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as Partial<AgentCredentialStoreFile>

    return {
      credentials: Array.isArray(parsed.credentials)
        ? parsed.credentials.map(toAgentCredentialRecord).filter(isAgentCredentialRecord)
        : [],
    }
  } catch {
    return { credentials: [] }
  }
}

function writeAgentCredentialStore(store: AgentCredentialStoreFile) {
  ensureAgentCredentialStore()
  const temporaryFile = `${AGENT_CREDENTIAL_STORE_FILE}.tmp`
  writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8')
  renameSync(temporaryFile, AGENT_CREDENTIAL_STORE_FILE)
}

export function createAgentCredentialRecord(
  input: Omit<AgentCredentialRecord, 'id' | 'createdAt' | 'lastUsedAt' | 'revokedAt'>
): AgentCredentialRecord {
  const store = readAgentCredentialStore()
  const record: AgentCredentialRecord = {
    id: `cred_${randomUUID()}`,
    ...input,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    revokedAt: null,
  }

  writeAgentCredentialStore({
    credentials: [...store.credentials, record],
  })

  return record
}

export function getAgentCredentialBySecretHash(secretHash: string): AgentCredentialRecord | null {
  return readAgentCredentialStore().credentials.find((record) => record.secretHash === secretHash) ?? null
}

export function touchAgentCredentialLastUsed(id: string): AgentCredentialRecord | null {
  const store = readAgentCredentialStore()
  const existingRecord = store.credentials.find((record) => record.id === id)

  if (!existingRecord) {
    return null
  }

  const updatedRecord: AgentCredentialRecord = {
    ...existingRecord,
    lastUsedAt: new Date().toISOString(),
  }

  writeAgentCredentialStore({
    credentials: store.credentials.map((record) => (record.id === id ? updatedRecord : record)),
  })

  return updatedRecord
}
