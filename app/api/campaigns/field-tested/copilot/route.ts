import { NextRequest, NextResponse } from 'next/server'

type CopilotRequest = {
  prompt?: string
  profile?: {
    audienceLens?: 'prospect' | 'parent' | 'influencer' | null
    topAttribute?: 'strength' | 'skills' | 'support' | 'stability' | null
    concernFlags?: string[]
  }
}

const lensGuidance: Record<string, string> = {
  prospect: 'Focus on practical fit, clarity, and first-step momentum.',
  parent: 'Focus on support systems, direction, and long-term value.',
  influencer: 'Focus on authentic language, relevance, and representational credibility.'
}

const attributeGuidance: Record<string, string> = {
  strength: 'Frame challenge as transformation, not intimidation.',
  skills: 'Highlight transferable and non-combat pathways with concrete examples.',
  support: 'Show belonging, mentorship, and team continuity.',
  stability: 'Lead with tangible benefits and future-readiness outcomes.'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CopilotRequest
    const prompt = (body.prompt || '').trim()
    const lens = body.profile?.audienceLens || 'prospect'
    const attribute = body.profile?.topAttribute || 'skills'
    const concerns = body.profile?.concernFlags || []

    const concernLine =
      concerns.length > 0
        ? `Address concern priority: ${concerns.slice(0, 2).join(', ')}.`
        : 'Add one concern check to reduce uncertainty before CTA.'

    const answer = [
      `For this prompt, guide with a ${lens} perspective.`,
      lensGuidance[lens] || lensGuidance.prospect,
      attributeGuidance[attribute] || attributeGuidance.skills,
      concernLine
    ].join(' ')

    const nextPrompt =
      lens === 'parent'
        ? 'What concrete support should families see first?'
        : lens === 'influencer'
          ? 'Which story angle feels authentic without overhyping?'
          : 'Which first step would make this feel achievable this week?'

    return NextResponse.json({ answer, nextPrompt, prompt })
  } catch {
    return NextResponse.json(
      {
        answer:
          'Use a practical, respectful tone. Show one real example, one concrete pathway, and one clear next step.',
        nextPrompt: 'What concern should we resolve first?'
      },
      { status: 200 }
    )
  }
}
