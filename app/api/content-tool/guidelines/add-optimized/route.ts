import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Read the optimized guideline file
    const guidelinePath = join(process.cwd(), 'app/content/prompts/Guideline-Optimized.md')
    const guidelineContent = await readFile(guidelinePath, 'utf-8')

    // Check if a guideline with this name already exists
    const existing = await prisma.contentGuideline.findFirst({
      where: {
        name: 'U.S. Army Q&A Generation Guidelines (Optimized)'
      }
    })

    let guideline
    if (existing) {
      // Update existing guideline
      guideline = await prisma.contentGuideline.update({
        where: { id: existing.id },
        data: {
          content: guidelineContent,
          version: '2.0',
          isActive: true,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new guideline
      guideline = await prisma.contentGuideline.create({
        data: {
          name: 'U.S. Army Q&A Generation Guidelines (Optimized)',
          content: guidelineContent,
          version: '2.0',
          isActive: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      guideline: {
        id: guideline.id,
        name: guideline.name,
        version: guideline.version,
        isActive: guideline.isActive,
        contentLength: guideline.content.length
      },
      message: existing ? 'Guideline updated successfully' : 'Guideline created successfully'
    })
  } catch (error) {
    console.error('Error adding optimized guideline:', error)
    const message = error instanceof Error ? error.message : 'Failed to add guideline'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
