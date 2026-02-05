import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

// GET: Fetch all campaign goals
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const goals = await prisma.segueCampaignGoal.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      goals
    })

  } catch (error) {
    console.error('Error fetching campaign goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign goals' },
      { status: 500 }
    )
  }
}

// POST: Create a new campaign goal
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, goalType, description, businessPrompt, ctaRequirement } = body

    if (!name || !goalType || !businessPrompt) {
      return NextResponse.json(
        { error: 'Name, goalType, and businessPrompt are required' },
        { status: 400 }
      )
    }

    // Get user ID from session
    let userId = (session.user as any).id
    
    // If no ID in session, look up user by email
    if (!userId && session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
      userId = user?.id
    }

    const goal = await prisma.segueCampaignGoal.create({
      data: {
        name,
        goalType,
        description,
        businessPrompt,
        ctaRequirement: ctaRequirement || { minCount: 1, maxCount: 2 },
        isActive: true,
        createdById: userId || null
      }
    })

    return NextResponse.json({
      success: true,
      goal
    })

  } catch (error) {
    console.error('Error creating campaign goal:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign goal'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
