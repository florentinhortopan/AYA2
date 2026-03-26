import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AudienceLens, WarriorAttribute } from '@/lib/campaigns/field-tested/types'

interface ActionLaneProps {
  lens: AudienceLens | null
  topAttribute: WarriorAttribute | null
}

const getPrimaryAction = (lens: AudienceLens | null, attribute: WarriorAttribute | null) => {
  if (lens === 'parent') {
    return { label: 'Talk With A Recruiter', href: '/explore/recruitment' }
  }
  if (lens === 'influencer') {
    return { label: 'Explore Stories To Share', href: '/content' }
  }
  if (attribute === 'skills' || attribute === 'stability') {
    return { label: 'Find Matching Army Jobs', href: '/explore/find-a-job' }
  }
  return { label: 'Start A Guided Conversation', href: '/explore/recruitment' }
}

export function ActionLane({ lens, topAttribute }: ActionLaneProps) {
  const primaryAction = getPrimaryAction(lens, topAttribute)

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">S9</p>
        <h2 className="text-2xl font-semibold">Action Lane</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Move from interest to action with the path best aligned to your current profile.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={primaryAction.href}>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">{primaryAction.label}</Button>
        </Link>
        <Button variant="outline">Save Profile Snapshot</Button>
        <Button variant="outline">Share This Journey</Button>
      </div>
    </section>
  )
}
