import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DB_DATA_DIRECTORY = '.data'

export function getDbDataRoot() {
  return path.join(process.cwd(), DB_DATA_DIRECTORY)
}

export async function readDbJsonFile<T>(relativePath: string, fallbackValue: T): Promise<T> {
  const targetFile = path.join(getDbDataRoot(), relativePath)

  try {
    const contents = await readFile(targetFile, 'utf8')
    return JSON.parse(contents) as T
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return fallbackValue
    }

    throw error
  }
}

export async function writeDbJsonFile<T>(relativePath: string, value: T) {
  try {
    const targetFile = path.join(getDbDataRoot(), relativePath)
    await mkdir(path.dirname(targetFile), { recursive: true })
    await writeFile(targetFile, JSON.stringify(value, null, 2), 'utf8')
  } catch {
    // On read-only filesystems (e.g. Vercel serverless) writes are skipped
  }
}
