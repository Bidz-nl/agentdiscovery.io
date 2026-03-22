import { kvRead, kvWrite } from '@/lib/kv-store'
import type {
  CreateOwnerServiceRequest,
  OwnerServicePricingSummary,
  OwnerServicePublicationMetadata,
  PublishedServiceSnapshot,
  ServiceRecord,
  UpdateOwnerServiceRequest,
} from '@/lib/owner-services'

const KV_KEY = 'adp:owner-services'

type OwnerServiceStoreFile = {
  services: ServiceRecord[]
}

async function readOwnerServiceStore(): Promise<OwnerServiceStoreFile> {
  const raw = await kvRead<OwnerServiceStoreFile | null>(KV_KEY, null)
  if (!raw) {
    return { services: [] }
  }
  try {
    return {
      services: Array.isArray(raw.services) ? raw.services.map(toServiceRecord) : [],
    }
  } catch {
    return { services: [] }
  }
}

async function writeOwnerServiceStore(store: OwnerServiceStoreFile): Promise<void> {
  await kvWrite(KV_KEY, store)
}

function toPublishedServiceSnapshot(snapshot: Partial<PublishedServiceSnapshot> | null | undefined): PublishedServiceSnapshot | null {
  if (!snapshot || typeof snapshot !== 'object') {
    return null
  }

  const capability = snapshot.capability

  if (!capability || typeof capability !== 'object' || Array.isArray(capability)) {
    return null
  }

  const capabilityKey = typeof snapshot.capabilityKey === 'string' ? snapshot.capabilityKey : ''
  const publishedAt = typeof snapshot.publishedAt === 'string' ? snapshot.publishedAt : ''

  if (!capabilityKey || !publishedAt) {
    return null
  }

  return {
    serviceId: typeof snapshot.serviceId === 'string' ? snapshot.serviceId : '',
    ownerAgentDid: typeof snapshot.ownerAgentDid === 'string' ? snapshot.ownerAgentDid : '',
    capabilityKey,
    projectionVersion: typeof snapshot.projectionVersion === 'number' ? snapshot.projectionVersion : 0,
    publishedAt,
    sourceRevision: typeof snapshot.sourceRevision === 'number' ? snapshot.sourceRevision : 0,
    category: typeof snapshot.category === 'string' ? snapshot.category : '',
    capability: {
      key: typeof capability.key === 'string' ? capability.key : '',
      description: typeof capability.description === 'string' ? capability.description : '',
      input_schema:
        capability.input_schema && typeof capability.input_schema === 'object' && !Array.isArray(capability.input_schema)
          ? capability.input_schema
          : undefined,
      output_schema:
        capability.output_schema && typeof capability.output_schema === 'object' && !Array.isArray(capability.output_schema)
          ? capability.output_schema
          : undefined,
    },
  }
}

function toServiceRecord(record: Partial<ServiceRecord>): ServiceRecord {
  return {
    id: typeof record.id === 'string' ? record.id : '',
    ownerAgentDid: typeof record.ownerAgentDid === 'string' ? record.ownerAgentDid : '',
    title: typeof record.title === 'string' ? record.title : '',
    category: typeof record.category === 'string' ? record.category : '',
    description: typeof record.description === 'string' ? record.description : null,
    publishedCapabilityKey:
      typeof record.publishedCapabilityKey === 'string' ? record.publishedCapabilityKey : null,
    projectionVersion: typeof record.projectionVersion === 'number' ? record.projectionVersion : 0,
    publishedAt: typeof record.publishedAt === 'string' ? record.publishedAt : null,
    publishedSourceRevision:
      typeof record.publishedSourceRevision === 'number' ? record.publishedSourceRevision : null,
    sourceRevision: typeof record.sourceRevision === 'number' ? record.sourceRevision : 1,
    hasUnpublishedChanges:
      typeof record.hasUnpublishedChanges === 'boolean' ? record.hasUnpublishedChanges : false,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date(0).toISOString(),
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date(0).toISOString(),
    archivedAt: typeof record.archivedAt === 'string' ? record.archivedAt : null,
    latestPublishedSnapshot: toPublishedServiceSnapshot(record.latestPublishedSnapshot),
    pricingSummary: normalizePricingSummary(record.pricingSummary),
  }
}

function createOwnerServiceId(records: ServiceRecord[]): string {
  const maxId = records.reduce((currentMax, record) => {
    const parsedId = Number.parseInt(record.id.replace(/^service-/, ''), 10)
    return Number.isFinite(parsedId) ? Math.max(currentMax, parsedId) : currentMax
  }, 0)

  return `service-${maxId + 1}`
}

function normalizePricingSummary(input?: Partial<OwnerServicePricingSummary>): OwnerServicePricingSummary {
  return {
    askingPrice: typeof input?.askingPrice === 'number' ? input.askingPrice : null,
    currency: typeof input?.currency === 'string' ? input.currency : null,
    negotiable: typeof input?.negotiable === 'boolean' ? input.negotiable : null,
  }
}

export async function listOwnerServiceRecords(): Promise<ServiceRecord[]> {
  return (await readOwnerServiceStore()).services
}

export async function getOwnerServiceRecord(serviceId: string): Promise<ServiceRecord | null> {
  return (await readOwnerServiceStore()).services.find((record) => record.id === serviceId) ?? null
}

export async function createOwnerServiceRecord(ownerAgentDid: string, input: CreateOwnerServiceRequest): Promise<ServiceRecord> {
  const store = await readOwnerServiceStore()
  const now = new Date().toISOString()
  const record: ServiceRecord = {
    id: createOwnerServiceId(store.services),
    ownerAgentDid: ownerAgentDid.trim(),
    title: typeof input.title === 'string' ? input.title.trim() : '',
    category: typeof input.category === 'string' ? input.category.trim() : '',
    description: typeof input.description === 'string' ? input.description.trim() : null,
    publishedCapabilityKey: null,
    projectionVersion: 0,
    publishedAt: null,
    publishedSourceRevision: null,
    sourceRevision: 1,
    hasUnpublishedChanges: false,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    latestPublishedSnapshot: null,
    pricingSummary: normalizePricingSummary(input.pricingSummary),
  }

  await writeOwnerServiceStore({
    services: [...store.services, record],
  })

  return record
}

export async function updateOwnerServiceRecord(serviceId: string, patch: UpdateOwnerServiceRequest): Promise<ServiceRecord | null> {
  const store = await readOwnerServiceStore()
  const current = store.services.find((record) => record.id === serviceId)
  if (!current) {
    return null
  }

  const nextSourceRevision = current.sourceRevision + 1
  const updated: ServiceRecord = {
    ...current,
    title: typeof patch.title === 'string' ? patch.title.trim() : current.title,
    category: typeof patch.category === 'string' ? patch.category.trim() : current.category,
    description:
      patch.description === null
        ? null
        : typeof patch.description === 'string'
          ? patch.description.trim()
          : current.description,
    pricingSummary: patch.pricingSummary
      ? {
          askingPrice:
            patch.pricingSummary.askingPrice === null
              ? null
              :
            typeof patch.pricingSummary.askingPrice === 'number'
              ? patch.pricingSummary.askingPrice
              : current.pricingSummary.askingPrice,
          currency:
            patch.pricingSummary.currency === null
              ? null
              :
            typeof patch.pricingSummary.currency === 'string'
              ? patch.pricingSummary.currency
              : current.pricingSummary.currency,
          negotiable:
            patch.pricingSummary.negotiable === null
              ? null
              :
            typeof patch.pricingSummary.negotiable === 'boolean'
              ? patch.pricingSummary.negotiable
              : current.pricingSummary.negotiable,
        }
      : current.pricingSummary,
    sourceRevision: nextSourceRevision,
    hasUnpublishedChanges: current.publishedCapabilityKey ? true : false,
    updatedAt: new Date().toISOString(),
  }

  await writeOwnerServiceStore({
    services: store.services.map((record) => (record.id === serviceId ? updated : record)),
  })

  return updated
}

export async function archiveOwnerServiceRecord(serviceId: string): Promise<ServiceRecord | null> {
  const store = await readOwnerServiceStore()
  const current = store.services.find((record) => record.id === serviceId)
  if (!current) {
    return null
  }

  if (current.archivedAt) {
    return current
  }

  const now = new Date().toISOString()
  const updated: ServiceRecord = {
    ...current,
    archivedAt: now,
    updatedAt: now,
  }

  await writeOwnerServiceStore({
    services: store.services.map((record) => (record.id === serviceId ? updated : record)),
  })

  return updated
}

export async function restoreOwnerServiceRecord(serviceId: string): Promise<ServiceRecord | null> {
  const store = await readOwnerServiceStore()
  const current = store.services.find((record) => record.id === serviceId)
  if (!current) {
    return null
  }

  if (!current.archivedAt) {
    return current
  }

  const updated: ServiceRecord = {
    ...current,
    archivedAt: null,
    updatedAt: new Date().toISOString(),
  }

  await writeOwnerServiceStore({
    services: store.services.map((record) => (record.id === serviceId ? updated : record)),
  })

  return updated
}

export async function deleteOwnerServiceRecord(serviceId: string): Promise<boolean> {
  const store = await readOwnerServiceStore()
  const nextServices = store.services.filter((record) => record.id !== serviceId)

  if (nextServices.length === store.services.length) {
    return false
  }

  await writeOwnerServiceStore({
    services: nextServices,
  })

  return true
}

export async function updateOwnerServicePublicationMetadata(
  serviceId: string,
  metadata: OwnerServicePublicationMetadata
): Promise<ServiceRecord | null> {
  const store = await readOwnerServiceStore()
  const current = store.services.find((record) => record.id === serviceId)
  if (!current) {
    return null
  }

  const updated: ServiceRecord = {
    ...current,
    publishedCapabilityKey: metadata.publishedCapabilityKey,
    projectionVersion: metadata.projectionVersion,
    publishedAt: metadata.publishedAt,
    publishedSourceRevision: metadata.publishedSourceRevision,
    hasUnpublishedChanges: false,
    updatedAt: new Date().toISOString(),
    latestPublishedSnapshot:
      metadata.latestPublishedSnapshot === undefined
        ? current.latestPublishedSnapshot
        : toPublishedServiceSnapshot(metadata.latestPublishedSnapshot),
  }

  await writeOwnerServiceStore({
    services: store.services.map((record) => (record.id === serviceId ? updated : record)),
  })

  return updated
}
