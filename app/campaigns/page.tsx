import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const campaigns = [
  {
    id: 'field-tested',
    title: 'Field Tested',
    description:
      'Interactive campaign prototype focused on confidence, real-world proof, and personalized path guidance.',
    href: '/campaigns/field-tested/v1'
  }
]

export default function CampaignsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto space-y-8 px-4 py-12">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Campaign Lab</p>
          <h1 className="text-4xl font-bold tracking-tight text-gold">Campaign Experience Area</h1>
          <p className="max-w-3xl text-muted-foreground">
            This area hosts design-phase campaign iterations. Each campaign can have multiple versions for rapid UX and
            interaction testing.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="border-border/70">
              <CardHeader>
                <CardTitle>{campaign.title}</CardTitle>
                <CardDescription>{campaign.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Link href={campaign.href}>
                  <Button>Open Campaign</Button>
                </Link>
                <Link href="/campaigns/field-tested/v2">
                  <Button variant="outline">Open Iteration v2</Button>
                </Link>
                <Link href="/campaigns/field-tested/v4">
                  <Button variant="outline">Open Iteration v4</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
