'use client'

import { concernModules } from '@/lib/campaigns/field-tested/content'
import { ConcernFlag } from '@/lib/campaigns/field-tested/types'
import { cn } from '@/lib/utils'

interface RealityCheckModuleProps {
  selectedConcern: ConcernFlag | null
  onSelectConcern?: (concern: ConcernFlag) => void
  disabled?: boolean
}

export function RealityCheckModule({ selectedConcern, onSelectConcern, disabled }: RealityCheckModuleProps) {
  const active = concernModules.find((module) => module.id === selectedConcern) || concernModules[0]

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">S5</p>
        <h2 className="text-2xl font-semibold">Reality Check</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the concern you want to resolve first and we will surface practical clarity.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {concernModules.map((module) => (
          <button
            key={module.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectConcern?.(module.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              selectedConcern === module.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:border-primary/40 hover:text-primary'
            )}
          >
            {module.title}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <h3 className="text-base font-semibold">{active.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{active.guidance}</p>
        <ul className="mt-3 space-y-1 text-sm">
          {active.faq.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
