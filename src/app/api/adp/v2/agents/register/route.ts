import { NextRequest } from 'next/server'

import { saveAgentManifest } from '@/lib/adp-v2/agent-repository'
import { validateAgentRegistration } from '@/lib/adp-v2/agent-schema'
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

  const validation = validateAgentRegistration(body)

  if (!validation.success) {
    return jsonAdpV2Error(
      400,
      'INVALID_AGENT_REGISTRATION',
      'Agent registration payload is invalid',
      { errors: validation.errors }
    )
  }

  const agent = saveAgentManifest(validation.data)

  return jsonAdpV2Success({
    ok: true,
    message: 'ADP v2 agent registered',
    agent,
  })
}
