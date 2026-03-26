import {
  AudienceLens,
  ConcernFlag,
  FieldStoryCardAsset,
  FieldTestedSectionSpec,
  WarriorAttribute
} from './types'

export const defaultFieldTestedProfile = {
  audienceLens: null,
  topAttribute: null,
  confidenceScore: 40,
  concernFlags: [] as ConcernFlag[],
  contentAffinity: [] as Array<'story' | 'practical' | 'benefits' | 'non_combat' | 'team'>,
  completedSections: [] as string[]
}

export const lensOptions: Array<{
  id: AudienceLens
  title: string
  subtitle: string
  outcomes: string[]
}> = [
  {
    id: 'prospect',
    title: 'Prospect Lens',
    subtitle: 'Find fit, confidence, and practical next steps.',
    outcomes: ['Role clarity', 'Confidence boost', 'Action plan']
  },
  {
    id: 'parent',
    title: 'Parent Lens',
    subtitle: 'Focus on support, safety context, and long-term value.',
    outcomes: ['Support framing', 'Benefits clarity', 'Conversation readiness']
  },
  {
    id: 'influencer',
    title: 'Influencer Lens',
    subtitle: 'Prioritize authenticity, relevance, and audience resonance.',
    outcomes: ['Message angle', 'Credibility checks', 'Share-ready talking points']
  }
]

export const warriorAttributes: Array<{
  id: WarriorAttribute
  title: string
  description: string
  proofPoint: string
}> = [
  {
    id: 'strength',
    title: 'Strength',
    description: 'Build a core of confidence, resilience, and determination.',
    proofPoint: 'Transformation over intimidation.'
  },
  {
    id: 'skills',
    title: 'Skills',
    description: 'Develop practical and transferable career pathways.',
    proofPoint: 'Non-combat roles and real-world applications.'
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Find belonging, mentorship, and team momentum.',
    proofPoint: 'You are not building your future alone.'
  },
  {
    id: 'stability',
    title: 'Stability',
    description: 'Build concrete foundations through benefits and structure.',
    proofPoint: 'Tangible outcomes and long-term readiness.'
  }
]

export const concernModules: Array<{
  id: ConcernFlag
  title: string
  guidance: string
  faq: string[]
}> = [
  {
    id: 'fit',
    title: 'Do I actually fit this?',
    guidance: 'You do not need to show up fully formed. The path is designed to build readiness over time.',
    faq: ['How do I know which roles match me?', 'Can I start without experience?', 'Are non-combat options available?']
  },
  {
    id: 'timeline',
    title: 'How long does this take?',
    guidance: 'Break the process into clear steps so uncertainty turns into a manageable plan.',
    faq: ['What are the first two steps?', 'How quickly can I move forward?', 'What happens after I choose a path?']
  },
  {
    id: 'benefits',
    title: 'What are the real benefits?',
    guidance: 'Lead with tangible outcomes: education, skill building, structure, and support.',
    faq: ['How does education support work?', 'What skills transfer to civilian careers?', 'What support exists for growth?']
  },
  {
    id: 'autonomy',
    title: 'How much control do I have?',
    guidance: 'Address this directly with clear expectations and transparent decision points.',
    faq: ['How are role paths chosen?', 'How does progression work?', 'What choices can I influence?']
  },
  {
    id: 'safety',
    title: 'What about safety and risk?',
    guidance: 'Do not dodge the concern. Provide realistic, respectful context and support pathways.',
    faq: ['How is readiness built?', 'What support systems exist?', 'How is risk discussed upfront?']
  }
]

export const sectionSpecs: FieldTestedSectionSpec[] = [
  {
    id: 's1_hero',
    title: 'Hero / Instigation',
    objective: 'Move from hesitation to forward momentum.',
    behavior: ['Lead with core proposition', 'Offer immediate path entry', 'Anchor realism through visual tone'],
    desiredAssets: [
      { name: 'Hero visual still/loop', availability: 'PARTIAL', notes: 'Use current GoArmy media until Field Tested cuts exist.' },
      { name: 'Instigation copy block', availability: 'HAVE', notes: 'Derived from findings and manifesto.' }
    ]
  },
  {
    id: 's2_lens',
    title: 'Choose Your Lens',
    objective: 'Set personalized context for all downstream modules.',
    behavior: ['Force one-lens selection', 'Adapt copy priority by lens', 'Persist lens in profile state'],
    desiredAssets: [
      { name: 'Lens card imagery', availability: 'PARTIAL', notes: 'Need balanced representation curation.' }
    ]
  },
  {
    id: 's3_wheel',
    title: 'Warrior Wheel',
    objective: 'Translate values into practical outcomes.',
    behavior: ['Interactive segment selection', 'Show proof card per segment', 'Set top attribute in profile'],
    desiredAssets: [
      { name: 'Pillar proof cards', availability: 'PARTIAL', notes: 'Requires metadata tagging by pillar.' }
    ]
  },
  {
    id: 's4_stories',
    title: 'Field Stories',
    objective: 'Increase authenticity and emotional relevance.',
    behavior: ['Card stack responses', 'Update affinity from reactions', 'Ensure operations/humans/field diversity'],
    desiredAssets: [
      { name: 'Story image set (24-36)', availability: 'PARTIAL', notes: 'Can start from 131 ingested images.' },
      { name: 'Short story loops', availability: 'MISSING', notes: 'Strongly recommended for premium version.' }
    ]
  },
  {
    id: 's5_reality',
    title: 'Reality Check',
    objective: 'Resolve high-friction uncertainty topics.',
    behavior: ['Concern tab switcher', 'FAQ expansion tracking', 'Mark concern resolved'],
    desiredAssets: [
      { name: 'Concern-specific FAQ bank', availability: 'PARTIAL', notes: 'Reuse Q&A project and curate campaign set.' }
    ]
  },
  {
    id: 's6_path_builder',
    title: 'My Path Builder',
    objective: 'Convert browsing into a concrete personal path.',
    behavior: ['3-5 quick decisions', 'Generate profile summary', 'Feed action lane ranking'],
    desiredAssets: [
      { name: 'Question mapping schema', availability: 'MISSING', notes: 'Needs explicit content authoring.' }
    ]
  },
  {
    id: 's7_copilot',
    title: 'AI Copilot Moment',
    objective: 'Answer in-context questions without breaking flow.',
    behavior: ['Starter prompts by section', 'Profile-aware answer hints', 'Q&A-grounded fallback'],
    desiredAssets: [
      { name: 'Section starter prompt bank', availability: 'PARTIAL', notes: 'Needs campaign-specific prompt curation.' }
    ]
  },
  {
    id: 's8_recap',
    title: 'Journey Recap',
    objective: 'Reinforce confidence with a personalized summary.',
    behavior: ['Generate achievements', 'Summarize resolved concerns', 'Prepare share card copy'],
    desiredAssets: [
      { name: 'Recap template variants', availability: 'MISSING', notes: 'Need lens x pillar template set.' }
    ]
  },
  {
    id: 's9_action',
    title: 'Action Lane',
    objective: 'Drive conversion and return loop.',
    behavior: ['Rank CTA by profile', 'Save/share profile state', 'Support resume flow'],
    desiredAssets: [
      { name: 'Share card templates', availability: 'MISSING', notes: 'Create copy and visual style variants.' }
    ]
  }
]

export const fallbackStoryCards: FieldStoryCardAsset[] = [
  {
    id: 'ops-1',
    title: 'Operations In Motion',
    bucket: 'operations',
    description: 'Real execution under pressure with practical coordination and adaptation.',
    imageUrl: 'https://www.goarmy.com/content/dam/goarmy/carousels/all-jobs-team-planning_sm.jpg'
  },
  {
    id: 'human-1',
    title: 'People In The Field',
    bucket: 'humans',
    description: 'Human stories focused on trust, confidence, and shared challenge.',
    imageUrl: 'https://www.goarmy.com/content/dam/goarmy/carousels/all-jobs-squad-working_sm.jpg'
  },
  {
    id: 'field-1',
    title: 'Environment As Teacher',
    bucket: 'field',
    description: 'Terrain and conditions are part of how readiness is built.',
    imageUrl: 'https://www.goarmy.com/content/dam/goarmy/carousels/all-jobs-helicopter-deployment_sm.jpg'
  }
]

