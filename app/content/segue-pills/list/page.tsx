'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/content/page-header'
import { ContentSubNav } from '@/components/content/sub-nav'

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  generating: 'bg-blue-500/10 text-blue-500',
  testing: 'bg-yellow-500/10 text-yellow-500',
  completed: 'bg-green-500/10 text-green-500',
  published: 'bg-emerald-500/10 text-emerald-600',
  archived: 'bg-muted text-muted-foreground'
}

interface PillResearch {
  id: string
  name: string
  description: string | null
  status: string
  personas: string[]
  topics: string[]
  questionCount: number
  createdAt: string
  updatedAt: string
  qaProject?: {
    id: string
    name: string
    status: string
  } | null
  campaignGoal?: {
    id: string
    name: string
    goalType: string
  } | null
  hasIntentClusters: boolean
  hasRecommendations: boolean
}

export default function PillResearchListPage() {
  const [researches, setResearches] = useState<PillResearch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadResearches = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/segue-pills/researches')
        if (response.ok) {
          const data = await response.json()
          const researchesData = data.researches || []
          
          // Format researches with additional info
          const formattedResearches: PillResearch[] = researchesData.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            status: r.status,
            personas: r.personas || [],
            topics: r.topics || [],
            questionCount: r.questionCount || 0,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            qaProject: r.qaProject || null,
            campaignGoal: r.campaignGoal || null,
            hasIntentClusters: r.intentClusters !== null && r.intentClusters !== undefined,
            hasRecommendations: r.recommendations !== null && r.recommendations !== undefined
          }))
          
          setResearches(formattedResearches)
        } else {
          const errorData = await response.json().catch(() => ({}))
          setError(errorData.error || 'Failed to load research projects')
        }
      } catch (err) {
        console.error('Error loading researches:', err)
        setError('Failed to load research projects')
      } finally {
        setLoading(false)
      }
    }

    loadResearches()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <ContentSubNav />
        <PageHeader
          title="Pill Research Projects"
          description="View and manage all segue pill research sessions. Each research project is linked to a Q&A project for testing."
          actions={(
            <div className="flex items-center gap-2">
              <Link href="/content/segue-pills">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  🧪 New Research
                </Button>
              </Link>
              <Link href="/content/segue-pills/goals">
                <Button variant="outline">Campaign Goals</Button>
              </Link>
            </div>
          )}
        />

        {error && (
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </Card>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading research projects...</p>
        ) : researches.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No research projects found.</p>
            <Link href="/content/segue-pills">
              <Button>Create Your First Research Project</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {researches.map((research) => (
              <Card key={research.id} className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>{research.name}</CardTitle>
                      <CardDescription>
                        {research.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge className={statusStyles[research.status] || 'bg-muted'}>
                      {research.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Q&A Project</p>
                      <p className="font-semibold">
                        {research.qaProject ? (
                          <Link 
                            href={`/content/${research.qaProject.id}`}
                            className="text-primary hover:underline"
                          >
                            {research.qaProject.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Not linked</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Questions</p>
                      <p className="font-semibold">{research.questionCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Progress</p>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs ${research.hasIntentClusters ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {research.hasIntentClusters ? '✓ Clustered' : '○ Not clustered'}
                        </span>
                        <span className={`text-xs ${research.hasRecommendations ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {research.hasRecommendations ? '✓ Recommendations' : '○ No recommendations'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Campaign Goal</p>
                      <p className="font-semibold">
                        {research.campaignGoal ? research.campaignGoal.name : 'None'}
                      </p>
                    </div>
                    <div className="flex items-center md:justify-end gap-2">
                      <Link href={`/content/segue-pills?researchId=${research.id}`}>
                        <Button variant="outline" size="sm">
                          {research.hasRecommendations ? 'View Results' : research.hasIntentClusters ? 'Continue' : 'Edit'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-muted-foreground">Personas:</span>
                      {research.personas.length > 0 ? (
                        research.personas.map((p, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {p.replace('_', ' ')}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                      <span className="text-muted-foreground ml-4">Topics:</span>
                      {research.topics.length > 0 ? (
                        research.topics.map((t, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {t.replace('_', ' ')}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(research.createdAt).toLocaleDateString()} • 
                      Updated: {new Date(research.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
