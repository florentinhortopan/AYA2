import { AgentType } from '@/types'
import { UserContextData } from './context-builder'

/**
 * Personalizes agent guidelines based on user profile and context data
 */
export function personalizeGuidelines(
  baseGuidelines: Record<string, any>,
  agentType: AgentType,
  enhancedContext?: {
    profile?: {
      age?: number | null
      location?: string | null
      interests?: string[]
      fitnessLevel?: string | null
      mentalHealth?: string | null
      careerGoals?: any
      preferences?: any
    }
    insights?: {
      preferences?: string[]
      personality?: {
        traits?: string[]
        learningStyle?: string
        motivationType?: string
      }
      recommendations?: string[]
    }
    sentiment?: {
      label?: string
      summary?: string
    }
  } | null
): Record<string, any> {
  if (!enhancedContext?.profile && !enhancedContext?.insights) {
    // No user context available, return base guidelines
    return baseGuidelines
  }

  const profile = enhancedContext.profile
  const insights = enhancedContext.insights
  const personalized = JSON.parse(JSON.stringify(baseGuidelines)) // Deep clone

  // Personalize based on agent type
  switch (agentType) {
    case 'recruitment':
      return personalizeRecruitmentGuidelines(personalized, profile, insights)
    case 'training':
      return personalizeTrainingGuidelines(personalized, profile, insights)
    case 'financial':
      return personalizeFinancialGuidelines(personalized, profile, insights)
    case 'educational':
      return personalizeEducationalGuidelines(personalized, profile, insights)
    default:
      return personalized
  }
}

function personalizeRecruitmentGuidelines(
  guidelines: Record<string, any>,
  profile?: {
    age?: number | null
    location?: string | null
    interests?: string[]
    fitnessLevel?: string | null
    mentalHealth?: string | null
    careerGoals?: any
    preferences?: any
  },
  insights?: {
    preferences?: string[]
    personality?: {
      traits?: string[]
      learningStyle?: string
      motivationType?: string
    }
    recommendations?: string[]
  }
): Record<string, any> {
  // Customize career path recommendations based on age
  if (profile?.age) {
    if (profile.age < 20) {
      guidelines.careerPaths = {
        ...guidelines.careerPaths,
        focusAreas: [
          ...(guidelines.careerPaths?.focusAreas || []),
          'Entry-level positions',
          'Basic training requirements',
          'Educational benefits',
          'Long-term career growth'
        ],
        emphasis: 'Emphasize entry-level opportunities, educational benefits, and long-term career growth potential.'
      }
    } else if (profile.age > 30) {
      guidelines.careerPaths = {
        ...guidelines.careerPaths,
        focusAreas: [
          ...(guidelines.careerPaths?.focusAreas || []),
          'Leadership roles',
          'Experience-based positions',
          'Career transition opportunities',
          'Maximum age requirements'
        ],
        emphasis: 'Focus on leadership opportunities, leveraging existing experience, and understanding age requirements.'
      }
    }
  }

  // Customize based on interests
  if (profile?.interests && profile.interests.length > 0) {
    const interests = profile.interests.map(i => i.toLowerCase())
    
    if (interests.some(i => i.includes('tech') || i.includes('computer') || i.includes('it'))) {
      guidelines.recommendations = {
        ...guidelines.recommendations,
        factors: [
          ...(guidelines.recommendations?.factors || []),
          'Technical roles (IT, Cyber, Communications)',
          'Certification opportunities',
          'Clearance requirements for technical positions'
        ],
        emphasis: 'Prioritize technical career paths matching user interests.'
      }
    }

    if (interests.some(i => i.includes('medical') || i.includes('health') || i.includes('care'))) {
      guidelines.recommendations = {
        ...guidelines.recommendations,
        factors: [
          ...(guidelines.recommendations?.factors || []),
          'Medical roles (Medic, Nurse, Medical Officer)',
          'Training programs and certifications',
          'Civilian transferable credentials'
        ],
        emphasis: 'Highlight medical career paths and training opportunities.'
      }
    }

    if (interests.some(i => i.includes('leadership') || i.includes('management') || i.includes('command'))) {
      guidelines.recommendations = {
        ...guidelines.recommendations,
        factors: [
          ...(guidelines.recommendations?.factors || []),
          'Officer candidate programs',
          'Leadership development tracks',
          'Management roles'
        ],
        emphasis: 'Focus on leadership and officer opportunities.'
      }
    }
  }

  // Customize based on fitness level
  if (profile?.fitnessLevel) {
    const fitnessLevel = profile.fitnessLevel.toLowerCase()
    if (fitnessLevel === 'beginner' || fitnessLevel === 'low') {
      guidelines.requirements = {
        ...guidelines.requirements,
        emphasis: 'Provide encouragement about fitness improvement programs. Emphasize that fitness can be developed over time with proper training.'
      }
    } else if (fitnessLevel === 'advanced' || fitnessLevel === 'high') {
      guidelines.recommendations = {
        ...guidelines.recommendations,
        factors: [
          ...(guidelines.recommendations?.factors || []),
          'Physically demanding roles (Special Forces, Infantry, Combat roles)',
          'Fitness assessment preparation'
        ],
        emphasis: 'Highlight physically demanding roles that match user capabilities.'
      }
    }
  }

  // Customize tone based on personality traits
  if (insights?.personality?.traits && insights.personality.traits.length > 0) {
    const traits = insights.personality.traits.map(t => t.toLowerCase())
    
    if (traits.some(t => t.includes('goal') || t.includes('driven'))) {
      guidelines.tone = {
        ...guidelines.tone,
        emphasis: 'Use goal-oriented language. Focus on career progression paths and achievement milestones.'
      }
    }

    if (traits.some(t => t.includes('curious') || t.includes('exploratory'))) {
      guidelines.approach = {
        ...guidelines.approach,
        emphasis: 'Provide detailed information and multiple options. Encourage exploration of different paths.'
      }
    }

    if (traits.some(t => t.includes('cautious') || t.includes('thoughtful'))) {
      guidelines.tone = {
        ...guidelines.tone,
        emphasis: 'Be thorough and patient. Address concerns and provide detailed information about requirements and commitments.'
      }
    }
  }

  // Customize based on learning style
  if (insights?.personality?.learningStyle) {
    const style = insights.personality.learningStyle.toLowerCase()
    if (style.includes('visual')) {
      guidelines.presentation = {
        emphasis: 'Use visual aids, timelines, and structured comparisons when explaining career paths.'
      }
    } else if (style.includes('hands') || style.includes('kinesthetic')) {
      guidelines.presentation = {
        emphasis: 'Provide hands-on examples, real-world scenarios, and practical next steps.'
      }
    }
  }

  return guidelines
}

function personalizeTrainingGuidelines(
  guidelines: Record<string, any>,
  profile?: {
    age?: number | null
    location?: string | null
    interests?: string[]
    fitnessLevel?: string | null
    mentalHealth?: string | null
    careerGoals?: any
    preferences?: any
  },
  insights?: {
    preferences?: string[]
    personality?: {
      traits?: string[]
      learningStyle?: string
      motivationType?: string
    }
    recommendations?: string[]
  }
): Record<string, any> {
  // Customize based on fitness level
  if (profile?.fitnessLevel) {
    const level = profile.fitnessLevel.toLowerCase()
    
    if (level === 'beginner' || level === 'low') {
      guidelines.physicalTraining = {
        ...guidelines.physicalTraining,
        focusAreas: [
          'Foundational fitness building',
          'Basic exercises and form',
          'Progressive overload',
          'Recovery and rest',
          'Building consistency'
        ],
        emphasis: 'Start with beginner-friendly programs. Emphasize consistency over intensity. Focus on form and gradual progression.'
      }
    } else if (level === 'intermediate') {
      guidelines.physicalTraining = {
        ...guidelines.physicalTraining,
        focusAreas: [
          'Performance optimization',
          'Varied training routines',
          'Strength and endurance balance',
          'Advanced techniques',
          'Military-specific training'
        ],
        emphasis: 'Provide intermediate-level programs with variety. Include military fitness test preparation.'
      }
    } else if (level === 'advanced' || level === 'high') {
      guidelines.physicalTraining = {
        ...guidelines.physicalTraining,
        focusAreas: [
          'Elite performance training',
          'Specialized programs',
          'Recovery optimization',
          'Competition preparation',
          'Mentorship and coaching'
        ],
        emphasis: 'Offer advanced, challenging programs. Focus on optimization and specialization.'
      }
    }
  }

  // Customize mental training based on mental health status
  if (profile?.mentalHealth) {
    const mentalHealth = profile.mentalHealth.toLowerCase()
    
    if (mentalHealth.includes('stress') || mentalHealth.includes('anxiety')) {
      guidelines.mentalTraining = {
        ...guidelines.mentalTraining,
        categories: [
          'Stress management techniques',
          'Anxiety coping strategies',
          'Mindfulness and meditation',
          'Breathing exercises',
          'Sleep hygiene',
          'Professional support resources'
        ],
        emphasis: 'Prioritize stress management and coping strategies. Provide gentle, supportive guidance.'
      }
    }
  }

  // Customize based on personality and motivation
  if (insights?.personality?.motivationType) {
    const motivation = insights.personality.motivationType.toLowerCase()
    
    if (motivation.includes('achievement')) {
      guidelines.approach = {
        emphasis: 'Set clear goals and milestones. Track progress and celebrate achievements. Use gamification elements.'
      }
    } else if (motivation.includes('social') || motivation.includes('affiliation')) {
      guidelines.approach = {
        emphasis: 'Emphasize community and social aspects. Suggest group training options and accountability partners.'
      }
    }
  }

  return guidelines
}

function personalizeFinancialGuidelines(
  guidelines: Record<string, any>,
  profile?: {
    age?: number | null
    location?: string | null
    interests?: string[]
    fitnessLevel?: string | null
    mentalHealth?: string | null
    careerGoals?: any
    preferences?: any
  },
  insights?: {
    preferences?: string[]
    personality?: {
      traits?: string[]
      learningStyle?: string
      motivationType?: string
    }
    recommendations?: string[]
  }
): Record<string, any> {
  // Customize based on age (different financial priorities)
  if (profile?.age) {
    if (profile.age < 22) {
      guidelines.benefits = {
        ...guidelines.benefits,
        categories: [
          ...(guidelines.benefits?.categories || []),
          'Education benefits (GI Bill)',
          'Tuition assistance',
          'Student loan repayment',
          'Early savings strategies'
        ],
        emphasis: 'Emphasize education benefits and early savings strategies. Focus on long-term financial planning.'
      }
    } else if (profile.age > 30) {
      guidelines.benefits = {
        ...guidelines.benefits,
        categories: [
          ...(guidelines.benefits?.categories || []),
          'Retirement planning (TSP)',
          'Home buying programs (VA loans)',
          'Family benefits',
          'Transition planning'
        ],
        emphasis: 'Focus on retirement planning, home ownership, and family benefits. Emphasize long-term financial security.'
      }
    }
  }

  // Customize budgeting based on personality
  if (insights?.personality?.traits) {
    const traits = insights.personality.traits.map(t => t.toLowerCase())
    
    if (traits.some(t => t.includes('detail') || t.includes('organized'))) {
      guidelines.budgeting = {
        ...guidelines.budgeting,
        emphasis: 'Provide detailed budgeting tools and tracking methods. Emphasize comprehensive financial planning.'
      }
    } else if (traits.some(t => t.includes('simple') || t.includes('minimal'))) {
      guidelines.budgeting = {
        ...guidelines.budgeting,
        emphasis: 'Offer simple, streamlined budgeting approaches. Focus on essential expenses and automatic savings.'
      }
    }
  }

  return guidelines
}

function personalizeEducationalGuidelines(
  guidelines: Record<string, any>,
  profile?: {
    age?: number | null
    location?: string | null
    interests?: string[]
    fitnessLevel?: string | null
    mentalHealth?: string | null
    careerGoals?: any
    preferences?: any
  },
  insights?: {
    preferences?: string[]
    personality?: {
      traits?: string[]
      learningStyle?: string
      motivationType?: string
    }
    recommendations?: string[]
  }
): Record<string, any> {
  // Customize based on learning style
  if (insights?.personality?.learningStyle) {
    const style = insights.personality.learningStyle.toLowerCase()
    
    if (style.includes('visual')) {
      guidelines.approach = {
        emphasis: 'Use visual learning materials, diagrams, videos, and interactive visualizations.'
      }
    } else if (style.includes('auditory')) {
      guidelines.approach = {
        emphasis: 'Recommend audio resources, podcasts, lectures, and discussion-based learning.'
      }
    } else if (style.includes('hands') || style.includes('kinesthetic')) {
      guidelines.approach = {
        emphasis: 'Focus on hands-on projects, practical exercises, and interactive learning experiences.'
      }
    } else if (style.includes('read') || style.includes('write')) {
      guidelines.approach = {
        emphasis: 'Provide reading materials, written guides, note-taking strategies, and written exercises.'
      }
    }
  }

  // Customize based on interests
  if (profile?.interests && profile.interests.length > 0) {
    const interests = profile.interests.map(i => i.toLowerCase())
    
    if (interests.some(i => i.includes('tech') || i.includes('computer') || i.includes('programming'))) {
      guidelines.programs = {
        ...guidelines.programs,
        categories: [
          ...(guidelines.programs?.categories || []),
          'IT certifications',
          'Cybersecurity training',
          'Software development',
          'Technical skills bootcamps'
        ],
        emphasis: 'Prioritize technical and IT-related educational programs.'
      }
    }
  }

  return guidelines
}

