import { getAgentRecordByDid } from '@/lib/adp-v2/agent-record-repository'
import type { NegotiatePayload } from '@/lib/adp-v2/negotiate-types'
import { listOwnerServiceRecords } from '@/lib/owner-service-repository'

export type NegotiateProviderValidationResult =
  | {
      success: true
      provider: {
        did: string
        name: string
        role: 'provider'
        categories?: string[]
        capabilities: Array<{
          key: string
          description: string
          input_schema?: Record<string, unknown>
          output_schema?: Record<string, unknown>
        }>
      }
    }
  | {
      success: false
      error: {
        status: number
        code: string
        message: string
        details?: Record<string, unknown>
      }
    }

export function validateNegotiateProvider(
  negotiate: NegotiatePayload
): NegotiateProviderValidationResult {
  const provider = getAgentRecordByDid(negotiate.provider_did)
  const publishedServices = listOwnerServiceRecords()
    .filter((service) => !service.archivedAt)
    .filter((service) => service.ownerAgentDid === negotiate.provider_did)
    .filter((service) => Boolean(service.publishedCapabilityKey && service.latestPublishedSnapshot))

  if (!provider) {
    return {
      success: false,
      error: {
        status: 404,
        code: 'NEGOTIATE_PROVIDER_NOT_FOUND',
        message: 'Negotiation provider not found',
        details: {
          provider_did: negotiate.provider_did,
        },
      },
    }
  }

  if (provider.role !== 'provider') {
    return {
      success: false,
      error: {
        status: 409,
        code: 'NEGOTIATE_PROVIDER_INVALID_ROLE',
        message: 'Negotiation provider must have role provider',
        details: {
          provider_did: negotiate.provider_did,
          role: provider.role,
        },
      },
    }
  }

  if (!provider.supportedProtocolVersions.includes('2.0')) {
    return {
      success: false,
      error: {
        status: 409,
        code: 'NEGOTIATE_PROVIDER_UNSUPPORTED_PROTOCOL',
        message: 'Negotiation provider does not support ADP protocol version 2.0',
        details: {
          provider_did: negotiate.provider_did,
          supported_protocol_versions: provider.supportedProtocolVersions,
        },
      },
    }
  }

  const matchingServices = publishedServices.filter((service) => {
    const category = service.latestPublishedSnapshot?.category || service.category
    return category.toLowerCase() === negotiate.service_category.toLowerCase()
  })

  if (negotiate.service_category && matchingServices.length === 0) {
    return {
      success: false,
      error: {
        status: 409,
        code: 'NEGOTIATE_PROVIDER_CATEGORY_MISMATCH',
        message: 'Negotiation provider does not support the requested service category',
        details: {
          provider_did: negotiate.provider_did,
          service_category: negotiate.service_category,
          categories: Array.from(
            new Set(publishedServices.map((service) => service.latestPublishedSnapshot?.category || service.category))
          ),
        },
      },
    }
  }

  return {
    success: true,
    provider: {
      did: provider.did,
      name: provider.name,
      role: 'provider',
      categories: Array.from(
        new Set(publishedServices.map((service) => service.latestPublishedSnapshot?.category || service.category))
      ),
      capabilities: publishedServices
        .map((service) => service.latestPublishedSnapshot?.capability)
        .filter(
          (capability): capability is {
            key: string
            description: string
            input_schema?: Record<string, unknown>
            output_schema?: Record<string, unknown>
          } => Boolean(capability)
        ),
    },
  }
}
