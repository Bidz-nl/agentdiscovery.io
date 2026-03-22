import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyConsumerDeliveryReplyTransition,
  applyDeliverySentTransition,
  getNegotiationLifecycle,
  normalizeNegotiationStatus,
  type NegotiationLifecycleShape,
} from '../src/lib/adp-v2/negotiation-lifecycle.ts'

function makeNegotiation(overrides: Partial<NegotiationLifecycleShape> = {}): NegotiationLifecycleShape {
  return {
    status: 'awaiting_provider',
    initiatorDid: 'did:consumer:1',
    responderDid: 'did:provider:1',
    transcript: [],
    ...overrides,
  }
}

test('normalizeNegotiationStatus maps legacy and canonical statuses', () => {
  assert.equal(normalizeNegotiationStatus('initiated'), 'awaiting_provider')
  assert.equal(normalizeNegotiationStatus('counter_proposed'), 'awaiting_provider')
  assert.equal(normalizeNegotiationStatus('proposal_sent'), 'awaiting_consumer')
  assert.equal(normalizeNegotiationStatus('completed'), 'accepted')
  assert.equal(normalizeNegotiationStatus('accepted'), 'accepted')
  assert.equal(normalizeNegotiationStatus('rejected'), 'rejected')
  assert.equal(normalizeNegotiationStatus('cancelled'), 'cancelled')
  assert.equal(normalizeNegotiationStatus('unknown_status'), 'cancelled')
})

test('getNegotiationLifecycle derives awaiting-provider negotiation state', () => {
  const lifecycle = getNegotiationLifecycle(makeNegotiation({ status: 'initiated' }))

  assert.equal(lifecycle.normalizedStatus, 'awaiting_provider')
  assert.equal(lifecycle.phase, 'negotiation')
  assert.equal(lifecycle.turn, 'responder')
  assert.equal(lifecycle.isAwaitingProvider, true)
  assert.equal(lifecycle.isAwaitingConsumer, false)
  assert.equal(lifecycle.isDeliveryOpen, false)
  assert.equal(lifecycle.isClosedFailed, false)
  assert.equal(lifecycle.canResponderNegotiate, true)
  assert.equal(lifecycle.canInitiatorNegotiate, false)
})

test('getNegotiationLifecycle derives awaiting-consumer negotiation state', () => {
  const lifecycle = getNegotiationLifecycle(makeNegotiation({ status: 'proposal_sent' }))

  assert.equal(lifecycle.normalizedStatus, 'awaiting_consumer')
  assert.equal(lifecycle.phase, 'negotiation')
  assert.equal(lifecycle.turn, 'initiator')
  assert.equal(lifecycle.isAwaitingProvider, false)
  assert.equal(lifecycle.isAwaitingConsumer, true)
  assert.equal(lifecycle.canInitiatorNegotiate, true)
  assert.equal(lifecycle.canResponderNegotiate, false)
})

test('getNegotiationLifecycle derives delivery-open semantics from accepted/completed status', () => {
  const acceptedLifecycle = getNegotiationLifecycle(makeNegotiation({ status: 'accepted' }))
  const completedLifecycle = getNegotiationLifecycle(makeNegotiation({ status: 'completed' }))

  assert.equal(acceptedLifecycle.normalizedStatus, 'accepted')
  assert.equal(acceptedLifecycle.phase, 'delivery')
  assert.equal(acceptedLifecycle.isDeliveryOpen, true)
  assert.equal(acceptedLifecycle.canProviderDeliver, true)
  assert.equal(acceptedLifecycle.canConsumerReply, false)

  assert.equal(completedLifecycle.normalizedStatus, 'accepted')
  assert.equal(completedLifecycle.phase, 'delivery')
  assert.equal(completedLifecycle.isDeliveryOpen, true)
})

test('getNegotiationLifecycle derives failed terminal semantics for rejected and cancelled', () => {
  const rejectedLifecycle = getNegotiationLifecycle(makeNegotiation({ status: 'rejected' }))
  const cancelledLifecycle = getNegotiationLifecycle(makeNegotiation({ status: 'cancelled' }))

  assert.equal(rejectedLifecycle.phase, 'closed_failed')
  assert.equal(rejectedLifecycle.isClosedFailed, true)
  assert.equal(rejectedLifecycle.isDeliveryOpen, false)
  assert.equal(rejectedLifecycle.canProviderDeliver, false)
  assert.equal(rejectedLifecycle.canConsumerReply, false)

  assert.equal(cancelledLifecycle.phase, 'closed_failed')
  assert.equal(cancelledLifecycle.isClosedFailed, true)
})

test('getNegotiationLifecycle derives delivery affordances from transcript turn-taking', () => {
  const lifecycle = getNegotiationLifecycle(
    makeNegotiation({
      status: 'accepted',
      transcript: [
        {
          kind: 'message',
          action: 'delivery_offer',
          by: 'did:provider:1',
          message: 'First offer',
          at: '2026-03-15T10:00:00.000Z',
        },
      ],
    })
  )

  assert.equal(lifecycle.providerMessageCount, 1)
  assert.equal(lifecycle.remainingProviderMessages, 2)
  assert.equal(lifecycle.canProviderDeliver, false)
  assert.equal(lifecycle.canConsumerReply, true)
  assert.deepEqual(lifecycle.messages, [
    {
      by: 'did:provider:1',
      message: 'First offer',
      at: '2026-03-15T10:00:00.000Z',
    },
  ])
})

test('applyDeliverySentTransition allows provider delivery in delivery-open state', () => {
  const result = applyDeliverySentTransition(makeNegotiation({ status: 'accepted' }))

  assert.equal(result.ok, true)
  if (!result.ok) {
    throw new Error('expected successful transition')
  }

  assert.equal(result.nextStatus, 'accepted')
  assert.equal(result.nextPhase, 'delivery')
  assert.equal(result.remainingProviderMessagesAfter, 2)
})

test('applyDeliverySentTransition blocks provider delivery when not in delivery phase', () => {
  const result = applyDeliverySentTransition(makeNegotiation({ status: 'awaiting_consumer' }))

  assert.equal(result.ok, false)
  if (result.ok) {
    throw new Error('expected blocked transition')
  }

  assert.equal(result.error.code, 'INVALID_STATUS')
})

test('applyDeliverySentTransition blocks provider delivery when it is not the provider turn', () => {
  const result = applyDeliverySentTransition(
    makeNegotiation({
      status: 'accepted',
      transcript: [
        {
          kind: 'message',
          action: 'delivery_offer',
          by: 'did:provider:1',
          message: 'Waiting for reply',
          at: '2026-03-15T10:00:00.000Z',
        },
      ],
    })
  )

  assert.equal(result.ok, false)
  if (result.ok) {
    throw new Error('expected blocked transition')
  }

  assert.equal(result.error.code, 'NEGOTIATION_TURN_INVALID')
})

test('applyDeliverySentTransition blocks provider delivery after max provider messages', () => {
  const result = applyDeliverySentTransition(
    makeNegotiation({
      status: 'accepted',
      transcript: [
        {
          kind: 'message',
          action: 'delivery_offer',
          by: 'did:provider:1',
          message: 'Offer 1',
          at: '2026-03-15T10:00:00.000Z',
        },
        {
          kind: 'message',
          action: 'delivery_reply',
          by: 'did:consumer:1',
          message: 'Reply 1',
          at: '2026-03-15T10:01:00.000Z',
        },
        {
          kind: 'message',
          action: 'delivery_offer',
          by: 'did:provider:1',
          message: 'Offer 2',
          at: '2026-03-15T10:02:00.000Z',
        },
        {
          kind: 'message',
          action: 'delivery_reply',
          by: 'did:consumer:1',
          message: 'Reply 2',
          at: '2026-03-15T10:03:00.000Z',
        },
        {
          kind: 'message',
          action: 'delivery_offer',
          by: 'did:provider:1',
          message: 'Offer 3',
          at: '2026-03-15T10:04:00.000Z',
        },
        {
          kind: 'message',
          action: 'delivery_reply',
          by: 'did:consumer:1',
          message: 'Reply 3',
          at: '2026-03-15T10:05:00.000Z',
        },
      ],
    })
  )

  assert.equal(result.ok, false)
  if (result.ok) {
    throw new Error('expected blocked transition')
  }

  assert.equal(result.error.code, 'MAX_OFFERS_REACHED')
})

test('applyConsumerDeliveryReplyTransition allows consumer reply after provider offer', () => {
  const result = applyConsumerDeliveryReplyTransition(
    makeNegotiation({
      status: 'accepted',
      transcript: [
        {
          kind: 'message',
          action: 'delivery_offer',
          by: 'did:provider:1',
          message: 'First offer',
          at: '2026-03-15T10:00:00.000Z',
        },
      ],
    })
  )

  assert.equal(result.ok, true)
  if (!result.ok) {
    throw new Error('expected successful transition')
  }

  assert.equal(result.nextStatus, 'accepted')
  assert.equal(result.nextPhase, 'delivery')
})

test('applyConsumerDeliveryReplyTransition blocks reply before provider message', () => {
  const result = applyConsumerDeliveryReplyTransition(makeNegotiation({ status: 'accepted' }))

  assert.equal(result.ok, false)
  if (result.ok) {
    throw new Error('expected blocked transition')
  }

  assert.equal(result.error.code, 'NEGOTIATION_TURN_INVALID')
})

test('applyConsumerDeliveryReplyTransition blocks reply after consumer already replied', () => {
  const result = applyConsumerDeliveryReplyTransition(
    makeNegotiation({
      status: 'accepted',
      transcript: [
        {
          kind: 'message',
          action: 'delivery_offer',
          by: 'did:provider:1',
          message: 'Offer',
          at: '2026-03-15T10:00:00.000Z',
        },
        {
          kind: 'message',
          action: 'delivery_reply',
          by: 'did:consumer:1',
          message: 'Reply',
          at: '2026-03-15T10:01:00.000Z',
        },
      ],
    })
  )

  assert.equal(result.ok, false)
  if (result.ok) {
    throw new Error('expected blocked transition')
  }

  assert.equal(result.error.code, 'NEGOTIATION_TURN_INVALID')
})
