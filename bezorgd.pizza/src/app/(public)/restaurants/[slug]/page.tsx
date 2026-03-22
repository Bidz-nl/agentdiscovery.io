import { notFound } from 'next/navigation'

import { findPublicRestaurantBySlug } from '@/lib/local-food/local-food-service'
import { RestaurantOrderExperience } from '@/app/(public)/restaurants/[slug]/restaurant-order-experience'

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const restaurantDetail = await findPublicRestaurantBySlug(slug)

  if (!restaurantDetail) {
    notFound()
  }

  return <RestaurantOrderExperience restaurantDetail={restaurantDetail} />
}
