'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { ContentSubNav } from '@/components/content/sub-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  CRITERION_LABELS,
  ENVIRONMENT_LABELS,
  ISSUE_TYPE_LABELS,
  PARTICIPANT_TYPE_LABELS,
  READINESS_LABELS,
  READINESS_STYLES,
  SEVERITY_STYLES,
  SESSION_STATUS_LABELS,
  SESSION_STATUS_STYLES,
  TOPIC_AREA_LABELS,
} from '@/types/content-testing'
import { Download, ClipboardList } from 'lucide-react'

interface SessionDetail {
  id: string
  status: string
  participantId: string
  participantType: string
  environment: string
  recordingPermission: boolean
  consentConfirmed: boolean
  startedAt: string | null
  completedAt: string | null
  sessionObjective: string | null
  knownLimitations: string | null
  accessibilityNotes: string | null
  participantNotes: string | null
  round: { id: string; name: string } | null
  moderator: { name: string | null; email: string | null } | null
  promptEvaluations: Array<{
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
    overallReadiness: string | null
    completedAt: string | null
    scores: { criterionKey: string; value: number }[]
    issues: { id: string; issueType: string; severity: string; description: string }[]
    quoteEvaluation: any
    nextStepEvaluation: any
  }>
  warmupAnswers: { questionKey: string; answer: string | null; keyQuote: string | null }[]
  summary: any
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [data, setData] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/content-testing/sessions/${id}`)
      .then((r) => r.json())
      .then((j) => setData(j.session))
      .finally(() => setLoading(false))
  }, [id])

  if (loading || !data) {
    return (
      <RequireAuth>
        <main className="container mx-auto px-4 py-12">
          <ContentSubNav />
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <ContentSubNav />
          <PageHeader
            title={`Session — ${data.participantId}`}
            description={`${PARTICIPANT_TYPE_LABELS[data.participantType] ?? data.participantType} · ${ENVIRONMENT_LABELS[data.environment] ?? data.environment}`}
            actions={(
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={SESSION_STATUS_STYLES[data.status]}>
                  {SESSION_STATUS_LABELS[data.status] ?? data.status}
                </Badge>
                {data.status !== 'COMPLETE' && (
                  <Link href={`/content/testing/run/${data.id}`}>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Resume
                    </Button>
                  </Link>
                )}
                <Button variant="outline" asChild>
                  <a href={`/api/content-testing/export?type=raw&sessionId=${data.id}&format=csv`}>
                    <Download className="mr-2 h-4 w-4" /> CSV
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/api/content-testing/export?type=raw&sessionId=${data.id}&format=xlsx`}>
                    <Download className="mr-2 h-4 w-4" /> XLSX
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/api/content-testing/export?type=raw&sessionId=${data.id}&format=json`}>
                    <Download className="mr-2 h-4 w-4" /> JSON
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/api/content-testing/export?type=intake&sessionId=${data.id}&format=xlsx`}>
                    <ClipboardList className="mr-2 h-4 w-4" /> Intake mask (XLSX)
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/api/content-testing/export?type=intake&sessionId=${data.id}&format=md`}>
                    <ClipboardList className="mr-2 h-4 w-4" /> Intake mask (MD)
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/api/content-testing/export?type=intake&sessionId=${data.id}&format=csv`}>
                    <ClipboardList className="mr-2 h-4 w-4" /> Intake mask (CSV)
                  </a>
                </Button>
              </div>
            )}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle>Session metadata</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Round" value={data.round?.name ?? '—'} />
                <Field label="Moderator" value={data.moderator?.name ?? data.moderator?.email ?? '—'} />
                <Field label="Started" value={data.startedAt ? new Date(data.startedAt).toLocaleString() : '—'} />
                <Field label="Completed" value={data.completedAt ? new Date(data.completedAt).toLocaleString() : '—'} />
                <Field label="Consent" value={data.consentConfirmed ? 'Confirmed' : 'Not confirmed'} />
                <Field label="Recording" value={data.recordingPermission ? 'Allowed' : 'Not allowed'} />
                {data.sessionObjective && (
                  <div className="col-span-2">
                    <Field label="Objective" value={data.sessionObjective} />
                  </div>
                )}
                {data.knownLimitations && (
                  <div className="col-span-2">
                    <Field label="Known limitations" value={data.knownLimitations} />
                  </div>
                )}
                {data.accessibilityNotes && (
                  <div className="col-span-2">
                    <Field label="Accessibility" value={data.accessibilityNotes} />
                  </div>
                )}
              </CardContent>
            </Card>

            {data.warmupAnswers.length > 0 && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Warm-up</CardTitle>
                  <CardDescription>Participant expectations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {data.warmupAnswers.map((w) => (
                    <div key={w.questionKey}>
                      <div className="text-xs font-medium text-muted-foreground">{w.questionKey}</div>
                      <div>{w.answer ?? '—'}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <h2 className="text-xl font-semibold mb-3">Prompt evaluations</h2>
          <div className="space-y-4">
            {data.promptEvaluations.map((pe) => (
              <Card key={pe.id} className="border-border/50">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">{pe.activitySlug}</Badge>
                    <Badge variant="outline" className="text-xs">#{pe.promptNumber}</Badge>
                    {pe.topicArea && (
                      <Badge variant="outline" className="text-xs">
                        {TOPIC_AREA_LABELS[pe.topicArea] ?? pe.topicArea}
                      </Badge>
                    )}
                    {pe.overallReadiness && (
                      <Badge className={READINESS_STYLES[pe.overallReadiness]}>
                        {READINESS_LABELS[pe.overallReadiness] ?? pe.overallReadiness}
                      </Badge>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {pe.completedAt ? new Date(pe.completedAt).toLocaleString() : 'in progress'}
                    </span>
                  </div>
                  <CardTitle className="text-base mt-2">{pe.promptText}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {pe.responseSummary && (
                    <div>
                      <div className="text-xs text-muted-foreground">Response summary</div>
                      <div>{pe.responseSummary}</div>
                    </div>
                  )}
                  {pe.participantReaction && (
                    <div>
                      <div className="text-xs text-muted-foreground">Participant reaction</div>
                      <div>{pe.participantReaction}</div>
                    </div>
                  )}
                  {pe.keyParticipantQuote && (
                    <div>
                      <div className="text-xs text-muted-foreground">Key participant quote</div>
                      <div className="italic">“{pe.keyParticipantQuote}”</div>
                    </div>
                  )}

                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {pe.scores
                      .sort((a, b) => a.criterionKey.localeCompare(b.criterionKey))
                      .map((s) => (
                        <div key={s.criterionKey} className="rounded border border-border/40 px-2 py-1">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {CRITERION_LABELS[s.criterionKey] ?? s.criterionKey}
                          </div>
                          <div className="text-lg font-semibold">{s.value}/5</div>
                        </div>
                      ))}
                  </div>

                  {pe.issues.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Issues</div>
                      {pe.issues.map((i) => (
                        <div key={i.id} className="flex items-start gap-2 text-xs">
                          <Badge className={SEVERITY_STYLES[i.severity]}>{i.severity}</Badge>
                          <Badge variant="outline">{ISSUE_TYPE_LABELS[i.issueType] ?? i.issueType}</Badge>
                          <span>{i.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {data.promptEvaluations.length === 0 && (
              <Card className="border-dashed border-border/50">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No prompts captured yet.
                </CardContent>
              </Card>
            )}
          </div>

          {data.summary && (
            <Card className="border-border/50 mt-6">
              <CardHeader>
                <CardTitle>Session summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Field label="Overall helpfulness" value={data.summary.overallHelpfulness} />
                <Field label="Strongest content moment" value={data.summary.strongestContentMoment} />
                <Field label="Weakest content moment" value={data.summary.weakestContentMoment} />
                <Field label="Top recommendations" value={Array.isArray(data.summary.topRecommendations) ? data.summary.topRecommendations.join(' · ') : null} />
                <Field label="Overall readiness" value={data.summary.overallContentReadiness ? READINESS_LABELS[data.summary.overallContentReadiness] : null} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </RequireAuth>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium whitespace-pre-wrap">{value || '—'}</div>
    </div>
  )
}
