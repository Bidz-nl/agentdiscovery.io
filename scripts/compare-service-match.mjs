const cases = [
  ['minimal_all', { category: 'all', limit: 10 }],
  ['keyword_cleaning', { category: 'all', requirements: { keywords: ['cleaning', 'home'] }, limit: 10 }],
  ['with_postcode', { category: 'all', postcode: '1011AB', requirements: { keywords: ['pizza'] }, limit: 10 }],
  ['with_budget', { category: 'all', requirements: { keywords: ['plumber'] }, budget: { maxAmount: 15000 }, limit: 10 }],
  ['with_urgency_valid', { category: 'all', requirements: { keywords: ['electrician'], urgency: 'high' }, limit: 10 }],
  ['empty_minimal', {}],
]

async function waitReady(port) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`)
      if (response.ok) {
        return
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw new Error(`Port ${port} is not ready`)
}

async function post(port, payload) {
  const response = await fetch(`http://127.0.0.1:${port}/api/app/services/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => null)
  const matches = Array.isArray(data?.matches) ? data.matches : null

  return {
    status: response.status,
    count: matches ? matches.length : null,
    top: matches
      ? matches.slice(0, 3).map((match) => ({
          title: match?.capability?.title ?? null,
          providerName: match?.provider?.name ?? match?.agent?.name ?? null,
          relevanceScore: match?.relevanceScore ?? match?.matchScore ?? null,
        }))
      : [],
    shape: matches
      ? {
          hasProvider: matches.some((match) => Boolean(match?.provider)),
          hasAgent: matches.some((match) => Boolean(match?.agent)),
          hasRelevanceScore: matches.some((match) => typeof match?.relevanceScore === 'number'),
          hasMatchScore: matches.some((match) => typeof match?.matchScore === 'number'),
          capabilityIdTypes: [...new Set(matches.slice(0, 3).map((match) => typeof match?.capability?.id))],
        }
      : null,
    error: data?.error ?? null,
  }
}

async function main() {
  const legacyPort = Number(process.argv[2] ?? 3011)
  const nativePort = Number(process.argv[3] ?? 3012)

  await waitReady(legacyPort)
  await waitReady(nativePort)

  const output = {}

  for (const [name, payload] of cases) {
    output[name] = {
      legacy: await post(legacyPort, payload),
      native: await post(nativePort, payload),
    }
  }

  console.log(JSON.stringify(output, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
