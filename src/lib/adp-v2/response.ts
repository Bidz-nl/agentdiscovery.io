import { NextResponse } from 'next/server'

export interface AdpV2ErrorShape {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export function createAdpV2Error(
  code: string,
  message: string,
  details?: unknown
): AdpV2ErrorShape {
  return {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  }
}

export function jsonAdpV2Error(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return NextResponse.json(createAdpV2Error(code, message, details), { status })
}

export function jsonAdpV2Success<T>(body: T, status?: number) {
  return NextResponse.json(body, status !== undefined ? { status } : undefined)
}
