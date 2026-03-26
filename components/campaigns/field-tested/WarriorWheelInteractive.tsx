'use client'

import { warriorAttributes } from '@/lib/campaigns/field-tested/content'
import { WarriorAttribute } from '@/lib/campaigns/field-tested/types'
import { cn } from '@/lib/utils'

interface WarriorWheelInteractiveProps {
  selected: WarriorAttribute | null
  onSelect?: (attribute: WarriorAttribute) => void
  disabled?: boolean
}

export function WarriorWheelInteractive({ selected, onSelect, disabled }: WarriorWheelInteractiveProps) {
  const active = warriorAttributes.find((attribute) => attribute.id === selected) || warriorAttributes[0]

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">S3</p>
      <h2 className="mt-1 text-2xl font-semibold">Warrior Wheel Entry</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Select the pillar that matters most right now. We adapt the next sections around it.
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          {warriorAttributes.map((attribute) => {
            const isSelected = selected === attribute.id
            return (
              <button
                key={attribute.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect?.(attribute.id)}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40',
                  disabled ? 'cursor-default opacity-90' : ''
                )}
              >
                <p className="text-sm font-semibold capitalize">{attribute.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{attribute.proofPoint}</p>
              </button>
            )
          })}
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Active Pillar</p>
          <h3 className="mt-2 text-xl font-semibold capitalize">{active.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{active.description}</p>
          <p className="mt-3 text-sm font-medium text-foreground">{active.proofPoint}</p>
        </div>
      </div>
    </section>
  )
}
