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

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title="Questions"
            description="Edit, rate, and approve generated questions."
            actions={(
              <div className="flex gap-2">
                <Button variant="outline">Generate Questions</Button>
                <Button>Export</Button>
              </div>
            )}
          />

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
                      <td className="p-3">{question.persona}</td>
                      <td className="p-3">{question.tone}</td>
                      <td className="p-3">{question.questionText}</td>
                      <td className="p-3">
                        <Badge variant="outline">{question.status}</Badge>
                      </td>
                      <td className="p-3">{question.ratingValue ?? question.rating}</td>
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
