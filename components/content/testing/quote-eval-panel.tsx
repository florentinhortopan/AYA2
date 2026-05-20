'use client'

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

export interface QuoteEvalValue {
  quoteText: string
  quoteSource: string
  quoteType: string
  authenticity: string | null
  value: string | null
  brandSafety: string | null
  contextSufficient: string | null
  marketingSpeak: boolean
  preservesSoldierVoice: string | null
  sensitiveInfo: string | null
  actionRecommendation: string
  suggestedEdit: string
  needsSmeReview: boolean
  notes: string
}

interface Props {
  value: QuoteEvalValue
  onChange: (next: QuoteEvalValue) => void
}

const TRINARY_OPTIONS = [
  { v: 'YES', label: 'Yes' },
  { v: 'PARTIALLY', label: 'Partially' },
  { v: 'NO', label: 'No' },
]

export function QuoteEvalPanel({ value, onChange }: Props) {
  const set = <K extends keyof QuoteEvalValue>(k: K, v: QuoteEvalValue[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Quote text</Label>
        <Textarea
          rows={2}
          value={value.quoteText}
          onChange={(e) => set('quoteText', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Source / attribution</Label>
          <Input value={value.quoteSource} onChange={(e) => set('quoteSource', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Quote type</Label>
          <Input
            value={value.quoteType}
            onChange={(e) => set('quoteType', e.target.value)}
            placeholder="e.g. testimonial, first-person, dialogue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TrinaryField label="Authentic?" value={value.authenticity} onChange={(v) => set('authenticity', v)} />
        <TrinaryField label="Useful?" value={value.value} onChange={(v) => set('value', v)} />
        <TrinaryField label="Brand safe?" value={value.brandSafety} onChange={(v) => set('brandSafety', v)} />
        <TrinaryField label="Enough context?" value={value.contextSufficient} onChange={(v) => set('contextSufficient', v)} />
        <TrinaryField label="Preserves Soldier voice?" value={value.preservesSoldierVoice} onChange={(v) => set('preservesSoldierVoice', v)} />
        <TrinaryField label="Sensitive info?" value={value.sensitiveInfo} onChange={(v) => set('sensitiveInfo', v)} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={value.marketingSpeak}
          onChange={(e) => set('marketingSpeak', e.target.checked)}
        />
        Feels like marketing speak
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Action</Label>
          <Select value={value.actionRecommendation} onValueChange={(v) => set('actionRecommendation', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="KEEP">Keep</SelectItem>
              <SelectItem value="LIGHT_EDIT">Light edit</SelectItem>
              <SelectItem value="REWRITE">Rewrite</SelectItem>
              <SelectItem value="REPLACE">Replace</SelectItem>
              <SelectItem value="REMOVE">Remove</SelectItem>
              <SelectItem value="ESCALATE">Escalate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-end gap-2 text-sm">
          <Checkbox
            checked={value.needsSmeReview}
            onChange={(e) => set('needsSmeReview', e.target.checked)}
          />
          Needs SME review
        </label>
      </div>

      <div className="space-y-1">
        <Label>Suggested edit</Label>
        <Textarea
          rows={2}
          value={value.suggestedEdit}
          onChange={(e) => set('suggestedEdit', e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea
          rows={2}
          value={value.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>
    </div>
  )
}

function TrinaryField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | null
  onChange: (v: string | null) => void
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={value ?? 'unset'} onValueChange={(v) => onChange(v === 'unset' ? null : v)}>
        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">—</SelectItem>
          {TRINARY_OPTIONS.map((o) => (
            <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
