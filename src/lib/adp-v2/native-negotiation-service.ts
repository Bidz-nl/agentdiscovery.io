import { randomUUID } from 'node:crypto'

import { getAgentRecordByDid } from '@/lib/adp-v2/agent-record-repository'
import type { HandshakeSessionGuardError } from '@/lib/adp-v2/require-handshake-session'
import { requireHandshakeSession } from '@/lib/adp-v2/require-handshake-session'
import {
  createNativeNegotiationRecord,
  getNativeNegotiationRecord,
  listNativeNegotiationRecords,
  type NativeNegotiationRecord,
  type NativeNegotiationTranscriptEntry,
  updateNativeNegotiationRecord,
} from '@/lib/adp-v2/native-negotiation-repository'
import { getNegotiationLifecycle } from '@/lib/adp-v2/negotiation-lifecycle'
import { validateNegotiateProvider } from '@/lib/adp-v2/negotiate-service'
import { validateNegotiateRequest } from '@/lib/adp-v2/negotiate-schema'
import type { NegotiatePayload } from '@/lib/adp-v2/negotiate-types'
import { findPublishedServiceByCapabilityId, toPublishedServiceCapabilityId } from '@/lib/service-match/service-identity'
import { listOwnerServiceRecords } from '@/lib/owner-service-repository'

function createNegotiationError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): HandshakeSessionGuardError {
  return {
    status,
    body: {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
  }
}

function getPublishedServiceForProvider(providerDid: string, category?: string) {
  return listOwnerServiceRecords()
    .filter((service) => !service.archivedAt)
    .filter((service) => service.ownerAgentDid === providerDid)
    .filter((service) => Boolean(service.publishedCapabilityKey && service.latestPublishedSnapshot))
    .find((service) => {
      if (!category) {
        return true
      }

      const serviceCategory = service.latestPublishedSnapshot?.category || service.category
      return serviceCategory.toLowerCase() === category.toLowerCase()
    }) ?? null
}

function toNegotiationCapabilityId(payload: Record<string, unknown>, providerDid: string, category?: string) {
  if (typeof payload.targetCapabilityId === 'number' && Number.isFinite(payload.targetCapabilityId)) {
    const targetService = findPublishedServiceByCapabilityId(payload.targetCapabilityId)
    if (targetService && targetService.ownerAgentDid === providerDid) {
      return payload.targetCapabilityId
    }
  }

  const fallbackService = getPublishedServiceForProvider(providerDid, category)
  return fallbackService ? toPublishedServiceCapabilityId(fallbackService.id) : null
}

function toPriceAndMessage(payload: Record<string, unknown>, intent: string) {
  const proposal = payload.proposal && typeof payload.proposal === 'object' && !Array.isArray(payload.proposal)
    ? (payload.proposal as Record<string, unknown>)
    : null

  const price = typeof proposal?.price === 'number'
    ? proposal.price
    : typeof payload.budget === 'number'
      ? payload.budget
      : 0

  const message = typeof proposal?.message === 'string' && proposal.message.trim().length > 0
    ? proposal.message.trim()
    : intent

  return {
    price,
    message,
  }
}

export function createNativeNegotiationFromNegotiatePayload(payload: Record<string, unknown>) {
  if (typeof payload.session_id !== 'string' || payload.session_id.trim().length === 0) {
    return {
      ok: false as const,
      error: createNegotiationError(400, 'MISSING_SESSION_ID', 'session_id is required'),
    }
  }

  const sessionCheck = requireHandshakeSession(payload.session_id)
  if (!sessionCheck.ok) {
    return sessionCheck
  }

  const validation = validateNegotiateRequest(payload)
  if (!validation.success) {
    return {
      ok: false as const,
      error: createNegotiationError(400, validation.error.code, validation.error.message),
    }
  }

  const providerValidation = validateNegotiateProvider(validation.data)
  if (!providerValidation.success) {
    return {
      ok: false as const,
      error: createNegotiationError(
        providerValidation.error.status,
        providerValidation.error.code,
        providerValidation.error.message,
        providerValidation.error.details
      ),
    }
  }

  const capabilityId = toNegotiationCapabilityId(payload, validation.data.provider_did, validation.data.service_category)
  if (!capabilityId) {
    return {
      ok: false as const,
      error: createNegotiationError(409, 'NEGOTIATE_CAPABILITY_NOT_FOUND', 'No published service is available for this provider'),
    }
  }

  const { price, message } = toPriceAndMessage(payload, validation.data.intent)
  const timestamp = new Date().toISOString()
  const negotiation = createNativeNegotiationRecord(
    {
      sessionId: sessionCheck.session.session_id,
      status: 'awaiting_provider',
      initiatorDid: sessionCheck.session.initiator_did,
      responderDid: providerValidation.provider.did,
      capabilityId,
      currentPrice: price,
      rounds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      transcript: [
        createTranscriptEntry({
          kind: 'round',
          action: 'propose',
          price,
          message,
          by: sessionCheck.session.initiator_did,
          at: timestamp,
        }),
      ],
    },
    {
      round: 1,
      actorDid: sessionCheck.session.initiator_did,
      action: 'propose',
      price,
      message,
      createdAt: timestamp,
    }
  )

  return {
    ok: true as const,
    session: sessionCheck.session,
    negotiate: validation.data,
    provider: providerValidation.provider,
    negotiation,
  }
}

export function createNativeNegotiationFromAppEngagePayload(payload: Record<string, unknown>) {
  const providerDid = typeof payload.agentDid === 'string' ? payload.agentDid.trim() : ''
  const serviceCategory = typeof payload.category === 'string' && payload.category.trim().length > 0
    ? payload.category.trim()
    : 'services'
  const intent = typeof payload.query === 'string' && payload.query.trim().length > 0
    ? payload.query.trim()
    : 'service request'

  return createNativeNegotiationFromNegotiatePayload({
    session_id: payload.session_id,
    provider_did: providerDid,
    service_category: serviceCategory,
    intent,
    budget:
      payload.proposal && typeof payload.proposal === 'object' && !Array.isArray(payload.proposal) && typeof (payload.proposal as Record<string, unknown>).price === 'number'
        ? (payload.proposal as Record<string, unknown>).price
        : undefined,
    constraints: {
      ...(typeof payload.postcode === 'string' && payload.postcode.trim().length > 0 ? { postcode: payload.postcode.trim() } : {}),
      ...(typeof payload.targetCapabilityId === 'number' && Number.isFinite(payload.targetCapabilityId)
        ? { targetCapabilityId: payload.targetCapabilityId }
        : {}),
    },
    proposal: payload.proposal,
    targetCapabilityId: payload.targetCapabilityId,
  })
}

export function getNativeNegotiationDetail(negotiationId: number) {
  return getNativeNegotiationRecord(negotiationId)
}

function toActionPrice(payload: Record<string, unknown>, currentPrice: number) {
  const proposal = payload.proposal && typeof payload.proposal === 'object' && !Array.isArray(payload.proposal)
    ? (payload.proposal as Record<string, unknown>)
    : null

  if (typeof proposal?.price === 'number' && Number.isFinite(proposal.price)) {
    return proposal.price
  }

  if (proposal?.price && typeof proposal.price === 'object' && !Array.isArray(proposal.price)) {
    const amount = (proposal.price as Record<string, unknown>).amount
    if (typeof amount === 'number' && Number.isFinite(amount)) {
      return amount
    }
  }

  return currentPrice
}

function toActionMessage(payload: Record<string, unknown>) {
  if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
    return payload.message.trim()
  }

  const proposal = payload.proposal && typeof payload.proposal === 'object' && !Array.isArray(payload.proposal)
    ? (payload.proposal as Record<string, unknown>)
    : null

  if (typeof proposal?.message === 'string' && proposal.message.trim().length > 0) {
    return proposal.message.trim()
  }

  return ''
}

function createTranscriptEntry(input: {
  kind: 'round' | 'message'
  action: string
  by: string
  message: string
  at: string
  price?: number
}): NativeNegotiationTranscriptEntry {
  return {
    id: `neg_txn_${randomUUID().replace(/-/g, '')}`,
    kind: input.kind,
    action: input.action,
    by: input.by,
    message: input.message,
    ...(typeof input.price === 'number' ? { price: input.price } : {}),
    at: input.at,
  }
}

export function applyNativeNegotiationAction(
  negotiationId: number,
  actorDid: string,
  action: 'accept' | 'reject' | 'counter',
  allowedActorRole: 'initiator' | 'responder',
  payload: Record<string, unknown>
) {
  const negotiation = getNativeNegotiationRecord(negotiationId)
  if (!negotiation) {
    return {
      ok: false as const,
      error: createNegotiationError(404, 'NEGOTIATION_NOT_FOUND', 'Negotiation not found'),
    }
  }

  const expectedActorDid = allowedActorRole === 'initiator' ? negotiation.initiatorDid : negotiation.responderDid
  if (actorDid !== expectedActorDid) {
    return {
      ok: false as const,
      error: createNegotiationError(403, 'NEGOTIATION_ACTION_FORBIDDEN', 'Caller is not allowed to perform this action'),
    }
  }

  const lifecycle = getNegotiationLifecycle(negotiation)

  if (allowedActorRole === 'initiator' && !lifecycle.canInitiatorNegotiate) {
    return {
      ok: false as const,
      error: createNegotiationError(409, 'NEGOTIATION_INITIATOR_TURN_INVALID', 'Initiator action is not allowed for the current negotiation status'),
    }
  }

  if (allowedActorRole === 'responder' && !lifecycle.canResponderNegotiate) {
    return {
      ok: false as const,
      error: createNegotiationError(409, 'NEGOTIATION_RESPONDER_TURN_INVALID', 'Responder action is not allowed for the current negotiation status'),
    }
  }

  const nextPrice = toActionPrice(payload, negotiation.currentPrice)
  const message = toActionMessage(payload)
  const updatedAt = new Date().toISOString()
  const nextStatus =
    action === 'accept'
      ? 'accepted'
      : action === 'reject'
        ? 'rejected'
        : allowedActorRole === 'initiator'
          ? 'awaiting_provider'
          : 'awaiting_consumer'

  const deliveryPayload =
    action === 'accept' && allowedActorRole === 'responder' && typeof payload.deliveryPayload === 'string' && payload.deliveryPayload.trim().length > 0
      ? payload.deliveryPayload.trim()
      : undefined

  const updated = updateNativeNegotiationRecord(
    negotiationId,
    (current) => ({
      ...current,
      status: nextStatus,
      currentPrice: nextPrice,
      updatedAt,
      transcript: [
        ...(current.transcript ?? []),
        createTranscriptEntry({
          kind: 'round',
          action,
          price: nextPrice,
          message,
          by: actorDid,
          at: updatedAt,
        }),
        ...(deliveryPayload !== undefined
          ? [
              createTranscriptEntry({
                kind: 'message',
                action: 'delivery_offer',
                message: deliveryPayload,
                by: actorDid,
                at: updatedAt,
              }),
            ]
          : []),
      ],
    }),
    {
      round: negotiation.rounds.length + 1,
      actorDid,
      action,
      price: nextPrice,
      message,
      createdAt: updatedAt,
    }
  )

  if (!updated) {
    return {
      ok: false as const,
      error: createNegotiationError(404, 'NEGOTIATION_NOT_FOUND', 'Negotiation not found'),
    }
  }

  return {
    ok: true as const,
    negotiation: updated,
  }
}

export function getNativeProviderInboxReadModel(providerDid: string) {
  const inboxItems = listNativeNegotiationRecords()
    .filter((negotiation) => negotiation.responderDid === providerDid)
    .map((negotiation) => {
      const service = findPublishedServiceByCapabilityId(negotiation.capabilityId)
      const initiator = getAgentRecordByDid(negotiation.initiatorDid)
      const lifecycle = getNegotiationLifecycle(negotiation)

      return {
        negotiation,
        lifecycle,
        capability: {
          id: negotiation.capabilityId,
          title: service?.title ?? '',
          category: service?.latestPublishedSnapshot?.category ?? service?.category ?? '',
        },
        initiator: {
          did: negotiation.initiatorDid,
          name: initiator?.name ?? negotiation.initiatorDid,
          reputationScore: '0',
        },
      }
    })

  return {
    inbox: inboxItems.filter((item) => item.lifecycle.canResponderNegotiate),
    stats: {
      pending: inboxItems.filter((item) => item.lifecycle.canResponderNegotiate).length,
      active: inboxItems.filter((item) => item.lifecycle.isAwaitingConsumer || item.lifecycle.isDeliveryOpen).length,
      completed: inboxItems.filter((item) => item.lifecycle.isClosed).length,
    },
  }
}

export function getNegotiationResponderDid(negotiationId: number) {
  return getNativeNegotiationRecord(negotiationId)?.responderDid ?? null
}

export function getNegotiationInitiatorDid(negotiationId: number) {
  return getNativeNegotiationRecord(negotiationId)?.initiatorDid ?? null
}

export function validateNativeNegotiationProvider(negotiate: NegotiatePayload) {
  return validateNegotiateProvider(negotiate)
}
