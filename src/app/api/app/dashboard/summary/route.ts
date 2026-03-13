import { NextResponse } from 'next/server'

import { getDashboardSummary } from '@/lib/adp-v2/dashboard-read-model'

export async function GET() {
  return NextResponse.json(getDashboardSummary())
}
