import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const loaderDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(loaderDirectory, '..')
const srcRoot = path.join(projectRoot, 'src')

function resolveLocalCandidate(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.mjs'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return pathToFileURL(candidate).href
    }
  }

  return null
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === 'next/server') {
    return defaultResolve('next/server.js', context, defaultResolve)
  }

  if (specifier.startsWith('@/')) {
    const resolvedUrl = resolveLocalCandidate(path.join(srcRoot, specifier.slice(2)))
    if (resolvedUrl) {
      return {
        shortCircuit: true,
        url: resolvedUrl,
      }
    }
  }

  return defaultResolve(specifier, context, defaultResolve)
}
