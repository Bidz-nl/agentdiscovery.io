import { NextRequest, NextResponse } from 'next/server'

import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'
import { getAgentManifest, saveAgentManifest } from '@/lib/adp-v2/agent-repository'
import type { AgentCapability, AgentManifest } from '@/lib/adp-v2/agent-types'
import { buildOwnerServiceCapabilityKey, buildPublishedCapabilityProjection, fetchOwnerServiceById } from '@/lib/owner-service-source'
import { upsertOwnerServicePublicationMetadata } from '@/lib/owner-service-publication-repository'
import type { PublishedServiceSnapshot } from '@/lib/owner-services'

function ensurePublishable(service: {
  ownerAgentDid: string
  title: string
  category: string
  description: string | null
}) {
  if (!service.ownerAgentDid.trim()) return 'ownerAgentDid is required'
  if (!service.title.trim()) return 'title is required'
  if (!service.category.trim()) return 'category is required'
  if (!service.description || !service.description.trim()) return 'description is required'
  return null
}

function toProjectedCapability(projection: ReturnType<typeof buildPublishedCapabilityProjection>): AgentCapability {
  return {
    key: projection.capabilityKey,
    description: projection.description,
    input_schema: projection.inputSchema,
    output_schema: projection.outputSchema,
  }
}

function upsertManifestCapability(manifest: AgentManifest, category: string, capability: AgentCapability): AgentManifest {
  const nextCapabilities = manifest.capabilities.some((existing) => existing.key === capability.key)
    ? manifest.capabilities.map((existing) => (existing.key === capability.key ? capability : existing))
    : [...manifest.capabilities, capability]

  const nextCategories = Array.from(new Set([...(manifest.categories ?? []), category]))

  return {
    ...manifest,
    categories: nextCategories,
    capabilities: nextCapabilities,
  }
}

async function getOrCreateProviderManifest(ownerAgentDid: string, category: string): Promise<AgentManifest> {
  const existing = await getAgentManifest(ownerAgentDid)
  if (existing) {
    return existing
  }

  return {
    did: ownerAgentDid,
    name: ownerAgentDid,
    role: 'provider',
    categories: [category],
    capabilities: [],
    supported_protocol_versions: ['2.0'],
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const ownerSession = await resolveOwnerPrivateAuthContext(request)

  if (!ownerSession) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_AUTH_REQUIRED',
          message: 'Owner app session is required to publish private provider services',
        },
      },
      { status: 401 }
    )
  }

  const { id } = await context.params
  const service = await fetchOwnerServiceById(ownerSession.activeProviderDid, id)

  if (!service) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_SERVICE_NOT_FOUND',
          message: 'Owner service not found',
        },
      },
      { status: 404 }
    )
  }

  if (service.status === 'archived') {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_SERVICE_ARCHIVED',
          message: 'Archived services must be restored before they can be published',
        },
      },
      { status: 409 }
    )
  }

  const publishableError = ensurePublishable(service)
  if (publishableError) {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_SERVICE_NOT_PUBLISHABLE',
          message: publishableError,
        },
      },
      { status: 422 }
    )
  }

  const capabilityKey = service.publishedCapabilityKey || buildOwnerServiceCapabilityKey(service)
  const nextProjectionVersion = (service.projectionVersion || 0) + 1
  const publishedAt = new Date().toISOString()
  const projection = buildPublishedCapabilityProjection(service, capabilityKey, publishedAt, nextProjectionVersion)
  const capability = toProjectedCapability(projection)
  const latestPublishedSnapshot: PublishedServiceSnapshot = {
    serviceId: service.id,
    ownerAgentDid: service.ownerAgentDid,
    capabilityKey,
    projectionVersion: nextProjectionVersion,
    publishedAt,
    sourceRevision: service.sourceRevision,
    category: service.category,
    capability,
  }
  const manifest = await getOrCreateProviderManifest(service.ownerAgentDid, service.category)
  const updatedManifest = upsertManifestCapability(manifest, service.category, capability)

  await saveAgentManifest(updatedManifest)
  await upsertOwnerServicePublicationMetadata(service.id, {
    publishedCapabilityKey: capabilityKey,
    projectionVersion: nextProjectionVersion,
    publishedAt,
    publishedSourceRevision: service.sourceRevision,
    latestPublishedSnapshot,
  })

  return NextResponse.json({
    service: {
      ...service,
      status: 'published',
      publishedCapabilityKey: capabilityKey,
      projectionVersion: nextProjectionVersion,
      publishedAt,
      publishedSourceRevision: service.sourceRevision,
      hasUnpublishedChanges: false,
      latestPublishedSnapshot,
      protocolProjection: {
        publishedCapabilityKey: capabilityKey,
        published: true,
      },
    },
    projection: {
      serviceId: service.id,
      ownerAgentDid: service.ownerAgentDid,
      capabilityKey,
      published: true,
      version: nextProjectionVersion,
      publishedAt,
    },
    manifest: {
      did: updatedManifest.did,
      capabilityCount: updatedManifest.capabilities.length,
    },
  })
}
