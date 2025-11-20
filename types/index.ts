// Agent Types
export type AgentType = 'recruitment' | 'training' | 'financial' | 'educational'

export interface AgentSession {
  id: string
  userId?: string
  agentType: AgentType
  sessionData: {
    messages?: Array<{
      role: 'user' | 'assistant' | 'system'
      content: string
      timestamp: string
    }>
    context?: Record<string, unknown>
  }
  createdAt: string
  updatedAt: string
}

// User Profile Types
export interface UserProfile {
  age?: number
  location?: string
  interests: string[]
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced'
  mentalHealth?: string
  careerGoals?: CareerGoal[]
  preferences?: UserPreferences
}

export interface CareerGoal {
  path: string
  interest: number
  requirements?: string[]
  timeline?: string
}

export interface UserPreferences {
  communicationStyle?: string
  trainingFrequency?: string
  notificationPreferences?: Record<string, boolean>
}

// Training Types
export type TrainingType = 'physical' | 'mental'
export type Intensity = 'low' | 'medium' | 'high'

export interface TrainingActivity {
  id: string
  type: TrainingType
  activity: string
  duration?: number
  intensity?: Intensity
  notes?: string
  completed: boolean
  createdAt: string
}

// Progress Types
export interface UserProgressData {
  category: 'career' | 'physical' | 'mental' | 'financial' | 'education'
  level: number
  experience: number
  milestones?: Array<{
    id: string
    name: string
    completed: boolean
    completedAt?: string
  }>
}

// Content Types
export type ContentType = 'guide' | 'review' | 'tip' | 'story'

export interface Content {
  id: string
  userId: string
  type: ContentType
  title: string
  description?: string
  body: string
  tags: string[]
  approved: boolean
  views: number
  likes: number
  createdAt: string
}

// Achievement Types
export interface Achievement {
  id: string
  name: string
  description: string
  icon?: string
  points: number
  category: 'training' | 'career' | 'community' | 'learning'
}

