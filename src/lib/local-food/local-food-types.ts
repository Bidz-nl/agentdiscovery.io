export type LocalFoodVertical = 'pizza'

export type LocalFoodProviderStatus = 'draft' | 'active' | 'paused'

export type LocalFoodFulfilmentMode = 'delivery' | 'pickup'

export type LocalFoodMenuCategory = 'pizza' | 'sides' | 'drinks' | 'desserts'

export type LocalFoodOrderStatus =
  | 'submitted'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export interface LocalFoodServiceArea {
  postcodePrefixes: string[]
  coverageLabel: string
  deliveryNotes: string
}

export interface LocalFoodPaymentConfig {
  mode: 'placeholder'
  providerLabel: string
  readiness: 'payment_ready_shape'
}

export interface LocalFoodProviderRecord {
  id: string
  providerDid: string
  vertical: LocalFoodVertical
  status: LocalFoodProviderStatus
  businessName: string
  slug: string
  summary: string
  cuisineLabel: string
  phone: string
  locationLabel: string
  fulfilmentModes: LocalFoodFulfilmentMode[]
  serviceArea: LocalFoodServiceArea
  payment: LocalFoodPaymentConfig
  createdAt: string
  updatedAt: string
}

export interface LocalFoodMenuItemRecord {
  id: string
  providerDid: string
  category: LocalFoodMenuCategory
  name: string
  description: string
  priceCents: number
  currency: 'EUR'
  available: boolean
  tags: string[]
  position: number
  createdAt: string
  updatedAt: string
}

export interface LocalFoodOrderItemSnapshot {
  menuItemId: string
  category: LocalFoodMenuCategory
  name: string
  unitPriceCents: number
  quantity: number
  lineTotalCents: number
}

export interface LocalFoodPaymentSummary {
  mode: 'placeholder'
  status: 'pending'
  displayLabel: string
  checkoutReference: string
}

export interface LocalFoodOrderStatusEvent {
  status: LocalFoodOrderStatus
  at: string
  note: string | null
}

export interface LocalFoodOrderRecord {
  id: string
  providerDid: string
  customerDid: string | null
  customerName: string
  customerPhone: string
  customerPostcode: string
  customerAddressLine: string
  customerNotes: string
  fulfilmentMode: LocalFoodFulfilmentMode
  items: LocalFoodOrderItemSnapshot[]
  subtotalCents: number
  totalCents: number
  currency: 'EUR'
  payment: LocalFoodPaymentSummary
  status: LocalFoodOrderStatus
  statusTimeline: LocalFoodOrderStatusEvent[]
  createdAt: string
  updatedAt: string
}

export interface LocalFoodProviderPatch {
  status?: LocalFoodProviderStatus
  businessName?: string
  summary?: string
  phone?: string
  locationLabel?: string
  fulfilmentModes?: LocalFoodFulfilmentMode[]
  serviceArea?: {
    postcodePrefixes?: string[]
    coverageLabel?: string
    deliveryNotes?: string
  }
}

export interface CreateLocalFoodMenuItemInput {
  category: LocalFoodMenuCategory
  name: string
  description?: string
  priceCents: number
  currency?: 'EUR'
  available?: boolean
  tags?: string[]
}

export interface UpdateLocalFoodMenuItemInput {
  category?: LocalFoodMenuCategory
  name?: string
  description?: string
  priceCents?: number
  available?: boolean
  tags?: string[]
}

export interface CreateLocalFoodOrderInput {
  providerDid: string
  customerDid?: string | null
  customerName: string
  customerPhone: string
  customerPostcode: string
  customerAddressLine: string
  customerNotes?: string
  fulfilmentMode: LocalFoodFulfilmentMode
  items: Array<{
    menuItemId: string
    quantity: number
  }>
}

export interface LocalFoodOrderStatusPatch {
  status: LocalFoodOrderStatus
  note?: string
}
