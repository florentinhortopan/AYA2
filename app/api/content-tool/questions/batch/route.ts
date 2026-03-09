import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questionIds, status, ratingValue } = body || {}

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'questionIds array is required' }, { status: 400 })
    }

    if (!status && ratingValue === undefined) {
      return NextResponse.json({ error: 'status or ratingValue is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (status) {
      updateData.status = status
    }
    if (ratingValue !== undefined) {
      updateData.ratingValue = ratingValue
      updateData.ratingUpdatedAt = new Date()
    }

    const result = await prisma.qaQuestion.updateMany({
      where: {
        id: { in: questionIds }
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      questionIds
    })
  } catch (error) {
    console.error('Error updating questions batch:', error)
    const message = error instanceof Error ? error.message : 'Failed to update questions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
