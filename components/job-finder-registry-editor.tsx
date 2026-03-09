'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface JobFinderRegistryEditorProps {
  initialRegistryJson: string
}

export function JobFinderRegistryEditor({ initialRegistryJson }: JobFinderRegistryEditorProps) {
  const [value, setValue] = useState(initialRegistryJson)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string>('')

  const parsedState = useMemo(() => {
    try {
      JSON.parse(value)
      return { valid: true, message: 'Valid JSON' }
    } catch (error) {
      return { valid: false, message: `JSON error: ${(error as Error).message}` }
    }
  }, [value])

  const save = async () => {
    setStatus('')
    let parsed: unknown
    try {
      parsed = JSON.parse(value)
    } catch (error) {
      setStatus(`Cannot save: ${(error as Error).message}`)
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/job-finder/registry', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registry: parsed })
      })
      const data = await response.json()
      if (!response.ok) {
        setStatus(data.error || 'Failed to save registry')
      } else {
        setStatus('Registry saved successfully.')
      }
    } catch (error) {
      setStatus(`Save failed: ${(error as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registry Editor</CardTitle>
        <CardDescription>
          Edit mapping rules separately from chat logic. In deployed environments, save is intentionally read-only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          className="w-full min-h-[340px] text-xs font-mono rounded-md border border-border bg-background p-3"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <p className={`text-xs ${parsedState.valid ? 'text-green-500' : 'text-red-500'}`}>{parsedState.message}</p>
          <Button onClick={save} disabled={saving || !parsedState.valid}>
            {saving ? 'Saving...' : 'Save Registry'}
          </Button>
        </div>
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </CardContent>
    </Card>
  )
}
