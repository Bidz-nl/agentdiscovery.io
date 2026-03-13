import { getOwnerServiceRecord, updateOwnerServicePublicationMetadata } from '@/lib/owner-service-repository'
import type { OwnerServicePublicationMetadata } from '@/lib/owner-services'

export function getOwnerServicePublicationMetadata(serviceId: string): OwnerServicePublicationMetadata | null {
  const service = getOwnerServiceRecord(serviceId)
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

export function upsertOwnerServicePublicationMetadata(
  serviceId: string,
  metadata: OwnerServicePublicationMetadata
): OwnerServicePublicationMetadata {
  updateOwnerServicePublicationMetadata(serviceId, metadata)
  return metadata
}
