import { BaseAgent, AgentMessage } from './base'
import { RichAgentResponse } from '@/types'
import { aiService } from '@/lib/ai'
import { recruitmentAgentConfig } from './config/recruitment'

export class RecruitmentAgent extends BaseAgent {
  constructor(context = {}) {
    super('recruitment', context)
  }

  getInitialMessage(): string {
    return "Hello! I'm your recruitment assistant. I can help you explore career paths, understand requirements, and provide personalized recommendations based on your interests and goals. What would you like to know?"
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

  // New rich UI method
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
      recruitmentAgentConfig,
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
    if (lowerMessage.includes('career') || lowerMessage.includes('path') || lowerMessage.includes('role')) {
      if (!components.some(c => c.type === 'button' && (c.props as any).action?.includes('career'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Explore Career Paths',
            action: 'explore_career',
            variant: 'default',
            size: 'default'
          }
        } as any)
      }
    }

    if (lowerMessage.includes('requirement') || lowerMessage.includes('qualification') || lowerMessage.includes('need')) {
      if (!components.some(c => c.type === 'button' && (c.props as any).action?.includes('requirement'))) {
        components.push({
          type: 'button',
          props: {
            label: 'View Requirements',
            action: 'view_requirements',
            variant: 'outline',
            size: 'default'
          }
        } as any)
      }
    }

    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('best')) {
      if (!components.some(c => c.type === 'button' && (c.props as any).action?.includes('assessment'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Start Career Assessment',
            action: 'start_assessment',
            variant: 'default',
            size: 'lg'
          }
        } as any)
        
        components.push({
          type: 'button',
          props: {
            label: 'Save to My Interests',
            action: 'save_interest',
            variant: 'outline',
            size: 'default'
          }
        } as any)
      }
    }

    // Add general "Learn More" CTA if no specific actions
    if (components.length === 0 && response.text.length > 100) {
      components.push({
        type: 'button',
        props: {
          label: 'Learn More',
          action: 'learn_more',
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
}
