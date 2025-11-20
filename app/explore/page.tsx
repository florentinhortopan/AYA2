import { AgentChat } from '@/components/agent-chat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const agents = [
  {
    type: 'recruitment' as const,
    title: 'Recruitment Assistant',
    description: 'Explore career paths, understand requirements, and get personalized recommendations.',
    icon: '🎯'
  },
  {
    type: 'training' as const,
    title: 'Training Assistant',
    description: 'Get physical and mental training programs, track progress, and build your fitness.',
    icon: '💪'
  },
  {
    type: 'financial' as const,
    title: 'Financial Assistant',
    description: 'Understand military benefits, plan finances, and set savings goals.',
    icon: '💰'
  },
  {
    type: 'educational' as const,
    title: 'Educational Assistant',
    description: 'Learn about educational opportunities, training programs, and skill development.',
    icon: '📚'
  }
]

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Explore Our AI Assistants
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Try our AI-powered assistants - no account required! Get personalized guidance 
            on career paths, training, finances, and education.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {agents.map((agent) => (
            <Card key={agent.type} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{agent.icon}</span>
                  <div>
                    <CardTitle>{agent.title}</CardTitle>
                    <CardDescription>{agent.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={`/explore/${agent.type}`}>
                  <Button className="w-full">Try {agent.title}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Want more? Create an account to access UGC content, detailed guides, and track your progress!
          </p>
          <Link href="/signup">
            <Button variant="outline">Create Free Account</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}

