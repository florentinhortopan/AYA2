'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnswerValidationStatus, ContentAnswer, ContentQuestion, QuestionStatus } from '@/types/content'

export default function PublishPage({ params }: { params: { projectId: string } }) {
  const [questions, setQuestions] = useState<ContentQuestion[]>([])
  const [answers, setAnswers] = useState<ContentAnswer[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState('')
  // Unified status order - same for questions and answers
  const questionStatusOrder: QuestionStatus[] = [
    'approved',
    'pending',
    'draft',
    'rejected',
    'published',
    'valid',
    'needs_review',
    'invalid'
  ]
  const answerStatusOrder: AnswerValidationStatus[] = questionStatusOrder

  useEffect(() => {
    let isMounted = true

    const loadStats = async () => {
      setLoadingStats(true)
      setStatsError('')

      try {
        const [questionsResponse, answersResponse] = await Promise.all([
          fetch(`/api/content-tool/projects/${params.projectId}/questions`),
          fetch(`/api/content-tool/projects/${params.projectId}/answers`)
        ])

        if (!questionsResponse.ok || !answersResponse.ok) {
          throw new Error('Unable to load approval stats.')
        }

        const questionsData = await questionsResponse.json()
        const answersData = await answersResponse.json()

        if (isMounted) {
          setQuestions(questionsData.questions || [])
          setAnswers(answersData.answers || [])
        }
      } catch (error) {
        if (isMounted) {
          setStatsError('Unable to load approval stats.')
        }
      } finally {
        if (isMounted) {
          setLoadingStats(false)
        }
      }
    }

    loadStats()
    return () => {
      isMounted = false
    }
  }, [params.projectId])

  const questionCounts = useMemo(() => {
    return questions.reduce<Record<QuestionStatus, number>>((acc, question) => {
      acc[question.status] = (acc[question.status] || 0) + 1
      return acc
    }, {} as Record<QuestionStatus, number>)
  }, [questions])

  const answerCounts = useMemo(() => {
    return answers.reduce<Record<AnswerValidationStatus, number>>((acc, answer) => {
      acc[answer.validationStatus] = (acc[answer.validationStatus] || 0) + 1
      return acc
    }, {} as Record<AnswerValidationStatus, number>)
  }, [answers])

  const approvedQuestionCount = questionCounts.approved || 0
  const approvedAnswerCount = answerCounts.approved || 0
  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title="Publish"
            description="Review approval status before publishing."
            actions={(
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Publish
              </Button>
            )}
          />

          <div className="space-y-4">
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Approval Status</h3>
                <Badge variant="secondary">Ready</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {loadingStats
                  ? 'Loading approval stats...'
                  : `${approvedQuestionCount} questions approved, ${approvedAnswerCount} answers approved.`}
              </p>
              {statsError && (
                <p className="text-xs text-red-500 mt-2">{statsError}</p>
              )}
            </div>
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Export</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a href={`/api/content-tool/projects/${params.projectId}/export?format=csv`}>
                      CSV
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a href={`/api/content-tool/projects/${params.projectId}/export?format=json`}>
                      JSON
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a href={`/api/content-tool/projects/${params.projectId}/export?format=markdown`}>
                      Markdown
                    </a>
                  </Button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>
                  Questions:{' '}
                  {questionStatusOrder
                    .map((status) => `${status.replace('_', ' ')} ${questionCounts[status] || 0}`)
                    .join(' · ')}
                </p>
                <p>
                  Answers:{' '}
                  {answerStatusOrder
                    .map((status) => `${status.replace('_', ' ')} ${answerCounts[status] || 0}`)
                    .join(' · ')}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Export the approved Q&A set for review or backup.
              </p>
            </div>
          </div>

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
