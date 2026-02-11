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
    const { answerIds, validationStatus, ratingValue } = body || {}

    if (!answerIds || !Array.isArray(answerIds) || answerIds.length === 0) {
      return NextResponse.json({ error: 'answerIds array is required' }, { status: 400 })
    }

    if (!validationStatus && ratingValue === undefined) {
      return NextResponse.json({ error: 'validationStatus or ratingValue is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (validationStatus) {
      updateData.validationStatus = validationStatus
    }
    if (ratingValue !== undefined) {
      updateData.ratingValue = ratingValue
      updateData.ratingUpdatedAt = new Date()
    }

    const result = await prisma.qaAnswer.updateMany({
      where: {
        id: { in: answerIds }
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      answerIds
    })
  } catch (error) {
    console.error('Error updating answers batch:', error)
    const message = error instanceof Error ? error.message : 'Failed to update answers'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
