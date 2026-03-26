import { notFound } from 'next/navigation'

import { findPublicRestaurantBySlug } from '@/lib/local-food/local-food-service'
import { findDirectoryRestaurantBySlug } from '@/lib/local-food/restaurant-directory'
import { RestaurantOrderExperience } from '@/app/(public)/restaurants/[slug]/restaurant-order-experience'
import { RestaurantDirectoryInfo } from '@/app/(public)/restaurants/[slug]/restaurant-directory-info'

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const restaurantDetail = await findPublicRestaurantBySlug(slug)
  if (restaurantDetail) {
    return <RestaurantOrderExperience restaurantDetail={restaurantDetail} />
  }

  const directoryRestaurant = findDirectoryRestaurantBySlug(slug)
  if (directoryRestaurant) {
    return <RestaurantDirectoryInfo restaurant={directoryRestaurant} />
  }

  notFound()
}
