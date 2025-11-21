import { BaseAgent, AgentMessage } from './base'
import { RichAgentResponse } from '@/types'

export class TrainingAgent extends BaseAgent {
  constructor(context = {}) {
    super('training', context)
  }

  getInitialMessage(): string {
    return "Hello! I'm your training assistant. I can help you with both physical and mental training programs, track your progress, and provide personalized workout plans. Are you looking for physical training, mental wellness guidance, or both?"
  }

  async processMessageRich(
    message: string,
    history: AgentMessage[]
  ): Promise<RichAgentResponse> {
    // For now, use legacy method until we implement AI integration
    const legacyResult = await this.processMessage(message, history)
    return {
      text: legacyResult.response,
      components: [],
      metadata: legacyResult.metadata
    }
  }

  async processMessage(
    message: string,
    history: AgentMessage[]
  ): Promise<{ response: string; metadata?: Record<string, unknown> }> {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('physical') || lowerMessage.includes('fitness') || lowerMessage.includes('workout')) {
      return {
        response: this.getPhysicalTrainingResponse(),
        metadata: { type: 'physical_training' }
      }
    }

    if (lowerMessage.includes('mental') || lowerMessage.includes('wellness') || lowerMessage.includes('stress')) {
      return {
        response: this.getMentalTrainingResponse(),
        metadata: { type: 'mental_training' }
      }
    }

    if (lowerMessage.includes('schedule') || lowerMessage.includes('plan')) {
      return {
        response: this.getTrainingPlanResponse(),
        metadata: { type: 'training_plan' }
      }
    }

    if (lowerMessage.includes('progress') || lowerMessage.includes('track')) {
      return {
        response: this.getProgressResponse(),
        metadata: { type: 'progress' }
      }
    }

    return {
      response: "I can help you with physical fitness training, mental wellness programs, creating training schedules, and tracking your progress. What would you like to focus on?",
      metadata: { type: 'general' }
    }
  }

  private getPhysicalTrainingResponse(): string {
    return `I can help you with physical training! Here's a starting plan:
    
    **Beginner Program:**
    - Week 1-2: 20-30 min workouts, 3x per week
    - Focus: Cardio, basic strength exercises
    - Rest days between sessions
    
    **Key Exercises:**
    - Running/walking (building endurance)
    - Push-ups (upper body strength)
    - Sit-ups (core strength)
    - Squats (lower body strength)
    
    What's your current fitness level? I can tailor a program specifically for you.`
  }

  private getMentalTrainingResponse(): string {
    return `Mental wellness is crucial! I can help with:
    
    **Stress Management:**
    - Breathing exercises and meditation
    - Time management techniques
    - Sleep hygiene tips
    
    **Resilience Building:**
    - Growth mindset practices
    - Goal-setting strategies
    - Problem-solving frameworks
    
    **Focus & Discipline:**
    - Concentration exercises
    - Mental preparation techniques
    
    What area of mental training would you like to explore?`
  }

  private getTrainingPlanResponse(): string {
    const profile = this.context.profile as { fitnessLevel?: string } | undefined
    const level = profile?.fitnessLevel || 'beginner'

    return `Here's a personalized training schedule for ${level} level:
    
    **3-Day Training Week:**
    - Monday: Strength training
    - Wednesday: Cardio endurance
    - Friday: Full body circuit
    
    **5-Day Training Week (Intermediate+):**
    - Monday: Upper body strength
    - Tuesday: Cardio
    - Wednesday: Lower body strength
    - Thursday: Active recovery/light cardio
    - Friday: Full body + core
    
    Would you like me to create a detailed weekly plan with specific exercises?`
  }

  private getProgressResponse(): string {
    return `Tracking your progress is important! I can help you:
    
    - Log your workouts (type, duration, intensity)
    - Track improvements in strength, endurance, and flexibility
    - Set and monitor goals
    - Celebrate milestones and achievements
    
    Would you like to start logging your training sessions? I can create a personalized tracking system for you.`
  }
}

