import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch recent training logs
    const trainingLogs = await prisma.trainingLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        activity: true,
        duration: true,
        createdAt: true
      }
    })

    // Format as activity items
    const activity = trainingLogs.map(log => ({
      id: log.id,
      type: log.type === 'physical' ? 'Physical Training' : 'Mental Training',
      description: `${log.activity}${log.duration ? ` (${log.duration} min)` : ''}`,
      timestamp: log.createdAt.toISOString()
    }))

    return NextResponse.json({ activity })
  } catch (error) {
    console.error('Activity fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

