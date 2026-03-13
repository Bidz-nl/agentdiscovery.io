import { listAgentRecords } from '@/lib/adp-v2/agent-record-repository'
import { toPublicAgent } from '@/lib/adp-v2/agent-registration-service'
import { jsonAdpV2Success } from '@/lib/adp-v2/response'

export async function GET() {
  const agents = listAgentRecords().map(toPublicAgent)

  return jsonAdpV2Success({
    ok: true,
    agents,
  })
}
