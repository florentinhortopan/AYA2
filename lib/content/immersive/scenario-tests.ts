import { ImmersiveCard, buildFallbackPayload } from '@/lib/content/immersive/scene-orchestrator'

interface ScenarioResult {
  scenario: 'discover' | 'compare' | 'convert'
  passed: boolean
  notes: string
}

const baseCards: ImmersiveCard[] = [
  {
    id: 'rag-1',
    type: 'rag',
    title: 'What jobs are available?',
    body: 'The Army includes medical, cyber, engineering, and operations tracks.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs.html'
  },
  {
    id: 'job-1',
    type: 'job',
    title: 'Combat Medic Specialist',
    body: 'Provide emergency medical treatment in combat and non-combat situations.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs/combat/medical-specialist.html'
  },
  {
    id: 'video-1',
    type: 'video',
    title: 'Day in the life',
    body: 'A role-focused story.',
    sourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
]

export const runImmersiveScenarioSmokeTests = (): ScenarioResult[] => {
  const discoverPayload = buildFallbackPayload({
    message: 'I want to explore career options',
    reply: 'Let us explore.',
    cards: baseCards
  })
  const comparePayload = buildFallbackPayload({
    message: 'Compare medic versus cyber',
    reply: 'Here is a comparison.',
    cards: baseCards
  })
  const convertPayload = buildFallbackPayload({
    message: 'How do I apply and talk to a recruiter?',
    reply: 'Let us move to next steps.',
    cards: baseCards
  })

  return [
    {
      scenario: 'discover',
      passed: discoverPayload.telemetry.journey === 'discover',
      notes: `journey=${discoverPayload.telemetry.journey}`
    },
    {
      scenario: 'compare',
      passed:
        comparePayload.telemetry.journey === 'compare' &&
        comparePayload.sceneDirectives.some((item) => item.target === 'job_compare_panel'),
      notes: `journey=${comparePayload.telemetry.journey}`
    },
    {
      scenario: 'convert',
      passed:
        convertPayload.telemetry.journey === 'convert' &&
        convertPayload.sceneDirectives.some((item) => item.action === 'cta_state'),
      notes: `journey=${convertPayload.telemetry.journey}`
    }
  ]
}
