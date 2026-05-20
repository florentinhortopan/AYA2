'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CRITERION_LABELS } from '@/types/content-testing'

interface Datum {
  criterionKey: string
  average: number
  count: number
}

interface Props {
  data: Datum[]
}

export function CriterionBarChart({ data }: Props) {
  const rows = data
    .map((d) => ({
      key: d.criterionKey,
      label: CRITERION_LABELS[d.criterionKey] ?? d.criterionKey,
      average: Number(d.average.toFixed(2)),
      count: d.count,
    }))
    .sort((a, b) => a.average - b.average)

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Average Score by Criterion</CardTitle>
        <CardDescription>1 = poor / 5 = excellent. Lower = weaker.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ left: 30, right: 16, top: 4, bottom: 4 }}>
              <XAxis type="number" domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                width={140}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  color: 'hsl(var(--popover-foreground))',
                  fontSize: 12,
                }}
                formatter={(v: number, _name, p) => [`${v.toFixed(2)} (${p.payload.count} scores)`, 'Avg']}
              />
              <Bar dataKey="average">
                {rows.map((r, i) => (
                  <Cell
                    key={r.key}
                    fill={
                      r.average >= 4
                        ? 'hsl(var(--primary))'
                        : r.average >= 3
                        ? 'hsl(45 70% 55%)'
                        : r.average >= 2
                        ? 'hsl(25 80% 55%)'
                        : 'hsl(0 70% 55%)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
