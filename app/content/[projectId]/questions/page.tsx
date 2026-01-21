'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContentQuestion, QuestionStatus } from '@/types/content'

export default function QuestionsPage({ params }: { params: { projectId: string } }) {
  const [questions, setQuestions] = useState<ContentQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [generationInput, setGenerationInput] = useState(
    'Generate 25 questions in a markdown table with columns: topic, persona, tone, question, source_url.'
  )
  const [generationOutput, setGenerationOutput] = useState('')
  const [generationError, setGenerationError] = useState('')
  const [statusError, setStatusError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [parsedRows, setParsedRows] = useState<Array<{
    topic: string
    persona?: string
    tone?: string
    questionText: string
    sourceUrl?: string
  }>>([])
  const questionStatusOptions: QuestionStatus[] = ['draft', 'pending', 'approved', 'rejected', 'published']

  const loadQuestions = useCallback(async () => {
    try {
      const response = await fetch(`/api/content-tool/projects/${params.projectId}/questions`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      }
    } finally {
      setLoading(false)
    }
  }, [params.projectId])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const handleStatusChange = async (questionId: string, nextStatus: QuestionStatus) => {
    setStatusError('')
    const previous = questions.find((question) => question.id === questionId)
    if (!previous || previous.status === nextStatus) {
      return
    }

    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? { ...question, status: nextStatus } : question
      )
    )

    try {
      const response = await fetch(`/api/content-tool/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })

      if (!response.ok) {
        throw new Error('Unable to update status.')
      }
    } catch (error) {
      setQuestions((current) =>
        current.map((question) =>
          question.id === questionId ? { ...question, status: previous.status } : question
        )
      )
      setStatusError('Unable to update status. Please try again.')
    }
  }

  const handleGenerate = async () => {
    if (generating) {
      return
    }

    setGenerating(true)
    setGenerationError('')
    setGenerationOutput('')
    setParsedRows([])

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
      setParsedRows(data.parsedQuestions || [])
      if (data.createdCount > 0) {
        await loadQuestions()
      }
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
            {parsedRows.length > 0 && (
              <div className="rounded-md border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="text-left p-2">Topic</th>
                        <th className="text-left p-2">Persona</th>
                        <th className="text-left p-2">Tone</th>
                        <th className="text-left p-2">Question</th>
                        <th className="text-left p-2">Source URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, index) => (
                        <tr key={`${row.questionText}-${index}`} className="border-t border-border">
                          <td className="p-2">{row.topic}</td>
                          <td className="p-2">{row.persona || '—'}</td>
                          <td className="p-2">{row.tone || '—'}</td>
                          <td className="p-2">{row.questionText}</td>
                          <td className="p-2">{row.sourceUrl || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
              {statusError && (
                <p className="text-sm text-red-500 p-3 border-b border-border">
                  {statusError}
                </p>
              )}
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
                        <div className="min-w-[140px]">
                          <Select
                            value={question.status}
                            onValueChange={(value) => handleStatusChange(question.id, value as QuestionStatus)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {(questionStatusOptions.includes(question.status)
                                ? questionStatusOptions
                                : [...questionStatusOptions, question.status]
                              ).map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
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
