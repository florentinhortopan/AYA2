'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ISSUE_TYPE_LABELS } from '@/types/content-testing'

interface Datum {
  type: string
  count: number
}

const PALETTE = [
  'hsl(var(--primary))',
  'hsl(200 80% 55%)',
  'hsl(290 60% 55%)',
  'hsl(0 70% 55%)',
  'hsl(140 60% 50%)',
  'hsl(25 80% 55%)',
  'hsl(45 70% 55%)',
  'hsl(160 50% 50%)',
  'hsl(220 60% 60%)',
  'hsl(330 60% 55%)',
]

export function IssueDonut({ data }: { data: Datum[] }) {
  const rows = data
    .slice()
    .sort((a, b) => b.count - a.count)
    .map((d, i) => ({
      ...d,
      label: ISSUE_TYPE_LABELS[d.type] ?? d.type,
      color: PALETTE[i % PALETTE.length],
    }))

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Issue Type Frequency</CardTitle>
        <CardDescription>Distribution of tagged issues by type.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="count"
                nameKey="label"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {rows.map((r) => (
                  <Cell key={r.type} fill={r.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(v: string) => <span className="text-muted-foreground">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
