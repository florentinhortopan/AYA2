'use client'

import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function PublishPage({ params }: { params: { projectId: string } }) {
  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title="Publish"
            description="Review approval status before publishing."
            actions={(
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Publish
              </Button>
            )}
          />

          <div className="space-y-4">
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Approval Status</h3>
                <Badge variant="secondary">Ready</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                250 questions approved, 250 preferred answers selected.
              </p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Export</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">CSV</Button>
                  <Button size="sm" variant="outline">JSON</Button>
                  <Button size="sm" variant="outline">Markdown</Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Export the approved Q&A set for review or backup.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Link href={`/content/${params.projectId}`}>
              <Button variant="outline">Back to Workspace</Button>
            </Link>
          </div>
        </div>
      </main>
    </RequireAuth>
  )
}
