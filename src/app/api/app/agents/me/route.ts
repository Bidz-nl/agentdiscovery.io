import { NextRequest, NextResponse } from 'next/server'

import { verifyBearerAgentApiKey } from '@/lib/adp-v2/agent-api-key'
import { sanitizeAgentName, validateAgentNamePolicy } from '@/lib/adp-v2/agent-name-policy'
import { updateAgentRecordName } from '@/lib/adp-v2/agent-record-repository'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function GET(request: NextRequest) {
  const verified = verifyBearerAgentApiKey(request.headers)

  if (!verified) {
    return NextResponse.json(
      {
        error: {
          code: 'AGENT_AUTH_REQUIRED',
          message: 'An active bot session is required.',
        },
      },
      { status: 401 }
    )
  }

  const agent = verified.agent

  return NextResponse.json({
    agent: {
      id: agent.id,
      did: agent.did,
      name: agent.name,
      description: agent.description ?? null,
      role: agent.role,
      updatedAt: agent.updatedAt,
    },
  })
}

export async function PATCH(request: NextRequest) {
  const verified = verifyBearerAgentApiKey(request.headers)

  if (!verified) {
    return NextResponse.json(
      {
        error: {
          code: 'AGENT_AUTH_REQUIRED',
          message: 'An active bot session is required to update this bot profile.',
        },
      },
      { status: 401 }
    )
  }

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
          code: 'INVALID_AGENT_UPDATE_REQUEST',
          message: 'Bot update request body must be a JSON object',
        },
      },
      { status: 400 }
    )
  }

  if (typeof body.name !== 'string') {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_AGENT_UPDATE_REQUEST',
          message: 'Bot name is required.',
        },
      },
      { status: 400 }
    )
  }

  const nextName = sanitizeAgentName(body.name)
  const nameError = validateAgentNamePolicy(nextName, { excludeDid: verified.agent.did })
  if (nameError) {
    return NextResponse.json(
      {
        error: nameError,
      },
      { status: nameError.code === 'AGENT_NAME_TAKEN' ? 409 : 400 }
    )
  }

  const updatedAgent = updateAgentRecordName(verified.agent.did, nextName)
  if (!updatedAgent) {
    return NextResponse.json(
      {
        error: {
          code: 'AGENT_NOT_FOUND',
          message: 'Bot could not be found.',
        },
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    agent: {
      id: updatedAgent.id,
      did: updatedAgent.did,
      name: updatedAgent.name,
      description: updatedAgent.description ?? null,
      role: updatedAgent.role,
      updatedAt: updatedAgent.updatedAt,
    },
  })
}
