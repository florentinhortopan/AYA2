import { RecruitmentAgent } from './recruitment'
import { TrainingAgent } from './training'
import { FinancialAgent } from './financial'
import { EducationalAgent } from './educational'
import { BaseAgent, AgentContext } from './base'
import { AgentType, RichAgentResponse } from '@/types'
import { AgentMessage } from './base'

export function createAgent(type: AgentType, context: AgentContext = {}): BaseAgent {
  switch (type) {
    case 'recruitment':
      return new RecruitmentAgent(context)
    case 'training':
      return new TrainingAgent(context)
    case 'financial':
      return new FinancialAgent(context)
    case 'educational':
      return new EducationalAgent(context)
    default:
      throw new Error(`Unknown agent type: ${type}`)
  }
}

// Type guard to check if agent supports rich responses
export function hasRichResponse(agent: BaseAgent): agent is BaseAgent & {
  processMessageRich: (message: string, history: AgentMessage[]) => Promise<RichAgentResponse>
} {
  return typeof (agent as any).processMessageRich === 'function'
}

export { BaseAgent, RecruitmentAgent, TrainingAgent, FinancialAgent, EducationalAgent }
export type { AgentContext } from './base'

