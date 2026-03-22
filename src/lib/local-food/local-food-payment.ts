import type { LocalFoodPaymentSummary } from '@/lib/local-food/local-food-types'

export function createLocalFoodPaymentPlaceholder(orderId: string, totalCents: number): LocalFoodPaymentSummary {
  const euros = (totalCents / 100).toFixed(2)

  return {
    mode: 'placeholder',
    status: 'pending',
    displayLabel: `Demo betaalreferentie · €${euros} afrekenen na bevestiging`,
    checkoutReference: `lf_checkout_${orderId}`,
  }
}
