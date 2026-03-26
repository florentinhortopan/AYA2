import { AudienceLens, ConcernFlag, WarriorAttribute } from '@/lib/campaigns/field-tested/types'

interface JourneyRecapProps {
  lens: AudienceLens | null
  topAttribute: WarriorAttribute | null
  resolvedConcerns: ConcernFlag[]
}

export function JourneyRecap({ lens, topAttribute, resolvedConcerns }: JourneyRecapProps) {
  const lensLabel = lens ? lens.charAt(0).toUpperCase() + lens.slice(1) : 'Not selected yet'
  const attributeLabel = topAttribute ? topAttribute.charAt(0).toUpperCase() + topAttribute.slice(1) : 'Not selected yet'

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">S8</p>
        <h2 className="text-2xl font-semibold">Your Warrior Journey Recap</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This summary is generated from your interactions to keep momentum toward action.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Lens</p>
          <p className="mt-2 text-base font-semibold">{lensLabel}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Top Attribute</p>
          <p className="mt-2 text-base font-semibold">{attributeLabel}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Concerns Addressed</p>
          <p className="mt-2 text-base font-semibold">{resolvedConcerns.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
        <p>
          Achievement summary: You translated campaign narrative into practical signal by selecting a personal lens,
          prioritizing your strongest pillar, and exploring real concerns with clear next steps.
        </p>
      </div>
    </section>
  )
}
