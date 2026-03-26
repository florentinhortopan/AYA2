'use client'

import { AudienceLens } from '@/lib/campaigns/field-tested/types'
import { lensOptions } from '@/lib/campaigns/field-tested/content'
import { cn } from '@/lib/utils'

interface LensSelectorProps {
  selected: AudienceLens | null
  onSelect?: (lens: AudienceLens) => void
  disabled?: boolean
}

export function LensSelector({ selected, onSelect, disabled }: LensSelectorProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">S2</p>
        <h2 className="text-2xl font-semibold">Choose Your Lens</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick the perspective that should personalize this journey.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {lensOptions.map((option) => {
          const active = selected === option.id
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(option.id)}
              className={cn(
                'rounded-xl border p-4 text-left transition-colors',
                active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                disabled ? 'cursor-default opacity-90' : ''
              )}
            >
              <p className="text-base font-semibold">{option.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{option.subtitle}</p>
              <ul className="mt-3 space-y-1 text-xs">
                {option.outcomes.map((outcome) => (
                  <li key={outcome}>- {outcome}</li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>
    </section>
  )
}
