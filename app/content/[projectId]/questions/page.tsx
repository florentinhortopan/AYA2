'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContentQuestion } from '@/types/content'

export default function QuestionsPage({ params }: { params: { projectId: string } }) {
  const [questions, setQuestions] = useState<ContentQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [generationInput, setGenerationInput] = useState(
    'Generate 25 questions in a markdown table with columns: topic, persona, tone, question, source_url.'
  )
  const [generationOutput, setGenerationOutput] = useState('')
  const [generationError, setGenerationError] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch(`/api/content-tool/projects/${params.projectId}/questions`)
        if (response.ok) {
          const data = await response.json()
          setQuestions(data.questions || [])
        }
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [params.projectId])

  const handleGenerate = async () => {
    if (generating) {
      return
    }

    setGenerating(true)
    setGenerationError('')
    setGenerationOutput('')

    try {
      const response = await fetch('/api/content-tool/prompts/questions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.projectId,
          userMessage: generationInput
        })
      })

      const data = await response.json()
      if (!response.ok) {
        setGenerationError(data.error || 'Generation failed.')
        return
      }

      setGenerationOutput(data.output || '')
    } catch (error) {
      setGenerationError('Generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title="Questions"
            description="Edit, rate, and approve generated questions."
            actions={(
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                  {generating ? 'Generating...' : 'Generate Questions'}
                </Button>
                <Button>Export</Button>
              </div>
            )}
          />

          <div className="border border-border rounded-lg p-4 mb-6 space-y-3">
            <div>
              <p className="text-sm font-medium">Generation Instructions</p>
              <p className="text-xs text-muted-foreground">
                Uses the project prompt and guideline from the database.
              </p>
            </div>
            <textarea
              className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={generationInput}
              onChange={(event) => setGenerationInput(event.target.value)}
            />
            {generationError && (
              <p className="text-sm text-red-500">{generationError}</p>
            )}
            {generationOutput && (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
                {generationOutput}
              </div>
            )}
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading questions...</p>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Topic</th>
                    <th className="text-left p-3">Persona</th>
                    <th className="text-left p-3">Tone</th>
                    <th className="text-left p-3">Question</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Rating</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => (
                    <tr key={question.id} className="border-t border-border">
                      <td className="p-3">{question.topic}</td>
                      <td className="p-3">{question.persona || '—'}</td>
                      <td className="p-3">{question.tone || '—'}</td>
                      <td className="p-3">{question.questionText}</td>
                      <td className="p-3">
                        <Badge variant="outline">{question.status}</Badge>
                      </td>
                      <td className="p-3">{question.ratingValue ?? question.ratingDefault ?? '—'}</td>
                      <td className="p-3">
                        <Link href={`/content/${params.projectId}/answers`}>
                          <Button size="sm" variant="outline">View Answers</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
