'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContentAnswer } from '@/types/content'

export default function AnswersPage({ params }: { params: { projectId: string } }) {
  const [answers, setAnswers] = useState<(ContentAnswer & { question?: { questionText: string } })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnswers = async () => {
      try {
        const response = await fetch(`/api/content-tool/projects/${params.projectId}/answers`)
        if (response.ok) {
          const data = await response.json()
          setAnswers(data.answers || [])
        }
      } finally {
        setLoading(false)
      }
    }

    loadAnswers()
  }, [params.projectId])

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title="Answers"
            description="Review answer variants, ratings, and validations."
            actions={(
              <Button variant="outline">Generate Answers</Button>
            )}
          />

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
