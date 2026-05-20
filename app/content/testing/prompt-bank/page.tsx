'use client'

import { useEffect, useState } from 'react'
import { RequireAuth } from '@/components/content/require-auth'
import { PageHeader } from '@/components/content/page-header'
import { ContentSubNav } from '@/components/content/sub-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { TOPIC_AREA_LABELS } from '@/types/content-testing'
import { Trash2, Pencil, Plus } from 'lucide-react'

interface Activity {
  id: string
  slug: string
  order: number
  title: string
  useCaseCategory: string
  capturesPrompts: boolean
}

interface PromptItem {
  id: string
  activitySlug: string
  promptText: string
  topicArea: string | null
  notes: string | null
  isArchived: boolean
}

const TOPIC_KEYS = Object.keys(TOPIC_AREA_LABELS) as Array<keyof typeof TOPIC_AREA_LABELS>

export default function PromptBankPage() {
  const { toast } = useToast()
  const [activities, setActivities] = useState<Activity[]>([])
  const [items, setItems] = useState<PromptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterActivity, setFilterActivity] = useState('all')
  const [editing, setEditing] = useState<PromptItem | null>(null)
  const [open, setOpen] = useState(false)
  const [formActivity, setFormActivity] = useState('')
  const [formText, setFormText] = useState('')
  const [formTopic, setFormTopic] = useState<string>('none')
  const [formNotes, setFormNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [a, p] = await Promise.all([
        fetch('/api/content-testing/activities').then((r) => r.json()),
        fetch('/api/content-testing/prompt-bank').then((r) => r.json()),
      ])
      setActivities(a.activities || [])
      setItems(p.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setFormActivity(
      activities.find((a) => a.capturesPrompts)?.slug ?? activities[0]?.slug ?? ''
    )
    setFormText('')
    setFormTopic('none')
    setFormNotes('')
    setOpen(true)
  }

  const openEdit = (it: PromptItem) => {
    setEditing(it)
    setFormActivity(it.activitySlug)
    setFormText(it.promptText)
    setFormTopic(it.topicArea ?? 'none')
    setFormNotes(it.notes ?? '')
    setOpen(true)
  }

  const save = async () => {
    if (!formActivity || !formText.trim()) return
    setSaving(true)
    try {
      const payload = {
        activitySlug: formActivity,
        promptText: formText.trim(),
        topicArea: formTopic === 'none' ? null : formTopic,
        notes: formNotes.trim() || null,
      }
      if (editing) {
        const r = await fetch(`/api/content-testing/prompt-bank/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (r.status === 403) {
          toast({ title: 'Admin only', description: 'Sign in as admin to edit prompts.', variant: 'destructive' })
          return
        }
      } else {
        const r = await fetch('/api/content-testing/prompt-bank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (r.status === 403) {
          toast({ title: 'Admin only', description: 'Sign in as admin to add prompts.', variant: 'destructive' })
          return
        }
      }
      setOpen(false)
      toast({ title: editing ? 'Prompt updated' : 'Prompt added' })
      load()
    } finally {
      setSaving(false)
    }
  }

  const archive = async (it: PromptItem) => {
    if (!confirm(`Archive this prompt?\n\n"${it.promptText}"`)) return
    const r = await fetch(`/api/content-testing/prompt-bank/${it.id}`, { method: 'DELETE' })
    if (r.status === 403) {
      toast({ title: 'Admin only', variant: 'destructive' })
      return
    }
    load()
  }

  const filtered = items.filter((i) => filterActivity === 'all' || i.activitySlug === filterActivity)

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <ContentSubNav />
          <PageHeader
            title="Prompt Bank"
            description="Curated prompts that virtual moderator can offer when testers run out of ideas. Admins only."
            actions={(
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={openCreate}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add prompt
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editing ? 'Edit prompt' : 'Add prompt'}</DialogTitle>
                    <DialogDescription>
                      Predefined prompts will appear inside the matching activity in the run flow.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Activity</Label>
                      <Select value={formActivity} onValueChange={setFormActivity}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {activities
                            .filter((a) => a.capturesPrompts)
                            .map((a) => (
                              <SelectItem key={a.slug} value={a.slug}>
                                {a.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Prompt text</Label>
                      <Textarea
                        value={formText}
                        onChange={(e) => setFormText(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Topic area</Label>
                      <Select value={formTopic} onValueChange={setFormTopic}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No topic</SelectItem>
                          {TOPIC_KEYS.map((k) => (
                            <SelectItem key={k} value={k}>
                              {TOPIC_AREA_LABELS[k]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Notes (optional)</Label>
                      <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                      onClick={save}
                      disabled={saving || !formActivity || !formText.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {saving ? 'Saving…' : editing ? 'Save changes' : 'Add prompt'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          />

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select value={filterActivity} onValueChange={setFilterActivity}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Activity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All activities</SelectItem>
                {activities.map((a) => (
                  <SelectItem key={a.slug} value={a.slug}>{a.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs">{filtered.length} prompts</Badge>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((it) => (
                <Card key={it.id} className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base leading-snug">{it.promptText}</CardTitle>
                        <CardDescription className="mt-1 text-xs">
                          {activities.find((a) => a.slug === it.activitySlug)?.title ?? it.activitySlug}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(it)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => archive(it)} title="Archive">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {it.topicArea && (
                        <Badge variant="outline">{TOPIC_AREA_LABELS[it.topicArea] ?? it.topicArea}</Badge>
                      )}
                      {it.notes && <span className="text-muted-foreground italic">{it.notes}</span>}
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
