'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ProgressRail, StepStatus } from '@/components/content/testing/progress-rail'
import { ScoringPanel } from '@/components/content/testing/scoring-panel'
import { IssueTagger } from '@/components/content/testing/issue-tagger'
import { QuoteEvalPanel, QuoteEvalValue } from '@/components/content/testing/quote-eval-panel'
import { NextStepPanel, NextStepEvalValue } from '@/components/content/testing/next-step-panel'
import {
  CRITERION_LABELS,
  READINESS_LABELS,
  READINESS_STYLES,
  TOPIC_AREA_LABELS,
} from '@/types/content-testing'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  Save,
  Sparkles,
  ListChecks,
} from 'lucide-react'

interface Activity {
  id: string
  slug: string
  order: number
  title: string
  objective: string
  script: string | null
  instructions: string | null
  useCaseCategory: string
  requiredCriteria: string[]
  capturesPrompts: boolean
  isSensitive: boolean
  isAdversarial: boolean
  followUpQuestions: string[] | null
  warmupQuestions: Array<{ key: string; question: string }> | null
  wrapUpQuestions: Array<{ key: string; question: string }> | null
  promptBank: Array<{ id: string; promptText: string; topicArea: string | null }>
}

interface SessionData {
  id: string
  participantId: string
  participantType: string
  environment: string
  status: string
  consentConfirmed: boolean
  recordingPermission: boolean
  activityProgress: Record<string, StepStatus> | null
  promptEvaluations: PromptEval[]
  warmupAnswers: { questionKey: string; answer: string | null; keyQuote: string | null; themeTags: string[]; notes: string | null }[]
  summary: Summary | null
}

interface PromptEval {
  id: string
  activitySlug: string
  promptNumber: number
  promptText: string
  promptSource: string
  useCaseCategory: string
  topicArea: string | null
  responseSummary: string | null
  fullResponse: string | null
  participantReaction: string | null
  keyParticipantQuote: string | null
  quoteIncluded: boolean
  nextStepIncluded: boolean
  moderatorNotes: string | null
  observerNotes: string | null
  toneDescription: string | null
  overallReadiness: string | null
  completedAt: string | null
  scores: { criterionKey: string; value: number }[]
  issues: any[]
  quoteEvaluation: any
  nextStepEvaluation: any
}

interface Summary {
  overallHelpfulness: string | null
  strongestContentMoment: string | null
  weakestContentMoment: string | null
  mostConcerningResponse: string | null
  mostAuthenticResponse: string | null
  mostObviousContentGap: string | null
  repeatedTheme: string | null
  riskyResponse: string | null
  marketingSpeakExamples: string | null
  expectedTopics: string | null
  contentGaps: string | null
  prospectImprovementIdeas: string | null
  influencerImprovementIdeas: string | null
  topImprovement: string | null
  otherComments: string | null
  participantTrustLevel: string | null
  participantPerceivedHelpfulness: string | null
  overallContentReadiness: string | null
  topRecommendations: string[] | null
  additionalNotes: string | null
}

interface Props {
  activities: Activity[]
  session: SessionData
}

const TOPIC_KEYS = Object.keys(TOPIC_AREA_LABELS) as Array<keyof typeof TOPIC_AREA_LABELS>

export function VirtualModeratorChat({ activities, session: initialSession }: Props) {
  const { toast } = useToast()
  const router = useRouter()
  const [session, setSession] = useState(initialSession)
  const [activeSlug, setActiveSlug] = useState(
    initialSession.activityProgress
      ? findFirstIncomplete(activities, initialSession.activityProgress)
      : activities[0]?.slug ?? 'setup'
  )
  const active = useMemo(() => activities.find((a) => a.slug === activeSlug), [activities, activeSlug])

  const statuses: Record<string, StepStatus> = useMemo(() => {
    return {
      ...Object.fromEntries(activities.map((a) => [a.slug, 'not_started' as StepStatus])),
      ...(session.activityProgress ?? {}),
    }
  }, [session.activityProgress, activities])

  const requiredCriteria = active?.requiredCriteria ?? []

  // ---- Session-level helpers ----
  const updateProgress = useCallback(
    async (slug: string, status: StepStatus) => {
      const next = { ...(statuses ?? {}), [slug]: status }
      setSession((s) => ({ ...s, activityProgress: next }))
      await fetch(`/api/content-testing/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityProgress: next, status: 'IN_PROGRESS' }),
      })
    },
    [session.id, statuses]
  )

  useEffect(() => {
    if (session.status === 'DRAFT') {
      fetch(`/api/content-testing/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      })
      setSession((s) => ({ ...s, status: 'IN_PROGRESS' }))
      if (!statuses[activeSlug] || statuses[activeSlug] === 'not_started') {
        updateProgress(activeSlug, 'in_progress')
      }
    }
  }, [])

  const goNext = () => {
    const idx = activities.findIndex((a) => a.slug === activeSlug)
    if (idx >= 0 && idx < activities.length - 1) {
      setActiveSlug(activities[idx + 1].slug)
    }
  }

  // ---- Per-activity content ----
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_minmax(0,1fr)_360px] gap-4 lg:gap-6">
      {/* Left: progress rail */}
      <Card className="border-border/50 h-fit lg:sticky lg:top-4">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Session
            </span>
            <Link
              href={`/content/testing/sessions/${session.id}`}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Detail
            </Link>
          </div>
          <div className="px-1 text-sm">
            <div className="font-medium">{session.participantId}</div>
            <div className="text-xs text-muted-foreground">{session.participantType}</div>
          </div>
          <Separator className="my-2" />
          <ProgressRail
            steps={activities.map((a) => ({
              slug: a.slug,
              title: a.title,
              order: a.order,
              isSensitive: a.isSensitive,
              isAdversarial: a.isAdversarial,
            }))}
            active={activeSlug}
            statuses={statuses}
            onSelect={(s) => setActiveSlug(s)}
          />
        </CardContent>
      </Card>

      {/* Center: moderator script + activity body */}
      <div className="min-w-0 space-y-4">
        <ActivityBody
          activity={active}
          session={session}
          setSession={setSession}
          onComplete={async () => {
            await updateProgress(activeSlug, 'complete')
            goNext()
          }}
          onMarkInProgress={() => updateProgress(activeSlug, 'in_progress')}
        />
      </div>

      {/* Right: optional context (only on xl) */}
      <Card className="hidden xl:block border-border/50 h-fit lg:sticky lg:top-4">
        <CardContent className="p-3 space-y-3 text-sm">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Required scoring
            </span>
            {requiredCriteria.length === 0 ? (
              <p className="mt-1 text-xs italic text-muted-foreground">No scoring required.</p>
            ) : (
              <ul className="mt-1 space-y-0.5 text-xs">
                {requiredCriteria.map((c) => (
                  <li key={c}>• {CRITERION_LABELS[c] ?? c}</li>
                ))}
              </ul>
            )}
          </div>
          <Separator />
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Activity
            </span>
            <p className="mt-1 text-xs leading-relaxed">{active?.objective}</p>
            {active?.isSensitive && (
              <p className="mt-2 rounded-md bg-orange-500/10 px-2 py-1 text-[11px] text-orange-500">
                Sensitive topic — keep a calm, supportive tone with the tester.
              </p>
            )}
            {active?.isAdversarial && (
              <p className="mt-2 rounded-md bg-red-500/10 px-2 py-1 text-[11px] text-red-500">
                Adversarial — defaults to High severity if issues are tagged.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function findFirstIncomplete(
  activities: Activity[],
  progress: Record<string, StepStatus>
): string {
  for (const a of activities) {
    if ((progress[a.slug] ?? 'not_started') !== 'complete') return a.slug
  }
  return activities[activities.length - 1]?.slug ?? 'setup'
}

// =====================================================================
// Activity body switches between activity types
// =====================================================================

function ActivityBody({
  activity,
  session,
  setSession,
  onComplete,
  onMarkInProgress,
}: {
  activity: Activity | undefined
  session: SessionData
  setSession: React.Dispatch<React.SetStateAction<SessionData>>
  onComplete: () => Promise<void> | void
  onMarkInProgress: () => Promise<void> | void
}) {
  if (!activity) return null

  if (activity.slug === 'setup') {
    return <SetupActivity activity={activity} session={session} onComplete={onComplete} />
  }
  if (activity.slug === 'introduction-and-consent') {
    return <IntroConsentActivity activity={activity} session={session} setSession={setSession} onComplete={onComplete} />
  }
  if (activity.useCaseCategory === 'WARM_UP') {
    return <WarmupActivity activity={activity} session={session} setSession={setSession} onComplete={onComplete} />
  }
  if (activity.useCaseCategory === 'WRAP_UP') {
    return <WrapUpActivity activity={activity} session={session} setSession={setSession} onComplete={onComplete} />
  }
  if (activity.slug === 'session-summary') {
    return <SummaryActivity activity={activity} session={session} setSession={setSession} onComplete={onComplete} />
  }
  if (activity.slug === 'review-and-complete') {
    return <ReviewActivity session={session} />
  }
  return (
    <CoreActivity
      activity={activity}
      session={session}
      setSession={setSession}
      onComplete={onComplete}
      onMarkInProgress={onMarkInProgress}
    />
  )
}

// ---------- Setup ----------
function SetupActivity({
  activity,
  session,
  onComplete,
}: {
  activity: Activity
  session: SessionData
  onComplete: () => void | Promise<void>
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <ActivityHeader activity={activity} />
        <p className="text-sm">
          Setup is captured before testing starts. You can refer back here at any time. Open the
          chatbot under test in another tab or window. When ready, mark setup complete to continue.
        </p>
        <div className="rounded border border-border/40 bg-muted/30 p-3 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Participant</span>
            <div>{session.participantId} · {session.participantType}</div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">Environment</span>
            <div>{session.environment}</div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onComplete()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Begin session <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Intro & Consent ----------
function IntroConsentActivity({
  activity,
  session,
  setSession,
  onComplete,
}: {
  activity: Activity
  session: SessionData
  setSession: React.Dispatch<React.SetStateAction<SessionData>>
  onComplete: () => void | Promise<void>
}) {
  const [consent, setConsent] = useState(session.consentConfirmed)
  const [recording, setRecording] = useState(session.recordingPermission)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/content-testing/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentConfirmed: consent, recordingPermission: recording }),
      })
      setSession((s) => ({ ...s, consentConfirmed: consent, recordingPermission: recording }))
      await onComplete()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <ActivityHeader activity={activity} />
        {activity.script && (
          <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm whitespace-pre-wrap leading-relaxed">
            <div className="text-xs font-medium uppercase tracking-wide text-primary mb-2">
              Read this aloud (or paraphrase)
            </div>
            {activity.script}
          </div>
        )}
        <div className="rounded-md border border-border/40 p-3 space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            Participant confirms consent
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={recording} onChange={(e) => setRecording(e.target.checked)} />
            Participant agrees to recording / note capture
          </label>
        </div>
        <div className="flex justify-end">
          <Button
            disabled={!consent || saving}
            onClick={save}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? 'Saving…' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Warm-up ----------
function WarmupActivity({
  activity,
  session,
  setSession,
  onComplete,
}: {
  activity: Activity
  session: SessionData
  setSession: React.Dispatch<React.SetStateAction<SessionData>>
  onComplete: () => void | Promise<void>
}) {
  const initial = useMemo(() => {
    const map = new Map(session.warmupAnswers.map((w) => [w.questionKey, w]))
    return (activity.warmupQuestions ?? []).map((q) => ({
      questionKey: q.key,
      question: q.question,
      answer: map.get(q.key)?.answer ?? '',
      keyQuote: map.get(q.key)?.keyQuote ?? '',
      notes: map.get(q.key)?.notes ?? '',
    }))
  }, [activity, session.warmupAnswers])

  const [entries, setEntries] = useState(initial)
  const [saving, setSaving] = useState(false)

  const setField = (key: string, field: 'answer' | 'keyQuote' | 'notes', value: string) =>
    setEntries((prev) => prev.map((e) => (e.questionKey === key ? { ...e, [field]: value } : e)))

  const save = async (next = false) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/content-testing/sessions/${session.id}/warmup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: entries.map((e) => ({
            questionKey: e.questionKey,
            answer: e.answer || null,
            keyQuote: e.keyQuote || null,
            notes: e.notes || null,
            themeTags: [],
          })),
        }),
      })
      if (res.ok) {
        const j = await res.json()
        setSession((s) => ({ ...s, warmupAnswers: j.warmupAnswers ?? [] }))
      }
      if (next) await onComplete()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <ActivityHeader activity={activity} />
        <p className="text-sm text-muted-foreground">
          Ask each warm-up question and capture the participant&apos;s answer in their own words.
        </p>
        <div className="space-y-4">
          {entries.map((e, i) => (
            <div key={e.questionKey} className="rounded-md border border-border/40 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">{i + 1}</Badge>
                <p className="text-sm font-medium leading-snug">{e.question}</p>
              </div>
              <Textarea
                value={e.answer}
                onChange={(ev) => setField(e.questionKey, 'answer', ev.target.value)}
                placeholder="Participant&#39;s answer…"
                rows={2}
              />
              <Input
                value={e.keyQuote}
                onChange={(ev) => setField(e.questionKey, 'keyQuote', ev.target.value)}
                placeholder="Key participant quote (optional)"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
          <Button
            onClick={() => save(true)}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? 'Saving…' : 'Save & continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Wrap-up ----------
function WrapUpActivity({
  activity,
  session,
  setSession,
  onComplete,
}: {
  activity: Activity
  session: SessionData
  setSession: React.Dispatch<React.SetStateAction<SessionData>>
  onComplete: () => void | Promise<void>
}) {
  const initial = useMemo(() => {
    const map = new Map(session.warmupAnswers.map((w) => [w.questionKey, w]))
    return (activity.wrapUpQuestions ?? []).map((q) => ({
      questionKey: q.key,
      question: q.question,
      answer: map.get(q.key)?.answer ?? '',
    }))
  }, [activity, session.warmupAnswers])

  const [entries, setEntries] = useState(initial)
  const [saving, setSaving] = useState(false)

  const save = async (next = false) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/content-testing/sessions/${session.id}/warmup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: entries.map((e) => ({
            questionKey: e.questionKey,
            answer: e.answer || null,
          })),
        }),
      })
      if (res.ok) {
        const j = await res.json()
        setSession((s) => ({ ...s, warmupAnswers: j.warmupAnswers ?? [] }))
      }
      if (next) await onComplete()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <ActivityHeader activity={activity} />
        <p className="text-sm text-muted-foreground">
          End the testing portion. Capture the participant&apos;s overall impressions and content gaps.
        </p>
        {entries.map((e, i) => (
          <div key={e.questionKey} className="rounded-md border border-border/40 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">{i + 1}</Badge>
              <p className="text-sm font-medium leading-snug">{e.question}</p>
            </div>
            <Textarea
              rows={2}
              value={e.answer}
              onChange={(ev) =>
                setEntries((prev) => prev.map((p) => (p.questionKey === e.questionKey ? { ...p, answer: ev.target.value } : p)))
              }
            />
          </div>
        ))}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
          <Button
            onClick={() => save(true)}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? 'Saving…' : 'Save & continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Summary ----------
function SummaryActivity({
  activity,
  session,
  setSession,
  onComplete,
}: {
  activity: Activity
  session: SessionData
  setSession: React.Dispatch<React.SetStateAction<SessionData>>
  onComplete: () => void | Promise<void>
}) {
  const [data, setData] = useState<Summary>(
    session.summary ?? {
      overallHelpfulness: '',
      strongestContentMoment: '',
      weakestContentMoment: '',
      mostConcerningResponse: '',
      mostAuthenticResponse: '',
      mostObviousContentGap: '',
      repeatedTheme: '',
      riskyResponse: '',
      marketingSpeakExamples: '',
      expectedTopics: '',
      contentGaps: '',
      prospectImprovementIdeas: '',
      influencerImprovementIdeas: '',
      topImprovement: '',
      otherComments: '',
      participantTrustLevel: null,
      participantPerceivedHelpfulness: null,
      overallContentReadiness: null,
      topRecommendations: [],
      additionalNotes: '',
    }
  )
  const [recs, setRecs] = useState((data.topRecommendations ?? []).join('\n'))
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof Summary>(k: K, v: Summary[K]) => setData((d) => ({ ...d, [k]: v }))

  const save = async (next = false) => {
    setSaving(true)
    try {
      const recommendations = recs
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)
        .slice(0, 10)
      const res = await fetch(`/api/content-testing/sessions/${session.id}/summary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, topRecommendations: recommendations }),
      })
      if (res.ok) {
        const j = await res.json()
        setSession((s) => ({ ...s, summary: j.summary }))
      }
      if (next) await onComplete()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <ActivityHeader activity={activity} />
        <p className="text-sm text-muted-foreground">
          Moderator-level summary. Captures themes, readiness, top recommendations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FieldArea label="Overall helpfulness" value={data.overallHelpfulness ?? ''} onChange={(v) => set('overallHelpfulness', v)} />
          <FieldArea label="Strongest content moment" value={data.strongestContentMoment ?? ''} onChange={(v) => set('strongestContentMoment', v)} />
          <FieldArea label="Weakest content moment" value={data.weakestContentMoment ?? ''} onChange={(v) => set('weakestContentMoment', v)} />
          <FieldArea label="Most concerning response" value={data.mostConcerningResponse ?? ''} onChange={(v) => set('mostConcerningResponse', v)} />
          <FieldArea label="Most authentic response" value={data.mostAuthenticResponse ?? ''} onChange={(v) => set('mostAuthenticResponse', v)} />
          <FieldArea label="Most obvious content gap" value={data.mostObviousContentGap ?? ''} onChange={(v) => set('mostObviousContentGap', v)} />
          <FieldArea label="Repeated theme" value={data.repeatedTheme ?? ''} onChange={(v) => set('repeatedTheme', v)} />
          <FieldArea label="Risky response" value={data.riskyResponse ?? ''} onChange={(v) => set('riskyResponse', v)} />
          <FieldArea label="Marketing speak examples" value={data.marketingSpeakExamples ?? ''} onChange={(v) => set('marketingSpeakExamples', v)} />
          <FieldArea label="Content gaps" value={data.contentGaps ?? ''} onChange={(v) => set('contentGaps', v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Participant trust level</Label>
            <Select value={data.participantTrustLevel ?? 'unset'} onValueChange={(v) => set('participantTrustLevel', v === 'unset' ? null : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">—</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Perceived helpfulness</Label>
            <Select value={data.participantPerceivedHelpfulness ?? 'unset'} onValueChange={(v) => set('participantPerceivedHelpfulness', v === 'unset' ? null : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">—</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Overall content readiness</Label>
            <Select value={data.overallContentReadiness ?? 'unset'} onValueChange={(v) => set('overallContentReadiness', v === 'unset' ? null : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">—</SelectItem>
                <SelectItem value="READY">Ready</SelectItem>
                <SelectItem value="MOSTLY_READY">Mostly ready</SelectItem>
                <SelectItem value="NEEDS_ITERATION">Needs iteration</SelectItem>
                <SelectItem value="NOT_READY">Not ready</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <FieldArea
          label="Top recommendations (one per line, up to 10)"
          value={recs}
          onChange={setRecs}
          rows={5}
        />
        <FieldArea label="Additional notes" value={data.additionalNotes ?? ''} onChange={(v) => set('additionalNotes', v)} />

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
          <Button
            onClick={() => save(true)}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? 'Saving…' : 'Save & continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FieldArea({
  label,
  value,
  onChange,
  rows = 2,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

// ---------- Review & Complete ----------
function ReviewActivity({ session }: { session: SessionData }) {
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const totalPrompts = session.promptEvaluations.length
  const completePrompts = session.promptEvaluations.filter((p) => p.completedAt).length

  const complete = async () => {
    setSubmitting(true)
    try {
      const r = await fetch(`/api/content-testing/sessions/${session.id}/complete`, {
        method: 'POST',
      })
      if (!r.ok) throw new Error('Could not complete session')
      toast({ title: 'Session marked complete' })
      router.push(`/content/testing/sessions/${session.id}`)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <h2 className="text-lg font-semibold">Review & complete</h2>
        <p className="text-sm text-muted-foreground">
          You have captured {completePrompts} of {totalPrompts} prompt evaluations and {session.summary ? 'a session summary' : 'no session summary yet'}.
        </p>
        <ul className="text-sm space-y-1">
          <li className="flex items-center gap-2">
            {session.consentConfirmed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Loader2 className="h-4 w-4 text-muted-foreground" />}
            Consent confirmed
          </li>
          <li className="flex items-center gap-2">
            {session.summary ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Loader2 className="h-4 w-4 text-muted-foreground" />}
            Session summary saved
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            {completePrompts} prompts evaluated
          </li>
        </ul>
        <div className="flex justify-end gap-2">
          <Link href={`/content/testing/sessions/${session.id}`}>
            <Button variant="outline">View session detail</Button>
          </Link>
          <Button
            onClick={complete}
            disabled={submitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? 'Completing…' : 'Mark session complete'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Core activities with prompt evaluation cards ----------
function CoreActivity({
  activity,
  session,
  setSession,
  onComplete,
  onMarkInProgress,
}: {
  activity: Activity
  session: SessionData
  setSession: React.Dispatch<React.SetStateAction<SessionData>>
  onComplete: () => void | Promise<void>
  onMarkInProgress: () => void | Promise<void>
}) {
  const { toast } = useToast()
  const evals = session.promptEvaluations.filter((p) => p.activitySlug === activity.slug)
  const [activePromptId, setActivePromptId] = useState<string | null>(evals[0]?.id ?? null)
  const [pendingPromptText, setPendingPromptText] = useState('')

  const refresh = async () => {
    const r = await fetch(`/api/content-testing/sessions/${session.id}`)
    if (r.ok) {
      const j = await r.json()
      setSession(j.session)
    }
  }

  const startPrompt = async (text: string, source: 'PARTICIPANT' | 'PREDEFINED' | 'MODERATOR' = 'PARTICIPANT', topicArea?: string | null) => {
    if (!text.trim()) return
    const r = await fetch(`/api/content-testing/sessions/${session.id}/prompt-evals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activitySlug: activity.slug,
        promptText: text,
        promptSource: source,
        useCaseCategory: activity.useCaseCategory,
        topicArea: topicArea ?? null,
      }),
    })
    if (!r.ok) {
      toast({ title: 'Could not create prompt', variant: 'destructive' })
      return
    }
    const j = await r.json()
    setPendingPromptText('')
    await refresh()
    setActivePromptId(j.promptEval.id)
    await onMarkInProgress()
  }

  const completed = evals.filter((e) => e.completedAt).length
  const allRequiredMet = (pe: PromptEval) => {
    const scoredKeys = new Set(pe.scores.map((s) => s.criterionKey))
    return activity.requiredCriteria.every((k) => scoredKeys.has(k))
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardContent className="p-5 space-y-4">
          <ActivityHeader activity={activity} />
          {activity.instructions && (
            <div className="rounded-md border border-border/40 bg-muted/30 p-3 text-sm">
              {activity.instructions}
            </div>
          )}

          <div className="space-y-2">
            <Label>Ask the participant for a question they would ask the chatbot</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type the participant&#39;s question, or pick a predefined one below."
                value={pendingPromptText}
                onChange={(e) => setPendingPromptText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') startPrompt(pendingPromptText)
                }}
              />
              <Button
                onClick={() => startPrompt(pendingPromptText)}
                disabled={!pendingPromptText.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <MessageSquarePlus className="mr-2 h-4 w-4" /> Add prompt
              </Button>
            </div>
          </div>

          {activity.promptBank.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>Predefined prompts</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activity.promptBank.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => startPrompt(p.promptText, 'PREDEFINED', p.topicArea)}
                    className="rounded-full border border-border/60 px-3 py-1 text-xs hover:bg-muted/40 hover:border-primary/40"
                  >
                    {p.promptText}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completed} of {evals.length} prompts completed
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onComplete()}
              disabled={evals.length === 0 || evals.some((e) => !e.completedAt)}
            >
              <ListChecks className="mr-2 h-4 w-4" /> Mark activity complete
            </Button>
          </div>
        </CardContent>
      </Card>

      {evals.map((pe) => (
        <PromptEvalCard
          key={pe.id}
          activity={activity}
          promptEval={pe}
          isOpen={activePromptId === pe.id}
          onToggle={() => setActivePromptId(activePromptId === pe.id ? null : pe.id)}
          onAnyChange={refresh}
          allRequiredMet={allRequiredMet(pe)}
        />
      ))}
    </div>
  )
}

function ActivityHeader({ activity }: { activity: Activity }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs">Step {activity.order}</Badge>
        {activity.isSensitive && (
          <Badge variant="outline" className="border-orange-500/40 text-orange-500 text-xs">Sensitive</Badge>
        )}
        {activity.isAdversarial && (
          <Badge variant="outline" className="border-red-500/40 text-red-500 text-xs">Adversarial</Badge>
        )}
      </div>
      <h2 className="text-lg font-semibold">{activity.title}</h2>
      <p className="text-sm text-muted-foreground">{activity.objective}</p>
    </div>
  )
}

// ---------- Single prompt evaluation card ----------
function PromptEvalCard({
  activity,
  promptEval,
  isOpen,
  onToggle,
  onAnyChange,
  allRequiredMet,
}: {
  activity: Activity
  promptEval: PromptEval
  isOpen: boolean
  onToggle: () => void
  onAnyChange: () => Promise<void> | void
  allRequiredMet: boolean
}) {
  const { toast } = useToast()
  const [draft, setDraft] = useState({
    responseSummary: promptEval.responseSummary ?? '',
    fullResponse: promptEval.fullResponse ?? '',
    participantReaction: promptEval.participantReaction ?? '',
    keyParticipantQuote: promptEval.keyParticipantQuote ?? '',
    quoteIncluded: promptEval.quoteIncluded,
    nextStepIncluded: promptEval.nextStepIncluded,
    toneDescription: promptEval.toneDescription ?? '',
    moderatorNotes: promptEval.moderatorNotes ?? '',
    observerNotes: promptEval.observerNotes ?? '',
    overallReadiness: promptEval.overallReadiness ?? '',
    topicArea: promptEval.topicArea ?? '',
  })
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [savingTag, setSavingTag] = useState(false)
  const lastSentRef = useRef<string>('')

  const debouncedSave = useDebouncedCallback(async () => {
    const payload = { ...draft, topicArea: draft.topicArea || null, overallReadiness: draft.overallReadiness || null }
    const ser = JSON.stringify(payload)
    if (ser === lastSentRef.current) return
    lastSentRef.current = ser
    setSavingTag(true)
    try {
      const r = await fetch(`/api/content-testing/prompt-evals/${promptEval.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (r.ok) setSavedAt(new Date())
    } finally {
      setSavingTag(false)
    }
  }, 1200)

  useEffect(() => {
    debouncedSave()
  }, [draft])

  const updateScore = async (criterionKey: string, value: number | null) => {
    await fetch(`/api/content-testing/prompt-evals/${promptEval.id}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores: [{ criterionKey, value }] }),
    })
    await onAnyChange()
  }

  const addIssue = async (data: any) => {
    const r = await fetch(`/api/content-testing/prompt-evals/${promptEval.id}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        severity: activity.isAdversarial && !data.severity ? 'HIGH' : data.severity,
      }),
    })
    if (r.ok) await onAnyChange()
  }

  const removeIssue = async (id: string) => {
    await fetch(`/api/content-testing/issues/${id}`, { method: 'DELETE' })
    await onAnyChange()
  }

  const saveQuote = async (v: QuoteEvalValue) => {
    await fetch(`/api/content-testing/prompt-evals/${promptEval.id}/quote-eval`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...v,
        authenticity: v.authenticity,
        value: v.value,
        brandSafety: v.brandSafety,
        contextSufficient: v.contextSufficient,
        preservesSoldierVoice: v.preservesSoldierVoice,
        sensitiveInfo: v.sensitiveInfo,
      }),
    })
    await onAnyChange()
  }

  const saveNextStep = async (v: NextStepEvalValue) => {
    await fetch(`/api/content-testing/prompt-evals/${promptEval.id}/next-step-eval`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    })
    await onAnyChange()
  }

  const markComplete = async () => {
    if (!allRequiredMet) {
      toast({
        title: 'Missing required scores',
        description: 'Please score all required criteria before marking complete.',
        variant: 'destructive',
      })
      return
    }
    await fetch(`/api/content-testing/prompt-evals/${promptEval.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, topicArea: draft.topicArea || null, overallReadiness: draft.overallReadiness || null, completed: true }),
    })
    await onAnyChange()
  }

  const quoteValue: QuoteEvalValue = {
    quoteText: promptEval.quoteEvaluation?.quoteText ?? '',
    quoteSource: promptEval.quoteEvaluation?.quoteSource ?? '',
    quoteType: promptEval.quoteEvaluation?.quoteType ?? '',
    authenticity: promptEval.quoteEvaluation?.authenticity ?? null,
    value: promptEval.quoteEvaluation?.value ?? null,
    brandSafety: promptEval.quoteEvaluation?.brandSafety ?? null,
    contextSufficient: promptEval.quoteEvaluation?.contextSufficient ?? null,
    marketingSpeak: promptEval.quoteEvaluation?.marketingSpeak ?? false,
    preservesSoldierVoice: promptEval.quoteEvaluation?.preservesSoldierVoice ?? null,
    sensitiveInfo: promptEval.quoteEvaluation?.sensitiveInfo ?? null,
    actionRecommendation: promptEval.quoteEvaluation?.actionRecommendation ?? 'KEEP',
    suggestedEdit: promptEval.quoteEvaluation?.suggestedEdit ?? '',
    needsSmeReview: promptEval.quoteEvaluation?.needsSmeReview ?? false,
    notes: promptEval.quoteEvaluation?.notes ?? '',
  }

  const nextStepValue: NextStepEvalValue = {
    nextStepNeeded: promptEval.nextStepEvaluation?.nextStepNeeded ?? true,
    nextStepProvided: promptEval.nextStepEvaluation?.nextStepProvided ?? false,
    nextStepType: promptEval.nextStepEvaluation?.nextStepType ?? '',
    clarity: promptEval.nextStepEvaluation?.clarity ?? null,
    appropriateness: promptEval.nextStepEvaluation?.appropriateness ?? null,
    overRecruiterReliance: promptEval.nextStepEvaluation?.overRecruiterReliance ?? false,
    suggestion: promptEval.nextStepEvaluation?.suggestion ?? '',
    notes: promptEval.nextStepEvaluation?.notes ?? '',
  }

  return (
    <Card className="border-border/50">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/20 transition-colors"
      >
        <Badge variant="outline" className="text-xs mt-0.5">#{promptEval.promptNumber}</Badge>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-snug">{promptEval.promptText}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <span>{promptEval.scores.length} / {activity.requiredCriteria.length} required scores</span>
            {promptEval.issues.length > 0 && <span>· {promptEval.issues.length} issues</span>}
            {promptEval.completedAt && (
              <span className="text-green-500 inline-flex items-center gap-1">
                · <CheckCircle2 className="h-3 w-3" /> complete
              </span>
            )}
            {savingTag && <span className="inline-flex items-center gap-1">· <Loader2 className="h-3 w-3 animate-spin" /> saving</span>}
            {!savingTag && savedAt && <span>· saved {formatRelative(savedAt)}</span>}
          </div>
        </div>
      </button>

      {isOpen && (
        <CardContent className="border-t border-border/30 pt-4 space-y-4">
          <Tabs defaultValue="response">
            <TabsList>
              <TabsTrigger value="response">Response</TabsTrigger>
              <TabsTrigger value="scores">Scores</TabsTrigger>
              <TabsTrigger value="issues">Issues ({promptEval.issues.length})</TabsTrigger>
              <TabsTrigger value="quote">Quote</TabsTrigger>
              <TabsTrigger value="next-step">Next step</TabsTrigger>
            </TabsList>

            <TabsContent value="response" className="space-y-3">
              <FieldArea
                label="Response summary"
                rows={3}
                value={draft.responseSummary}
                onChange={(v) => setDraft((d) => ({ ...d, responseSummary: v }))}
              />
              <FieldArea
                label="Full response (paste optional)"
                rows={4}
                value={draft.fullResponse}
                onChange={(v) => setDraft((d) => ({ ...d, fullResponse: v }))}
              />
              <FieldArea
                label="Participant reaction"
                rows={2}
                value={draft.participantReaction}
                onChange={(v) => setDraft((d) => ({ ...d, participantReaction: v }))}
              />
              <FieldArea
                label="Key participant quote"
                rows={2}
                value={draft.keyParticipantQuote}
                onChange={(v) => setDraft((d) => ({ ...d, keyParticipantQuote: v }))}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Topic area</Label>
                  <Select value={draft.topicArea || 'unset'} onValueChange={(v) => setDraft((d) => ({ ...d, topicArea: v === 'unset' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">—</SelectItem>
                      {TOPIC_KEYS.map((k) => (
                        <SelectItem key={k} value={k}>{TOPIC_AREA_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Overall readiness</Label>
                  <Select value={draft.overallReadiness || 'unset'} onValueChange={(v) => setDraft((d) => ({ ...d, overallReadiness: v === 'unset' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">—</SelectItem>
                      <SelectItem value="READY">Ready</SelectItem>
                      <SelectItem value="MOSTLY_READY">Mostly ready</SelectItem>
                      <SelectItem value="NEEDS_ITERATION">Needs iteration</SelectItem>
                      <SelectItem value="NOT_READY">Not ready</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 pt-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={draft.quoteIncluded} onChange={(e) => setDraft((d) => ({ ...d, quoteIncluded: e.target.checked }))} />
                    Quote included in response
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={draft.nextStepIncluded} onChange={(e) => setDraft((d) => ({ ...d, nextStepIncluded: e.target.checked }))} />
                    Next step included
                  </label>
                </div>
              </div>
              <FieldArea
                label="Moderator notes"
                rows={2}
                value={draft.moderatorNotes}
                onChange={(v) => setDraft((d) => ({ ...d, moderatorNotes: v }))}
              />
            </TabsContent>

            <TabsContent value="scores">
              <ScoringPanel
                required={activity.requiredCriteria}
                optional={['quote_usefulness', 'sensitivity_handling'].filter((k) => !activity.requiredCriteria.includes(k))}
                scores={promptEval.scores.map((s) => ({ criterionKey: s.criterionKey, value: s.value }))}
                onChange={updateScore}
              />
            </TabsContent>

            <TabsContent value="issues">
              <IssueTagger
                issues={promptEval.issues as any}
                onAdd={addIssue}
                onRemove={removeIssue}
                defaultSeverity={activity.isAdversarial || activity.isSensitive ? 'HIGH' : 'MEDIUM'}
              />
            </TabsContent>

            <TabsContent value="quote">
              <QuoteEvalPanel
                value={quoteValue}
                onChange={(v) => saveQuote(v)}
              />
            </TabsContent>

            <TabsContent value="next-step">
              <NextStepPanel
                value={nextStepValue}
                onChange={(v) => saveNextStep(v)}
              />
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between border-t border-border/30 pt-3">
            <span className="text-xs text-muted-foreground">
              {allRequiredMet
                ? 'All required criteria scored.'
                : 'Score all required criteria before completing this prompt.'}
            </span>
            <Button
              onClick={markComplete}
              disabled={!allRequiredMet}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {promptEval.completedAt ? 'Update & keep complete' : 'Mark prompt complete'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function useDebouncedCallback(fn: () => void, ms: number) {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback(() => {
    if (ref.current) clearTimeout(ref.current)
    ref.current = setTimeout(fn, ms)
  }, [fn, ms])
}

function formatRelative(d: Date) {
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}
