import { kv } from '@vercel/kv'

export async function kvRead<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await kv.get<T>(key)
    return value ?? fallback
  } catch {
    // Fallback for local dev without KV configured
    return fallback
  }
}

export async function kvWrite<T>(key: string, value: T): Promise<void> {
  try {
    await kv.set(key, value)
  } catch (error) {
    console.error(`KV write failed for key ${key}:`, error)
    throw error
  }
}
