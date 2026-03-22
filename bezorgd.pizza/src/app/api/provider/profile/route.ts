import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    scope: 'provider',
    resource: 'profile',
    status: 'scaffold',
  })
}

export async function PATCH() {
  return NextResponse.json({
    ok: true,
    scope: 'provider',
    resource: 'profile',
    status: 'scaffold',
  })
}
