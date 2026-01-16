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

type PromptFormState = {
  id?: string
  name: string
  type: PromptType
  version: string
  isActive: boolean
  content: string
}

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
  const [formState, setFormState] = useState<PromptFormState>(emptyFormState)

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

  const savePrompt = async () => {
    if (!isValid || saving) {
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formState.name.trim(),
        type: formState.type,
        version: formState.version.trim(),
        content: formState.content,
        isActive: formState.isActive,
      }

      const response = await fetch(
        formState.id ? `/api/content-tool/prompts/${formState.id}` : '/api/content-tool/prompts',
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
      const updatedPrompt = data.prompt as ContentPrompt

      setPrompts((prev) => {
        if (!formState.id) {
          return [updatedPrompt, ...prev]
        }
        return prev.map((prompt) => (prompt.id === updatedPrompt.id ? updatedPrompt : prompt))
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
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={closeEditor}>
                    Cancel
                  </Button>
                  <Button onClick={savePrompt} disabled={!isValid || saving}>
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
                <Label htmlFor="prompt-content">Prompt Content</Label>
                <textarea
                  id="prompt-content"
                  className="min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formState.content}
                  onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="Paste the full system prompt here."
                />
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
