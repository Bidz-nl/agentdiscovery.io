import { NextRequest, NextResponse } from 'next/server'

import { sanitizeAgentName, validateAgentNamePolicy } from '@/lib/adp-v2/agent-name-policy'
import { createOwnerServiceRecord } from '@/lib/owner-service-repository'
import { registerNativeAgent } from '@/lib/adp-v2/agent-registration-service'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function toNativeAgentRole(agentType: unknown) {
  if (agentType === 'buyer') {
    return 'consumer' as const
  }

  if (agentType === 'seller' || agentType === 'service_provider') {
    return 'provider' as const
  }

  if (agentType === 'broker') {
    return 'broker' as const
  }

  return null
}

function toOwnerServiceRequest(
  body: Record<string, unknown>,
  role: 'consumer' | 'provider' | 'broker'
) {
  if (role !== 'provider' || !isRecord(body.capability)) {
    return null
  }

  const capability = body.capability
  const pricing = isRecord(capability.pricing) ? capability.pricing : null
  const trimmedDescription = typeof body.description === 'string' ? body.description.trim() : ''

  return {
    title: typeof capability.title === 'string' ? capability.title.trim() : '',
    category: typeof capability.category === 'string' ? capability.category.trim() : 'services',
    description: trimmedDescription || null,
    pricingSummary: {
      askingPrice: typeof pricing?.askingPrice === 'number' ? pricing.askingPrice : null,
      currency: typeof pricing?.currency === 'string' ? pricing.currency.trim().toUpperCase() : null,
      negotiable: typeof pricing?.negotiable === 'boolean' ? pricing.negotiable : null,
    },
  }
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_JSON',
          message: 'Request body must be valid JSON',
        },
      },
      { status: 400 }
    )
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_AGENT_REGISTRATION_REQUEST',
          message: 'Agent registration request body must be a JSON object',
        },
      },
      { status: 400 }
    )
  }

  const role = toNativeAgentRole(body.agentType)

  if (!role || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_AGENT_REGISTRATION',
          message: 'name and agentType are required',
        },
      },
      { status: 400 }
    )
  }

  const normalizedName = sanitizeAgentName(body.name)
  const nameError = validateAgentNamePolicy(normalizedName)
  if (nameError) {
    return NextResponse.json(
      {
        error: nameError,
      },
      { status: nameError.code === 'AGENT_NAME_TAKEN' ? 409 : 400 }
    )
  }

  const authorityBoundaries =
    body.authorityBoundaries && isRecord(body.authorityBoundaries) ? body.authorityBoundaries : {}
  const endpoints = body.endpoints && isRecord(body.endpoints) ? body.endpoints : {}
  const registration = registerNativeAgent({
    name: normalizedName,
    role,
    description: typeof body.description === 'string' ? body.description.trim() : undefined,
    supported_protocol_versions: ['2.0'],
    authority_summary: authorityBoundaries,
  })
  const ownerServiceInput = toOwnerServiceRequest(body, role)
  const createdService =
    ownerServiceInput && (ownerServiceInput.title || ownerServiceInput.category || ownerServiceInput.description)
      ? createOwnerServiceRecord(registration.agent.did, ownerServiceInput)
      : null

  return NextResponse.json({
    agent: {
      id: registration.agent.id,
      did: registration.agent.did,
      name: registration.agent.name,
      description: registration.agent.description ?? null,
      agentType: body.agentType,
      authorityBoundaries,
      endpoints,
      reputationScore: '0.00',
      isActive: registration.agent.status === 'active',
      createdAt: registration.agent.createdAt,
    },
    apiKey: registration.apiKey,
    ...(createdService
      ? {
          capability: {
            id: createdService.id,
            category: createdService.category,
            title: createdService.title,
            description: createdService.description,
            status: 'draft',
            note: 'Private capability draft created during registration',
          },
        }
      : {}),
    instructions: {
      next_steps: [
        'Store the API key securely',
        'Use Authorization: Bearer <apiKey> on ADP requests',
        'Create and publish services from the provider control plane',
      ],
      api_base: '/api/adp/v2',
      docs: '/docs',
    },
  })
}
