import { NextRequest, NextResponse } from 'next/server'

import { resolveOwnerPrivateAuthContext } from '@/lib/owner-private-auth-resolver'
import { getAgentManifest, saveAgentManifest } from '@/lib/adp-v2/agent-repository'
import type { AgentCapability, AgentManifest } from '@/lib/adp-v2/agent-types'
import { fetchOwnerServiceById } from '@/lib/owner-service-source'
import { upsertOwnerServicePublicationMetadata } from '@/lib/owner-service-publication-repository'

function getCapabilityCategory(capability: AgentCapability): string | null {
  const inputCategory = capability.input_schema?.category
  if (typeof inputCategory === 'string' && inputCategory.trim()) {
    return inputCategory.trim()
  }

  const outputCategory = capability.output_schema?.category
  if (typeof outputCategory === 'string' && outputCategory.trim()) {
    return outputCategory.trim()
  }

  return null
}

function removeManifestCapability(manifest: AgentManifest, capabilityKey: string, category: string): AgentManifest {
  const nextCapabilities = manifest.capabilities.filter((capability) => capability.key !== capabilityKey)
  const categoryStillUsed = nextCapabilities.some((capability) => getCapabilityCategory(capability) === category)
  const nextCategories = categoryStillUsed
    ? manifest.categories ?? []
    : (manifest.categories ?? []).filter((existingCategory) => existingCategory !== category)

  return {
    ...manifest,
    categories: nextCategories,
    capabilities: nextCapabilities,
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
          message: 'Owner app session is required to unpublish private provider services',
        },
      },
      { status: 401 }
    )
  }

  try {
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
            message: 'Archived services cannot be unpublished until they are restored',
          },
        },
        { status: 409 }
      )
    }

    if (!service.publishedCapabilityKey) {
      return NextResponse.json(
        {
          error: {
            code: 'OWNER_SERVICE_NOT_PUBLISHED',
            message: 'Owner service does not have an active published projection',
          },
        },
        { status: 409 }
      )
    }

    const manifest = getAgentManifest(service.ownerAgentDid)
    const updatedManifest = manifest
      ? removeManifestCapability(manifest, service.publishedCapabilityKey, service.category)
      : null

    if (updatedManifest) {
      saveAgentManifest(updatedManifest)
    }

    upsertOwnerServicePublicationMetadata(service.id, {
      publishedCapabilityKey: null,
      projectionVersion: service.projectionVersion,
      publishedAt: null,
      publishedSourceRevision: null,
    })

    return NextResponse.json({
      service: {
        ...service,
        status: 'draft',
        publishedCapabilityKey: null,
        publishedAt: null,
        publishedSourceRevision: null,
        hasUnpublishedChanges: false,
        protocolProjection: {
          publishedCapabilityKey: null,
          published: false,
        },
      },
      projection: {
        serviceId: service.id,
        ownerAgentDid: service.ownerAgentDid,
        capabilityKey: service.publishedCapabilityKey,
        unpublished: true,
      },
      manifest: {
        did: service.ownerAgentDid,
        capabilityCount: updatedManifest?.capabilities.length ?? 0,
      },
    })
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'OWNER_SERVICE_UNPUBLISH_FAILED',
          message: 'Unable to unpublish private provider service',
        },
      },
      { status: 502 }
    )
  }
}
