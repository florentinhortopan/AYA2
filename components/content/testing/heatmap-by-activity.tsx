'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CRITERION_LABELS } from '@/types/content-testing'

interface Row {
  activitySlug: string
  activityTitle: string
  cells: Record<string, number>
}

interface Props {
  data: Row[]
  criteriaOrder?: string[]
}

const DEFAULT_COLS = [
  'relevance',
  'completeness',
  'accuracy',
  'clarity',
  'authenticity',
  'brand_safety',
  'overall_readiness',
]

export function HeatmapByActivity({ data, criteriaOrder }: Props) {
  const cols = criteriaOrder ?? DEFAULT_COLS

  const colorFor = (v: number) => {
    if (!v) return 'bg-muted text-muted-foreground'
    if (v >= 4) return 'bg-green-500/20 text-green-500'
    if (v >= 3) return 'bg-yellow-500/15 text-yellow-500'
    if (v >= 2) return 'bg-orange-500/15 text-orange-500'
    return 'bg-red-500/20 text-red-500'
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Score Heatmap by Activity</CardTitle>
        <CardDescription>Average score per activity × criterion (1-5 scale).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 text-muted-foreground sticky left-0 bg-card">Activity</th>
                {cols.map((c) => (
                  <th key={c} className="p-2 text-muted-foreground">
                    {CRITERION_LABELS[c] ?? c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.activitySlug} className="border-t border-border/50">
                  <td className="p-2 font-medium sticky left-0 bg-card">{row.activityTitle}</td>
                  {cols.map((c) => {
                    const v = row.cells[c]
                    return (
                      <td key={c} className="p-1.5 text-center">
                        <div className={`rounded px-2 py-1 font-medium ${colorFor(v ?? 0)}`}>
                          {v ? v.toFixed(1) : '—'}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
