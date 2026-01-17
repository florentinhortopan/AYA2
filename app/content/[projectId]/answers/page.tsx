'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContentAnswer, ContentQuestion } from '@/types/content'

export default function AnswersPage({ params }: { params: { projectId: string } }) {
  const [answers, setAnswers] = useState<(ContentAnswer & { question?: { questionText: string } })[]>([])
  const [questions, setQuestions] = useState<ContentQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [generationInput, setGenerationInput] = useState(
    'Generate answer variants in a markdown table with columns: question, variant_level, answer, source_link.'
  )
  const [generationOutput, setGenerationOutput] = useState('')
  const [generationError, setGenerationError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('')
  const [parsedRows, setParsedRows] = useState<Array<{
    questionText?: string
    variantLevel: string
    answerText: string
    sourceLink?: string
  }>>([])

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId),
    [questions, selectedQuestionId]
  )

  const loadAnswers = useCallback(async () => {
    try {
      const response = await fetch(`/api/content-tool/projects/${params.projectId}/answers`)
      if (response.ok) {
        const data = await response.json()
        setAnswers(data.answers || [])
      }
    } finally {
      setLoading(false)
    }
  }, [params.projectId])

  const loadQuestions = useCallback(async () => {
    try {
      const response = await fetch(`/api/content-tool/projects/${params.projectId}/questions`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      }
    } catch (error) {
      setQuestions([])
    }
  }, [params.projectId])

  useEffect(() => {
    loadAnswers()
    loadQuestions()
  }, [loadAnswers, loadQuestions])

  const handleGenerate = async () => {
    if (generating) {
      return
    }

    setGenerating(true)
    setGenerationError('')
    setGenerationOutput('')
    setParsedRows([])

    try {
      const response = await fetch('/api/content-tool/prompts/answers/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.projectId,
          questionId: selectedQuestionId || undefined,
          userMessage: generationInput
        })
      })

      const data = await response.json()
      if (!response.ok) {
        setGenerationError(data.error || 'Generation failed.')
        return
      }

      setGenerationOutput(data.output || '')
      setParsedRows(data.parsedAnswers || [])
      if (data.createdCount > 0) {
        await loadAnswers()
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
            title="Answers"
            description="Review answer variants, ratings, and validations."
            actions={(
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={generating || !selectedQuestionId}
              >
                {generating ? 'Generating...' : 'Generate Answers'}
              </Button>
            )}
          />

          <div className="border border-border rounded-lg p-4 mb-6 space-y-3">
            <div>
              <p className="text-sm font-medium">Generation Instructions</p>
              <p className="text-xs text-muted-foreground">
                Select a question to generate answers using the project prompt and guideline.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Question</p>
              <Select value={selectedQuestionId} onValueChange={setSelectedQuestionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a question to generate answers" />
                </SelectTrigger>
                <SelectContent>
                  {questions.map((question) => (
                    <SelectItem key={question.id} value={question.id}>
                      {question.questionText}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedQuestion && (
                <p className="text-xs text-muted-foreground">
                  Topic: {selectedQuestion.topic} · Persona: {selectedQuestion.persona || '—'} · Tone: {selectedQuestion.tone || '—'}
                </p>
              )}
              {questions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No questions available yet. Generate questions first.
                </p>
              )}
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
                        <th className="text-left p-2">Question</th>
                        <th className="text-left p-2">Variant</th>
                        <th className="text-left p-2">Answer</th>
                        <th className="text-left p-2">Source Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, index) => (
                        <tr key={`${row.answerText}-${index}`} className="border-t border-border">
                          <td className="p-2">{row.questionText || '—'}</td>
                          <td className="p-2">{row.variantLevel}</td>
                          <td className="p-2">{row.answerText}</td>
                          <td className="p-2">{row.sourceLink || '—'}</td>
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
            <p className="text-muted-foreground">Loading answers...</p>
          ) : (
            <div className="space-y-4">
              {answers.map((answer) => (
                <div key={answer.id} className="border border-border rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{answer.variantLevel.replace('_', ' ')}</Badge>
                      <Badge variant="outline">{answer.validationStatus}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Rating: {answer.ratingValue ?? answer.ratingDefault ?? '—'}
                    </div>
                  </div>
                  {answer.question?.questionText && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Question: {answer.question.questionText}
                    </p>
                  )}
                  {!answer.question?.questionText && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Question: <Link className="underline" href={`/content/${params.projectId}/questions`}>View question list</Link>
                    </p>
                  )}
                  <p className="mt-3 text-sm">{answer.answerText}</p>
                  {answer.sourceLink && (
                    <a className="text-sm text-blue-500 hover:underline mt-2 inline-block" href={answer.sourceLink}>
                      {answer.sourceLink}
                    </a>
                  )}
                </div>
              ))}
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
