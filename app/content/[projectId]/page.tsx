'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const sections = [
  { title: 'Questions', href: 'questions', description: 'Review and edit generated questions.' },
  { title: 'Answers', href: 'answers', description: 'Review and refine answer variants.' },
  { title: 'Prompts', href: '/content/prompts', description: 'Edit prompt templates for this workflow.' },
  { title: 'Guidelines', href: '/content/guidelines', description: 'Edit guideline content and versions.' },
  { title: 'Batch', href: 'batch', description: 'Run and monitor batch generation.' },
  { title: 'Validation', href: 'validate', description: 'Check URLs and corpus validation.' },
  { title: 'Publish', href: 'publish', description: 'Approve and publish content.' },
  { title: 'Immersive', href: 'immersive', description: 'Launch the full-page immersive chatbot experience.' }
]

export default function ProjectWorkspacePage({ params }: { params: { projectId: string } }) {
  const [projectName, setProjectName] = useState('')
  const [nameDraft, setNameDraft] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [loadingName, setLoadingName] = useState(true)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch(`/api/content-tool/projects/${params.projectId}`)
        if (response.ok) {
          const data = await response.json()
          const name = data.project?.name || ''
          setProjectName(name)
          setNameDraft(name)
        }
      } finally {
        setLoadingName(false)
      }
    }

    loadProject()
  }, [params.projectId])

  const saveName = async () => {
    if (savingName) {
      return
    }

    const trimmed = nameDraft.trim()
    if (!trimmed) {
      setNameError('Project name is required.')
      return
    }

    setSavingName(true)
    setNameError('')
    try {
      const response = await fetch(`/api/content-tool/projects/${params.projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      })

      if (!response.ok) {
        const data = await response.json()
        setNameError(data.error || 'Unable to update name.')
        return
      }

      setProjectName(trimmed)
      setNameDraft(trimmed)
    } finally {
      setSavingName(false)
    }
  }

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <PageHeader
            title={projectName || `Project ${params.projectId}`}
            description="Workspace overview for content generation."
            actions={(
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/content">
                  <Button variant="outline">Back to Content</Button>
                </Link>
              </div>
            )}
          />

          <div className="border border-border rounded-lg p-4 mb-8 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[220px] flex-1">
                <Input
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  placeholder={loadingName ? 'Loading project name...' : 'Project name'}
                  disabled={loadingName || savingName}
                />
              </div>
              <Button onClick={saveName} disabled={loadingName || savingName}>
                {savingName ? 'Saving...' : 'Save Title'}
              </Button>
            </div>
            {nameError && (
              <p className="text-sm text-red-500">{nameError}</p>
            )}
            {!loadingName && projectName && (
              <p className="text-xs text-muted-foreground">
                Current title: {projectName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section) => (
              <Card key={section.title} className="border-border/50">
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-muted-foreground">{section.description}</p>
                  <Link href={section.href.startsWith('/') ? section.href : `/content/${params.projectId}/${section.href}`}>
                    <Button variant="outline">Open</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </RequireAuth>
  )
}
