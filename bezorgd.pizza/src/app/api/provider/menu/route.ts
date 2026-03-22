import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    scope: 'provider',
    resource: 'menu',
    status: 'scaffold',
  })
}

export async function POST() {
  return NextResponse.json({
    ok: true,
    scope: 'provider',
    resource: 'menu',
    status: 'scaffold',
  })
}
