import { listOwnerServiceRecords, getOwnerServiceRecord } from '@/lib/owner-service-repository'
import { getOwnerServicePublicationMetadata } from '@/lib/owner-service-publication-repository'
import type { OwnerServiceReadModel, ServiceRecord } from '@/lib/owner-services'

function toOwnerServiceStatus(record: ServiceRecord, metadata: Awaited<ReturnType<typeof getOwnerServicePublicationMetadata>>): OwnerServiceReadModel['status'] {
  if (record.archivedAt) {
    return 'archived'
  }

  return metadata?.publishedCapabilityKey ? 'published' : 'draft'
}

export function buildOwnerServiceCapabilityKey(service: Pick<OwnerServiceReadModel, 'id' | 'ownerAgentDid' | 'category'>): string {
  const base = `${service.ownerAgentDid}-${service.id}-${service.category}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `service-${base || 'capability'}`
}

export function buildPublishedCapabilityProjection(
  service: Pick<OwnerServiceReadModel, 'id' | 'ownerAgentDid' | 'title' | 'category' | 'description' | 'pricingSummary'>,
  capabilityKey: string,
  publishedAt: string,
  projectionVersion: number
) {
  return {
    serviceId: service.id,
    ownerAgentDid: service.ownerAgentDid,
    capabilityKey,
    description: `${service.title} — ${service.description}`,
    inputSchema: {
      category: service.category,
      pricing: {
        askingPrice: service.pricingSummary.askingPrice,
        currency: service.pricingSummary.currency,
        negotiable: service.pricingSummary.negotiable,
      },
    },
    outputSchema: {
      category: service.category,
    },
    publishedAt,
    version: projectionVersion,
  }
}

async function toOwnerServiceReadModel(record: ServiceRecord): Promise<OwnerServiceReadModel> {
  const metadata = await getOwnerServicePublicationMetadata(record.id)
  const publishedCapabilityKey = metadata?.publishedCapabilityKey ?? null

  return {
    id: record.id,
    ownerAgentDid: record.ownerAgentDid,
    title: record.title,
    category: record.category,
    description: record.description,
    status: toOwnerServiceStatus(record, metadata),
    publishedCapabilityKey,
    projectionVersion: metadata?.projectionVersion ?? 0,
    publishedAt: metadata?.publishedAt ?? null,
    publishedSourceRevision: metadata?.publishedSourceRevision ?? null,
    sourceRevision: record.sourceRevision,
    hasUnpublishedChanges: record.hasUnpublishedChanges,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    archivedAt: record.archivedAt,
    pricingSummary: record.pricingSummary,
    protocolProjection: {
      publishedCapabilityKey,
      published: Boolean(publishedCapabilityKey),
    },
  }
}

export async function fetchOwnerServices(activeProviderDid: string): Promise<OwnerServiceReadModel[]> {
  const records = await listOwnerServiceRecords()
  const filtered = records.filter((record) => record.ownerAgentDid === activeProviderDid)
  return Promise.all(filtered.map(toOwnerServiceReadModel))
}

export async function fetchOwnerServiceById(
  activeProviderDid: string,
  serviceId: string
): Promise<OwnerServiceReadModel | null> {
  const service = await getOwnerServiceRecord(serviceId)
  if (!service || service.ownerAgentDid !== activeProviderDid) {
    return null
  }
  return toOwnerServiceReadModel(service)
}
