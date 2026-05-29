'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react'

export type StepStatus = 'not_started' | 'in_progress' | 'complete' | 'needs_review'

interface Step {
  slug: string
  title: string
  order: number
  isSensitive?: boolean
  isAdversarial?: boolean
  useCaseCategory?: string
}

interface Props {
  steps: Step[]
  active: string
  statuses: Record<string, StepStatus>
  onSelect: (slug: string) => void
}

type StepGroup = 'session' | 'core' | 'edge'

const GROUP_LABELS: Record<StepGroup, string> = {
  session: 'Session',
  core: 'Core Activities',
  edge: 'Edge / Adversarial',
}

function groupOf(step: Step): StepGroup {
  switch (step.useCaseCategory) {
    case 'CORE_PROSPECT':
      return 'core'
    case 'AMBIGUOUS_EDGE_CASE':
    case 'OUT_OF_SCOPE':
    case 'SENSITIVE':
    case 'ADVERSARIAL':
      return 'edge'
    default:
      return 'session'
  }
}

export function ProgressRail({ steps, active, statuses, onSelect }: Props) {
  return (
    <ul className="space-y-1 text-sm">
      {steps.map((s, i) => {
        const status = statuses[s.slug] ?? 'not_started'
        const isActive = s.slug === active
        const group = groupOf(s)
        const showHeader = i === 0 || groupOf(steps[i - 1]) !== group
        const Icon =
          status === 'complete'
            ? CheckCircle2
            : status === 'in_progress'
            ? Loader2
            : status === 'needs_review'
            ? AlertCircle
            : Circle
        return (
          <li key={s.slug}>
            {showHeader && (
              <div className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground first:pt-0">
                {GROUP_LABELS[group]}
              </div>
            )}
            <button
              type="button"
              onClick={() => onSelect(s.slug)}
              className={cn(
                'group flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors',
                isActive
                  ? 'bg-primary/10 text-foreground border border-primary/30'
                  : 'hover:bg-muted/40 border border-transparent'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 mt-0.5 shrink-0',
                  status === 'complete'
                    ? 'text-green-500'
                    : status === 'in_progress'
                    ? 'text-blue-500 animate-spin'
                    : status === 'needs_review'
                    ? 'text-orange-500'
                    : 'text-muted-foreground'
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium leading-snug">{s.title}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  {s.isSensitive && (
                    <span className="rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] text-orange-500">
                      Sensitive
                    </span>
                  )}
                  {s.isAdversarial && (
                    <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-500">
                      Adversarial
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
