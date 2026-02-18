import { AgentChat } from '@/components/agent-chat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { jobFinderGroups, getJobFinderPagesByGroup, jobFinderPageDefinitions } from '@/lib/job-finder/jobs-catalog'
import Link from 'next/link'

export default function FindAJobPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 space-y-10">
        <section className="max-w-5xl mx-auto text-center space-y-4">
          <Badge variant="outline">Career Paths and Jobs</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gold">
            Find a Job
          </h1>
          <p className="text-foreground text-lg md:text-xl max-w-3xl mx-auto">
            Discover Army roles, compare tracks, and chat with a dedicated job finder assistant. This page is structured to mirror the jobs journey so users can move from exploration to decision.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <a href="#job-finder-chat">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start with Job Finder Assistant
              </Button>
            </a>
            <Link href="/explore">
              <Button variant="outline">All Assistants</Button>
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobFinderGroups.map((group) => (
            <Card key={group.key} className="bg-card border-border/50">
              <CardHeader>
                <CardTitle>{group.label}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {getJobFinderPagesByGroup(group.key).map((item) => (
                  <Link
                    key={item.slug}
                    href={`/explore/find-a-job/${item.slug}`}
                    className="block rounded-md border border-border/70 px-3 py-2 text-foreground hover:bg-muted/40 transition-colors"
                  >
                    {item.title}
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="max-w-6xl mx-auto space-y-4">
          <h2 className="text-2xl font-semibold">Published Job Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobFinderPageDefinitions.slice(0, 9).map((item) => (
              <Card key={item.slug} className="bg-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.shortDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {item.highlights.slice(0, 2).map((point) => (
                      <Badge key={point} variant="outline">{point}</Badge>
                    ))}
                  </div>
                  <Link href={`/explore/find-a-job/${item.slug}`}>
                    <Button variant="outline" className="w-full">
                      Open Page
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto">
          <Alert>
            <AlertTitle>Published jobs pages (next phase)</AlertTitle>
            <AlertDescription>
              We will replace static modules with scraped and normalized page content from goarmy.com jobs sections,
              then wire each module card to its published in-app page.
            </AlertDescription>
          </Alert>
        </section>

        <section id="job-finder-chat" className="pb-8">
          <AgentChat agentType="job-finder" />
        </section>
      </div>
    </main>
  )
}
