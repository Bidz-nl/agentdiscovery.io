import { NextRequest } from 'next/server'

import { validateAgentNamePolicy } from '@/lib/adp-v2/agent-name-policy'
import { registerNativeAgent, toPublicAgent } from '@/lib/adp-v2/agent-registration-service'
import { validateNativeAgentRegistration } from '@/lib/adp-v2/native-agent-schema'
import { jsonAdpV2Error, jsonAdpV2Success } from '@/lib/adp-v2/response'

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonAdpV2Error(400, 'INVALID_JSON', 'Request body must be valid JSON')
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonAdpV2Error(400, 'INVALID_AGENT_REGISTRATION_REQUEST', 'Agent registration request body must be a JSON object')
  }

  const validation = validateNativeAgentRegistration(body)

  if (!validation.success) {
    return jsonAdpV2Error(
      400,
      'INVALID_AGENT_REGISTRATION',
      'Agent registration payload is invalid',
      { errors: validation.errors }
    )
  }

  const nameError = validateAgentNamePolicy(validation.data.name)
  if (nameError) {
    return jsonAdpV2Error(
      nameError.code === 'AGENT_NAME_TAKEN' ? 409 : 400,
      nameError.code,
      nameError.message
    )
  }

  const registration = registerNativeAgent(validation.data)

  return jsonAdpV2Success({
    ok: true,
    message: 'ADP v2 agent registered',
    agent: toPublicAgent(registration.agent),
    apiKey: registration.apiKey,
  })
}
