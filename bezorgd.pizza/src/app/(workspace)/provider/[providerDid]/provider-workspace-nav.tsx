'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function getLinkClassName(active: boolean) {
  return active
    ? 'rounded-full bg-[#c85b24] px-4 py-2 font-semibold text-white transition hover:bg-[#ab4715]'
    : 'rounded-full border border-orange-200 bg-white px-4 py-2 font-semibold text-[#6a3c24] transition hover:bg-[#fff3ea]'
}

export function ProviderWorkspaceNav({ providerDid }: { providerDid: string }) {
  const pathname = usePathname()
  const encodedProviderDid = encodeURIComponent(providerDid)
  const links = [
    {
      href: `/provider/${encodedProviderDid}/orders`,
      label: 'Balie',
      active: pathname.startsWith(`/provider/${encodedProviderDid}/orders`),
    },
    {
      href: `/provider/${encodedProviderDid}/menu`,
      label: 'Menu',
      active: pathname.startsWith(`/provider/${encodedProviderDid}/menu`),
    },
    {
      href: `/provider/${encodedProviderDid}/kitchen`,
      label: 'Keuken',
      active: pathname.startsWith(`/provider/${encodedProviderDid}/kitchen`),
    },
  ]

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={getLinkClassName(link.active)}>
          {link.label}
        </Link>
      ))}
    </div>
  )
}
