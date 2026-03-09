import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AgentChat } from '@/components/agent-chat'
import { getJobFinderPageBySlug, jobFinderPageDefinitions } from '@/lib/job-finder/jobs-catalog'
import { getPagesForSlug, loadScrapedJobsPayload } from '@/lib/job-finder/scraped-data'

interface JobFinderPublishedPageProps {
  params: {
    slug: string
  }
}

export function generateStaticParams() {
  return jobFinderPageDefinitions.map((item) => ({ slug: item.slug }))
}

export default async function JobFinderPublishedPage({ params }: JobFinderPublishedPageProps) {
  const page = getJobFinderPageBySlug(params.slug)

  if (!page) {
    notFound()
  }

  const payload = await loadScrapedJobsPayload()
  const scrapedMatches = await getPagesForSlug(page.slug, page.title, 4)

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 space-y-8">
        <section className="max-w-4xl mx-auto text-center space-y-3">
          <Badge variant="outline">Published Job Page</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gold">{page.title}</h1>
          <p className="text-lg text-foreground">{page.shortDescription}</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/explore/find-a-job">
              <Button variant="outline">Back to Find a Job</Button>
            </Link>
            <a href={page.sourceUrl} target="_blank" rel="noreferrer">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                View Source Page
              </Button>
            </a>
          </div>
        </section>

        <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>
                This page is generated from the job taxonomy and will be hydrated with scraped content and references.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                The final version of this module will render normalized content blocks from the ingestion pipeline
                and keep links back to the original source page.
              </p>
              <p>
                It is intentionally structured in reusable cards so we can map sections from scraped pages without
                redesigning each time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Highlights</CardTitle>
              <CardDescription>Initial points for this path</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {page.highlights.map((item) => (
                <Badge key={item} variant="outline">{item}</Badge>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="max-w-5xl mx-auto">
          <Alert>
            <AlertTitle>Scraped knowledge loaded</AlertTitle>
            <AlertDescription>
              This page is mapped to scraped jobs sources. The assistant queries across {payload?.pages.length || 0} indexed pages.
            </AlertDescription>
          </Alert>
        </section>

        <section className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Relevant Scraped Sources</CardTitle>
              <CardDescription>
                Top matched pages for this route based on title/slug overlap.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scrapedMatches.map((match) => (
                <div key={match.url} className="rounded-md border border-border p-3 space-y-2">
                  <div className="font-medium">{match.title}</div>
                  <p className="text-sm text-muted-foreground">{match.textExcerpt.slice(0, 260)}...</p>
                  <a href={match.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                    {match.url}
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Ask the Job Finder Assistant</CardTitle>
              <CardDescription>
                Continue the conversation with context from this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentChat agentType="job-finder" />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
