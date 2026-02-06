import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const jsonNoStore = (payload: unknown, init?: Parameters<typeof NextResponse.json>[1]) => {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  return response
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return jsonNoStore({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all researches (optionally filter by status)
    const status = request.nextUrl.searchParams.get('status')
    const where: any = {}
    
    if (status) {
      where.status = status
    }

    const researches = await prisma.seguePillResearch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        campaignGoal: {
          select: {
            id: true,
            name: true,
            goalType: true
          }
        }
      }
    })

    return jsonNoStore({ researches })
  } catch (error) {
    console.error('Error fetching researches:', error)
    return jsonNoStore({ error: 'Failed to fetch researches' }, { status: 500 })
  }
}
