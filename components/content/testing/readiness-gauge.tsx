'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { READINESS_LABELS, READINESS_STYLES } from '@/types/content-testing'

interface Props {
  score: number
  counts: Record<string, number>
  total: number
}

export function ReadinessGauge({ score, counts, total }: Props) {
  const pct = Math.round(score * 100)

  let label = 'Not Ready'
  if (score >= 0.85) label = 'Ready'
  else if (score >= 0.6) label = 'Mostly Ready'
  else if (score >= 0.3) label = 'Needs Iteration'

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle>Overall Content Readiness</CardTitle>
        <CardDescription>
          Composite of all prompt-level readiness ratings ({total} scored).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-6">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="12"
                strokeDasharray={`${(score * 314).toFixed(1)} 314`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{pct}%</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1">
            {(['READY', 'MOSTLY_READY', 'NEEDS_ITERATION', 'NOT_READY'] as const).map((k) => (
              <div
                key={k}
                className={`rounded-md border px-3 py-2 ${READINESS_STYLES[k]}`}
              >
                <div className="text-xs font-medium">{READINESS_LABELS[k]}</div>
                <div className="text-2xl font-semibold">{counts[k] ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
