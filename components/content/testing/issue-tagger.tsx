'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  ACTION_RECOMMENDATION_LABELS,
  ISSUE_TYPE_LABELS,
  SEVERITY_STYLES,
} from '@/types/content-testing'
import { Plus, Trash2 } from 'lucide-react'

interface IssueData {
  id: string
  issueType: string
  severity: string
  description: string
  recommendedAction: string
  suggestedRevision: string | null
  requiresSme: boolean
  requiresOfficialSource: boolean
  requiresRecruiterReferral: boolean
}

interface Props {
  issues: IssueData[]
  onAdd: (data: Omit<IssueData, 'id'>) => Promise<void>
  onRemove: (id: string) => Promise<void>
  defaultSeverity?: string
}

export function IssueTagger({ issues, onAdd, onRemove, defaultSeverity = 'MEDIUM' }: Props) {
  const [open, setOpen] = useState(false)
  const [issueType, setIssueType] = useState('CONTENT_GAP')
  const [severity, setSeverity] = useState(defaultSeverity)
  const [description, setDescription] = useState('')
  const [recommendedAction, setRecommendedAction] = useState('EDIT')
  const [suggestedRevision, setSuggestedRevision] = useState('')
  const [requiresSme, setRequiresSme] = useState(false)
  const [requiresOfficialSource, setRequiresOfficialSource] = useState(false)
  const [requiresRecruiterReferral, setRequiresRecruiterReferral] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!description.trim()) return
    setSaving(true)
    try {
      await onAdd({
        issueType,
        severity,
        description: description.trim(),
        recommendedAction,
        suggestedRevision: suggestedRevision.trim() || null,
        requiresSme,
        requiresOfficialSource,
        requiresRecruiterReferral,
      })
      setOpen(false)
      setDescription('')
      setSuggestedRevision('')
      setRequiresSme(false)
      setRequiresOfficialSource(false)
      setRequiresRecruiterReferral(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Issues ({issues.length})</Label>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-3 w-3" />
              Tag issue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tag content issue</DialogTitle>
              <DialogDescription>Capture what is wrong with this response.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={issueType} onValueChange={setIssueType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ISSUE_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Severity</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is wrong, in plain language?"
                />
              </div>
              <div className="space-y-1">
                <Label>Recommended action</Label>
                <Select value={recommendedAction} onValueChange={setRecommendedAction}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_RECOMMENDATION_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Suggested revision (optional)</Label>
                <Textarea
                  value={suggestedRevision}
                  onChange={(e) => setSuggestedRevision(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={requiresSme}
                    onChange={(e) => setRequiresSme(e.target.checked)}
                  />
                  Needs SME review
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={requiresOfficialSource}
                    onChange={(e) => setRequiresOfficialSource(e.target.checked)}
                  />
                  Needs official source
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={requiresRecruiterReferral}
                    onChange={(e) => setRequiresRecruiterReferral(e.target.checked)}
                  />
                  Needs recruiter referral
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={save}
                disabled={saving || !description.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? 'Saving…' : 'Tag issue'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {issues.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No issues yet.</p>
      ) : (
        <div className="space-y-2">
          {issues.map((i) => (
            <div key={i.id} className="rounded border border-border/40 p-2 text-xs">
              <div className="flex flex-wrap items-center gap-1 mb-1">
                <Badge className={SEVERITY_STYLES[i.severity]}>{i.severity}</Badge>
                <Badge variant="outline">{ISSUE_TYPE_LABELS[i.issueType] ?? i.issueType}</Badge>
                <span className="text-muted-foreground">
                  → {ACTION_RECOMMENDATION_LABELS[i.recommendedAction] ?? i.recommendedAction}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(i.id)}
                  className="ml-auto text-muted-foreground hover:text-red-500"
                  aria-label="Remove issue"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <p>{i.description}</p>
              {i.suggestedRevision && (
                <p className="mt-1 text-muted-foreground italic">→ {i.suggestedRevision}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
