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

export async function GET(
  request: NextRequest,
  { params }: { params: { researchId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return jsonNoStore({ error: 'Unauthorized' }, { status: 401 })
    }

    const { researchId } = params

    const research = await prisma.seguePillResearch.findUnique({
      where: { id: researchId },
      include: {
        campaignGoal: {
          select: {
            id: true,
            name: true,
            goalType: true
          }
        },
        qaProject: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    if (!research) {
      return jsonNoStore({ error: 'Research not found' }, { status: 404 })
    }

    return jsonNoStore({ research })
  } catch (error) {
    console.error('Error fetching research:', error)
    return jsonNoStore({ error: 'Failed to fetch research' }, { status: 500 })
  }
}
