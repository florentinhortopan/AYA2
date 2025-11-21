import { BaseAgent, AgentMessage } from './base'
import { RichAgentResponse } from '@/types'
import { aiService } from '@/lib/ai'
import { educationalAgentConfig } from './config/educational'

export class EducationalAgent extends BaseAgent {
  constructor(context = {}) {
    super('educational', context)
  }

  getInitialMessage(): string {
    return "Hello! I'm your educational assistant. I can help you understand educational opportunities in the military, guide you through training programs, assist with skill development, and provide resources for continuing education. What would you like to learn about?"
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
      educationalAgentConfig,
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
    if (lowerMessage.includes('gi bill') || lowerMessage.includes('education') || lowerMessage.includes('benefit')) {
      if (!components.some(c => c.type === 'button' && (c.props as any).action?.includes('eligibility'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Check Eligibility',
            action: 'check_eligibility',
            variant: 'default',
            size: 'default'
          }
        } as any)
        
        components.push({
          type: 'button',
          props: {
            label: 'Apply for Benefits',
            action: 'apply_now',
            variant: 'outline',
            size: 'default'
          }
        } as any)
      }
    }

    if (lowerMessage.includes('training') || lowerMessage.includes('skill') || lowerMessage.includes('program')) {
      if (!components.some(c => c.type === 'button' && (c.props as any).action?.includes('program'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Explore Programs',
            action: 'explore_program',
            variant: 'default',
            size: 'default'
          }
        } as any)
        
        components.push({
          type: 'button',
          props: {
            label: 'Find Training',
            action: 'find_training',
            variant: 'outline',
            size: 'default'
          }
        } as any)
      }
    }

    if (lowerMessage.includes('plan') || lowerMessage.includes('pathway') || lowerMessage.includes('degree')) {
      if (!components.some(c => c.type === 'button' && (c.props as any).action?.includes('plan'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Create Educational Plan',
            action: 'create_plan',
            variant: 'default',
            size: 'lg'
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
  private getEducationBenefitsResponse(): string {
    return `The military offers excellent educational opportunities:
    
    **GI Bill:**
    - Post-9/11 GI Bill: Covers tuition, housing, and books
    - Montgomery GI Bill: Monthly education payments
    - Transferable to family members (after 6 years of service)
    
    **Tuition Assistance:**
    - Up to $4,500/year while serving
    - Can be used for college courses, certifications
    - Available during active duty
    
    **Additional Programs:**
    - SkillBridge (transition training)
    - CLEP/DSST exams (free college credits)
    - Military-specific training and certifications
    
    Are you interested in pursuing a degree, certification, or specific skill training?`
  }

  private getTrainingResponse(): string {
    return `Military training covers a wide range:
    
    **Job-Specific Training:**
    - Technical skills (IT, mechanics, medical, etc.)
    - Leadership development programs
    - Specialized certifications
    
    **Continuing Education:**
    - Online courses and programs
    - Professional development workshops
    - Advanced training courses
    
    **Certifications Available:**
    - Technical certifications (CompTIA, Cisco, etc.)
    - Professional licenses (CDL, EMT, etc.)
    - Military-specific credentials
    
    What type of training or certification interests you?`
  }

  private getCareerDevelopmentResponse(): string {
    return `Career development in the military includes:
    
    **On-the-Job Learning:**
    - Hands-on experience in your field
    - Mentorship opportunities
    - Cross-training in related areas
    
    **Advancement Paths:**
    - Promotions based on performance and qualifications
    - Specialized career tracks
    - Leadership positions
    
    **Transition Planning:**
    - Skill translation to civilian careers
    - Networking opportunities
    - Resume building and interview prep
    
    What career development goals do you have?`
  }

  private getResourcesResponse(): string {
    return `Here are valuable educational resources:
    
    **Free Resources:**
    - Khan Academy, Coursera (some free courses)
    - Military libraries and learning centers
    - Online training platforms
    
    **Study Materials:**
    - Test prep for CLEP/DSST exams
    - Field manuals and technical guides
    - Professional development books
    
    **Support:**
    - Educational counselors
    - Study groups and tutoring
    - Learning management systems
    
    What subject or skill would you like to study? I can recommend specific resources.`
  }
}
