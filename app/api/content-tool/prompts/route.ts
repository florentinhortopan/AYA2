import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const prompts = await prisma.contentPrompt.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json({ prompts })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, type, content, version, isActive = false } = body || {}

  if (!name || !type || !content || !version) {
    return NextResponse.json({ error: 'name, type, content, version are required' }, { status: 400 })
  }

  const prompt = await prisma.contentPrompt.create({
    data: {
      name,
      type,
      content,
      version,
      isActive,
    }
  })

  return NextResponse.json({ prompt })
}
