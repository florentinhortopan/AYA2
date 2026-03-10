'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { Button } from '@/components/ui/button'
import { ChatOverlay, ImmersiveChatMessage } from '@/components/content/immersive/chat-overlay'
import { SceneCanvas } from '@/components/content/immersive/scene-canvas'
import {
  ImmersiveCard,
  ImmersiveScenePayload,
  SceneDirective
} from '@/lib/content/immersive/scene-orchestrator'

interface WorkspaceState {
  title: string
  summary: string
  audience: string
  tone: string
  goals: string[]
  sections: Array<{
    id: string
    title: string
    status: 'draft' | 'in_review' | 'ready'
    notes: string
  }>
}

const DEFAULT_STATE: WorkspaceState = {
  title: 'Immersive experience draft',
  summary: 'Interactive scene-driven assistant experience',
  audience: 'Prospective Army candidates',
  tone: 'confident',
  goals: ['Engage', 'Educate', 'Convert'],
  sections: [
    { id: 'strategy', title: 'Strategy', status: 'draft', notes: '' },
    { id: 'questions', title: 'Questions', status: 'draft', notes: '' },
    { id: 'answers', title: 'Answers', status: 'draft', notes: '' },
    { id: 'publish', title: 'Publish', status: 'draft', notes: '' }
  ]
}

const logImmersiveEvent = (name: string, payload: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('immersive-event', { detail: { name, ...payload } }))
  }
  console.info('[ImmersiveTelemetry]', name, payload)
}

export default function ImmersiveProjectPage({ params }: { params: { projectId: string } }) {
  const [projectName, setProjectName] = useState('Immersive Project')
  const [messages, setMessages] = useState<ImmersiveChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Welcome to the immersive workspace. Ask for jobs, videos, or evidence and I will reshape the page with transitions.',
      timestamp: new Date().toISOString()
    }
  ])
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<WorkspaceState>(DEFAULT_STATE)
  const [cards, setCards] = useState<ImmersiveCard[]>([])
  const [directives, setDirectives] = useState<SceneDirective[]>([])
  const [latestAssistantText, setLatestAssistantText] = useState('')

  useEffect(() => {
    const loadProject = async () => {
      const response = await fetch(`/api/content-tool/projects/${params.projectId}`)
      if (!response.ok) return
      const data = await response.json()
      const name = data.project?.name || 'Immersive Project'
      setProjectName(name)
      setState((current) => ({ ...current, title: name }))
    }
    loadProject()
  }, [params.projectId])

  const handleSubmit = async (message: string, settings: { sttEnabled: boolean; ttsEnabled: boolean }) => {
    const userMessage: ImmersiveChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }
    setMessages((current) => [...current, userMessage])
    setLoading(true)

    try {
      const response = await fetch(`/api/content-tool/projects/${params.projectId}/immersive-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: messages.slice(-8).map((entry) => ({ role: entry.role, content: entry.content })),
          state,
          ...settings
        })
      })
      const data = (await response.json()) as ImmersiveScenePayload | { error?: string }
      if (!response.ok || 'error' in data) {
        throw new Error('error' in data ? data.error : 'Failed immersive request')
      }

      setCards(data.contentCards || [])
      setDirectives(data.sceneDirectives || [])
      setLatestAssistantText(data.assistantReply)
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.assistantReply, timestamp: new Date().toISOString() }
      ])

      logImmersiveEvent('scene_rendered', {
        journey: data.telemetry.journey,
        cardCount: data.contentCards.length,
        confidence: data.telemetry.confidence
      })
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'I hit an issue while building the scene. Please retry your request.',
          timestamp: new Date().toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const heading = useMemo(() => `${projectName} · Immersive Experience`, [projectName])

  return (
    <RequireAuth>
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.2),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.18),transparent_28%)]" />

        <header className="relative z-20 flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">{heading}</h1>
            <p className="text-sm text-white/70">Infinite scroll chat + adaptive content cards + voice controls</p>
          </div>
          <Link href={`/content/${params.projectId}`}>
            <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              Back To Workspace
            </Button>
          </Link>
        </header>

        <div className="relative z-10 h-[calc(100vh-74px)]">
          <SceneCanvas
            cards={cards}
            directives={directives}
            onCardClick={(card) => {
              logImmersiveEvent('card_clicked', { cardId: card.id, cardType: card.type })
              if (card.type === 'cta') {
                logImmersiveEvent('cta_clicked', { cardId: card.id, sourceUrl: card.sourceUrl || null })
              }
            }}
          />
        </div>

        <ChatOverlay
          messages={messages}
          loading={loading}
          latestAssistantText={latestAssistantText}
          onSubmit={handleSubmit}
          onTelemetryEvent={(eventName, payload) => {
            logImmersiveEvent(eventName, payload || {})
          }}
        />
      </main>
    </RequireAuth>
  )
}
