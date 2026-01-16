import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const guidelines = await prisma.contentGuideline.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json({ guidelines })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, content, version, isActive = false } = body || {}

  if (!name || !content || !version) {
    return NextResponse.json({ error: 'name, content, version are required' }, { status: 400 })
  }

  const guideline = await prisma.contentGuideline.create({
    data: {
      name,
      content,
      version,
      isActive,
    }
  })

  return NextResponse.json({ guideline })
}
