'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { RequireAuth } from '@/components/content/require-auth'
import { ModeratorScriptDeck } from '@/components/content/testing/moderator-script-deck'

function ScriptDeckWithParams() {
  const params = useSearchParams()
  const sessionId = params?.get('sessionId') ?? undefined
  return <ModeratorScriptDeck sessionId={sessionId} />
}

export default function ModeratorScriptPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-muted-foreground">
            Loading script…
          </div>
        }
      >
        <ScriptDeckWithParams />
      </Suspense>
    </RequireAuth>
  )
}
