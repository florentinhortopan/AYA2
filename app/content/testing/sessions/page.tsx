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
  PARTICIPANT_TYPE_LABELS,
  SESSION_STATUS_LABELS,
  SESSION_STATUS_STYLES,
} from '@/types/content-testing'
import { ClipboardList, Presentation } from 'lucide-react'

interface Round {
  id: string
  name: string
}

interface SessionItem {
  id: string
  status: string
  participantId: string
  participantType: string
  environment: string
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  round: { id: string; name: string } | null
  moderator: { name: string | null; email: string | null } | null
  _count: { promptEvaluations: number; issues: number }
}

export default function SessionsListPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRound, setFilterRound] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterParticipant, setFilterParticipant] = useState('all')

  useEffect(() => {
    fetch('/api/content-testing/rounds')
      .then((r) => r.json())
      .then((j) => setRounds(j.rounds || []))
      .catch(() => null)
  }, [])

  useEffect(() => {
    const qs = new URLSearchParams()
    if (filterRound !== 'all') qs.set('roundId', filterRound)
    if (filterStatus !== 'all') qs.set('status', filterStatus)
    if (filterParticipant !== 'all') qs.set('participantType', filterParticipant)
    setLoading(true)
    fetch(`/api/content-testing/sessions?${qs.toString()}`)
      .then((r) => r.json())
      .then((j) => setSessions(j.sessions || []))
      .finally(() => setLoading(false))
  }, [filterRound, filterStatus, filterParticipant])

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <ContentSubNav />
          <PageHeader
            title="Testing Sessions"
            description="All content testing sessions across rounds."
            actions={(
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/content/testing/script">
                    <Presentation className="mr-2 h-4 w-4" /> Interviewer script
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/api/content-testing/export?type=intake&format=xlsx">
                    <ClipboardList className="mr-2 h-4 w-4" /> Blank intake mask (XLSX)
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/api/content-testing/export?type=intake&format=md">
                    <ClipboardList className="mr-2 h-4 w-4" /> Blank intake mask (MD)
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/api/content-testing/export?type=intake&format=csv">
                    <ClipboardList className="mr-2 h-4 w-4" /> Blank intake mask (CSV)
                  </a>
                </Button>
                <Link href="/content/testing/sessions/new">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Start Session
                  </Button>
                </Link>
              </div>
            )}
          />

          <div className="mb-4 flex flex-wrap gap-3">
            <Select value={filterRound} onValueChange={setFilterRound}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Round" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rounds</SelectItem>
                {rounds.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="COMPLETE">Complete</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterParticipant} onValueChange={setFilterParticipant}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Participant" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All participants</SelectItem>
                {Object.entries(PARTICIPANT_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : sessions.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="py-10 text-center text-muted-foreground">
                No sessions match these filters.
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <th className="text-left p-3">Session</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Participant</th>
                        <th className="text-left p-3">Round</th>
                        <th className="text-right p-3">Prompts</th>
                        <th className="text-right p-3">Issues</th>
                        <th className="text-right p-3">Updated</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s) => (
                        <tr key={s.id} className="border-b border-border/30 hover:bg-muted/30">
                          <td className="p-3 font-medium">
                            <Link href={`/content/testing/sessions/${s.id}`} className="hover:underline">
                              {s.participantId}
                            </Link>
                            <div className="text-xs text-muted-foreground">{s.id.slice(0, 8)}…</div>
                          </td>
                          <td className="p-3">
                            <Badge className={SESSION_STATUS_STYLES[s.status]}>
                              {SESSION_STATUS_LABELS[s.status] ?? s.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs">
                            {PARTICIPANT_TYPE_LABELS[s.participantType] ?? s.participantType}
                          </td>
                          <td className="p-3 text-xs">{s.round?.name ?? '—'}</td>
                          <td className="p-3 text-right">{s._count.promptEvaluations}</td>
                          <td className="p-3 text-right">{s._count.issues}</td>
                          <td className="p-3 text-right text-xs text-muted-foreground">
                            {new Date(s.completedAt ?? s.startedAt ?? s.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            {s.status === 'COMPLETE' ? (
                              <Link href={`/content/testing/sessions/${s.id}`}>
                                <Button size="sm" variant="outline">View</Button>
                              </Link>
                            ) : (
                              <Link href={`/content/testing/run/${s.id}`}>
                                <Button
                                  size="sm"
                                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                  {s.status === 'DRAFT' ? 'Begin' : 'Resume'}
                                </Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </RequireAuth>
  )
}
