import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ScrapedComponentBlock } from './scraped-data'

type BlockType = ScrapedComponentBlock['type']
type OutputType = 'text' | 'card' | 'list' | 'table' | 'custom'

export interface ComponentMappingRule {
  outputType: OutputType
  maxBlocksPerPage?: number
  styleVariant?: string
}

export interface JobFinderComponentRegistry {
  version: string
  description?: string
  mappings: Record<BlockType, ComponentMappingRule>
}

const registryPath = resolve(process.cwd(), 'data', 'goarmy', 'component-registry.json')
let cache: JobFinderComponentRegistry | null = null
let cacheAt = 0
const CACHE_TTL_MS = 60_000
const allowedOutputTypes = new Set<OutputType>(['text', 'card', 'list', 'table', 'custom'])
const requiredBlockTypes: BlockType[] = ['hero', 'table', 'list', 'media-grid', 'cta', 'text']

const defaultRegistry: JobFinderComponentRegistry = {
  version: '1.0.0',
  description: 'Fallback component mapping registry',
  mappings: {
    hero: { outputType: 'card', maxBlocksPerPage: 1, styleVariant: 'elevated' },
    table: { outputType: 'table', maxBlocksPerPage: 2, styleVariant: 'striped' },
    list: { outputType: 'list', maxBlocksPerPage: 2, styleVariant: 'bulleted' },
    'media-grid': { outputType: 'custom', maxBlocksPerPage: 2, styleVariant: 'gallery' },
    cta: { outputType: 'card', maxBlocksPerPage: 2, styleVariant: 'outline' },
    text: { outputType: 'text', maxBlocksPerPage: 3, styleVariant: 'default' }
  }
}

export const isValidRegistry = (value: unknown): value is JobFinderComponentRegistry => {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  if (!obj.version || typeof obj.version !== 'string') return false
  if (!obj.mappings || typeof obj.mappings !== 'object') return false

  for (const key of requiredBlockTypes) {
    const rule = (obj.mappings as Record<string, unknown>)[key] as Record<string, unknown> | undefined
    if (!rule) return false
    if (!rule.outputType || typeof rule.outputType !== 'string') return false
    if (!allowedOutputTypes.has(rule.outputType as OutputType)) return false
    if (rule.maxBlocksPerPage !== undefined) {
      if (typeof rule.maxBlocksPerPage !== 'number' || rule.maxBlocksPerPage < 0) return false
    }
    if (rule.styleVariant !== undefined && typeof rule.styleVariant !== 'string') return false
  }

  return true
}

export async function loadJobFinderComponentRegistry(): Promise<JobFinderComponentRegistry> {
  const now = Date.now()
  if (cache && now - cacheAt < CACHE_TTL_MS) return cache

  try {
    const raw = await readFile(registryPath, 'utf8')
    const parsed = JSON.parse(raw)
    if (isValidRegistry(parsed)) {
      cache = parsed
      cacheAt = now
      return parsed
    }
  } catch {
    // fallback below
  }

  cache = defaultRegistry
  cacheAt = now
  return defaultRegistry
}

export function getDefaultJobFinderComponentRegistry(): JobFinderComponentRegistry {
  return defaultRegistry
}

export async function saveJobFinderComponentRegistry(
  nextRegistry: JobFinderComponentRegistry
): Promise<JobFinderComponentRegistry> {
  if (!isValidRegistry(nextRegistry)) {
    throw new Error('Invalid registry payload. Check version, mappings, outputType, and required block types.')
  }

  await writeFile(registryPath, JSON.stringify(nextRegistry, null, 2), 'utf8')
  cache = nextRegistry
  cacheAt = Date.now()
  return nextRegistry
}
