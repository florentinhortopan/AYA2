'use client'

import { useEffect, useState } from 'react'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContentPrompt, PromptType } from '@/types/content'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type PromptFormState = {
  id?: string
  name: string
  type: PromptType
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

const emptyFormState: PromptFormState = {
  name: '',
  type: 'question_generator',
  version: '',
  isActive: false,
  content: ''
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<ContentPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingAsNew, setSavingAsNew] = useState(false)
  const [formState, setFormState] = useState<PromptFormState>(emptyFormState)
  const [previewMode, setPreviewMode] = useState(false)

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

  const openNewPrompt = () => {
    setFormState(emptyFormState)
    setPreviewMode(false)
    setEditorOpen(true)
  }

  const openEditPrompt = (prompt: ContentPrompt) => {
    setFormState({
      id: prompt.id,
      name: prompt.name,
      type: prompt.type,
      version: prompt.version,
      isActive: prompt.isActive,
      content: prompt.content ?? ''
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

  const savePrompt = async (options?: { forceCreate?: boolean }) => {
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
        type: formState.type,
        version: formState.version.trim(),
        content: formState.content,
        isActive: formState.isActive,
      }

      const response = await fetch(
        formState.id && !forceCreate
          ? `/api/content-tool/prompts/${formState.id}`
          : '/api/content-tool/prompts',
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
      const updatedPrompt = data.prompt as ContentPrompt

      setPrompts((prev) => {
        if (!formState.id || forceCreate) {
          return [updatedPrompt, ...prev]
        }
        return prev.map((prompt) => (prompt.id === updatedPrompt.id ? updatedPrompt : prompt))
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
            title="Prompts"
            description="Manage question and answer generator prompts."
            actions={(
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={openNewPrompt}
              >
                New Prompt
              </Button>
            )}
          />

          {editorOpen && (
            <div className="border border-border rounded-lg p-6 mb-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {formState.id ? 'Edit Prompt' : 'New Prompt'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Update the prompt content and version details.
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
                      onClick={() => savePrompt({ forceCreate: true })}
                      disabled={!isValid || savingAsNew}
                    >
                      {savingAsNew ? 'Saving Copy...' : 'Save as New'}
                    </Button>
                  )}
                  <Button onClick={() => savePrompt()} disabled={!isValid || saving || savingAsNew}>
                    {saving ? 'Saving...' : 'Save Prompt'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prompt-name">Name</Label>
                  <Input
                    id="prompt-name"
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Prompt name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt-version">Version</Label>
                  <Input
                    id="prompt-version"
                    value={formState.version}
                    onChange={(event) => setFormState((prev) => ({ ...prev, version: event.target.value }))}
                    placeholder="1.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formState.type}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, type: value as PromptType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="question_generator">Question Generator</SelectItem>
                      <SelectItem value="answer_generator">Answer Generator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <input
                    id="prompt-active"
                    type="checkbox"
                    className="h-4 w-4 rounded border border-input"
                    checked={formState.isActive}
                    onChange={(event) => setFormState((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  <Label htmlFor="prompt-active">Mark as active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt-content">Prompt Content (Markdown)</Label>
                {previewMode ? (
                  <div className="min-h-[220px] w-full rounded-md border border-input bg-background px-4 py-3 text-base leading-7 prose prose-sm sm:prose-base prose-invert max-w-none">
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
                    id="prompt-content"
                    className="min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formState.content}
                    onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
                    placeholder="Write or paste the full prompt in markdown."
                  />
                )}
              </div>
            </div>
          )}

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
                    <Button size="sm" variant="outline" onClick={() => openEditPrompt(prompt)}>
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
