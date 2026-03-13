import { NextRequest, NextResponse } from 'next/server'

import { getDashboardAggregate, getDashboardSummary } from '@/lib/adp-v2/dashboard-read-model'

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)

  if (url.searchParams.get('summary') === 'true') {
    return NextResponse.json(getDashboardSummary())
  }

  const limit = parsePositiveInt(url.searchParams.get('limit'), 20)
  const offset = parsePositiveInt(url.searchParams.get('offset'), 0)

  return NextResponse.json(getDashboardAggregate(limit, offset))
}
