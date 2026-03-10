import { z } from 'zod'

export const sceneDirectiveSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['hero_swap', 'panel_add', 'panel_remove', 'emphasis', 'cta_state', 'focus_shift']),
  target: z.string().min(1),
  transition: z.enum(['fade', 'slide', 'parallax', 'none']).default('fade'),
  intensity: z.number().min(0).max(1).default(0.45),
  reason: z.string().min(1)
})

export const immersiveCardSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['rag', 'job', 'video', 'cta', 'insight']),
  title: z.string().min(1),
  body: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
})

export const voiceDirectivesSchema = z.object({
  speak: z.boolean().default(false),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  mode: z.enum(['none', 'stt', 'stt_tts']).default('none')
})

export const immersiveScenePayloadSchema = z.object({
  assistantReply: z.string().min(1),
  sceneDirectives: z.array(sceneDirectiveSchema).max(8),
  contentCards: z.array(immersiveCardSchema).max(10),
  voiceDirectives: voiceDirectivesSchema,
  telemetry: z.object({
    journey: z.enum(['discover', 'compare', 'convert']),
    confidence: z.number().min(0).max(1),
    sourceAttributionCount: z.number().int().min(0)
  })
})

export type SceneDirective = z.infer<typeof sceneDirectiveSchema>
export type ImmersiveCard = z.infer<typeof immersiveCardSchema>
export type VoiceDirectives = z.infer<typeof voiceDirectivesSchema>
export type ImmersiveScenePayload = z.infer<typeof immersiveScenePayloadSchema>

type IntentStage = 'discover' | 'compare' | 'convert'

const discoverTokens = ['explore', 'learn', 'overview', 'what', 'how', 'why', 'start']
const compareTokens = ['compare', 'difference', 'vs', 'better', 'which', 'between']
const convertTokens = ['apply', 'contact', 'recruiter', 'join', 'next step', 'eligibility']

const matchesAny = (value: string, terms: string[]): boolean => {
  const lower = value.toLowerCase()
  return terms.some((term) => lower.includes(term))
}

export const detectIntentStage = (message: string): IntentStage => {
  if (matchesAny(message, convertTokens)) return 'convert'
  if (matchesAny(message, compareTokens)) return 'compare'
  if (matchesAny(message, discoverTokens)) return 'discover'
  return 'discover'
}

export const clampCardsForLatency = (cards: ImmersiveCard[], max = 6): ImmersiveCard[] => {
  return cards.slice(0, max)
}

export const dedupeCardsBySource = (cards: ImmersiveCard[]): ImmersiveCard[] => {
  const seen = new Set<string>()
  const result: ImmersiveCard[] = []
  for (const card of cards) {
    const dedupeKey = `${card.type}:${card.sourceUrl || card.title.toLowerCase()}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    result.push(card)
  }
  return result
}

export const buildSceneDirectives = (
  stage: IntentStage,
  hasVideo: boolean,
  hasJobs: boolean
): SceneDirective[] => {
  const directives: SceneDirective[] = [
    {
      id: 'focus-main',
      action: 'focus_shift',
      target: 'scene_canvas',
      transition: 'fade',
      intensity: 0.3,
      reason: 'Maintain continuity on each turn'
    }
  ]

  if (stage === 'discover') {
    directives.push({
      id: 'discover-hero',
      action: 'hero_swap',
      target: 'insight_hero',
      transition: 'parallax',
      intensity: 0.45,
      reason: 'Guide first-time exploration'
    })
  }

  if (stage === 'compare' && hasJobs) {
    directives.push({
      id: 'compare-panel',
      action: 'panel_add',
      target: 'job_compare_panel',
      transition: 'slide',
      intensity: 0.55,
      reason: 'Show role comparison context'
    })
  }

  if (hasVideo) {
    directives.push({
      id: 'video-emphasis',
      action: 'emphasis',
      target: 'media_strip',
      transition: 'fade',
      intensity: 0.5,
      reason: 'Provide proof and storytelling'
    })
  }

  if (stage === 'convert') {
    directives.push({
      id: 'cta-ready',
      action: 'cta_state',
      target: 'apply_cta',
      transition: 'slide',
      intensity: 0.8,
      reason: 'Escalate from soft CTA to conversion'
    })
  }

  return directives
}

export const buildFallbackPayload = (params: {
  message: string
  reply: string
  cards: ImmersiveCard[]
  sttEnabled?: boolean
  ttsEnabled?: boolean
}): ImmersiveScenePayload => {
  const stage = detectIntentStage(params.message)
  const cards = clampCardsForLatency(dedupeCardsBySource(params.cards))
  const hasVideo = cards.some((card) => card.type === 'video')
  const hasJobs = cards.some((card) => card.type === 'job')
  const sourceAttributionCount = cards.filter((card) => Boolean(card.sourceUrl)).length

  return {
    assistantReply: params.reply,
    sceneDirectives: buildSceneDirectives(stage, hasVideo, hasJobs),
    contentCards: cards,
    voiceDirectives: {
      speak: Boolean(params.ttsEnabled),
      priority: stage === 'convert' ? 'high' : 'normal',
      mode: params.ttsEnabled ? 'stt_tts' : params.sttEnabled ? 'stt' : 'none'
    },
    telemetry: {
      journey: stage,
      confidence: cards.length > 0 ? 0.75 : 0.45,
      sourceAttributionCount
    }
  }
}

export const parseImmersiveScenePayload = (raw: unknown): ImmersiveScenePayload | null => {
  const parsed = immersiveScenePayloadSchema.safeParse(raw)
  if (!parsed.success) {
    return null
  }
  return parsed.data
}
