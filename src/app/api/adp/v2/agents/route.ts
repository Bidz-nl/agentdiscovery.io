import { listAgentManifests } from '@/lib/adp-v2/agent-repository'
import { jsonAdpV2Success } from '@/lib/adp-v2/response'

export async function GET() {
  const agents = listAgentManifests()

  return jsonAdpV2Success({
    ok: true,
    agents,
  })
}
