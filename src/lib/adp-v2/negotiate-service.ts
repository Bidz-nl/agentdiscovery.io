import { getAgentManifest } from '@/lib/adp-v2/agent-repository'
import type { AgentManifest } from '@/lib/adp-v2/agent-types'
import type { NegotiatePayload } from '@/lib/adp-v2/negotiate-types'

export type NegotiateProviderValidationResult =
  | {
      success: true
      provider: Pick<AgentManifest, 'did' | 'name' | 'role' | 'categories' | 'capabilities'>
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
  const provider = getAgentManifest(negotiate.provider_did)

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

  if (!provider.supported_protocol_versions.includes('2.0')) {
    return {
      success: false,
      error: {
        status: 409,
        code: 'NEGOTIATE_PROVIDER_UNSUPPORTED_PROTOCOL',
        message: 'Negotiation provider does not support ADP protocol version 2.0',
        details: {
          provider_did: negotiate.provider_did,
          supported_protocol_versions: provider.supported_protocol_versions,
        },
      },
    }
  }

  if (
    negotiate.service_category &&
    (!Array.isArray(provider.categories) || !provider.categories.includes(negotiate.service_category))
  ) {
    return {
      success: false,
      error: {
        status: 409,
        code: 'NEGOTIATE_PROVIDER_CATEGORY_MISMATCH',
        message: 'Negotiation provider does not support the requested service category',
        details: {
          provider_did: negotiate.provider_did,
          service_category: negotiate.service_category,
          categories: provider.categories ?? [],
        },
      },
    }
  }

  return {
    success: true,
    provider: {
      did: provider.did,
      name: provider.name,
      role: provider.role,
      categories: provider.categories,
      capabilities: provider.capabilities,
    },
  }
}
