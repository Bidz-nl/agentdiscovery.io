import { redirect } from 'next/navigation'

export default async function ProviderScopedPage({
  params,
}: Readonly<{
  params: Promise<{ providerDid: string }>
}>) {
  const { providerDid } = await params
  redirect(`/provider/${providerDid}/orders`)
}
