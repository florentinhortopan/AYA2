import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z, ZodError } from 'zod'

const profileUpdateSchema = z.object({
  age: z.number().min(17).max(65).optional(),
  location: z.string().optional(),
  interests: z.array(z.string()).optional(),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  careerGoals: z.string().optional(),
  onboardingComplete: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)

    // Update profile
    const profile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        age: validatedData.age,
        location: validatedData.location,
        interests: validatedData.interests,
        fitnessLevel: validatedData.fitnessLevel,
        careerGoals: validatedData.careerGoals ? JSON.stringify({
          text: validatedData.careerGoals,
          updatedAt: new Date().toISOString()
        }) : undefined,
        onboardingComplete: validatedData.onboardingComplete ?? undefined,
      }
    })

    // If onboarding is complete, initialize user progress
    if (validatedData.onboardingComplete) {
      const categories = ['career', 'physical', 'mental', 'financial', 'education'] as const
      
      for (const category of categories) {
        await prisma.userProgress.upsert({
          where: {
            userId_category: {
              userId: session.user.id,
              category
            }
          },
          create: {
            userId: session.user.id,
            category,
            level: 1,
            experience: 0,
            progress: {}
          },
          update: {}
        })
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        age: profile.age,
        location: profile.location,
        interests: profile.interests,
        fitnessLevel: profile.fitnessLevel,
        onboardingComplete: profile.onboardingComplete
      }
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        age: profile.age,
        location: profile.location,
        interests: profile.interests,
        fitnessLevel: profile.fitnessLevel,
        careerGoals: profile.careerGoals,
        onboardingComplete: profile.onboardingComplete
      }
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

