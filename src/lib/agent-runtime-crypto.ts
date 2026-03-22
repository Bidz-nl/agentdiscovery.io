import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

function getEncryptionKeyMaterial() {
  const rawKey = process.env.AGENT_SECRET_ENCRYPTION_KEY?.trim()
  if (!rawKey) {
    return null
  }

  if (/^[a-f0-9]{64}$/i.test(rawKey)) {
    return Buffer.from(rawKey, 'hex')
  }

  try {
    const base64 = Buffer.from(rawKey, 'base64')
    if (base64.length === 32) {
      return base64
    }
  } catch {
    return null
  }

  return null
}

function getEncryptionKey() {
  const key = getEncryptionKeyMaterial()
  if (!key) {
    throw new Error('AGENT_SECRET_ENCRYPTION_KEY must be configured as 32-byte base64 or 64-char hex')
  }
  return key
}

export function canEncryptAgentSecrets() {
  return Boolean(getEncryptionKeyMaterial())
}

export function encryptAgentSecret(secret: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptAgentSecret(payload: string) {
  const buffer = Buffer.from(payload, 'base64')
  const iv = buffer.subarray(0, 12)
  const tag = buffer.subarray(12, 28)
  const encrypted = buffer.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

export function maskAgentSecret(secret: string) {
  const trimmed = secret.trim()
  if (trimmed.length <= 8) {
    return '••••••••'
  }
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`
}

export function fingerprintHostedManagedCredential(provider: 'openai' | 'anthropic', agentId: number) {
  return createHash('sha256').update(`hosted:${provider}:${agentId}`).digest('hex')
}
