import { BaseAgent, AgentMessage } from './base'
import { RichAgentResponse } from '@/types'
import { aiService } from '@/lib/ai'
import { financialAgentConfig } from './config/financial'

export class FinancialAgent extends BaseAgent {
  constructor(context = {}) {
    super('financial', context)
  }

  getInitialMessage(): string {
    return "Hello! I'm your financial assistant. I can help you understand military benefits, plan your finances, set savings goals, and provide guidance on managing money during and after service. What financial topic would you like to explore?"
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
    const response = await aiService.generateRichResponse(
      aiMessages,
      financialAgentConfig,
      this.context as Record<string, unknown>
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
    if (lowerMessage.includes('benefit') || lowerMessage.includes('pay') || lowerMessage.includes('salary')) {
      if (!components.some(c => c.type === 'button' && (c.props as any).action?.includes('benefit'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Calculate My Benefits',
            action: 'calculate_benefits',
            variant: 'default',
            size: 'default'
          }
        } as any)
        
        components.push({
          type: 'button',
          props: {
            label: 'View All Benefits',
            action: 'view_benefits',
            variant: 'outline',
            size: 'default'
          }
        } as any)
      }
    }

    if (lowerMessage.includes('budget') || lowerMessage.includes('save') || lowerMessage.includes('money')) {
      if (!components.some(c => c.type === 'button' && (c.props as any).action?.includes('budget'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Create Budget',
            action: 'create_budget',
            variant: 'default',
            size: 'default'
          }
        } as any)
      }
    }

    if (lowerMessage.includes('goal') || lowerMessage.includes('plan') || lowerMessage.includes('retirement')) {
      if (!components.some(c => c.type === 'button' && (c.props as any).action?.includes('goal'))) {
        components.push({
          type: 'button',
          props: {
            label: 'Set Savings Goal',
            action: 'set_savings_goal',
            variant: 'default',
            size: 'default'
          }
        } as any)
        
        if (lowerMessage.includes('retirement')) {
          components.push({
            type: 'button',
            props: {
              label: 'Plan for Retirement',
              action: 'plan_retirement',
              variant: 'outline',
              size: 'default'
            }
          } as any)
        }
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
  private getBenefitsResponse(): string {
    return `Military service comes with excellent benefits:
    
    **Compensation:**
    - Base pay (varies by rank and years of service)
    - Housing allowance (BAH) or free housing
    - Food allowance (BAS)
    - Special pay for deployments, hazardous duty, etc.
    
    **Additional Benefits:**
    - Comprehensive health care (Tricare)
    - Education benefits (GI Bill, tuition assistance)
    - Retirement plan (if you serve 20+ years)
    - Tax advantages
    - Commissary and exchange privileges
    
    Would you like more details about any specific benefit?`
  }

  private getBudgetingResponse(): string {
    return `Creating a budget is essential! Here's a basic framework:
    
    **50/30/20 Rule:**
    - 50% for essentials (housing, food, utilities)
    - 30% for wants (entertainment, hobbies)
    - 20% for savings and debt repayment
    
    **Military-Specific Tips:**
    - Since housing and food are often provided, you can save more
    - Take advantage of tax-free deployment pay
    - Use the commissary for savings on groceries
    - Set up automatic savings transfers
    
    Would you like help creating a personalized budget?`
  }

  private getGoalsResponse(): string {
    return `Setting financial goals is important! Common goals include:
    
    - Emergency fund (3-6 months of expenses)
    - Debt payoff
    - Saving for education
    - Down payment for a home
    - Retirement savings
    
    I can help you create a plan to reach your financial goals. What's your top priority right now?`
  }

  private getRetirementResponse(): string {
    return `Military retirement planning is unique:
    
    **Traditional Pension:**
    - Requires 20 years of service
    - Provides lifetime monthly payments
    - Based on final pay and years of service
    
    **Blended Retirement System (BRS):**
    - Available for those who joined after 2018
    - Combines pension with Thrift Savings Plan (TSP)
    - More portable if you don't serve 20 years
    
    **Additional Options:**
    - TSP (military's 401(k))
    - IRA accounts
    - Civilian retirement accounts after service
    
    Are you planning for a full 20-year career, or exploring shorter service options?`
  }
}
