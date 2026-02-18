import { BaseAgent, AgentMessage } from './base'
import { RichAgentResponse } from '@/types'
import { aiService } from '@/lib/ai'
import { jobFinderAgentConfig } from './config/job-finder'

export class JobFinderAgent extends BaseAgent {
  constructor(context = {}) {
    super('job-finder', context)
  }

  getInitialMessage(): string {
    return "Hello! I'm your job finder assistant. I can help you discover Army jobs that fit your interests, skills, and goals, compare options, and guide you to the right next step. What kind of work are you most interested in?"
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
    const aiMessages = history
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

    aiMessages.push({
      role: 'user',
      content: message
    })

    const contextForAI = {
      ...this.context,
      enhancedContext: this.context.enhancedContext
    } as Record<string, unknown>

    const response = await aiService.generateRichResponse(
      aiMessages,
      jobFinderAgentConfig,
      contextForAI
    )

    return this.enhanceWithCTAs(response, message)
  }

  private enhanceWithCTAs(
    response: RichAgentResponse,
    message: string
  ): RichAgentResponse {
    const lowerMessage = message.toLowerCase()
    const components = response.components || []

    if (
      lowerMessage.includes('job') ||
      lowerMessage.includes('career') ||
      lowerMessage.includes('role')
    ) {
      if (!components.some((c) => c.type === 'button' && (c.props as any).action?.includes('explore_jobs'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Explore Job Options',
            action: 'explore_jobs',
            variant: 'default',
            size: 'default'
          }
        } as any)
      }
    }

    if (
      lowerMessage.includes('compare') ||
      lowerMessage.includes('best') ||
      lowerMessage.includes('difference')
    ) {
      if (!components.some((c) => c.type === 'button' && (c.props as any).action?.includes('compare_jobs'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Compare Top Jobs',
            action: 'compare_jobs',
            variant: 'outline',
            size: 'default'
          }
        } as any)
      }
    }

    if (
      lowerMessage.includes('requirement') ||
      lowerMessage.includes('qualify') ||
      lowerMessage.includes('asvab')
    ) {
      if (!components.some((c) => c.type === 'button' && (c.props as any).action?.includes('view_requirements'))) {
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

    if (components.length === 0 && response.text.length > 100) {
      components.push({
        type: 'button',
        props: {
          label: 'Start Job Match',
          action: 'match_my_profile',
          variant: 'default',
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
