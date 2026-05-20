'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { ContentSubNav } from '@/components/content/sub-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { PARTICIPANT_TYPE_LABELS, ENVIRONMENT_LABELS } from '@/types/content-testing'

interface Round {
  id: string
  name: string
  status: string
  defaultEnvironment: string
}

export default function NewSessionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [rounds, setRounds] = useState<Round[]>([])
  const [roundId, setRoundId] = useState<string>('none')
  const [participantId, setParticipantId] = useState('')
  const [participantType, setParticipantType] = useState('INTERNAL_TESTER')
  const [environment, setEnvironment] = useState('STAGING')
  const [participantNotes, setParticipantNotes] = useState('')
  const [sessionObjective, setSessionObjective] = useState('')
  const [knownLimitations, setKnownLimitations] = useState('')
  const [accessibilityNotes, setAccessibilityNotes] = useState('')
  const [recordingPermission, setRecordingPermission] = useState(false)
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/content-testing/rounds')
      .then((r) => r.json())
      .then((j) => setRounds(j.rounds || []))
      .catch(() => null)
  }, [])

  const create = async () => {
    if (!participantId.trim()) {
      toast({ title: 'Participant ID required', variant: 'destructive' })
      return
    }
    if (!consentConfirmed) {
      toast({ title: 'Consent must be confirmed before starting', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/content-testing/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId: roundId === 'none' ? null : roundId,
          participantId: participantId.trim(),
          participantType,
          environment,
          participantNotes: participantNotes.trim() || null,
          sessionObjective: sessionObjective.trim() || null,
          knownLimitations: knownLimitations.trim() || null,
          accessibilityNotes: accessibilityNotes.trim() || null,
          recordingPermission,
          consentConfirmed,
        }),
      })
      if (!r.ok) throw new Error('Could not create session')
      const j = await r.json()
      router.push(`/content/testing/run/${j.session.id}`)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <ContentSubNav />
          <PageHeader
            title="Start Content Testing Session"
            description="Capture session metadata, confirm consent, and launch the virtual moderator."
          />

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Session setup</CardTitle>
              <CardDescription>This information is captured once per session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Round</Label>
                  <Select value={roundId} onValueChange={setRoundId}>
                    <SelectTrigger>
                      <SelectValue placeholder="No round" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No round</SelectItem>
                      {rounds.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} {r.status === 'ACTIVE' ? '· active' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Environment</Label>
                  <Select value={environment} onValueChange={setEnvironment}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ENVIRONMENT_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Participant ID</Label>
                  <Input
                    value={participantId}
                    onChange={(e) => setParticipantId(e.target.value)}
                    placeholder="P-001 or anonymized handle"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Participant type</Label>
                  <Select value={participantType} onValueChange={setParticipantType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PARTICIPANT_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Session objective</Label>
                <Textarea
                  value={sessionObjective}
                  onChange={(e) => setSessionObjective(e.target.value)}
                  placeholder="e.g. Validate Army Answers content quality with internal testers before R2."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Known limitations</Label>
                  <Textarea
                    value={knownLimitations}
                    onChange={(e) => setKnownLimitations(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Accessibility notes</Label>
                  <Textarea
                    value={accessibilityNotes}
                    onChange={(e) => setAccessibilityNotes(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Participant notes</Label>
                <Textarea
                  value={participantNotes}
                  onChange={(e) => setParticipantNotes(e.target.value)}
                  placeholder="Optional context about the participant."
                />
              </div>

              <div className="space-y-2 rounded-md border border-border/40 p-4 bg-muted/30">
                <p className="text-sm font-medium">Consent</p>
                <p className="text-xs text-muted-foreground">
                  Confirm you have explained the purpose of the session, that the focus is on the content
                  (not the participant), and that you have permission to record notes for research use.
                </p>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                  />
                  Participant has confirmed consent
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={recordingPermission}
                    onChange={(e) => setRecordingPermission(e.target.checked)}
                  />
                  Participant agrees to recording / note capture
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => router.push('/content/testing/sessions')}>
                  Cancel
                </Button>
                <Button
                  onClick={create}
                  disabled={submitting}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {submitting ? 'Starting…' : 'Start session'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </RequireAuth>
  )
}
