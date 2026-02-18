import { AnyUIComponent } from '@/types/ui'
import { JobFinderComponentRegistry } from './component-registry'
import { ScrapedComponentBlock, ScrapedJobPage } from './scraped-data'

interface MapperResult {
  components: AnyUIComponent[]
  stats: {
    blocksExamined: number
    blocksMapped: number
    byType: Record<string, number>
  }
}

const toSafeText = (value: string | undefined, fallback = '') =>
  (value || fallback).replace(/\s+/g, ' ').trim()

const mapBlockToComponent = (
  block: ScrapedComponentBlock,
  page: ScrapedJobPage,
  registry: JobFinderComponentRegistry
): AnyUIComponent | null => {
  const rule = registry.mappings[block.type]
  if (!rule) return null

  if (rule.outputType === 'text') {
    return {
      type: 'text',
      props: {
        content: toSafeText(block.text, page.textExcerpt).slice(0, 320),
        variant: 'default',
        size: 'sm'
      }
    } as AnyUIComponent
  }

  if (rule.outputType === 'list') {
    const items = (block.listItems || [])
      .slice(0, 6)
      .map((item) => ({ title: item }))
    if (items.length === 0) return null
    return {
      type: 'list',
      props: {
        items,
        variant: rule.styleVariant === 'bulleted' ? 'bulleted' : 'default'
      }
    } as AnyUIComponent
  }

  if (rule.outputType === 'table') {
    if (!block.tableHeaders || !block.tableRows || block.tableHeaders.length === 0 || block.tableRows.length === 0) {
      return null
    }
    return {
      type: 'table',
      props: {
        title: block.title || page.title,
        description: `Mapped from scraped ${block.type} block`,
        headers: block.tableHeaders.slice(0, 6),
        rows: block.tableRows.slice(0, 6).map((row) => row.slice(0, 6)),
        variant: rule.styleVariant === 'striped' ? 'striped' : 'default'
      }
    } as AnyUIComponent
  }

  if (rule.outputType === 'card') {
    const cta = block.links?.[0]
      ? [
          {
            type: 'button',
            props: {
              label: block.links?.[0].text || 'Open source page',
              action: 'open_source_page',
              href: block.links[0].href,
              variant: 'outline',
              size: 'sm'
            }
          }
        ]
      : []

    return {
      type: 'card',
      props: {
        title: block.title || page.title,
        description: `Mapped from ${block.type}`,
        content: toSafeText(block.text, page.textExcerpt).slice(0, 260),
        footer: cta,
        variant: rule.styleVariant === 'outline' ? 'outline' : 'elevated'
      }
    } as AnyUIComponent
  }

  return {
    type: 'custom',
    props: {
      componentName: `${block.type}_module`,
      title: block.title || page.title,
      description: `Custom DS mapping: ${rule.styleVariant || 'default'}`,
      data: {
        pageUrl: page.url,
        text: toSafeText(block.text, page.textExcerpt).slice(0, 260),
        links: block.links || [],
        images: block.images || [],
        styleHints: block.styleHints || null
      }
    }
  } as AnyUIComponent
}

export function mapPageBlocksToComponents(
  page: ScrapedJobPage,
  registry: JobFinderComponentRegistry,
  options?: { maxBlocks?: number }
): MapperResult {
  const blocks = page.componentBlocks || []
  const maxBlocks = options?.maxBlocks || 8
  const selectedBlocks = blocks.slice(0, maxBlocks)

  const components: AnyUIComponent[] = []
  const stats = {
    blocksExamined: selectedBlocks.length,
    blocksMapped: 0,
    byType: {} as Record<string, number>
  }

  const perTypeCount: Record<string, number> = {}
  for (const block of selectedBlocks) {
    perTypeCount[block.type] = perTypeCount[block.type] || 0
    const rule = registry.mappings[block.type]
    const maxForType = rule?.maxBlocksPerPage ?? Number.POSITIVE_INFINITY
    if (perTypeCount[block.type] >= maxForType) continue

    const component = mapBlockToComponent(block, page, registry)
    if (!component) continue

    perTypeCount[block.type] += 1
    stats.byType[block.type] = (stats.byType[block.type] || 0) + 1
    stats.blocksMapped += 1
    components.push(component)
  }

  return { components, stats }
}
