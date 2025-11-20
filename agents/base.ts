import { AgentType } from '@/types'

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface AgentContext {
  userId?: string
  sessionId?: string
  profile?: Record<string, unknown>
  preferences?: Record<string, unknown>
}

export abstract class BaseAgent {
  protected agentType: AgentType
  protected context: AgentContext

  constructor(agentType: AgentType, context: AgentContext = {}) {
    this.agentType = agentType
    this.context = context
  }

  abstract processMessage(
    message: string,
    history: AgentMessage[]
  ): Promise<{ response: string; metadata?: Record<string, unknown> }>

  abstract getInitialMessage(): string

  setContext(context: Partial<AgentContext>): void {
    this.context = { ...this.context, ...context }
  }

  getContext(): AgentContext {
    return this.context
  }
}

