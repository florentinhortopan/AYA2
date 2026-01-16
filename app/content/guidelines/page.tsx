'use client'

import { useEffect, useState } from 'react'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContentGuideline } from '@/types/content'

type GuidelineFormState = {
  id?: string
  name: string
  version: string
  isActive: boolean
  content: string
}

const emptyFormState: GuidelineFormState = {
  name: '',
  version: '',
  isActive: false,
  content: ''
}

export default function GuidelinesPage() {
  const [guidelines, setGuidelines] = useState<ContentGuideline[]>([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formState, setFormState] = useState<GuidelineFormState>(emptyFormState)

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

  const openNewGuideline = () => {
    setFormState(emptyFormState)
    setEditorOpen(true)
  }

  const openEditGuideline = (guideline: ContentGuideline) => {
    setFormState({
      id: guideline.id,
      name: guideline.name,
      version: guideline.version,
      isActive: guideline.isActive,
      content: guideline.content ?? ''
    })
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setFormState(emptyFormState)
  }

  const isValid =
    formState.name.trim().length > 0 &&
    formState.version.trim().length > 0 &&
    formState.content.trim().length > 0

  const saveGuideline = async () => {
    if (!isValid || saving) {
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formState.name.trim(),
        version: formState.version.trim(),
        content: formState.content,
        isActive: formState.isActive,
      }

      const response = await fetch(
        formState.id ? `/api/content-tool/guidelines/${formState.id}` : '/api/content-tool/guidelines',
        {
          method: formState.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      if (!response.ok) {
        return
      }

      const data = await response.json()
      const updatedGuideline = data.guideline as ContentGuideline

      setGuidelines((prev) => {
        if (!formState.id) {
          return [updatedGuideline, ...prev]
        }
        return prev.map((guideline) => (guideline.id === updatedGuideline.id ? updatedGuideline : guideline))
      })

      closeEditor()
    } finally {
      setSaving(false)
    }
  }

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title="Guidelines"
            description="Manage guideline files and versions."
            actions={(
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={openNewGuideline}
              >
                New Guideline
              </Button>
            )}
          />

          {editorOpen && (
            <div className="border border-border rounded-lg p-6 mb-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {formState.id ? 'Edit Guideline' : 'New Guideline'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Update the guideline content and version details.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={closeEditor}>
                    Cancel
                  </Button>
                  <Button onClick={saveGuideline} disabled={!isValid || saving}>
                    {saving ? 'Saving...' : 'Save Guideline'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guideline-name">Name</Label>
                  <Input
                    id="guideline-name"
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Guideline name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guideline-version">Version</Label>
                  <Input
                    id="guideline-version"
                    value={formState.version}
                    onChange={(event) => setFormState((prev) => ({ ...prev, version: event.target.value }))}
                    placeholder="1.0"
                  />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input
                    id="guideline-active"
                    type="checkbox"
                    className="h-4 w-4 rounded border border-input"
                    checked={formState.isActive}
                    onChange={(event) => setFormState((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  <Label htmlFor="guideline-active">Mark as active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guideline-content">Guideline Content</Label>
                <textarea
                  id="guideline-content"
                  className="min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formState.content}
                  onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="Paste the guideline text here."
                />
              </div>
            </div>
          )}

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
                    <Button size="sm" variant="outline" onClick={() => openEditGuideline(guideline)}>
                      Edit
                    </Button>
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
