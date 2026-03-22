import assert from 'node:assert/strict'
import test from 'node:test'

const { registerNativeAgent } = await import('../src/lib/adp-v2/agent-registration-service.ts')
const { postcodeMatchesPrefixes } = await import('../src/lib/local-food/local-food-postcode.ts')
const { parseLocalFoodMenuCsv } = await import('../src/lib/local-food/local-food-menu-import.ts')
const { listLocalFoodMenuItemsByProvider } = await import('../src/lib/local-food/local-food-menu-repository.ts')
const {
  createLocalFoodManualMenuItem,
  createLocalFoodOrder,
  getProviderLaunchChecklist,
  listIncomingLocalFoodOrders,
  listLocalFoodDiscoverableProviders,
  seedLocalFoodDemoForProvider,
  updateLocalFoodProviderByDid,
} = await import('../src/lib/local-food/local-food-service.ts')

test('postcode service-area matching uses normalized prefixes', () => {
  assert.equal(postcodeMatchesPrefixes('1012 AB', ['1012', '1055']), true)
  assert.equal(postcodeMatchesPrefixes('1055ZX', ['1012', '1055']), true)
  assert.equal(postcodeMatchesPrefixes('3011 AA', ['1012', '1055']), false)
})

test('menu CSV parsing and manual menu creation support a narrow structured catalog', async () => {
  const parsed = parseLocalFoodMenuCsv([
    'name,category,description,price,available,tags',
    'Margherita,pizza,Tomato mozzarella basil,11.50,true,classics|vegetarian',
    'Cola,drinks,330ml can,2.75,true,soft-drink',
  ].join('\n'))

  assert.equal(parsed.length, 2)
  assert.deepEqual(parsed[0], {
    category: 'pizza',
    name: 'Margherita',
    description: 'Tomato mozzarella basil',
    priceCents: 1150,
    available: true,
    tags: ['classics', 'vegetarian'],
  })

  const { agent } = await registerNativeAgent({
    name: 'Manual Menu Bot',
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: 'Local pizza supplier',
  })

  await createLocalFoodManualMenuItem(agent.did, {
    category: 'pizza',
    name: 'Pepperoni',
    description: 'Classic pepperoni pizza',
    priceCents: 1295,
    available: true,
    tags: ['classics'],
  })

  const items = await listLocalFoodMenuItemsByProvider(agent.did)
  assert.equal(items.length, 1)
  assert.equal(items[0]?.name, 'Pepperoni')
  assert.equal(items[0]?.priceCents, 1295)
})

test('direct order creation makes the order visible to the supplier', async () => {
  const { agent } = await registerNativeAgent({
    name: 'Pizza Partner Bot',
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: 'Direct pizza ordering partner',
  })

  const menuItem = await createLocalFoodManualMenuItem(agent.did, {
    category: 'pizza',
    name: 'Quattro Formaggi',
    description: 'Four cheese pizza',
    priceCents: 1450,
    available: true,
    tags: ['vegetarian'],
  })

  await updateLocalFoodProviderByDid(agent.did, {
    status: 'active',
    businessName: 'Demo Pizza West',
    summary: 'Local pizza delivery demo',
    locationLabel: 'Amsterdam West',
    fulfilmentModes: ['delivery', 'pickup'],
    serviceArea: {
      postcodePrefixes: ['1055', '1056'],
      coverageLabel: 'Amsterdam West',
      deliveryNotes: 'Fast demo delivery window',
    },
  })

  const discoverableProviders = await listLocalFoodDiscoverableProviders('1055AB')
  assert.equal(discoverableProviders.length, 1)
  assert.equal(discoverableProviders[0]?.businessName, 'Demo Pizza West')

  const order = await createLocalFoodOrder({
    providerDid: agent.did,
    customerDid: 'did:adp:test-customer',
    customerName: 'Ron Demo',
    customerPhone: '+31600000000',
    customerPostcode: '1055 AB',
    customerAddressLine: 'Demo Street 12',
    customerNotes: 'Ring the bell once',
    fulfilmentMode: 'delivery',
    items: [{ menuItemId: menuItem.id, quantity: 2 }],
  })

  assert.equal(order.status, 'submitted')
  assert.equal(order.totalCents, 2900)
  assert.equal(order.payment.status, 'pending')

  const incomingOrders = await listIncomingLocalFoodOrders(agent.did)
  assert.equal(incomingOrders.length, 1)
  assert.equal(incomingOrders[0]?.customerName, 'Ron Demo')
  assert.equal(incomingOrders[0]?.items[0]?.quantity, 2)
})

test('provider cannot go live before business basics, coverage, and menu are ready', async () => {
  const { agent } = await registerNativeAgent({
    name: 'Not Ready Pizza Bot',
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: 'Provider waiting for setup',
  })

  await assert.rejects(
    () =>
      updateLocalFoodProviderByDid(agent.did, {
        status: 'active',
        businessName: 'Not Ready Pizza',
        locationLabel: 'Amsterdam West',
        serviceArea: {
          postcodePrefixes: ['1055'],
          coverageLabel: 'Amsterdam West',
        },
      }),
    /To go live, add supplier basics, postcode coverage, and at least one available menu item\./
  )

  const checklist = await getProviderLaunchChecklist(agent.did)
  assert.equal(checklist.canGoLive, false)
  assert.equal(checklist.hasMenu, false)
})

test('demo bootstrap seeds a discoverable supplier with menu items', async () => {
  const { agent } = await registerNativeAgent({
    name: 'Bootstrap Pizza Bot',
    role: 'provider',
    supported_protocol_versions: ['2.0'],
    description: 'Bootstrap provider',
  })

  const provider = await seedLocalFoodDemoForProvider(agent.did)
  const checklist = await getProviderLaunchChecklist(agent.did)
  const menuItems = await listLocalFoodMenuItemsByProvider(agent.did)
  const discoverableProviders = await listLocalFoodDiscoverableProviders('1055 AB')

  assert.ok(provider)
  assert.equal(provider.status, 'active')
  assert.equal(checklist.canGoLive, true)
  assert.equal(menuItems.length >= 4, true)
  assert.equal(discoverableProviders.some((entry) => entry.providerDid === agent.did), true)
})
