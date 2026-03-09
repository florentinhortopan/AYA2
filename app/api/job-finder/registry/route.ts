import { NextRequest, NextResponse } from 'next/server'
import {
  JobFinderComponentRegistry,
  loadJobFinderComponentRegistry,
  saveJobFinderComponentRegistry
} from '@/lib/job-finder/component-registry'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const registry = await loadJobFinderComponentRegistry()
  return NextResponse.json({ registry })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = body?.registry as JobFinderComponentRegistry | undefined

    if (!payload) {
      return NextResponse.json({ error: 'registry is required' }, { status: 400 })
    }

    // Vercel filesystem is read-only at runtime; allow local editing but block production mutation.
    if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          error:
            'Registry cannot be persisted at runtime in deployment. Update `data/goarmy/component-registry.json` in git and redeploy.'
        },
        { status: 501 }
      )
    }

    const saved = await saveJobFinderComponentRegistry(payload)
    return NextResponse.json({ registry: saved, saved: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to save registry'
      },
      { status: 400 }
    )
  }
}
