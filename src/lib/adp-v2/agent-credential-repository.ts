import { randomUUID } from 'node:crypto'

import { kvRead, kvWrite } from '@/lib/kv-store'
import type { AgentCredentialRecord } from '@/lib/adp-v2/agent-types'

type AgentCredentialStoreFile = {
  credentials: AgentCredentialRecord[]
}

const KV_KEY = 'adp:agent-credentials'

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

async function readAgentCredentialStore(): Promise<AgentCredentialStoreFile> {
  const raw = await kvRead<AgentCredentialStoreFile | null>(KV_KEY, null)
  if (!raw) {
    return { credentials: [] }
  }
  try {
    return {
      credentials: Array.isArray(raw.credentials)
        ? raw.credentials.map(toAgentCredentialRecord).filter(isAgentCredentialRecord)
        : [],
    }
  } catch {
    return { credentials: [] }
  }
}

async function writeAgentCredentialStore(store: AgentCredentialStoreFile): Promise<void> {
  await kvWrite(KV_KEY, store)
}

export async function createAgentCredentialRecord(
  input: Omit<AgentCredentialRecord, 'id' | 'createdAt' | 'lastUsedAt' | 'revokedAt'>
): Promise<AgentCredentialRecord> {
  const store = await readAgentCredentialStore()
  const record: AgentCredentialRecord = {
    id: `cred_${randomUUID()}`,
    ...input,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    revokedAt: null,
  }

  await writeAgentCredentialStore({
    credentials: [...store.credentials, record],
  })

  return record
}

export async function getAgentCredentialBySecretHash(secretHash: string): Promise<AgentCredentialRecord | null> {
  return (await readAgentCredentialStore()).credentials.find((record) => record.secretHash === secretHash && record.kind === 'app_api_key') ?? null
}

export async function touchAgentCredentialLastUsed(id: string): Promise<AgentCredentialRecord | null> {
  const store = await readAgentCredentialStore()
  const existingRecord = store.credentials.find((record) => record.id === id)

  if (!existingRecord) {
    return null
  }

  const updatedRecord: AgentCredentialRecord = {
    ...existingRecord,
    lastUsedAt: new Date().toISOString(),
  }

  await writeAgentCredentialStore({
    credentials: store.credentials.map((record) => (record.id === id ? updatedRecord : record)),
  })

  return updatedRecord
}

export async function getAgentCredentialById(id: string): Promise<AgentCredentialRecord | null> {
  return (await readAgentCredentialStore()).credentials.find((record) => record.id === id) ?? null
}

export async function listAgentCredentialRecords(agentId: number): Promise<AgentCredentialRecord[]> {
  return (await readAgentCredentialStore()).credentials.filter((record) => record.agentId === agentId)
}

export async function getActiveAgentProviderCredential(
  agentId: number,
  provider: 'openai' | 'anthropic'
): Promise<AgentCredentialRecord | null> {
  return (
    (await readAgentCredentialStore()).credentials.find(
      (record) =>
        record.agentId === agentId &&
        record.kind === 'provider_api_key' &&
        record.provider === provider &&
        record.status === 'active'
    ) ?? null
  )
}

export async function updateAgentCredentialRecord(
  id: string,
  updater: (record: AgentCredentialRecord) => AgentCredentialRecord
): Promise<AgentCredentialRecord | null> {
  const store = await readAgentCredentialStore()
  const existing = store.credentials.find((record) => record.id === id)

  if (!existing) {
    return null
  }

  const updated = updater(existing)

  await writeAgentCredentialStore({
    credentials: store.credentials.map((record) => (record.id === id ? updated : record)),
  })

  return updated
}

export async function setAgentCredentialValidation(
  id: string,
  validationStatus: AgentCredentialRecord['validationStatus']
): Promise<AgentCredentialRecord | null> {
  return updateAgentCredentialRecord(id, (record) => ({
    ...record,
    validationStatus,
    validatedAt: new Date().toISOString(),
  }))
}

export async function revokeAgentCredential(id: string): Promise<AgentCredentialRecord | null> {
  return updateAgentCredentialRecord(id, (record) => ({
    ...record,
    status: 'revoked',
    revokedAt: new Date().toISOString(),
  }))
}
