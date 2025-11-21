import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z, ZodError } from 'zod'

// Action schemas for validation
const actionSchemas = {
  save_interest: z.object({
    interest: z.string(),
    category: z.string().optional(),
  }),
  explore_career: z.object({
    careerPath: z.string(),
  }),
  start_assessment: z.object({
    type: z.string().optional(),
  }),
  save_plan: z.object({
    planName: z.string(),
    planData: z.record(z.unknown()),
    category: z.string(),
  }),
  log_progress: z.object({
    activity: z.string(),
    duration: z.number().optional(),
    intensity: z.string().optional(),
    notes: z.string().optional(),
    category: z.enum(['physical', 'mental']),
  }),
  set_savings_goal: z.object({
    goalName: z.string(),
    targetAmount: z.number(),
    deadline: z.string().optional(),
  }),
  create_budget: z.object({
    budgetData: z.record(z.unknown()),
  }),
  check_eligibility: z.object({
    program: z.string(),
  }),
}

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
    const { action, data } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    const userId = session.user.id

    // Handle different actions
    switch (action) {
      case 'save_interest':
        return await handleSaveInterest(userId, data)
      
      case 'explore_career':
        return await handleExploreCareer(userId, data)
      
      case 'start_assessment':
        return await handleStartAssessment(userId, data)
      
      case 'save_plan':
        return await handleSavePlan(userId, data)
      
      case 'log_progress':
        return await handleLogProgress(userId, data)
      
      case 'set_savings_goal':
        return await handleSetSavingsGoal(userId, data)
      
      case 'create_budget':
        return await handleCreateBudget(userId, data)
      
      case 'check_eligibility':
        return await handleCheckEligibility(userId, data)
      
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Action handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Save interest to user profile
async function handleSaveInterest(userId: string, data: unknown) {
  try {
    const validated = actionSchemas.save_interest.parse(data)
    
    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId }
    })

    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId, interests: [] }
      })
    }

    // Add interest if not already present
    const interests = profile.interests || []
    if (!interests.includes(validated.interest)) {
      await prisma.profile.update({
        where: { userId },
        data: {
          interests: [...interests, validated.interest]
        }
      })
    }

    // Update progress
    await updateUserProgress(userId, 'career', 10)

    return NextResponse.json({
      success: true,
      message: 'Interest saved successfully'
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    throw error
  }
}

// Track career exploration
async function handleExploreCareer(userId: string, data: unknown) {
  try {
    const validated = actionSchemas.explore_career.parse(data)
    
    // Update progress
    await updateUserProgress(userId, 'career', 5)

    // Could create a tracking record here
    return NextResponse.json({
      success: true,
      message: `Exploring ${validated.careerPath}`,
      redirect: `/careers/${encodeURIComponent(validated.careerPath)}`
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    throw error
  }
}

// Start assessment
async function handleStartAssessment(userId: string, data: unknown) {
  try {
    const validated = actionSchemas.start_assessment.parse(data)
    
    // Update progress
    await updateUserProgress(userId, 'career', 15)

    return NextResponse.json({
      success: true,
      message: 'Assessment started',
      redirect: `/assessment/${validated.type || 'career'}`
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    throw error
  }
}

// Save workout plan or training plan
async function handleSavePlan(userId: string, data: unknown) {
  try {
    const validated = actionSchemas.save_plan.parse(data)
    
    // For now, we'll store this in UserProgress
    // Later could create a separate Plans table
    await prisma.userProgress.upsert({
      where: {
        userId_category: {
          userId,
          category: validated.category as any
        }
      },
      create: {
        userId,
        category: validated.category as any,
        progress: JSON.parse(JSON.stringify({
          savedPlans: [{
            name: validated.planName,
            data: validated.planData,
            savedAt: new Date().toISOString()
          }]
        })) as any,
        level: 1,
        experience: 20
      },
      update: {
        progress: JSON.parse(JSON.stringify({
          savedPlans: [
            ...((await prisma.userProgress.findUnique({
              where: { userId_category: { userId, category: validated.category as any } }
            }))?.progress as any)?.savedPlans || [],
            {
              name: validated.planName,
              data: validated.planData,
              savedAt: new Date().toISOString()
            }
          ]
        })) as any
      }
    })

    await updateUserProgress(userId, validated.category as any, 20)

    return NextResponse.json({
      success: true,
      message: 'Plan saved successfully'
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    throw error
  }
}

// Log training progress
async function handleLogProgress(userId: string, data: unknown) {
  try {
    const validated = actionSchemas.log_progress.parse(data)
    
    // Create training log
    await prisma.trainingLog.create({
      data: {
        userId,
        type: validated.category,
        activity: validated.activity,
        duration: validated.duration,
        intensity: validated.intensity,
        notes: validated.notes,
        completed: true
      }
    })

    // Update progress
    const category = validated.category === 'physical' ? 'physical' : 'mental'
    await updateUserProgress(userId, category, 10)

    return NextResponse.json({
      success: true,
      message: 'Progress logged successfully'
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    throw error
  }
}

// Set savings goal
async function handleSetSavingsGoal(userId: string, data: unknown) {
  try {
    const validated = actionSchemas.set_savings_goal.parse(data)
    
    // Save to financial data
    await prisma.financialData.create({
      data: {
        userId,
        type: 'goal',
        data: JSON.parse(JSON.stringify({
          name: validated.goalName,
          targetAmount: validated.targetAmount,
          deadline: validated.deadline,
          createdAt: new Date().toISOString()
        })) as any
      }
    })

    await updateUserProgress(userId, 'financial', 15)

    return NextResponse.json({
      success: true,
      message: 'Savings goal set successfully'
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    throw error
  }
}

// Create budget
async function handleCreateBudget(userId: string, data: unknown) {
  try {
    const validated = actionSchemas.create_budget.parse(data)
    
    // Save budget
    await prisma.financialData.create({
      data: {
        userId,
        type: 'budget',
        data: JSON.parse(JSON.stringify(validated.budgetData)) as any
      }
    })

    await updateUserProgress(userId, 'financial', 20)

    return NextResponse.json({
      success: true,
      message: 'Budget created successfully'
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    throw error
  }
}

// Check eligibility (placeholder)
async function handleCheckEligibility(userId: string, data: unknown) {
  try {
    const validated = actionSchemas.check_eligibility.parse(data)
    
    await updateUserProgress(userId, 'education', 10)

    return NextResponse.json({
      success: true,
      message: `Checking eligibility for ${validated.program}`,
      redirect: `/eligibility/${encodeURIComponent(validated.program)}`
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    throw error
  }
}

// Helper function to update user progress
async function updateUserProgress(
  userId: string,
  category: 'career' | 'physical' | 'mental' | 'financial' | 'education',
  experience: number
) {
  const current = await prisma.userProgress.findUnique({
    where: {
      userId_category: { userId, category }
    }
  })

  const newExperience = (current?.experience || 0) + experience
  const newLevel = Math.floor(newExperience / 100) + 1

  await prisma.userProgress.upsert({
    where: {
      userId_category: { userId, category }
    },
    create: {
      userId,
      category,
      level: newLevel,
      experience: newExperience,
      progress: {}
    },
    update: {
      level: newLevel,
      experience: newExperience,
        progress: JSON.parse(JSON.stringify({
          ...(current?.progress as any || {}),
          lastActivity: new Date().toISOString()
        })) as any
    }
  })
}

