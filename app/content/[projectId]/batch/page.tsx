'use client'

import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export default function BatchPage({ params }: { params: { projectId: string } }) {
  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title="Batch Processing"
            description="Run and monitor question and answer batches."
            actions={(
              <div className="flex gap-2">
                <Button>Start Batch</Button>
                <Button variant="outline">Pause</Button>
              </div>
            )}
          />

          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>50%</span>
            </div>
            <Progress value={50} />
            <p className="text-muted-foreground text-sm">
              5 of 10 batches complete. Estimated time remaining: 12 minutes.
            </p>
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
