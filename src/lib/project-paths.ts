import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

function isProjectRoot(candidatePath: string) {
  const packageJsonPath = path.join(candidatePath, 'package.json')

  if (!existsSync(packageJsonPath)) {
    return false
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name?: string }
    return packageJson.name === 'agentdiscovery.io'
  } catch {
    return false
  }
}

function resolveProjectRootFrom(startPath: string) {
  let currentPath = path.resolve(startPath)

  while (true) {
    if (isProjectRoot(currentPath)) {
      return currentPath
    }

    const parentPath = path.dirname(currentPath)
    if (parentPath === currentPath) {
      return path.resolve(startPath)
    }

    currentPath = parentPath
  }
}

const PROJECT_ROOT = resolveProjectRootFrom(process.cwd())
const DATA_ROOT = path.join(PROJECT_ROOT, '.data')

export function getProjectRoot() {
  return PROJECT_ROOT
}

export function getDataRoot() {
  return DATA_ROOT
}
