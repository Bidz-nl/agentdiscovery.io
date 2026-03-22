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
    typeof value.kind !== 'string' ||
    (value.kind !== 'app_api_key' && value.kind !== 'provider_api_key') ||
    (value.provider !== null && value.provider !== 'native' && value.provider !== 'openai' && value.provider !== 'anthropic') ||
    typeof value.source !== 'string' ||
    (value.source !== 'hosted_managed' && value.source !== 'bring_your_own') ||
    typeof value.secretHash !== 'string' ||
    value.secretHash.trim().length === 0 ||
    (value.encryptedSecret !== null && typeof value.encryptedSecret !== 'string') ||
    (value.maskedSecret !== null && typeof value.maskedSecret !== 'string') ||
    typeof value.status !== 'string' ||
    (value.status !== 'active' && value.status !== 'revoked') ||
    typeof value.validationStatus !== 'string' ||
    (value.validationStatus !== 'unvalidated' && value.validationStatus !== 'valid' && value.validationStatus !== 'invalid') ||
    (value.validatedAt !== null && typeof value.validatedAt !== 'string') ||
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
    kind: value.kind,
    provider: value.provider,
    source: value.source,
    secretHash: value.secretHash.trim(),
    encryptedSecret: value.encryptedSecret,
    maskedSecret: value.maskedSecret,
    status: value.status,
    validationStatus: value.validationStatus,
    validatedAt: value.validatedAt,
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
  return readAgentCredentialStore().credentials.find((record) => record.secretHash === secretHash && record.kind === 'app_api_key') ?? null
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

export function getAgentCredentialById(id: string): AgentCredentialRecord | null {
  return readAgentCredentialStore().credentials.find((record) => record.id === id) ?? null
}

export function listAgentCredentialRecords(agentId: number): AgentCredentialRecord[] {
  return readAgentCredentialStore().credentials.filter((record) => record.agentId === agentId)
}

export function getActiveAgentProviderCredential(
  agentId: number,
  provider: 'openai' | 'anthropic'
): AgentCredentialRecord | null {
  return (
    readAgentCredentialStore().credentials.find(
      (record) =>
        record.agentId === agentId &&
        record.kind === 'provider_api_key' &&
        record.provider === provider &&
        record.status === 'active'
    ) ?? null
  )
}

export function updateAgentCredentialRecord(
  id: string,
  updater: (record: AgentCredentialRecord) => AgentCredentialRecord
): AgentCredentialRecord | null {
  const store = readAgentCredentialStore()
  const existing = store.credentials.find((record) => record.id === id)

  if (!existing) {
    return null
  }

  const updated = updater(existing)

  writeAgentCredentialStore({
    credentials: store.credentials.map((record) => (record.id === id ? updated : record)),
  })

  return updated
}

export function setAgentCredentialValidation(
  id: string,
  validationStatus: AgentCredentialRecord['validationStatus']
): AgentCredentialRecord | null {
  return updateAgentCredentialRecord(id, (record) => ({
    ...record,
    validationStatus,
    validatedAt: new Date().toISOString(),
  }))
}

export function revokeAgentCredential(id: string): AgentCredentialRecord | null {
  return updateAgentCredentialRecord(id, (record) => ({
    ...record,
    status: 'revoked',
    revokedAt: new Date().toISOString(),
  }))
}
