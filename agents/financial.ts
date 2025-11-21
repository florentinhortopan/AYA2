import { BaseAgent, AgentMessage } from './base'
import { RichAgentResponse } from '@/types'

export class FinancialAgent extends BaseAgent {
  constructor(context = {}) {
    super('financial', context)
  }

  getInitialMessage(): string {
    return "Hello! I'm your financial assistant. I can help you understand military benefits, plan your finances, set savings goals, and provide guidance on managing money during and after service. What financial topic would you like to explore?"
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

    if (lowerMessage.includes('benefit') || lowerMessage.includes('pay') || lowerMessage.includes('salary')) {
      return {
        response: this.getBenefitsResponse(),
        metadata: { type: 'benefits' }
      }
    }

    if (lowerMessage.includes('budget') || lowerMessage.includes('save') || lowerMessage.includes('money')) {
      return {
        response: this.getBudgetingResponse(),
        metadata: { type: 'budgeting' }
      }
    }

    if (lowerMessage.includes('goal') || lowerMessage.includes('plan')) {
      return {
        response: this.getGoalsResponse(),
        metadata: { type: 'goals' }
      }
    }

    if (lowerMessage.includes('retirement') || lowerMessage.includes('pension')) {
      return {
        response: this.getRetirementResponse(),
        metadata: { type: 'retirement' }
      }
    }

    return {
      response: "I can help you with military benefits, budgeting, financial planning, savings goals, and retirement planning. What specific financial topic would you like to discuss?",
      metadata: { type: 'general' }
    }
  }

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

