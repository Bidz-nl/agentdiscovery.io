export type OwnerServiceStatus = 'draft' | 'published' | 'archived'

export interface OwnerServicePublicationMetadata {
  publishedCapabilityKey: string | null
  projectionVersion: number
  publishedAt: string | null
  publishedSourceRevision: number | null
  latestPublishedSnapshot?: PublishedServiceSnapshot | null
}

export interface PublishedServiceSnapshot {
  serviceId: string
  ownerAgentDid: string
  capabilityKey: string
  projectionVersion: number
  publishedAt: string
  sourceRevision: number
  category: string
  capability: {
    key: string
    description: string
    input_schema?: Record<string, unknown>
    output_schema?: Record<string, unknown>
  }
}

export interface OwnerServicePricingSummary {
  askingPrice: number | null
  currency: string | null
  negotiable: boolean | null
}

export interface ServiceRecord {
  id: string
  ownerAgentDid: string
  title: string
  category: string
  description: string | null
  publishedCapabilityKey: string | null
  projectionVersion: number
  publishedAt: string | null
  publishedSourceRevision: number | null
  sourceRevision: number
  hasUnpublishedChanges: boolean
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  latestPublishedSnapshot: PublishedServiceSnapshot | null
  pricingSummary: OwnerServicePricingSummary
}

export interface CreateOwnerServiceRequest {
  title?: string
  category?: string
  description?: string | null
  pricingSummary?: Partial<OwnerServicePricingSummary>
}

export interface UpdateOwnerServiceRequest {
  title?: string
  category?: string
  description?: string | null
  pricingSummary?: Partial<OwnerServicePricingSummary>
}

export interface OwnerServiceReadModel {
  id: string
  ownerAgentDid: string
  title: string
  category: string
  description: string | null
  status: OwnerServiceStatus
  publishedCapabilityKey: string | null
  projectionVersion: number
  publishedAt: string | null
  publishedSourceRevision: number | null
  sourceRevision: number
  hasUnpublishedChanges: boolean
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  pricingSummary: OwnerServicePricingSummary
  protocolProjection: {
    publishedCapabilityKey: string | null
    published: boolean
  }
}

export interface OwnerServiceDetailResponse {
  service: OwnerServiceReadModel
}

export interface OwnerServiceListResponse {
  services: OwnerServiceReadModel[]
}
