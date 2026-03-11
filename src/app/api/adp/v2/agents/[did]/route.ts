import { NextRequest } from 'next/server'

import { getAgentManifest } from '@/lib/adp-v2/agent-repository'
import { jsonAdpV2Error, jsonAdpV2Success } from '@/lib/adp-v2/response'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ did: string }> }
) {
  const { did } = await context.params
  const agent = getAgentManifest(did)

  if (!agent) {
    return jsonAdpV2Error(404, 'AGENT_NOT_FOUND', 'ADP v2 agent not found', { did })
  }

  return jsonAdpV2Success({
    ok: true,
    agent,
  })
}
