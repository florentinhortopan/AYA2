'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { ContentSubNav } from '@/components/content/sub-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ACTION_RECOMMENDATION_LABELS,
  ISSUE_TYPE_LABELS,
  SEVERITY_STYLES,
  TOPIC_AREA_LABELS,
} from '@/types/content-testing'
import { Download } from 'lucide-react'

interface Issue {
  id: string
  severity: string
  issueType: string
  status: string
  description: string
  recommendedAction: string
  owner: string | null
  priority: string
  requiresSme: boolean
  requiresOfficialSource: boolean
  requiresRecruiterReferral: boolean
  sessionId: string
  promptEval: {
    id: string
    promptText: string
    topicArea: string | null
    activitySlug: string
    useCaseCategory: string
  } | null
  session: {
    id: string
    participantId: string
    participantType: string
    round: { name: string } | null
  } | null
}

const PRIORITY_LABEL: Record<string, string> = {
  QUICK_WIN: 'Quick win',
  PHASE_1: 'Phase 1',
  PHASE_2: 'Phase 2',
  BACKLOG: 'Backlog',
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open',
  IN_REVIEW: 'In review',
  RESOLVED: 'Resolved',
  WONT_FIX: "Won't fix",
}

export default function BacklogPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [severity, setSeverity] = useState('all')
  const [status, setStatus] = useState('all')
  const [issueType, setIssueType] = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (severity !== 'all') qs.set('severity', severity)
      if (status !== 'all') qs.set('status', status)
      if (issueType !== 'all') qs.set('issueType', issueType)
      const r = await fetch(`/api/content-testing/issues?${qs.toString()}`)
      if (r.ok) {
        const j = await r.json()
        setIssues(j.issues || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [severity, status, issueType])

  const update = async (id: string, data: Partial<Issue>) => {
    await fetch(`/api/content-testing/issues/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    load()
  }

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <ContentSubNav />
          <PageHeader
            title="Content Backlog"
            description="Prioritized issues found in testing sessions. Track triage, owners, and resolution."
            actions={(
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a href="/api/content-testing/export?type=backlog&format=csv">
                    <Download className="mr-2 h-4 w-4" /> CSV
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/api/content-testing/export?type=backlog&format=xlsx">
                    <Download className="mr-2 h-4 w-4" /> XLSX
                  </a>
                </Button>
              </div>
            )}
          />

          <div className="mb-4 flex flex-wrap gap-3">
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severity</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_REVIEW">In review</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="WONT_FIX">Won&apos;t fix</SelectItem>
              </SelectContent>
            </Select>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Issue type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Object.entries(ISSUE_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="ml-auto text-xs">{issues.length} issues</Badge>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : issues.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="py-10 text-center text-muted-foreground">
                No issues match these filters.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {issues.map((i) => (
                <Card key={i.id} className="border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={SEVERITY_STYLES[i.severity]}>{i.severity}</Badge>
                      <Badge variant="outline">{ISSUE_TYPE_LABELS[i.issueType] ?? i.issueType}</Badge>
                      {i.promptEval?.topicArea && (
                        <Badge variant="outline">
                          {TOPIC_AREA_LABELS[i.promptEval.topicArea] ?? i.promptEval.topicArea}
                        </Badge>
                      )}
                      {i.requiresSme && (
                        <Badge variant="outline" className="border-orange-500/40 text-orange-500">
                          SME review needed
                        </Badge>
                      )}
                      {i.requiresRecruiterReferral && (
                        <Badge variant="outline" className="border-blue-500/40 text-blue-500">
                          Recruiter referral
                        </Badge>
                      )}
                      {i.requiresOfficialSource && (
                        <Badge variant="outline" className="border-purple-500/40 text-purple-500">
                          Needs official source
                        </Badge>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        Session{' '}
                        <Link
                          href={`/content/testing/sessions/${i.sessionId}`}
                          className="underline hover:text-foreground"
                        >
                          {i.session?.participantId ?? i.sessionId.slice(0, 8)}
                        </Link>
                        {i.session?.round?.name ? ` · ${i.session.round.name}` : ''}
                      </span>
                    </div>

                    {i.promptEval && (
                      <p className="text-xs text-muted-foreground italic">
                        Prompt: “{i.promptEval.promptText}”
                      </p>
                    )}
                    <p className="text-sm">{i.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Recommended action</span>
                        <Select
                          value={i.recommendedAction}
                          onValueChange={(v) => update(i.id, { recommendedAction: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ACTION_RECOMMENDATION_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Priority</span>
                        <Select
                          value={i.priority}
                          onValueChange={(v) => update(i.id, { priority: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <Select
                          value={i.status}
                          onValueChange={(v) => update(i.id, { status: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_LABEL).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Owner</span>
                        <input
                          defaultValue={i.owner ?? ''}
                          onBlur={(e) => update(i.id, { owner: e.target.value || null })}
                          placeholder="Assign owner"
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                        />
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
