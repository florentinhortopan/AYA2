'use client'

import { useEffect, useState } from 'react'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContentPrompt } from '@/types/content'

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<ContentPrompt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const response = await fetch('/api/content-tool/prompts')
        if (response.ok) {
          const data = await response.json()
          setPrompts(data.prompts || [])
        }
      } finally {
        setLoading(false)
      }
    }

    loadPrompts()
  }, [])

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title="Prompts"
            description="Manage question and answer generator prompts."
            actions={(
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                New Prompt
              </Button>
            )}
          />

          {loading ? (
            <p className="text-muted-foreground">Loading prompts...</p>
          ) : (
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <div key={prompt.id} className="border border-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{prompt.name}</h3>
                    <p className="text-sm text-muted-foreground">Type: {prompt.type.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">Version: {prompt.version}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {prompt.isActive && <Badge variant="secondary">Active</Badge>}
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
