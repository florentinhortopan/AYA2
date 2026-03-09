'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type SectionStatus = 'draft' | 'in_review' | 'ready'

interface WorkspaceSection {
  id: string
  title: string
  status: SectionStatus
  notes: string
}

interface WorkspaceState {
  title: string
  summary: string
  audience: string
  tone: string
  goals: string[]
  sections: WorkspaceSection[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const badgeStyles: Record<SectionStatus, string> = {
  draft: 'bg-muted text-foreground',
  in_review: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200',
  ready: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200'
}

export default function ProjectImmersivePage({ params }: { params: { projectId: string } }) {
  const { status } = useSession()
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    title: `Project ${params.projectId}`,
    summary: 'Draft your content strategy and refine it with the copilot chat.',
    audience: 'Prospective candidates',
    tone: 'supportive',
    goals: ['Clarify the value proposition'],
    sections: [
      { id: 'strategy', title: 'Strategy', status: 'draft', notes: 'Define message hierarchy.' },
      { id: 'questions', title: 'Questions', status: 'in_review', notes: 'Review generated prompts.' },
      { id: 'answers', title: 'Answers', status: 'draft', notes: 'Expand high-confidence variants.' },
      { id: 'publish', title: 'Publish', status: 'draft', notes: 'Waiting for final review.' }
    ]
  })
  const [chatOpen, setChatOpen] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "I can update this page in real time. Ask me to change title, summary, audience, tone, goals, or section statuses."
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const progress = useMemo(() => {
    const readyCount = workspace.sections.filter((item) => item.status === 'ready').length
    return Math.round((readyCount / workspace.sections.length) * 100)
  }, [workspace.sections])

  const applyUpdates = (updates: any) => {
    setWorkspace((current) => {
      const next = { ...current, sections: [...current.sections], goals: [...current.goals] }
      if (typeof updates?.setTitle === 'string' && updates.setTitle.trim()) {
        next.title = updates.setTitle.trim()
      }
      if (typeof updates?.setSummary === 'string' && updates.setSummary.trim()) {
        next.summary = updates.setSummary.trim()
      }
      if (typeof updates?.setAudience === 'string' && updates.setAudience.trim()) {
        next.audience = updates.setAudience.trim()
      }
      if (typeof updates?.setTone === 'string' && updates.setTone.trim()) {
        next.tone = updates.setTone.trim()
      }
      if (Array.isArray(updates?.addGoals)) {
        const normalized = updates.addGoals
          .map((goal: unknown) => String(goal || '').trim())
          .filter(Boolean)
        next.goals = Array.from(new Set([...next.goals, ...normalized]))
      }
      if (Array.isArray(updates?.updateSectionStatus)) {
        updates.updateSectionStatus.forEach((change: any) => {
          const index = next.sections.findIndex((section) => section.id === change.id)
          if (index === -1) return
          if (['draft', 'in_review', 'ready'].includes(change.status)) {
            next.sections[index] = {
              ...next.sections[index],
              status: change.status as SectionStatus,
              notes:
                typeof change.notes === 'string' && change.notes.trim()
                  ? change.notes.trim()
                  : next.sections[index].notes
            }
          }
        })
      }
      return next
    })
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`/api/content-tool/projects/${params.projectId}/immersive-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-8),
          state: workspace
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Chat request failed')
      }

      if (data.updates) {
        applyUpdates(data.updates)
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.reply || 'Updated.'
        }
      ])
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `I hit an error: ${error.message || 'unknown issue'}`
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (status === 'unauthenticated') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This immersive workspace is available for signed-in users.
            </p>
            <Link href="/auth/signin">
              <Button className="w-full">Go to Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{workspace.title}</h1>
            <p className="text-muted-foreground max-w-2xl">{workspace.summary}</p>
            <p className="text-sm">
              Audience: <span className="font-medium">{workspace.audience}</span> · Tone:{' '}
              <span className="font-medium capitalize">{workspace.tone}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Completion</p>
            <p className="text-2xl font-semibold">{progress}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {workspace.goals.map((goal) => (
                  <p key={goal} className="text-sm">
                    - {goal}
                  </p>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workspace.sections.map((section) => (
                <Card key={section.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <span
                      className={`text-xs rounded-full px-2.5 py-1 font-medium ${badgeStyles[section.status]}`}
                    >
                      {section.status.replace('_', ' ')}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{section.notes}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="h-[70vh] flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Immersive Copilot</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setChatOpen((current) => !current)}>
                  {chatOpen ? 'Hide' : 'Show'}
                </Button>
              </div>
            </CardHeader>
            {chatOpen && (
              <>
                <CardContent className="flex-1 overflow-y-auto space-y-3">
                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className="space-y-1">
                      <p className="text-[11px] uppercase text-muted-foreground">{message.role}</p>
                      <div
                        className={`rounded-md px-3 py-2 text-sm ${
                          message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {loading && <p className="text-xs text-muted-foreground">Updating workspace...</p>}
                </CardContent>
                <div className="border-t p-3 flex gap-2">
                  <Input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Try: set tone to confident and mark publish ready"
                    disabled={loading}
                  />
                  <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                    Send
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}
