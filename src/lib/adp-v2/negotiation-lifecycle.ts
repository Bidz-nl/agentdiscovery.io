export type NegotiationLifecycleStatus =
  | 'awaiting_provider'
  | 'awaiting_consumer'
  | 'accepted'
  | 'rejected'
  | 'cancelled'

export type NegotiationLifecyclePhase =
  | 'negotiation'
  | 'delivery'
  | 'closed_failed'

export type NegotiationLifecycleTurn = 'initiator' | 'responder' | 'none'

export type NegotiationLifecycleTranscriptEntry = {
  kind: 'round' | 'message'
  action: string
  by: string
  message: string
  at: string
  price?: number
}

export type NegotiationLifecycleShape = {
  status: string
  initiatorDid: string
  responderDid: string
  transcript?: NegotiationLifecycleTranscriptEntry[]
  deliveryMessages?: Array<{
    by: string
    message: string
    at: string
  }>
}

export type NegotiationLifecyclePresentation = {
  label: string
  tone: 'info' | 'success' | 'danger'
}

export type NegotiationDeliveryTransitionError = {
  status: number
  code: string
  message: string
}

type NegotiationLifecycleComputed = ReturnType<typeof getNegotiationLifecycle>

type NegotiationLifecyclePresentationInput =
  | NegotiationLifecycleShape
  | {
      normalizedStatus: NegotiationLifecycleStatus
      isAwaitingProvider: boolean
      isAwaitingConsumer: boolean
      isDeliveryOpen: boolean
      isClosedFailed: boolean
    }

type NegotiationDeliveryTransitionResult =
  | {
      ok: true
      nextStatus: NegotiationLifecycleStatus
      nextPhase: NegotiationLifecyclePhase
      remainingProviderMessagesAfter?: number
    }
  | {
      ok: false
      error: NegotiationDeliveryTransitionError
    }

export function normalizeNegotiationStatus(status: string): NegotiationLifecycleStatus {
  if (status === 'awaiting_provider' || status === 'awaiting_consumer' || status === 'accepted' || status === 'rejected' || status === 'cancelled') {
    return status
  }

  if (status === 'initiated' || status === 'counter_proposed') {
    return 'awaiting_provider'
  }

  if (status === 'proposal_sent') {
    return 'awaiting_consumer'
  }

  if (status === 'completed') {
    return 'accepted'
  }

  if (status === 'rejected') {
    return 'rejected'
  }

  return 'cancelled'
}

export function getNegotiationMessages(negotiation: NegotiationLifecycleShape) {
  return (negotiation.transcript ?? [])
    .filter((entry) => entry.kind === 'message')
    .map((entry) => ({ by: entry.by, message: entry.message, at: entry.at }))
}

function toLifecyclePresentation(lifecycle: {
  normalizedStatus: NegotiationLifecycleStatus
  isAwaitingProvider: boolean
  isAwaitingConsumer: boolean
  isDeliveryOpen: boolean
  isClosedFailed: boolean
}): NegotiationLifecyclePresentation {
  if (lifecycle.isAwaitingProvider) {
    return {
      label: 'Waiting for provider',
      tone: 'info',
    }
  }

  if (lifecycle.isAwaitingConsumer) {
    return {
      label: 'Waiting for consumer',
      tone: 'info',
    }
  }

  if (lifecycle.isDeliveryOpen) {
    return {
      label: 'Delivery in progress',
      tone: 'success',
    }
  }

  return {
    label: lifecycle.normalizedStatus === 'rejected' ? 'Rejected' : 'Cancelled',
    tone: 'danger',
  }
}

export function getNegotiationLifecyclePresentation(input: NegotiationLifecyclePresentationInput): NegotiationLifecyclePresentation {
  const lifecycle = 'normalizedStatus' in input ? input : getNegotiationLifecycle(input)
  return toLifecyclePresentation(lifecycle)
}

function resolveDeliveryTransition(
  negotiation: NegotiationLifecycleShape,
  kind: 'provider_delivery' | 'consumer_reply'
): NegotiationDeliveryTransitionResult {
  const lifecycle = getNegotiationLifecycle(negotiation)

  if (!lifecycle.isDeliveryOpen) {
    return {
      ok: false,
      error: {
        status: 409,
        code: 'INVALID_STATUS',
        message:
          kind === 'provider_delivery'
            ? 'Delivery can only be sent after the negotiation is accepted'
            : 'Can only reply after the negotiation is accepted',
      },
    }
  }

  if (kind === 'provider_delivery' && !lifecycle.canProviderDeliver) {
    return {
      ok: false,
      error: {
        status: 409,
        code: lifecycle.remainingProviderMessages === 0 ? 'MAX_OFFERS_REACHED' : 'NEGOTIATION_TURN_INVALID',
        message:
          lifecycle.remainingProviderMessages === 0
            ? 'Provider can send at most 3 offers'
            : 'Provider can only send the next delivery message after a consumer reply',
      },
    }
  }

  if (kind === 'consumer_reply' && !lifecycle.canConsumerReply) {
    return {
      ok: false,
      error: {
        status: 409,
        code: 'NEGOTIATION_TURN_INVALID',
        message: 'Consumer can only reply after a provider message',
      },
    }
  }

  return {
    ok: true,
    nextStatus: lifecycle.normalizedStatus,
    nextPhase: lifecycle.phase,
    remainingProviderMessagesAfter:
      kind === 'provider_delivery' ? Math.max(0, lifecycle.remainingProviderMessages - 1) : undefined,
  }
}

export function applyDeliverySentTransition(negotiation: NegotiationLifecycleShape): NegotiationDeliveryTransitionResult {
  return resolveDeliveryTransition(negotiation, 'provider_delivery')
}

export function applyConsumerDeliveryReplyTransition(negotiation: NegotiationLifecycleShape): NegotiationDeliveryTransitionResult {
  return resolveDeliveryTransition(negotiation, 'consumer_reply')
}

export function getNegotiationLifecycle(negotiation: NegotiationLifecycleShape) {
  const normalizedStatus = normalizeNegotiationStatus(negotiation.status)
  const messages = getNegotiationMessages(negotiation)
  const providerMessageCount = messages.filter((message) => message.by === negotiation.responderDid).length
  const lastMessage = messages[messages.length - 1] ?? null

  const phase: NegotiationLifecyclePhase =
    normalizedStatus === 'accepted'
      ? 'delivery'
      : normalizedStatus === 'rejected' || normalizedStatus === 'cancelled'
        ? 'closed_failed'
        : 'negotiation'

  const turn: NegotiationLifecycleTurn =
    normalizedStatus === 'awaiting_provider'
      ? 'responder'
      : normalizedStatus === 'awaiting_consumer'
        ? 'initiator'
        : 'none'

  const isAwaitingProvider = normalizedStatus === 'awaiting_provider'
  const isAwaitingConsumer = normalizedStatus === 'awaiting_consumer'
  const isDeliveryOpen = normalizedStatus === 'accepted'
  const isClosedFailed = normalizedStatus === 'rejected' || normalizedStatus === 'cancelled'
  const isClosedSuccess = false
  const isClosed = isClosedFailed || isClosedSuccess

  return {
    normalizedStatus,
    phase,
    turn,
    messages,
    lastMessage,
    providerMessageCount,
    remainingProviderMessages: Math.max(0, 3 - providerMessageCount),
    isAwaitingProvider,
    isAwaitingConsumer,
    isDeliveryOpen,
    isClosed,
    isClosedFailed,
    isClosedSuccess,
    canInitiatorNegotiate: isAwaitingConsumer,
    canResponderNegotiate: isAwaitingProvider,
    canProviderDeliver: isDeliveryOpen && providerMessageCount < 3 && (!lastMessage || lastMessage.by === negotiation.initiatorDid),
    canConsumerReply: isDeliveryOpen && messages.length > 0 && lastMessage?.by === negotiation.responderDid,
    consumerLabel:
      normalizedStatus === 'awaiting_provider'
        ? 'Waiting for provider'
        : normalizedStatus === 'awaiting_consumer'
          ? 'Waiting for your decision'
          : normalizedStatus === 'accepted'
            ? 'Delivery in progress'
            : normalizedStatus === 'rejected'
              ? 'Rejected'
              : 'Cancelled',
    providerLabel:
      normalizedStatus === 'awaiting_provider'
        ? 'Action required'
        : normalizedStatus === 'awaiting_consumer'
          ? 'Waiting for consumer'
          : normalizedStatus === 'accepted'
            ? 'Delivery in progress'
            : normalizedStatus === 'rejected'
              ? 'Rejected'
              : 'Cancelled',
  }
}
