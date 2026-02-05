'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { ContentProject } from '@/types/content'

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-500/10 text-blue-500',
  review: 'bg-yellow-500/10 text-yellow-500',
  published: 'bg-green-500/10 text-green-500',
  archived: 'bg-muted text-muted-foreground'
}

export default function ContentPage() {
  const [projects, setProjects] = useState<ContentProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/content-tool/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        }
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title="Content"
            description="Manage Q&A generation projects, prompts, and guidelines."
            actions={(
              <div className="flex items-center gap-2">
                <Link href="/content/segue-pills">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                    🧪 Segue Pills Lab
                  </Button>
                </Link>
                <Link href="/content/prompts">
                  <Button variant="outline">Prompts</Button>
                </Link>
                <Link href="/content/guidelines">
                  <Button variant="outline">Guidelines</Button>
                </Link>
                <Link href="/content/new">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    New Project
                  </Button>
                </Link>
              </div>
            )}
          />

          {loading ? (
            <p className="text-muted-foreground">Loading projects...</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => (
              <Card key={project.id} className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <Badge className={statusStyles[project.status]}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Questions</p>
                      <p className="font-semibold">{project.questionCount}/{project.targetQuestionCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Answers</p>
                      <p className="font-semibold">{project.answerCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Prompts</p>
                      <p className="font-semibold">
                        {project.promptIds.questionPromptId && project.promptIds.answerPromptId ? 'Configured' : 'Missing'}
                      </p>
                    </div>
                    <div className="flex items-center md:justify-end">
                      <Link href={`/content/${project.id}`}>
                        <Button variant="outline">Open</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  )
}
