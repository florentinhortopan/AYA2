'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AgentChat } from '@/components/agent-chat'

export function FloatingJobFinderWidget() {
  const [open, setOpen] = useState(true)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open && (
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
          onClick={() => setOpen(true)}
        >
          Open Job Finder
        </Button>
      )}

      <div
        className={`bg-card border border-border rounded-lg shadow-2xl overflow-hidden min-w-[320px] min-h-[360px] max-w-[92vw] max-h-[88vh] transition-opacity ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none absolute bottom-0 right-0'
        }`}
        style={{ width: 420, height: 560, resize: 'both' as const }}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
          <div className="text-sm font-semibold text-gold">Job Finder Assistant</div>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Minimize
          </Button>
        </div>
        <div className="h-[calc(100%-49px)] p-2">
          <AgentChat
            agentType="job-finder"
            hideHeader
            containerClassName="max-w-none h-full border-0 shadow-none"
          />
        </div>
      </div>
    </div>
  )
}
