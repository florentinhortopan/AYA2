'use client'

import { useEffect, useState } from 'react'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { ContentSubNav } from '@/components/content/sub-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

interface Round {
  id: string
  name: string
  description: string | null
  status: 'PLANNED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  defaultEnvironment: string
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  owner: { id: string; name: string | null; email: string | null } | null
  _count: { sessions: number }
}

const STATUS_STYLES: Record<string, string> = {
  PLANNED: 'bg-muted text-muted-foreground',
  ACTIVE: 'bg-blue-500/10 text-blue-500',
  CLOSED: 'bg-green-500/10 text-green-500',
  ARCHIVED: 'bg-muted text-muted-foreground',
}

export default function RoundsPage() {
  const { toast } = useToast()
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('R1')
  const [description, setDescription] = useState('')
  const [environment, setEnvironment] = useState('STAGING')
  const [status, setStatus] = useState('PLANNED')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/content-testing/rounds')
      if (r.ok) {
        const j = await r.json()
        setRounds(j.rounds || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const r = await fetch('/api/content-testing/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          defaultEnvironment: environment,
          status,
        }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to create round')
      }
      toast({ title: 'Round created' })
      setOpen(false)
      setDescription('')
      await load()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const updateStatus = async (id: string, next: Round['status']) => {
    await fetch(`/api/content-testing/rounds/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    await load()
  }

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <ContentSubNav />
          <PageHeader
            title="Testing Rounds"
            description="Group sessions into versioned rounds (R1, R2…) to compare iterations."
            actions={(
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    New Round
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create testing round</DialogTitle>
                    <DialogDescription>Group future sessions under one round.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Round name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="R1" />
                    </div>
                    <div className="space-y-1">
                      <Label>Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Internal acceptance testing — Army Answers."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Default environment</Label>
                        <Select value={environment} onValueChange={setEnvironment}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PROTOTYPE">Prototype</SelectItem>
                            <SelectItem value="STAGING">Staging</SelectItem>
                            <SelectItem value="PRODUCTION">Production</SelectItem>
                            <SelectItem value="TRANSCRIPT_REVIEW">Transcript review</SelectItem>
                            <SelectItem value="STATIC_RESPONSE_REVIEW">Static response review</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PLANNED">Planned</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={create}
                      disabled={creating || !name.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {creating ? 'Creating…' : 'Create round'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          />

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : rounds.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="py-10 text-center text-muted-foreground">
                No rounds yet. Create one to start grouping sessions.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rounds.map((r) => (
                <Card key={r.id} className="border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle>{r.name}</CardTitle>
                        <CardDescription>
                          {r._count.sessions} sessions • {r.defaultEnvironment.toLowerCase()}
                        </CardDescription>
                      </div>
                      <Badge className={STATUS_STYLES[r.status]}>{r.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                    <div className="flex flex-wrap gap-2">
                      {(['PLANNED', 'ACTIVE', 'CLOSED', 'ARCHIVED'] as const).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={s === r.status ? 'default' : 'outline'}
                          onClick={() => updateStatus(r.id, s)}
                        >
                          {s}
                        </Button>
                      ))}
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
