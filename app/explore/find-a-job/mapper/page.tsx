import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loadScrapedJobsPayload } from '@/lib/job-finder/scraped-data'
import { loadJobFinderComponentRegistry } from '@/lib/job-finder/component-registry'
import { mapPageBlocksToComponents } from '@/lib/job-finder/component-mapper'
import { UIComponentsRenderer } from '@/components/ui-components-renderer'
import { JobFinderRegistryEditor } from '@/components/job-finder-registry-editor'

export default async function JobFinderMapperPage() {
  const payload = await loadScrapedJobsPayload()
  const registry = await loadJobFinderComponentRegistry()

  const pageCandidates = payload?.pages.slice(0, 3) || []
  const mappedSamples = pageCandidates.map((page) => ({
    page,
    mapped: mapPageBlocksToComponents(page, registry, { maxBlocks: 10 })
  }))

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 space-y-8">
        <section className="max-w-5xl mx-auto text-center space-y-3">
          <Badge variant="outline">Design System Mapper Lab</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gold">
            Block to Component Mapper
          </h1>
          <p className="text-muted-foreground text-lg">
            Tune mapping rules independently from chat. This lab previews how scraped blocks become reusable UI modules.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/explore/find-a-job">
              <Button variant="outline">Back to Find a Job</Button>
            </Link>
            <Link href="/api/job-finder/mapper">
              <Button variant="outline">Open Mapper API JSON</Button>
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Dataset and Coverage</CardTitle>
              <CardDescription>
                Generated: {payload?.generatedAt ? new Date(payload.generatedAt).toLocaleString() : 'n/a'} •
                Pages: {payload?.pages.length || 0} •
                Coverage: {payload?.coverage?.coveragePercent || 0}%
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Missing labels: {(payload?.coverage?.labelsMissing || []).length === 0 ? 'none' : payload?.coverage?.labelsMissing.join(', ')}
            </CardContent>
          </Card>
        </section>

        <section className="max-w-6xl mx-auto">
          <JobFinderRegistryEditor initialRegistryJson={JSON.stringify(registry, null, 2)} />
        </section>

        <section className="max-w-6xl mx-auto space-y-4">
          <h2 className="text-2xl font-semibold">Mapped Component Previews</h2>
          {mappedSamples.map(({ page, mapped }) => (
            <Card key={page.url}>
              <CardHeader>
                <CardTitle>{page.title}</CardTitle>
                <CardDescription>
                  {page.url} • Blocks: {mapped.stats.blocksExamined} • Mapped: {mapped.stats.blocksMapped}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <UIComponentsRenderer components={mapped.components} />
                <pre className="text-xs whitespace-pre-wrap break-words bg-muted/30 rounded-md p-3">
                  {JSON.stringify(mapped.stats, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  )
}
