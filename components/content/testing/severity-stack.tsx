'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  counts: Record<string, number>
}

const ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const COLORS: Record<string, string> = {
  CRITICAL: 'hsl(0 75% 55%)',
  HIGH: 'hsl(25 85% 55%)',
  MEDIUM: 'hsl(45 80% 55%)',
  LOW: 'hsl(210 70% 60%)',
}

export function SeverityStack({ counts }: Props) {
  const data = ORDER.map((k) => ({ severity: k, count: counts[k] ?? 0 }))
  const total = data.reduce((a, b) => a + b.count, 0)
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Severity Distribution</CardTitle>
        <CardDescription>{total} total issues identified.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <XAxis dataKey="severity" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.severity} fill={COLORS[d.severity]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
