import { AgentChat } from '@/components/agent-chat'
import { AgentType } from '@/types'

interface PageProps {
  params: {
    type: string
  }
}

export default function AgentPage({ params }: PageProps) {
  const agentType = params.type as AgentType

  // Validate agent type
  const validTypes: AgentType[] = ['recruitment', 'training', 'financial', 'educational']
  if (!validTypes.includes(agentType)) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Agent Type</h1>
          <a href="/explore" className="text-primary hover:underline">
            Return to Explore
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <AgentChat agentType={agentType} />
      </div>
    </main>
  )
}

