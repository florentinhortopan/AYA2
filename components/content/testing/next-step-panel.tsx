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

export interface NextStepEvalValue {
  nextStepNeeded: boolean
  nextStepProvided: boolean
  nextStepType: string
  clarity: string | null
  appropriateness: string | null
  overRecruiterReliance: boolean
  suggestion: string
  notes: string
}

interface Props {
  value: NextStepEvalValue
  onChange: (v: NextStepEvalValue) => void
}

const TRINARY_OPTIONS = [
  { v: 'YES', label: 'Yes' },
  { v: 'PARTIALLY', label: 'Partially' },
  { v: 'NO', label: 'No' },
]

export function NextStepPanel({ value, onChange }: Props) {
  const set = <K extends keyof NextStepEvalValue>(k: K, v: NextStepEvalValue[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <Checkbox
            checked={value.nextStepNeeded}
            onChange={(e) => set('nextStepNeeded', e.target.checked)}
          />
          Next step needed
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={value.nextStepProvided}
            onChange={(e) => set('nextStepProvided', e.target.checked)}
          />
          Next step provided
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={value.overRecruiterReliance}
            onChange={(e) => set('overRecruiterReliance', e.target.checked)}
          />
          Over-relies on recruiter
        </label>
      </div>

      <div className="space-y-1">
        <Label>Type</Label>
        <Input
          value={value.nextStepType}
          onChange={(e) => set('nextStepType', e.target.value)}
          placeholder="e.g. talk to recruiter, take assessment, visit goarmy.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TrinaryField label="Clarity" value={value.clarity} onChange={(v) => set('clarity', v)} />
        <TrinaryField label="Appropriateness" value={value.appropriateness} onChange={(v) => set('appropriateness', v)} />
      </div>

      <div className="space-y-1">
        <Label>Suggestion</Label>
        <Textarea
          rows={2}
          value={value.suggestion}
          onChange={(e) => set('suggestion', e.target.value)}
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
