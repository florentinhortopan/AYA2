'use client'

import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ValidatePage({ params }: { params: { projectId: string } }) {
  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title="Validation"
            description="Check URL accessibility and corpus alignment."
            actions={(
              <div className="flex gap-2">
                <Button>Run URL Checks</Button>
                <Button variant="outline">Run Corpus Validation</Button>
              </div>
            )}
          />

          <div className="space-y-4">
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">URL Checks</h3>
                <Badge variant="outline">2 issues</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                248 URLs validated, 2 failed (non-200 responses).
              </p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Corpus Validation</h3>
                <Badge variant="secondary">Needs Review</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                12 answers flagged for manual review.
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
