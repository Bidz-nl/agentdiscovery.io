import { randomUUID } from 'node:crypto'

import {
  createLocalFoodOrderRecord,
  findLocalFoodOrderRecordById,
  listLocalFoodOrderRecordsByProviderDid,
  updateLocalFoodOrderRecord,
} from '@/lib/db/repositories/local-food-order-db-repository'
import type {
  LocalFoodOrderPaymentStatus,
  LocalFoodOrderStatus,
  LocalFoodOrderRecord,
  LocalFoodOrderStatusTimeline,
  LocalFoodProviderOrderSummary,
  LocalFoodPublicOrderDraft,
} from '@/lib/local-food/local-food-types'

function createOrderReference() {
  const referenceSuffix = Date.now().toString().slice(-6)
  return `BZ-${referenceSuffix}`
}

function createInitialStatusTimeline(timestamp: string): LocalFoodOrderStatusTimeline {
  return {
    receivedAt: timestamp,
    preparingAt: null,
    readyForPickupAt: null,
    outForDeliveryAt: null,
    completedAt: null,
    cancelledAt: null,
  }
}

function getTimelineKey(status: LocalFoodOrderStatus): keyof LocalFoodOrderStatusTimeline {
  switch (status) {
    case 'received':
      return 'receivedAt'
    case 'preparing':
      return 'preparingAt'
    case 'ready_for_pickup':
      return 'readyForPickupAt'
    case 'out_for_delivery':
      return 'outForDeliveryAt'
    case 'completed':
      return 'completedAt'
    case 'cancelled':
      return 'cancelledAt'
  }
}

export async function createConfirmedLocalFoodOrderFromDraft(draft: LocalFoodPublicOrderDraft) {
  const timestamp = new Date().toISOString()

  const orderRecord: LocalFoodOrderRecord = {
    ...draft,
    id: randomUUID(),
    orderReference: createOrderReference(),
    status: 'received',
    paymentStatus: 'not_started',
    source: 'public_web',
    createdAt: timestamp,
    updatedAt: timestamp,
    confirmedAt: timestamp,
    statusTimeline: createInitialStatusTimeline(timestamp),
  }

  return createLocalFoodOrderRecord(orderRecord)
}

export async function getLocalFoodOrderRecordById(orderId: string) {
  return findLocalFoodOrderRecordById(orderId)
}

export async function listProviderLocalFoodOrderSummaries(providerDid: string): Promise<LocalFoodProviderOrderSummary[]> {
  const records = await listLocalFoodOrderRecordsByProviderDid(providerDid)

  return records.map((record) => ({
    id: record.id,
    orderReference: record.orderReference,
    providerDid: record.providerDid,
    restaurantName: record.restaurantName,
    fulfilmentMode: record.fulfilmentMode,
    status: record.status,
    paymentStatus: record.paymentStatus,
    itemCount: record.itemCount,
    subtotalCents: record.subtotalCents,
    customerName: record.customer.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    confirmedAt: record.confirmedAt,
    statusTimeline: record.statusTimeline,
  }))
}

export async function updateLocalFoodOrderStatus(orderId: string, status: LocalFoodOrderStatus) {
  return updateLocalFoodOrderRecord(orderId, (order) => {
    const timestamp = new Date().toISOString()
    const timeline: LocalFoodOrderStatusTimeline = {
      receivedAt: order.statusTimeline?.receivedAt ?? order.createdAt,
      preparingAt: order.statusTimeline?.preparingAt ?? null,
      readyForPickupAt: order.statusTimeline?.readyForPickupAt ?? null,
      outForDeliveryAt: order.statusTimeline?.outForDeliveryAt ?? null,
      completedAt: order.statusTimeline?.completedAt ?? null,
      cancelledAt: order.statusTimeline?.cancelledAt ?? null,
    }

    const timelineKey = getTimelineKey(status)
    timeline[timelineKey] = timeline[timelineKey] ?? timestamp

    return {
      ...order,
      status,
      updatedAt: timestamp,
      statusTimeline: timeline,
    }
  })
}

export async function updateLocalFoodOrderPaymentStatus(orderId: string, paymentStatus: LocalFoodOrderPaymentStatus) {
  return updateLocalFoodOrderRecord(orderId, (order) => ({
    ...order,
    paymentStatus,
    updatedAt: new Date().toISOString(),
  }))
}
