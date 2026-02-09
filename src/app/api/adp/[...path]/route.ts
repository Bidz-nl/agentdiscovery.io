import { NextRequest, NextResponse } from 'next/server'

const ADP_BACKEND = 'https://www.bidz.nl/api/adp/v1'

async function proxyRequest(request: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params
  const targetPath = path.join('/')
  const url = new URL(request.url)
  const queryString = url.search

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const authHeader = request.headers.get('Authorization')
  if (authHeader) {
    headers['Authorization'] = authHeader
  }

  const apiKeyHeader = request.headers.get('x-api-key')
  if (apiKeyHeader) {
    headers['x-api-key'] = apiKeyHeader
  }

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text()
      if (body) fetchOptions.body = body
    }

    const response = await fetch(`${ADP_BACKEND}/${targetPath}${queryString}`, fetchOptions)
    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[ADP Proxy] Error:', error)
    return NextResponse.json(
      { error: { code: 'PROXY_ERROR', message: 'Failed to reach ADP backend' } },
      { status: 502 }
    )
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    },
  })
}
