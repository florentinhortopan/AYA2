'use client'

import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const sections = [
  { title: 'Questions', href: 'questions', description: 'Review and edit generated questions.' },
  { title: 'Answers', href: 'answers', description: 'Review and refine answer variants.' },
  { title: 'Batch', href: 'batch', description: 'Run and monitor batch generation.' },
  { title: 'Validation', href: 'validate', description: 'Check URLs and corpus validation.' },
  { title: 'Publish', href: 'publish', description: 'Approve and publish content.' }
]

export default function ProjectWorkspacePage({ params }: { params: { projectId: string } }) {
  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title={`Project ${params.projectId}`}
            description="Workspace overview for content generation."
            actions={(
              <Link href="/content">
                <Button variant="outline">Back to Content</Button>
              </Link>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section) => (
              <Card key={section.title} className="border-border/50">
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-muted-foreground">{section.description}</p>
                  <Link href={`/content/${params.projectId}/${section.href}`}>
                    <Button variant="outline">Open</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </RequireAuth>
  )
}
