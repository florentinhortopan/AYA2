import { BaseAgent, AgentMessage } from './base'
import { RichAgentResponse } from '@/types'
import { aiService } from '@/lib/ai'
import { trainingAgentConfig } from './config/training'

export class TrainingAgent extends BaseAgent {
  constructor(context = {}) {
    super('training', context)
  }

  getInitialMessage(): string {
    return "Hello! I'm your training assistant. I can help you with both physical and mental training programs, track your progress, and provide personalized workout plans. Are you looking for physical training, mental wellness guidance, or both?"
  }

  // Legacy method - keep for backwards compatibility
  async processMessage(
    message: string,
    history: AgentMessage[]
  ): Promise<{ response: string; metadata?: Record<string, unknown> }> {
    const richResponse = await this.processMessageRich(message, history)
    return {
      response: richResponse.text,
      metadata: richResponse.metadata
    }
  }

  // Rich UI method with AI integration
  async processMessageRich(
    message: string,
    history: AgentMessage[]
  ): Promise<RichAgentResponse> {
    // Convert history to AI message format
    const aiMessages = history
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

    // Add current message
    aiMessages.push({
      role: 'user',
      content: message
    })

    // Generate rich response with UI components
    // Pass enhanced context properly nested (lib/ai.ts expects context?.enhancedContext)
    const contextForAI = {
      ...this.context,
      enhancedContext: this.context.enhancedContext
    } as Record<string, unknown>
    
    const response = await aiService.generateRichResponse(
      aiMessages,
      trainingAgentConfig,
      contextForAI
    )

    // Enhance response with dynamic CTAs based on message intent
    const enhancedResponse = this.enhanceWithCTAs(response, message)

    return enhancedResponse
  }

  private enhanceWithCTAs(
    response: RichAgentResponse,
    message: string
  ): RichAgentResponse {
    const lowerMessage = message.toLowerCase()
    const components = response.components || []

    // Add relevant CTAs based on intent
    if (lowerMessage.includes('physical') || lowerMessage.includes('fitness') || lowerMessage.includes('workout')) {
      if (!components.some(c => c.type === 'button' && (c.props as any).action?.includes('workout'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Start Workout Plan',
            action: 'start_workout',
            variant: 'default',
            size: 'default'
          }
        } as any)
        
        components.push({
          type: 'button',
          props: {
            label: 'Save Workout Plan',
            action: 'save_plan',
            variant: 'outline',
            size: 'default'
          }
        } as any)
      }
    }

    if (lowerMessage.includes('mental') || lowerMessage.includes('wellness') || lowerMessage.includes('stress')) {
      if (!components.some(c => c.type === 'button' && (c.props as any).action?.includes('session'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Start Training Session',
            action: 'start_session',
            variant: 'default',
            size: 'default'
          }
        } as any)
      }
    }

    if (lowerMessage.includes('progress') || lowerMessage.includes('track') || lowerMessage.includes('log')) {
      if (!components.some(c => c.type === 'button' && (c.props as any).action?.includes('progress'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Log Progress',
            action: 'log_progress',
            variant: 'default',
            size: 'default'
          }
        } as any)
      }
    }

    // Add general "Get Started" CTA if no specific actions
    if (components.length === 0 && response.text.length > 100) {
      components.push({
        type: 'button',
        props: {
          label: 'Get Started',
          action: 'get_started',
          variant: 'outline',
          size: 'default'
        }
      } as any)
    }

    return {
      ...response,
      components
    }
  }

  // Legacy helper methods (kept for reference, but AI will handle most responses)
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
