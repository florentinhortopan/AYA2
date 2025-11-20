import { RecruitmentAgent } from './recruitment'
import { TrainingAgent } from './training'
import { FinancialAgent } from './financial'
import { EducationalAgent } from './educational'
import { BaseAgent, AgentContext } from './base'
import { AgentType } from '@/types'

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

export { BaseAgent, RecruitmentAgent, TrainingAgent, FinancialAgent, EducationalAgent }
export type { AgentContext } from './base'

