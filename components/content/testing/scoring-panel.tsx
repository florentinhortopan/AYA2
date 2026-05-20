'use client'

import { useMemo } from 'react'
import { Slider } from '@/components/ui/slider'
import { CRITERION_LABELS } from '@/types/content-testing'

interface ScoreValue {
  criterionKey: string
  value: number | null
}

interface Props {
  required: string[]
  optional?: string[]
  scores: ScoreValue[]
  onChange: (criterionKey: string, value: number | null) => void
  disabled?: boolean
}

export function ScoringPanel({ required, optional, scores, onChange, disabled }: Props) {
  const all = useMemo(() => {
    const uniq = new Set([...required, ...(optional ?? [])])
    return Array.from(uniq)
  }, [required, optional])

  const valueOf = (k: string) => scores.find((s) => s.criterionKey === k)?.value ?? null

  return (
    <div className="space-y-3">
      {all.map((k) => {
        const v = valueOf(k)
        const isReq = required.includes(k)
        return (
          <div key={k} className="rounded-md border border-border/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm">
                <span className="font-medium">{CRITERION_LABELS[k] ?? k}</span>
                {isReq && <span className="ml-2 text-xs text-orange-500">required</span>}
              </div>
              <div className="text-sm font-semibold">
                {v ? `${v}/5` : <span className="text-muted-foreground">—</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-8">Poor</span>
              <div className="flex-1">
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={v ? [v] : [0]}
                  onValueChange={(arr) => onChange(k, arr[0] || null)}
                  disabled={disabled}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">Great</span>
              {v != null && (
                <button
                  type="button"
                  onClick={() => onChange(k, null)}
                  className="text-xs text-muted-foreground hover:text-foreground ml-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
