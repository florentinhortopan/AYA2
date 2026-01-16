import { NextRequest, NextResponse } from 'next/server'
import { runPrompt } from '@/lib/content/prompt-runner'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { systemPrompt, userMessage, guidelineText } = body || {}

  if (!systemPrompt || !userMessage) {
    return NextResponse.json({ error: 'systemPrompt and userMessage are required' }, { status: 400 })
  }

  const output = await runPrompt({ systemPrompt, userMessage, guidelineText })
  return NextResponse.json({ output })
}
