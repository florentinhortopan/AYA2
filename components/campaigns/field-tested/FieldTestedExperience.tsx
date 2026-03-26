'use client'

import { useEffect, useMemo, useState } from 'react'
import { FieldTestedHero } from './FieldTestedHero'
import { LensSelector } from './LensSelector'
import { WarriorWheelInteractive } from './WarriorWheelInteractive'
import { FieldStoryStack } from './FieldStoryStack'
import { RealityCheckModule } from './RealityCheckModule'
import { JourneyRecap } from './JourneyRecap'
import { ActionLane } from './ActionLane'
import {
  defaultFieldTestedProfile,
  fallbackStoryCards,
  sectionSpecs,
  warriorAttributes
} from '@/lib/campaigns/field-tested/content'
import {
  AudienceLens,
  ContentAffinity,
  ConcernFlag,
  FieldTestedProfile,
  FieldStoryCardAsset,
  FieldTestedVariant
} from '@/lib/campaigns/field-tested/types'
import { Button } from '@/components/ui/button'

interface FieldTestedExperienceProps {
  variant: FieldTestedVariant
}

type CopilotReply = {
  answer: string
  nextPrompt: string
}

const pathBuilderQuestions = [
  {
    id: 'priority',
    title: 'What matters most right now?',
    options: ['Real-world skills', 'Stable next step', 'Community support']
  },
  {
    id: 'workstyle',
    title: 'Which work style sounds most like you?',
    options: ['Hands-on problem solving', 'Team coordination', 'Structured progression']
  },
  {
    id: 'timeline',
    title: 'When do you want to take your first real step?',
    options: ['This week', 'This month', 'Still exploring']
  }
]

function dedupe<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

export function FieldTestedExperience({ variant }: FieldTestedExperienceProps) {
  const interactive = variant !== 'v1'
  const aiEnabled = variant === 'v3'

  const [profile, setProfile] = useState<FieldTestedProfile>(defaultFieldTestedProfile)
  const [storyReviewed, setStoryReviewed] = useState(0)
  const [concern, setConcern] = useState<ConcernFlag | null>(null)
  const [pathAnswers, setPathAnswers] = useState<Record<string, string>>({})
  const [copilotPrompt, setCopilotPrompt] = useState('')
  const [copilotReply, setCopilotReply] = useState<CopilotReply | null>(null)
  const [copilotLoading, setCopilotLoading] = useState(false)
  const [storyCards, setStoryCards] = useState<FieldStoryCardAsset[]>(fallbackStoryCards)
  const [storyCardsSource, setStoryCardsSource] = useState<'api' | 'fallback'>('fallback')
  const [assetMatchLabel, setAssetMatchLabel] = useState('generic')

  useEffect(() => {
    const loadCampaignAssets = async () => {
      try {
        const query = profile.topAttribute ? `?pillar=${profile.topAttribute}` : ''
        const response = await fetch(`/api/campaigns/field-tested/assets${query}`, { cache: 'no-store' })
        if (!response.ok) return
        const payload = (await response.json()) as {
          cards?: FieldStoryCardAsset[]
          source?: string
          selectedPillar?: string | null
          matchedToPillar?: number
        }
        if (payload.cards && payload.cards.length > 0) {
          setStoryCards(payload.cards)
          setStoryCardsSource(payload.source === 'knowledge-source-media' ? 'api' : 'fallback')
          if (payload.selectedPillar) {
            setAssetMatchLabel(`${payload.selectedPillar} (${payload.matchedToPillar || 0} matches)`)
          } else {
            setAssetMatchLabel('generic')
          }
        }
      } catch {
        // Keep fallback cards.
      }
    }
    loadCampaignAssets()
  }, [profile.topAttribute])

  const pathComplete = Object.keys(pathAnswers).length >= pathBuilderQuestions.length

  const canShowWheel = !interactive || !!profile.audienceLens
  const canShowStories = !interactive || !!profile.topAttribute
  const canShowReality = !interactive || storyReviewed >= 2
  const canShowPathBuilder = !interactive || !!concern
  const canShowRecap = !interactive || pathComplete

  const onLensSelect = (lens: AudienceLens) => {
    setProfile((current) => ({
      ...current,
      audienceLens: lens,
      completedSections: dedupe([...current.completedSections, 's2_lens'])
    }))
  }

  const onAttributeSelect = (value: typeof warriorAttributes[number]['id']) => {
    setProfile((current) => ({
      ...current,
      topAttribute: value,
      confidenceScore: Math.min(100, current.confidenceScore + 12),
      completedSections: dedupe([...current.completedSections, 's3_wheel'])
    }))
  }

  const onConcernSelect = (value: ConcernFlag) => {
    setConcern(value)
    setProfile((current) => ({
      ...current,
      concernFlags: dedupe([...current.concernFlags, value]),
      confidenceScore: Math.min(100, current.confidenceScore + 8),
      completedSections: dedupe([...current.completedSections, 's5_reality'])
    }))
  }

  const onPathAnswer = (questionId: string, answer: string) => {
    setPathAnswers((current) => ({ ...current, [questionId]: answer }))
    setProfile((current) => ({
      ...current,
      completedSections: dedupe([...current.completedSections, 's6_path_builder']),
      confidenceScore: Math.min(100, current.confidenceScore + 5)
    }))
  }

  const runCopilot = async () => {
    if (!copilotPrompt.trim()) return
    setCopilotLoading(true)
    try {
      const response = await fetch('/api/campaigns/field-tested/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: copilotPrompt,
          profile: {
            audienceLens: profile.audienceLens,
            topAttribute: profile.topAttribute,
            concernFlags: profile.concernFlags
          }
        })
      })
      const data = (await response.json()) as CopilotReply
      setCopilotReply(data)
      setProfile((current) => ({
        ...current,
        completedSections: dedupe([...current.completedSections, 's7_copilot'])
      }))
    } finally {
      setCopilotLoading(false)
    }
  }

  const recapConcernList = concern ? dedupe([...profile.concernFlags, concern]) : profile.concernFlags

  const sectionReadiness = useMemo(
    () =>
      sectionSpecs.map((spec) => ({
        ...spec,
        ready: profile.completedSections.includes(spec.id)
      })),
    [profile.completedSections]
  )

  return (
    <div className="space-y-8 pb-12">
      <FieldTestedHero />

      <LensSelector selected={profile.audienceLens} onSelect={interactive ? onLensSelect : undefined} disabled={!interactive} />

      {canShowWheel ? (
        <WarriorWheelInteractive
          selected={profile.topAttribute}
          onSelect={interactive ? onAttributeSelect : undefined}
          disabled={!interactive}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Select a lens to unlock the Warrior Wheel.
        </p>
      )}

      {canShowStories ? (
        <FieldStoryStack
          cards={storyCards}
          disabled={!interactive}
          onProgress={({ reviewedCount, responses }) => {
            setStoryReviewed(reviewedCount)
            setProfile((current) => ({
              ...current,
              contentAffinity: dedupe<ContentAffinity>([
                ...current.contentAffinity,
                ...(responses.includes('want_this') ? (['story'] as ContentAffinity[]) : []),
                ...(responses.includes('need_details') ? (['practical'] as ContentAffinity[]) : [])
              ]),
              completedSections: dedupe([...current.completedSections, 's4_stories'])
            }))
          }}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Select a Warrior Wheel attribute to unlock Field Stories.
        </p>
      )}

      {canShowReality ? (
        <RealityCheckModule
          selectedConcern={concern}
          onSelectConcern={interactive ? onConcernSelect : undefined}
          disabled={!interactive}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Review at least two story cards to unlock Reality Check.
        </p>
      )}

      {canShowPathBuilder ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">S6</p>
            <h2 className="text-2xl font-semibold">My Path Builder</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Answer quick prompts to generate your first practical path.
            </p>
          </div>
          <div className="space-y-4">
            {pathBuilderQuestions.map((question) => (
              <div key={question.id} className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm font-semibold">{question.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {question.options.map((option) => {
                    const active = pathAnswers[question.id] === option
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={!interactive}
                        onClick={() => onPathAnswer(question.id, option)}
                        className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/40 hover:text-primary'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Select a concern in Reality Check to unlock the path builder.
        </p>
      )}

      {aiEnabled ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">S7</p>
            <h2 className="text-2xl font-semibold">AI Copilot Moment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask a focused question and get campaign-aware guidance tied to your current profile.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'How do I know if this path fits me?',
              'What should I do first this week?',
              'What does support actually look like?'
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setCopilotPrompt(prompt)}
                className="rounded-full border border-border px-3 py-1 text-xs text-foreground hover:border-primary/40 hover:text-primary"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={copilotPrompt}
              onChange={(event) => setCopilotPrompt(event.target.value)}
              placeholder="Ask a question about your path..."
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
            />
            <Button onClick={runCopilot} disabled={copilotLoading}>
              {copilotLoading ? 'Thinking...' : 'Ask'}
            </Button>
          </div>
          {copilotReply ? (
            <div className="space-y-2 rounded-lg border border-border bg-background p-4">
              <p className="text-sm">{copilotReply.answer}</p>
              <p className="text-xs text-muted-foreground">Try next: {copilotReply.nextPrompt}</p>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
          S7 Copilot unlocks in Version 3. In v1 and v2 this section stays intentionally static.
        </section>
      )}

      {canShowRecap ? (
        <>
          <JourneyRecap lens={profile.audienceLens} topAttribute={profile.topAttribute} resolvedConcerns={recapConcernList} />
          <ActionLane lens={profile.audienceLens} topAttribute={profile.topAttribute} />
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Complete the path builder to unlock recap and action lane.
        </p>
      )}

      <section className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Implementation Readiness Snapshot</p>
        <p className="text-xs text-muted-foreground">
          Story assets source: {storyCardsSource === 'api' ? 'database-backed (KnowledgeSourceMedia)' : 'fallback seed set'}
          {' · '}
          ranking mode: {assetMatchLabel}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Section</th>
                <th className="py-2 pr-3 font-medium">Objective</th>
                <th className="py-2 pr-3 font-medium">Asset Status</th>
                <th className="py-2 font-medium">Ready</th>
              </tr>
            </thead>
            <tbody>
              {sectionReadiness.map((section) => (
                <tr key={section.id} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-medium">{section.title}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{section.objective}</td>
                  <td className="py-2 pr-3">
                    {section.desiredAssets.map((asset) => (
                      <p key={asset.name} className="text-xs text-muted-foreground">
                        {asset.availability}: {asset.name}
                      </p>
                    ))}
                  </td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        section.ready ? 'bg-emerald-600/15 text-emerald-600' : 'bg-amber-600/15 text-amber-600'
                      }`}
                    >
                      {section.ready ? 'complete' : 'in progress'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
