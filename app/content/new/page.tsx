'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ContentGuideline, ContentPrompt } from '@/types/content'

export default function NewProjectPage() {
  const router = useRouter()
  const [prompts, setPrompts] = useState<ContentPrompt[]>([])
  const [guidelines, setGuidelines] = useState<ContentGuideline[]>([])
  const [formState, setFormState] = useState({
    name: '',
    targetQuestionCount: 250,
    ratingDefault: 3,
    questionPromptId: '',
    answerPromptId: '',
    guidelineId: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOptions = async () => {
      const [promptsResponse, guidelinesResponse] = await Promise.all([
        fetch('/api/content-tool/prompts'),
        fetch('/api/content-tool/guidelines')
      ])

      if (promptsResponse.ok) {
        const data = await promptsResponse.json()
        setPrompts(data.prompts || [])
      }

      if (guidelinesResponse.ok) {
        const data = await guidelinesResponse.json()
        setGuidelines(data.guidelines || [])
      }
    }

    loadOptions()
  }, [])

  const handleCreate = async () => {
    setError(null)
    if (!formState.name.trim()) {
      setError('Project name is required.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch('/api/content-tool/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/content/${data.project.id}`)
      } else {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Failed to create project.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title="Create Project"
            description="Set up a new content generation project."
            actions={(
              <Link href="/content">
                <Button variant="outline">Back</Button>
              </Link>
            )}
          />

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="Army 2026 Q1"
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Target Question Count</Label>
                  <Input
                    id="target"
                    placeholder="250"
                    type="number"
                    min={1}
                    value={formState.targetQuestionCount}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, targetQuestionCount: Number(event.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Rating</Label>
                  <Select
                    value={String(formState.ratingDefault)}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, ratingDefault: Number(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <SelectItem key={value} value={value.toString()}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prompt & Guideline Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question Generator Prompt</Label>
                  <Select
                    value={formState.questionPromptId}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, questionPromptId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      {prompts
                        .filter((prompt) => prompt.type === 'question_generator')
                        .map((prompt) => (
                          <SelectItem key={prompt.id} value={prompt.id}>
                            {prompt.name} (v{prompt.version})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Answer Generator Prompt</Label>
                  <Select
                    value={formState.answerPromptId}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, answerPromptId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      {prompts
                        .filter((prompt) => prompt.type === 'answer_generator')
                        .map((prompt) => (
                          <SelectItem key={prompt.id} value={prompt.id}>
                            {prompt.name} (v{prompt.version})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Guideline File</Label>
                  <Select
                    value={formState.guidelineId}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, guidelineId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select guideline" />
                    </SelectTrigger>
                    <SelectContent>
                      {guidelines.map((guideline) => (
                        <SelectItem key={guideline.id} value={guideline.id}>
                          {guideline.name} (v{guideline.version})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleCreate}
                disabled={submitting}
              >
                Create Project
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-500 text-right">{error}</p>
            )}
          </div>
        </div>
      </main>
    </RequireAuth>
  )
}
