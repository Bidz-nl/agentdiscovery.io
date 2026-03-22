import { getOwnerServiceRecord, updateOwnerServicePublicationMetadata } from '@/lib/owner-service-repository'
import type { OwnerServicePublicationMetadata } from '@/lib/owner-services'

export async function getOwnerServicePublicationMetadata(serviceId: string): Promise<OwnerServicePublicationMetadata | null> {
  const service = await getOwnerServiceRecord(serviceId)
  if (!service) {
    return null
  }

  return {
    publishedCapabilityKey: service.publishedCapabilityKey,
    projectionVersion: service.projectionVersion,
    publishedAt: service.publishedAt,
    publishedSourceRevision: service.publishedSourceRevision,
    latestPublishedSnapshot: service.latestPublishedSnapshot,
  }
}

export async function upsertOwnerServicePublicationMetadata(
  serviceId: string,
  metadata: OwnerServicePublicationMetadata
): Promise<OwnerServicePublicationMetadata> {
  await updateOwnerServicePublicationMetadata(serviceId, metadata)
  return metadata
}
