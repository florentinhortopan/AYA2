import Link from 'next/link'
import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { FieldTestedTopNav } from '@/components/campaigns/field-tested/FieldTestedTopNav'

export default function FieldTestedLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Campaign</p>
            <h1 className="text-3xl font-bold tracking-tight text-gold">Field Tested</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Interactive campaign design workspace with versioned prototypes.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/campaigns">
              <Button variant="outline">Back To Campaigns</Button>
            </Link>
            <Link href="/content">
              <Button variant="outline">Open Content Workspace</Button>
            </Link>
          </div>
        </header>
      </div>

      <FieldTestedTopNav />

      <div className="container mx-auto px-4 py-8">{children}</div>
    </main>
  )
}
