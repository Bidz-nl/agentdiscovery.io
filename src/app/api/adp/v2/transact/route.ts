import { NextRequest, NextResponse } from 'next/server'

import {
  requireHandshakeSession,
  toHandshakeSessionErrorResponse,
} from '@/lib/adp-v2/require-handshake-session'
import { jsonAdpV2Error, jsonAdpV2Success } from '@/lib/adp-v2/response'
import { validateTransactRequest } from '@/lib/adp-v2/transact-schema'
import { createTransaction, listTransactions } from '@/lib/adp-v2/transact-service'
import type { TransactionStatus, TransactSuccessResponse } from '@/lib/adp-v2/transact-types'

const VALID_TRANSACTION_STATUSES: TransactionStatus[] = ['pending', 'accepted', 'rejected', 'completed']

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('session_id')?.trim()
  const providerDid = searchParams.get('provider_did')?.trim()
  const status = searchParams.get('status')?.trim()

  if (status && !VALID_TRANSACTION_STATUSES.includes(status as TransactionStatus)) {
    return jsonAdpV2Error(
      400,
      'TRANSACTION_INVALID_STATUS',
      'status must be one of: pending, accepted, rejected, completed'
    )
  }

  const transactions = listTransactions({
    ...(sessionId ? { session_id: sessionId } : {}),
    ...(providerDid ? { provider_did: providerDid } : {}),
    ...(status ? { status: status as TransactionStatus } : {}),
  })

  return jsonAdpV2Success({
    ok: true,
    transactions,
  })
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonAdpV2Error(400, 'INVALID_JSON', 'Request body must be valid JSON')
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonAdpV2Error(400, 'INVALID_TRANSACT_REQUEST', 'Transact request body must be a JSON object')
  }

  const payload = body as Record<string, unknown>

  if (typeof payload.session_id !== 'string' || payload.session_id.trim().length === 0) {
    return jsonAdpV2Error(400, 'MISSING_SESSION_ID', 'session_id is required and must be a non-empty string')
  }

  const sessionCheck = requireHandshakeSession(payload.session_id)

  if (!sessionCheck.ok) {
    return toHandshakeSessionErrorResponse(NextResponse, sessionCheck.error)
  }

  const transactValidation = validateTransactRequest(payload)

  if (!transactValidation.success) {
    return jsonAdpV2Error(400, transactValidation.error.code, transactValidation.error.message)
  }

  const transactionResult = createTransaction(sessionCheck.session.session_id, transactValidation.data)

  if (!transactionResult.success) {
    return jsonAdpV2Error(
      transactionResult.error.status,
      transactionResult.error.code,
      transactionResult.error.message,
      transactionResult.error.details
    )
  }

  const response: TransactSuccessResponse = {
    ok: true,
    message: 'ADP v2 transaction created',
    transaction: transactionResult.transaction,
  }

  return jsonAdpV2Success(response)
}
