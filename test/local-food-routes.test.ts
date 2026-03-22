import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { NextRequest } from 'next/server'

const tempDataRoot = mkdtempSync(path.join(os.tmpdir(), 'local-food-route-tests-'))

process.env.ADP_DATA_ROOT = tempDataRoot

const providerRoute = await import('../src/app/api/app/local-food/provider/route.ts')
const menuRoute = await import('../src/app/api/app/local-food/menu/route.ts')
const demoBootstrapRoute = await import('../src/app/api/app/local-food/demo-bootstrap/route.ts')
const ordersRoute = await import('../src/app/api/app/local-food/orders/route.ts')
const orderStatusRoute = await import('../src/app/api/app/local-food/orders/[orderId]/route.ts')
const submitOrderRoute = await import('../src/app/api/app/local-food/orders/submit/route.ts')
const { registerNativeAgent } = await import('../src/lib/adp-v2/agent-registration-service.ts')

function resetStores() {
  rmSync(tempDataRoot, { recursive: true, force: true })
  mkdirSync(tempDataRoot, { recursive: true })
}

test.beforeEach(() => {
  resetStores()
})

test('owner-private local food routes enforce owner auth', async () => {
  const providerGet = await providerRoute.GET(new NextRequest('http://localhost/api/app/local-food/provider'))
  const menuPost = await menuRoute.POST(
    new NextRequest('http://localhost/api/app/local-food/menu', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ item: { name: 'Blocked Pizza', priceCents: 1000 } }),
    })
  )
  const ordersGet = await ordersRoute.GET(new NextRequest('http://localhost/api/app/local-food/orders'))

  assert.equal(providerGet.status, 401)
  assert.equal(menuPost.status, 401)
  assert.equal(ordersGet.status, 401)

  const providerBody = await providerGet.json()
  const menuBody = await menuPost.json()
  const ordersBody = await ordersGet.json()

  assert.equal(providerBody.error.code, 'OWNER_AUTH_REQUIRED')
  assert.equal(menuBody.error.code, 'OWNER_AUTH_REQUIRED')
  assert.equal(ordersBody.error.code, 'OWNER_AUTH_REQUIRED')
})

test('supplier can receive and progress incoming local food orders through owner-private routes', async () => {
  const registration = registerNativeAgent({
    name: 'Route Pizza Bot',
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: 'Pizza route provider',
  })

  const authHeaders = {
    authorization: `Bearer ${registration.apiKey}`,
    'content-type': 'application/json',
  }

  const providerPatch = await providerRoute.PATCH(
    new NextRequest('http://localhost/api/app/local-food/provider', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'draft',
        businessName: 'Route Pizza West',
        summary: 'Pizza route demo supplier',
        locationLabel: 'Amsterdam West',
        fulfilmentModes: ['delivery'],
        serviceArea: {
          postcodePrefixes: ['1055'],
          coverageLabel: 'Amsterdam West',
          deliveryNotes: 'Demo route coverage',
        },
      }),
    })
  )

  assert.equal(providerPatch.status, 200)

  const menuPost = await menuRoute.POST(
    new NextRequest('http://localhost/api/app/local-food/menu', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        item: {
          name: 'Marinara',
          category: 'pizza',
          description: 'Tomato garlic oregano',
          priceCents: 950,
          available: true,
          tags: ['classic'],
        },
      }),
    })
  )

  assert.equal(menuPost.status, 200)
  const menuBody = await menuPost.json()
  const menuItemId = menuBody.menuItem.id as string

  const activatePatch = await providerRoute.PATCH(
    new NextRequest('http://localhost/api/app/local-food/provider', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'active',
      }),
    })
  )

  assert.equal(activatePatch.status, 200)

  const submitResponse = await submitOrderRoute.POST(
    new NextRequest('http://localhost/api/app/local-food/orders/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        providerDid: registration.agent.did,
        customerDid: 'did:adp:customer-route-test',
        customerName: 'Pizza Customer',
        customerPhone: '+31611111111',
        customerPostcode: '1055 AB',
        customerAddressLine: 'Customer Street 5',
        fulfilmentMode: 'delivery',
        items: [{ menuItemId, quantity: 1 }],
      }),
    })
  )

  assert.equal(submitResponse.status, 201)
  const submitBody = await submitResponse.json()
  const orderId = submitBody.order.id as string

  const ordersGet = await ordersRoute.GET(
    new NextRequest('http://localhost/api/app/local-food/orders', {
      headers: { authorization: `Bearer ${registration.apiKey}` },
    })
  )

  assert.equal(ordersGet.status, 200)
  const ordersBody = await ordersGet.json()
  assert.equal(ordersBody.orders.length, 1)
  assert.equal(ordersBody.orders[0].customerName, 'Pizza Customer')
  assert.equal(ordersBody.orders[0].status, 'submitted')

  const statusPatch = await orderStatusRoute.PATCH(
    new NextRequest(`http://localhost/api/app/local-food/orders/${orderId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'confirmed' }),
    }),
    { params: Promise.resolve({ orderId }) }
  )

  assert.equal(statusPatch.status, 200)
  const statusBody = await statusPatch.json()
  assert.equal(statusBody.order.status, 'confirmed')
})

test('demo bootstrap route seeds a live supplier menu for owner-private sessions', async () => {
  const registration = registerNativeAgent({
    name: 'Bootstrap Route Pizza Bot',
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: 'Pizza demo bootstrap provider',
  })

  const bootstrapResponse = await demoBootstrapRoute.POST(
    new NextRequest('http://localhost/api/app/local-food/demo-bootstrap', {
      method: 'POST',
      headers: { authorization: `Bearer ${registration.apiKey}` },
    })
  )

  assert.equal(bootstrapResponse.status, 201)
  const bootstrapBody = await bootstrapResponse.json()
  assert.equal(bootstrapBody.provider.status, 'active')

  const providerGet = await providerRoute.GET(
    new NextRequest('http://localhost/api/app/local-food/provider', {
      headers: { authorization: `Bearer ${registration.apiKey}` },
    })
  )

  assert.equal(providerGet.status, 200)
  const providerBody = await providerGet.json()
  assert.equal(providerBody.launchChecklist.canGoLive, true)
  assert.equal(providerBody.menuItems.length >= 4, true)
})
