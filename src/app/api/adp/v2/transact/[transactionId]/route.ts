import { NextRequest } from 'next/server'

import { jsonAdpV2Error, jsonAdpV2Success } from '@/lib/adp-v2/response'
import { getTransaction, updateTransactionStatus } from '@/lib/adp-v2/transact-service'
import type { TransactionStatus, TransactionStatusUpdateRequest } from '@/lib/adp-v2/transact-types'

const VALID_TRANSACTION_STATUSES: TransactionStatus[] = ['pending', 'accepted', 'rejected', 'completed']

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ transactionId: string }> }
) {
  const { transactionId } = await context.params
  const transaction = getTransaction(transactionId)

  if (!transaction) {
    return jsonAdpV2Error(404, 'TRANSACTION_NOT_FOUND', 'ADP v2 transaction not found', {
      transaction_id: transactionId,
    })
  }

  return jsonAdpV2Success({
    ok: true,
    transaction,
  })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ transactionId: string }> }
) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonAdpV2Error(400, 'INVALID_JSON', 'Request body must be valid JSON')
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonAdpV2Error(
      400,
      'INVALID_TRANSACTION_STATUS_UPDATE',
      'Transaction status update body must be a JSON object'
    )
  }

  const payload = body as Record<string, unknown>

  if (
    typeof payload.status !== 'string' ||
    !VALID_TRANSACTION_STATUSES.includes(payload.status as TransactionStatus)
  ) {
    return jsonAdpV2Error(
      400,
      'TRANSACTION_INVALID_STATUS',
      'status must be one of: pending, accepted, rejected, completed'
    )
  }

  const { transactionId } = await context.params
  const updateRequest: TransactionStatusUpdateRequest = {
    status: payload.status as TransactionStatus,
  }

  const result = updateTransactionStatus(transactionId, updateRequest.status)

  if (!result.success) {
    return jsonAdpV2Error(
      result.error.status,
      result.error.code,
      result.error.message,
      result.error.details
    )
  }

  return jsonAdpV2Success({
    ok: true,
    transaction: result.transaction,
  })
}
