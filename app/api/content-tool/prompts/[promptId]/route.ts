import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: { promptId: string } }) {
  const body = await request.json()
  const { name, content, version, isActive } = body || {}

  const prompt = await prisma.contentPrompt.update({
    where: { id: params.promptId },
    data: {
      name,
      content,
      version,
      isActive,
    }
  })

  return NextResponse.json({ prompt })
}
