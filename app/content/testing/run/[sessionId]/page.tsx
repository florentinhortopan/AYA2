'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { RequireAuth } from '@/components/content/require-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VirtualModeratorChat } from '@/components/content/testing/virtual-moderator-chat'
import { ArrowLeft } from 'lucide-react'

export default function RunSessionPage() {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params?.sessionId
  const [activities, setActivities] = useState<any[]>([])
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const load = async () => {
      try {
        const [a, s] = await Promise.all([
          fetch('/api/content-testing/activities').then((r) => r.json()),
          fetch(`/api/content-testing/sessions/${sessionId}`).then((r) => r.json()),
        ])
        if (!s.session) {
          setError('Session not found')
          return
        }
        setActivities(a.activities || [])
        setSession(s.session)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId])

  return (
    <RequireAuth>
      <main className="min-h-screen bg-background">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-30">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/content/testing/sessions" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Virtual Moderator
                </p>
                <h1 className="text-base font-semibold leading-tight">
                  Content Testing Session
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline">Tester surface</Badge>
              {session && <Badge variant="outline">{session.status}</Badge>}
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-4 lg:py-6">
          {loading ? (
            <p className="text-muted-foreground">Loading session…</p>
          ) : error || !session ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-3">{error ?? 'Unable to load session.'}</p>
              <Link href="/content/testing/sessions">
                <Button variant="outline">Back to sessions</Button>
              </Link>
            </div>
          ) : (
            <VirtualModeratorChat activities={activities} session={session} />
          )}
        </div>
      </main>
    </RequireAuth>
  )
}
