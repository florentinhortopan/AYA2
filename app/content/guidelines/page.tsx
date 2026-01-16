'use client'

import { useEffect, useState } from 'react'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContentGuideline } from '@/types/content'

export default function GuidelinesPage() {
  const [guidelines, setGuidelines] = useState<ContentGuideline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGuidelines = async () => {
      try {
        const response = await fetch('/api/content-tool/guidelines')
        if (response.ok) {
          const data = await response.json()
          setGuidelines(data.guidelines || [])
        }
      } finally {
        setLoading(false)
      }
    }

    loadGuidelines()
  }, [])

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title="Guidelines"
            description="Manage guideline files and versions."
            actions={(
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                New Guideline
              </Button>
            )}
          />

          {loading ? (
            <p className="text-muted-foreground">Loading guidelines...</p>
          ) : (
            <div className="space-y-4">
              {guidelines.map((guideline) => (
                <div key={guideline.id} className="border border-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{guideline.name}</h3>
                    <p className="text-sm text-muted-foreground">Version: {guideline.version}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {guideline.isActive && <Badge variant="secondary">Active</Badge>}
                    <Button size="sm" variant="outline">Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  )
}
