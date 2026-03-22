import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const projectRoot = path.resolve(import.meta.dirname, '..')

function readProjectFile(...segments: string[]) {
  return readFileSync(path.join(projectRoot, ...segments), 'utf8')
}

test('delivery route is wired to the centralized provider delivery transition helper', () => {
  const source = readProjectFile('src', 'app', 'api', 'app', 'negotiations', '[id]', 'deliver', 'route.ts')

  assert.match(source, /applyDeliverySentTransition/)
  assert.match(source, /const transition = applyDeliverySentTransition\(negotiation\)/)
  assert.match(source, /status: transition\.nextStatus/)
  assert.doesNotMatch(source, /status:\s*'accepted'/)
})

test('delivery reply route is wired to the centralized consumer reply transition helper', () => {
  const source = readProjectFile('src', 'app', 'api', 'app', 'negotiations', '[id]', 'deliver', 'reply', 'route.ts')

  assert.match(source, /applyConsumerDeliveryReplyTransition/)
  assert.match(source, /const transition = applyConsumerDeliveryReplyTransition\(negotiation\)/)
  assert.match(source, /status: transition\.nextStatus/)
  assert.doesNotMatch(source, /status:\s*'accepted'/)
})

test('native negotiation service guards negotiation actions through centralized lifecycle affordances', () => {
  const source = readProjectFile('src', 'lib', 'adp-v2', 'native-negotiation-service.ts')

  assert.match(source, /const lifecycle = getNegotiationLifecycle\(negotiation\)/)
  assert.match(source, /!lifecycle\.canInitiatorNegotiate/)
  assert.match(source, /!lifecycle\.canResponderNegotiate/)
  assert.doesNotMatch(source, /negotiation\.status !== 'proposal_sent'/)
  assert.doesNotMatch(source, /!\['initiated', 'counter_proposed'\]\.includes\(negotiation\.status\)/)
})
