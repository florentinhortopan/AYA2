'use client'

import { useEffect, useState } from 'react'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContentGuideline } from '@/types/content'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type GuidelineFormState = {
  id?: string
  name: string
  version: string
  isActive: boolean
  content: string
}

const formatMarkdown = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

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
  const [savingAsNew, setSavingAsNew] = useState(false)
  const [formState, setFormState] = useState<GuidelineFormState>(emptyFormState)
  const [previewMode, setPreviewMode] = useState(false)

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
    setPreviewMode(false)
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
    setPreviewMode(false)
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setPreviewMode(false)
    setFormState(emptyFormState)
  }

  const isValid =
    formState.name.trim().length > 0 &&
    formState.version.trim().length > 0 &&
    formState.content.trim().length > 0

  const saveGuideline = async (options?: { forceCreate?: boolean }) => {
    if (!isValid || saving || savingAsNew) {
      return
    }

    const forceCreate = options?.forceCreate ?? false
    if (forceCreate) {
      setSavingAsNew(true)
    } else {
      setSaving(true)
    }

    try {
      const payload = {
        name: formState.name.trim(),
        version: formState.version.trim(),
        content: formState.content,
        isActive: formState.isActive,
      }

      const response = await fetch(
        formState.id && !forceCreate
          ? `/api/content-tool/guidelines/${formState.id}`
          : '/api/content-tool/guidelines',
        {
          method: formState.id && !forceCreate ? 'PUT' : 'POST',
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
        if (!formState.id || forceCreate) {
          return [updatedGuideline, ...prev]
        }
        return prev.map((guideline) => (guideline.id === updatedGuideline.id ? updatedGuideline : guideline))
      })

      closeEditor()
    } finally {
      setSaving(false)
      setSavingAsNew(false)
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
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={closeEditor}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFormState((prev) => ({ ...prev, content: formatMarkdown(prev.content) }))
                    }
                    disabled={!formState.content.trim()}
                  >
                    Format Markdown
                  </Button>
                  <Button variant="outline" onClick={() => setPreviewMode((prev) => !prev)}>
                    {previewMode ? 'Edit' : 'Preview'}
                  </Button>
                  {formState.id && (
                    <Button
                      variant="outline"
                      onClick={() => saveGuideline({ forceCreate: true })}
                      disabled={!isValid || savingAsNew}
                    >
                      {savingAsNew ? 'Saving Copy...' : 'Save as New'}
                    </Button>
                  )}
                  <Button onClick={() => saveGuideline()} disabled={!isValid || saving || savingAsNew}>
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
                <Label htmlFor="guideline-content">Guideline Content (Markdown)</Label>
                {previewMode ? (
                  <div className="min-h-[220px] w-full rounded-md border border-input bg-background px-4 py-3 text-base leading-7">
                    {formState.content.trim() ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {formState.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground">Nothing to preview yet.</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    id="guideline-content"
                    className="min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formState.content}
                    onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
                    placeholder="Write or paste the guideline text in markdown."
                  />
                )}
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
