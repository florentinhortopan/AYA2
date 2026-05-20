'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { ContentSubNav } from '@/components/content/sub-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReadinessGauge } from '@/components/content/testing/readiness-gauge'
import { CriterionBarChart } from '@/components/content/testing/criterion-bar-chart'
import { HeatmapByActivity } from '@/components/content/testing/heatmap-by-activity'
import { IssueDonut } from '@/components/content/testing/issue-donut'
import { SeverityStack } from '@/components/content/testing/severity-stack'
import { TopicRiskMatrix } from '@/components/content/testing/topic-risk-matrix'
import {
  ISSUE_TYPE_LABELS,
  SEVERITY_STYLES,
  TOPIC_AREA_LABELS,
} from '@/types/content-testing'
import { Download, FilePlus2, MessageSquareWarning, ListChecks } from 'lucide-react'

interface AggResponse {
  totals: { promptEvals: number; sessions: number; criticalIssues: number; highIssues: number }
  readiness: { score: number; counts: Record<string, number>; total: number }
  criterionAverages: { criterionKey: string; average: number; count: number }[]
  heatmap: { activitySlug: string; activityTitle: string; cells: Record<string, number> }[]
  issueTypes: { type: string; count: number }[]
  severityCounts: Record<string, number>
  topicRiskMatrix: { topic: string; issueCount: number; averageSeverity: number; promptCount: number }[]
  lowestScoring: {
    id: string
    promptText: string
    activitySlug: string
    topicArea: string | null
    average: number
    scoreCount: number
  }[]
  criticalHigh: {
    id: string
    sessionId?: string
    participantId?: string
    roundName: string | null
    promptText: string | null
    topicArea: string | null
    issueType: string
    severity: string
    description: string
    recommendedAction: string
    owner: string | null
    status: string
  }[]
  quoteSummary: {
    total: number
    keep: number
    lightEdit: number
    rewrite: number
    replace: number
    remove: number
    escalate: number
    needsSmeReview: number
  }
  nextStepSummary: {
    total: number
    needed: number
    provided: number
    overRecruiter: number
  }
  sessionStatusCounts: Record<string, number>
}

interface Round {
  id: string
  name: string
}

export default function ContentTestingDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AggResponse | null>(null)
  const [rounds, setRounds] = useState<Round[]>([])
  const [roundId, setRoundId] = useState<string>('all')
  const [participantType, setParticipantType] = useState<string>('all')

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/content-testing/rounds')
        if (r.ok) {
          const j = await r.json()
          setRounds(j.rounds || [])
        }
      } catch (_) {}
    }
    load()
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const qs = new URLSearchParams()
        if (roundId !== 'all') qs.set('roundId', roundId)
        if (participantType !== 'all') qs.set('participantType', participantType)
        const r = await fetch(`/api/content-testing/aggregations?${qs.toString()}`)
        if (r.ok) {
          const j = await r.json()
          setData(j)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [roundId, participantType])

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <ContentSubNav />
          <PageHeader
            title="Content Testing"
            description="Run guided moderator sessions and review aggregated readiness, scores, and issues."
            actions={(
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/content/testing/sessions/new">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Start Session
                  </Button>
                </Link>
                <Link href="/content/testing/sessions">
                  <Button variant="outline">Sessions</Button>
                </Link>
                <Link href="/content/testing/rounds">
                  <Button variant="outline">Rounds</Button>
                </Link>
                <Link href="/content/testing/prompt-bank">
                  <Button variant="outline">Prompt Bank</Button>
                </Link>
                <Link href="/content/testing/backlog">
                  <Button variant="outline">
                    <ListChecks className="mr-2 h-4 w-4" />
                    Backlog
                  </Button>
                </Link>
              </div>
            )}
          />

          {/* Filters + Exports */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Round</span>
              <Select value={roundId} onValueChange={setRoundId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All rounds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rounds</SelectItem>
                  {rounds.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Participant</span>
              <Select value={participantType} onValueChange={setParticipantType}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="INTERNAL_TESTER">Internal Tester</SelectItem>
                  <SelectItem value="PROSPECT_LIKE">Prospect-like</SelectItem>
                  <SelectItem value="PARENT_GUARDIAN">Parent / Guardian</SelectItem>
                  <SelectItem value="EDUCATOR">Educator</SelectItem>
                  <SelectItem value="INFLUENCER">Influencer</SelectItem>
                  <SelectItem value="RECRUITER">Recruiter</SelectItem>
                  <SelectItem value="CONTENT_REVIEWER">Content Reviewer</SelectItem>
                  <SelectItem value="STAKEHOLDER">Stakeholder</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`/api/content-testing/export?type=raw&format=csv${roundId !== 'all' ? `&roundId=${roundId}` : ''}`}>
                  <Download className="mr-2 h-4 w-4" /> Raw CSV
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`/api/content-testing/export?type=raw&format=xlsx${roundId !== 'all' ? `&roundId=${roundId}` : ''}`}>
                  <Download className="mr-2 h-4 w-4" /> XLSX
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`/api/content-testing/export?type=summary&format=pdf${roundId !== 'all' ? `&roundId=${roundId}` : ''}`}>
                  <Download className="mr-2 h-4 w-4" /> Summary PDF
                </a>
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading dashboard…</p>
          ) : !data || data.totals.promptEvals === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Prompts evaluated" value={data.totals.promptEvals} />
                <KpiCard label="Sessions" value={data.totals.sessions} />
                <KpiCard
                  label="Critical issues"
                  value={data.totals.criticalIssues}
                  tone={data.totals.criticalIssues > 0 ? 'danger' : undefined}
                />
                <KpiCard
                  label="High issues"
                  value={data.totals.highIssues}
                  tone={data.totals.highIssues > 0 ? 'warn' : undefined}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReadinessGauge
                  score={data.readiness.score}
                  counts={data.readiness.counts}
                  total={data.readiness.total}
                />
                <CriterionBarChart data={data.criterionAverages} />
              </div>

              <HeatmapByActivity data={data.heatmap} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IssueDonut data={data.issueTypes} />
                <SeverityStack counts={data.severityCounts} />
              </div>

              <TopicRiskMatrix data={data.topicRiskMatrix} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Quote Quality</CardTitle>
                    <CardDescription>
                      Disposition of Soldier quote evaluations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <SummaryStat label="Total" value={data.quoteSummary.total} />
                    <SummaryStat label="Needs SME review" value={data.quoteSummary.needsSmeReview} tone="warn" />
                    <SummaryStat label="Keep" value={data.quoteSummary.keep} />
                    <SummaryStat label="Light edit" value={data.quoteSummary.lightEdit} />
                    <SummaryStat label="Rewrite" value={data.quoteSummary.rewrite} />
                    <SummaryStat label="Replace" value={data.quoteSummary.replace} />
                    <SummaryStat label="Remove" value={data.quoteSummary.remove} />
                    <SummaryStat label="Escalate" value={data.quoteSummary.escalate} tone="danger" />
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Next Best Action</CardTitle>
                    <CardDescription>How well responses point users to next steps.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <SummaryStat label="Evaluations" value={data.nextStepSummary.total} />
                    <SummaryStat label="Step needed" value={data.nextStepSummary.needed} />
                    <SummaryStat label="Step provided" value={data.nextStepSummary.provided} />
                    <SummaryStat label="Over-reliant on recruiter" value={data.nextStepSummary.overRecruiter} tone="warn" />
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Lowest-Scoring Prompts</CardTitle>
                  <CardDescription>Prompts most in need of revision.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <th className="text-left p-2">Prompt</th>
                          <th className="text-left p-2">Activity</th>
                          <th className="text-left p-2">Topic</th>
                          <th className="text-right p-2">Avg score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lowestScoring.map((p) => (
                          <tr key={p.id} className="border-b border-border/30">
                            <td className="p-2 max-w-md truncate">{p.promptText}</td>
                            <td className="p-2 text-xs text-muted-foreground">{p.activitySlug}</td>
                            <td className="p-2 text-xs text-muted-foreground">
                              {p.topicArea ? TOPIC_AREA_LABELS[p.topicArea] ?? p.topicArea : '—'}
                            </td>
                            <td className="p-2 text-right font-semibold">{p.average.toFixed(2)}</td>
                          </tr>
                        ))}
                        {data.lowestScoring.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-3 text-muted-foreground text-center">
                              No scored prompts yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>
                    <span className="inline-flex items-center gap-2">
                      <MessageSquareWarning className="h-4 w-4 text-red-500" />
                      Critical & High Issues
                    </span>
                  </CardTitle>
                  <CardDescription>Triage queue for content escalation.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <th className="text-left p-2">Severity</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Prompt</th>
                          <th className="text-left p-2">Topic</th>
                          <th className="text-left p-2">Action</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.criticalHigh.map((i) => (
                          <tr key={i.id} className="border-b border-border/30">
                            <td className="p-2">
                              <Badge className={SEVERITY_STYLES[i.severity]}>{i.severity}</Badge>
                            </td>
                            <td className="p-2 text-xs">{ISSUE_TYPE_LABELS[i.issueType] ?? i.issueType}</td>
                            <td className="p-2 max-w-sm truncate">{i.promptText ?? '—'}</td>
                            <td className="p-2 text-xs text-muted-foreground">
                              {i.topicArea ? TOPIC_AREA_LABELS[i.topicArea] ?? i.topicArea : '—'}
                            </td>
                            <td className="p-2 text-xs">{i.recommendedAction}</td>
                            <td className="p-2 text-xs">{i.status}</td>
                          </tr>
                        ))}
                        {data.criticalHigh.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-3 text-muted-foreground text-center">
                              No critical or high issues.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  )
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number | string
  tone?: 'danger' | 'warn'
}) {
  const cls =
    tone === 'danger'
      ? 'bg-red-500/10 text-red-500 border-red-500/30'
      : tone === 'warn'
      ? 'bg-orange-500/10 text-orange-500 border-orange-500/30'
      : 'bg-card text-foreground border-border/50'
  return (
    <Card className={`border ${cls}`}>
      <CardContent className="pt-5 pb-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'danger' | 'warn'
}) {
  const cls =
    tone === 'danger'
      ? 'text-red-500'
      : tone === 'warn'
      ? 'text-orange-500'
      : 'text-foreground'
  return (
    <div className="rounded border border-border/40 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold ${cls}`}>{value}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="border-dashed border-border/60">
      <CardContent className="py-10 text-center">
        <h3 className="text-lg font-semibold mb-2">No testing data yet</h3>
        <p className="text-muted-foreground mb-4">
          Start a content testing session to populate the dashboard.
        </p>
        <Link href="/content/testing/sessions/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Start your first session
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
