'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TOPIC_AREA_LABELS } from '@/types/content-testing'

interface Datum {
  topic: string
  issueCount: number
  averageSeverity: number
  promptCount: number
}

export function TopicRiskMatrix({ data }: { data: Datum[] }) {
  const points = data.map((d) => ({
    name: TOPIC_AREA_LABELS[d.topic] ?? d.topic,
    issueCount: d.issueCount,
    averageSeverity: Number(d.averageSeverity.toFixed(2)),
    promptCount: d.promptCount,
  }))

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Topic Risk Matrix</CardTitle>
        <CardDescription>
          Issue count vs average severity weight. Bubble size = prompts evaluated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="issueCount"
                name="Issues"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                label={{ value: 'Issues', position: 'insideBottom', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                allowDecimals={false}
              />
              <YAxis
                dataKey="averageSeverity"
                name="Severity (1-4)"
                domain={[0, 4]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                label={{ value: 'Avg severity', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <ZAxis dataKey="promptCount" range={[80, 400]} name="Prompts" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(value: number | string, name: string) => [value, name]}
                labelFormatter={(_) => ''}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0].payload as (typeof points)[number]
                  return (
                    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs">
                      <div className="font-semibold">{p.name}</div>
                      <div>Issues: {p.issueCount}</div>
                      <div>Severity weight: {p.averageSeverity.toFixed(2)}</div>
                      <div>Prompts evaluated: {p.promptCount}</div>
                    </div>
                  )
                }}
              />
              <Scatter data={points}>
                {points.map((p, i) => (
                  <Cell
                    key={p.name}
                    fill={p.averageSeverity >= 3 ? 'hsl(0 75% 55%)' : p.averageSeverity >= 2 ? 'hsl(25 85% 55%)' : 'hsl(var(--primary))'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
