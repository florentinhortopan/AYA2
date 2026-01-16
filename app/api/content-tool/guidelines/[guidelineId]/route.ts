import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: { guidelineId: string } }) {
  const body = await request.json()
  const { name, content, version, isActive } = body || {}

  const guideline = await prisma.contentGuideline.update({
    where: { id: params.guidelineId },
    data: {
      name,
      content,
      version,
      isActive,
    }
  })

  return NextResponse.json({ guideline })
}
